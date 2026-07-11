'use client';

import Link from 'next/link'
import Image from 'next/image';
import {Settings, Users, FileText, Calendar, ListTodo, Diamond, CheckLine, Newspaper, DoorClosedLocked, User, Minus, RotateCcw, ChevronDown, ChevronUp, Check, X} from "lucide-react";
import {useState, useEffect, useTransition, useRef} from 'react';
import {useRouter} from 'next/navigation';
import {themeColors} from "@lib/theme";
import {useTheme} from '@lib/themeProvider';
import {motion, AnimatePresence} from "framer-motion"
import {MathJax, MathJaxContext} from 'better-react-mathjax';
import {findParticularContest, getIndividualParticipantData, getIdentifiers, getParticipantQuestionData, removeParticipantStrike, resetParticipantStrikes} from '@funcs/actions';
import {ContestCard} from '@/app/host/contestCard';

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift();
  }
  return undefined;
}

type Contest = {
  competition_id: number;
  name: string;
  start_datetime: string;
  end_datetime: string;
  participants_count: number | string;
  submissions: number | string;
}

type Participant = {
  participant_id: number;
  identifiers: string[];
  total_score: number;
  max_score: number;
  submitted: boolean;
  started_at: string | null;
  submitted_at: string | null;
  warnings: number;
}

type Question = {
    question_number: number;
    question_text: string;
    correct_answer: string;
    chosen_answer: string;
    total_score: number;
    max_score: number;
}

export default function ParticipantsClient({id, participantId}: {id: string, participantId: string}) {
    const router = useRouter();

    const contest_id = parseInt(id || '0', 10);
    const participant_id = parseInt(participantId || '0', 10);
    const {currentTheme, isMounted, toggleTheme} = useTheme();
    const themeRef = useRef(currentTheme);
    const transitionRef = useRef({factor: 1, prevTheme: currentTheme});
    const [paletteOpen, setPaletteOpen] = useState(false);
    const paletteRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState('loading');
    const [showMessage, setShowMessage] = useState(false);
    const [message, setMessage] = useState('');
    const loadingContest: Contest = {
        competition_id: 0,
        name: 'Loading...',
        start_datetime: '',
        end_datetime: '',
        participants_count: 'Loading...',
        submissions: 'Loading...'
    }
    const emptyParticipant: Participant = {
        participant_id: 0,
        identifiers: [],
        total_score: 0,
        max_score: 0,
        submitted: false,
        started_at: null,
        submitted_at: null,
        warnings: 0
    }
    const [contest, setContest] = useState<Contest>(loadingContest);
    const [contestIdentifiers, setContestIdentifiers] = useState<string[]>([]);
    const [participant, setParticipant] = useState<Participant>(emptyParticipant);
    const [showDetails, setShowDetails] = useState(false);
    const [showQuestionDetails, setShowQuestionDetails] = useState<boolean[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);

    const togglePalette = () => {
        setPaletteOpen(!paletteOpen);
    };

    const handleThemeChange = (preference: string) => {
        const nextTheme = preference.replace(/\s+/g, '');
        toggleTheme(nextTheme);
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
        if (paletteRef.current && !paletteRef.current.contains(event.target as Node)) {
            setPaletteOpen(false);
        }
        }
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [])

    useEffect(() => {
        if (isMounted) {
        const root = window.document.documentElement;
        const themeNames = Object.keys(themeColors);
        root.classList.remove(...themeNames);
        root.classList.add(currentTheme.name.replace(/\s+/g, ''));
        transitionRef.current = {
            factor: 0,
            prevTheme: themeRef.current
        };
        themeRef.current = currentTheme;
        }
    }, [currentTheme, isMounted]);

    useEffect(() => {
        if (isMounted) {
        themeRef.current = currentTheme;
        transitionRef.current.prevTheme = currentTheme;
        transitionRef.current.factor = 1; 
        }
    }, [isMounted]);

    useEffect(() => {
        fetchContestData();
        fetchIdentifiers();
        fetchParticipantData();
        fetchQuestionData();
    }, []);

    const fetchContestData = async () => {   
        setLoading('loading');
        const res = await findParticularContest(contest_id);

        if (!res.success) {
            setMessage(res.message);
            setShowMessage(true);
            setTimeout(() => setShowMessage(false), 3000);
            return;
        }

        setContest(res.data || loadingContest);
        setLoading('');
    };

    const fetchIdentifiers = async () => {   
        setLoading('loading');
        const res = await getIdentifiers(contest_id);

        if (!res.success) {
            setMessage(res.message);
            setShowMessage(true);
            setTimeout(() => setShowMessage(false), 3000);
            return;
        }

        setContestIdentifiers(Array.isArray(res.data) ? res.data : []);
        setLoading('');
    };

    const fetchParticipantData = async () => {   
        setLoading('loading');
        const res = await getIndividualParticipantData(contest_id, participant_id);

        if (!res.success) {
            setMessage(res.message);
            setShowMessage(true);
            setTimeout(() => setShowMessage(false), 3000);
            return;
        }

        setParticipant(res.data || emptyParticipant);
        setLoading('');
    };

    const fetchQuestionData = async () => {   
        setLoading('loading');
        const res = await getParticipantQuestionData(contest_id, participant_id);

        if (!res.success) {
            setMessage(res.message);
            setShowMessage(true);
            setTimeout(() => setShowMessage(false), 3000);
            return;
        }

        setQuestions(Array.isArray(res.data) ? res.data : []);
        setShowQuestionDetails(Array.from({length: (Array.isArray(res.data) ? res.data : []).length}, () => false));
        setLoading('');
    };

    const findStatus = (participant: Participant) => {   
        let statusText = 'Not Started';
        if (participant.submitted) {
            statusText = 'Completed';
        }
        else if (participant.started_at) {
            statusText = 'In Progress';
        }
        if (participant.warnings > 3) {
            statusText = 'Blocked';
        }
        return statusText;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) {
            return "-- -- --";
        }
        
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(dateString));
    };

    const removeStrike = async () => {
        const res = await removeParticipantStrike(participant_id);

        if (!res.success) {
            setMessage(res.message);
            setShowMessage(true);
            setTimeout(() => setShowMessage(false), 3000);
            return;
        }

        window.location.reload();
    };

    const resetStrikes = async () => {
        const res = await resetParticipantStrikes(participant_id);

        if (!res.success) {
            setMessage(res.message);
            setShowMessage(true);
            setTimeout(() => setShowMessage(false), 3000);
            return;
        }

        window.location.reload();
    };

    if (!isMounted) {
        return null;
    }

    return (
        <>
            <div ref={paletteRef}>
                <div onClick={togglePalette} className="text-text_secondary transition-all duration-300 flex group items-center absolute top-0 right-0 p-8 z-10 cursor-pointer mt-3 mr-3 px-2 py-1 rounded-lg">
                    <Settings className="transition-transform duration-500 ease-in-out w-5 h-5 group-hover:rotate-90 group-hover:scale-110"/>
                </div>
                {paletteOpen && (
                    <motion.div
                        initial={{opacity: 0, y: -6}}
                        animate={{opacity: 1, y: 0, scale: 1}}
                        exit={{opacity: 0, y: -6}}
                        transition={{duration: 0.2}}
                        className="transition-colors duration-700 font-mono text-text_secondary absolute top-13 right-5 z-55 bg-background border-2 border-primary p-4 rounded-xl flex flex-col gap-2.5"
                    >
                        <p className='mb-1'>Theme</p>
                        {Object.values(themeColors).map((theme) => (
                            <button
                            key={theme.name}
                            onClick={() => handleThemeChange(theme.name)}
                            className="text-sm flex items-center gap-2.5 rounded-md cursor-pointer group"
                            >
                            <div className="flex w-15 h-5 rounded-lg overflow-hidden border-2 border-[#555555]">
                                <div style={{backgroundColor: theme.primary}} className="flex-1 border-r-2 border-[#555555]"/>
                                <div style={{backgroundColor: theme.secondary}} className="flex-1"/>
                                <div style={{backgroundColor: theme.background}} className="flex-1 border-l-2 border-[#555555]"/>
                            </div>
                            <span className={`group-hover:scale-105 transition-transform duration-200 capitalize ${theme.name === currentTheme.name ? "font-bold" : ""}`}>{theme.name}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </div>
            <div className='font-mono flex flex-col items-center min-h-screen p-8 pb-20 gap-10 sm:p-20'>
                <Link href='/host'>
                    <Image
                        src={currentTheme.logo}
                        alt='Quantix Arena logo'
                        width={600}
                        height={67}
                        priority
                    />
                </Link>
                <main className='font-mono flex flex-col gap-[20px] row-start-2 items-stretch max-w-[90vw]'>
                    {loading !== 'loading' && (
                        <ContestCard contest={contest} clickable={true}></ContestCard>
                    )}
                    {loading === 'loading' && (
                        <div className="md:min-w-150 transition-all duration-300 w-full hover:bg-primary_dark rounded-xl p-6 bg-primary text-text_main hover:scale-102 transition">
                            <div className="flex items-center justify-between gap-5">
                                <h2 className="text-lg sm:text-xl font-medium">Loading...</h2>
                                <span className="text-sm px-3 py-1 rounded-full bg-background/15">
                                    Loading...
                                </span>
                            </div>

                            <div className="flex flex-col text-sm md:flex-row md:gap-10">
                                <div className="flex gap-2 mt-4 text-sm whitespace-nowrap">
                                    <Users className="w-4 h-4"/> Loading...
                                </div>
                                <div className="center flex gap-2 mt-4 text-sm whitespace-nowrap">
                                    <FileText className="w-4 h-4"/> Loading...
                                </div>
                                <div className="center flex gap-2 mt-4 text-sm whitespace-nowrap">
                                    <Calendar className="w-4 h-4 shrink-0"/> Loading...
                                </div>
                            </div>
                        </div>
                    )}
                    <MathJaxContext>
                        <div className="w-full rounded-xl p-6 bg-secondary text-text_main">
                            <div className="flex flex-col items-start sm:gap-5">
                                <h2 className="text-lg font-medium sm:mb-1 mb-2">Participant Data</h2>
                                <div className="mt-1 sm:mt-0 transition-all duration-300 flex flex-col gap-3">
                                    <div className="flex gap-2 text-md items-center font-medium sm:mb-1 mb-2">
                                        <ListTodo className="w-4 h-4"/> Identifiers
                                    </div>
                                    <ul className="list-disc pl-5 space-y-3 text-xs sm:text-sm">
                                        {participant.identifiers.map((identifier, index) => (
                                            <li key={index} className="flex gap-6">
                                                <div className="flex gap-2 text-sm items-center">
                                                    <Diamond className="w-3 h-3 shrink-0"/>{contestIdentifiers[index]}: {identifier}
                                                </div>
                                            </li>
                                    ))}
                                    </ul>
                                </div>
                                <div className="mt-5 sm:mt-0 transition-all duration-300 flex flex-col gap-3 w-full">
                                    <div className="flex gap-2 text-md items-center font-medium sm:mb-1 mb-2">
                                        <Newspaper className="w-4 h-4"/>
                                        <span>Score </span>
                                        <span className="rounded-full bg-background/15 text-sm px-3 py-1 font-normal">{participant.total_score}/{participant.max_score}</span>
                                    </div>
                                    <ul className="list-disc pl-5 space-y-3 text-xs sm:text-sm">
                                        <>
                                            <button 
                                                className="flex gap-6 bg-primary text-text_main gap-2 py-1 px-3 rounded-lg hover:bg-primary_dark cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                onClick={() => setShowDetails(!showDetails)}
                                            >
                                                <div className="flex gap-2 text-sm items-center">
                                                    {showDetails ? <ChevronUp className="w-4 h-4 shrink-0"/> : <ChevronDown className="w-4 h-4 shrink-0"/>}
                                                    See details
                                                </div>
                                            </button>
                                        </>
                                    </ul>
                                    {showDetails &&
                                        <ul className="pl-5 space-y-3 text-xs sm:text-sm">
                                            {questions.map((question, index) => (
                                                <li key={index} className="flex gap-6">
                                                    <div className="flex flex-col bg-primary rounded-lg w-full">
                                                        <div className="flex gap-2 text-sm items-center px-3 flex-1 py-1">
                                                            <Diamond className="w-2.5 h-2.5 shrink-0"/>
                                                            <span className="sm:hidden block">Q{question.question_number}: {question.total_score}/{question.max_score}</span>
                                                            <span className="sm:block hidden">Question {question.question_number}: {question.total_score}/{question.max_score}</span>
                                                            <button 
                                                                className="ml-auto px-1 py-1 hover:bg-primary_dark cursor-pointer rounded-lg"
                                                                onClick={() => setShowQuestionDetails(prevDetails => 
                                                                    prevDetails.map((item, ind) => ind === index ? !item : item)
                                                                )}
                                                            >
                                                                {showQuestionDetails[index] ? <ChevronUp className="w-4 h-4 shrink-0"/> : <ChevronDown className="w-4 h-4 shrink-0"/>}
                                                            </button>
                                                        </div>
                                                        {showQuestionDetails[index] &&
                                                            <>
                                                                <div className="flex gap-2 ml-4.5 text-sm items-center bg-primary px-3 flex-1 py-1 rounded-lg">
                                                                    <MathJax>{question.question_text}</MathJax>
                                                                </div>
                                                                <div className="flex gap-2 ml-4.5 text-sm items-center bg-primary px-3 flex-1 py-1 rounded-lg mt-1">
                                                                    <MathJax>Correct Answer: {question.correct_answer || "-"}</MathJax>
                                                                </div>
                                                                <div className="flex gap-2 ml-4.5 text-sm items-center bg-primary px-3 flex-1 py-1 rounded-lg mb-1">
                                                                    <MathJax>Chosen Answer: {question.chosen_answer || "-"}</MathJax>
                                                                </div>
                                                            </>
                                                        }
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    }
                                </div>
                                <div className="mt-5 sm:mt-0 transition-all duration-300 flex flex-col gap-3">
                                    <div className="flex gap-2 text-md items-center font-medium sm:mb-1 mb-2">
                                        <User className="w-4 h-4"/>
                                        <span>Status </span>
                                        <span className="rounded-full bg-background/15 text-sm px-3 py-1 font-normal">{findStatus(participant)}</span>
                                    </div>
                                    <ul className="list-disc pl-5 space-y-3 text-xs sm:text-sm">
                                        <li className="flex gap-6">
                                            <div className="flex gap-2 text-sm items-center">
                                                <Diamond className="w-3 h-3 shrink-0"/> Started at: {formatDate(participant.started_at || "")}
                                            </div>
                                        </li>
                                        <li className="flex gap-6">
                                            <div className="flex gap-2 text-sm items-center">
                                                <Diamond className="w-3 h-3 shrink-0"/> Submitted at: {formatDate(participant.submitted_at || "")}
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                                <div className="mt-5 sm:mt-0 transition-all duration-300 flex flex-col gap-3">
                                    <div className="flex gap-2 text-md items-center font-medium sm:mb-1 mb-2">
                                        <DoorClosedLocked className="w-4 h-4"/>
                                        <span>Leave Attempts </span>
                                        <span className="rounded-full bg-background/15 text-sm px-3 py-1 font-normal">{Math.max(0, participant.warnings-1)}</span>
                                    </div>
                                    <ul className="list-disc pl-5 space-y-3 text-xs sm:text-sm">
                                        <button 
                                            className="flex gap-6 bg-primary text-text_main gap-2 py-1 px-3 rounded-lg hover:bg-primary_dark cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => removeStrike()}
                                        >
                                            <div className="flex gap-2 text-sm items-center">
                                                <Minus className="w-3 h-3 shrink-0"/> Remove strike
                                            </div>
                                        </button>
                                        <button 
                                            className="flex gap-6 bg-primary text-text_main gap-2 py-1 px-3 rounded-lg hover:bg-primary_dark cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => resetStrikes()}
                                        >
                                            <div className="flex gap-2 text-sm items-center">
                                                <RotateCcw className="w-3 h-3 shrink-0"/> Reset strikes
                                            </div>
                                        </button>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </MathJaxContext>
                </main>
                <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-text_main px-4 py-2 rounded shadow-md transition-opacity duration-500 font-mono ${showMessage ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    {message}
                </div>
            </div>
        </>
    );
}
