'use client';

import {useState, useEffect, useRef} from 'react';
import Link from 'next/link'
import Image from 'next/image';
import {Users, FileText, Calendar, Hourglass, Clock8, Clock10, Clock12, ChartColumn, Pencil, Copy} from "lucide-react";
import {useRouter} from 'next/navigation';
import {themeColors} from "@lib/theme";
import {findParticularContest, getTestingWindows} from '@funcs/actions';
import {useTheme} from '@lib/themeProvider';
import {Settings} from "lucide-react";
import {motion, AnimatePresence} from "framer-motion"
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

type TestingWindow = {
    start_datetime: string;
    end_datetime: string;
}

export default function ContestsClient({id}: {id: string}) {
    const router = useRouter();
    const {currentTheme, isMounted, toggleTheme} = useTheme();
    const themeRef = useRef(currentTheme);
    const transitionRef = useRef({factor: 1, prevTheme: currentTheme});
    const [paletteOpen, setPaletteOpen] = useState(false);
    const paletteRef = useRef<HTMLDivElement>(null);
    const contest_id = parseInt(id || '0', 10);
    const [loading, setLoading] = useState('loading');
    const [showMessage, setShowMessage] = useState(false);
    const [message, setMessage] = useState('');
    const [linkCopied, setLinkCopied] = useState(false);
    const loadingContest: Contest = {
        competition_id: 0,
        name: 'Loading...',
        start_datetime: '',
        end_datetime: '',
        participants_count: 'Loading...',
        submissions: 'Loading...'
    }
    const [contest, setContest] = useState<Contest>(loadingContest);
    const [testingWindows, setTestingWindows] = useState<TestingWindow[]>([]);

    const handleParticipantsClick = () => {
        router.push(`/host/contests/${contest_id}/participants`);
    };

    const handleAnalyticsClick = () => {
        router.push(`/host/contests/${contest_id}/analytics`);
    };

    const handleEditClick = () => {
        router.push(`/host/contests/${contest_id}/edit`);
    };

    const handleCopyLink = async () => {
        const link = `${window.location.origin}/join`;
        try {
            await navigator.clipboard.writeText(link);
            setMessage('Contest link copied to clipboard');
            setShowMessage(true);
            setLinkCopied(true);
            setTimeout(() => {
                setShowMessage(false);
                setLinkCopied(false);
            }, 2000);
        } catch (error) {
            setMessage('Unable to copy link');
            setShowMessage(true);
            setTimeout(() => setShowMessage(false), 3000);
        }
    };

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
        fetchtestingWindows();
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

    const fetchtestingWindows = async () => {   
        setLoading('loading');
        const res = await getTestingWindows(contest_id);

        if (!res.success) {
            setMessage(res.message);
            setShowMessage(true);
            setTimeout(() => setShowMessage(false), 3000);
            return;
        }

        setTestingWindows(res.data || []);
        setLoading('');
    };

    const formatStartDate = (startStr: string) => {
        const options: Intl.DateTimeFormatOptions = {month: 'short', day: 'numeric', year: 'numeric'};
        const start = new Date(startStr).toLocaleDateString('en-US', options);
        return start;
    };

    const formatStartTime = (startStr: string) => {
        const options: Intl.DateTimeFormatOptions = {hour: 'numeric', minute: '2-digit', hour12: true};
        const start = new Date(startStr).toLocaleTimeString('en-US', options);
        return start;
    };

    const formatDuration = (startStr: string, endStr: string): string => {
        const start = new Date(startStr);
        const end = new Date(endStr);

        const diffInMs = end.getTime() - start.getTime();

        if (isNaN(diffInMs) || diffInMs < 0) {
            return "Invalid duration";
        }

        const totalMinutes = Math.floor(diffInMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours === 0) {
            return `${minutes}m`;
        }
        return `${hours}h ${minutes}m`;
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
                        <ContestCard contest={contest} clickable={false}></ContestCard>
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
                    <div className="w-full flex flex-col lg:flex-row gap-6">
                        <div className="transition-all duration-300 w-full rounded-xl p-6 bg-secondary text-text_main">
                            <h2 className="text-base font-medium mb-3">Testing Windows</h2>
                            <ul className="mt-2 list-disc pl-5 space-y-3 text-xs sm:text-sm">
                                {testingWindows.map((slot, index) => (
                                    <li key={index} className="flex gap-6">
                                        <div className="center flex gap-2">
                                            <span><Calendar className="w-4 h-4"/></span>
                                            <span>{formatStartDate(slot.start_datetime)}</span>
                                        </div>
                                        <div className="center flex gap-2">
                                            <span><Clock10 className="w-4 h-4"/></span>
                                            <span>{formatStartTime(slot.start_datetime)}</span>
                                        </div>
                                        
                                        <div className="center flex gap-2">
                                            <span><Hourglass className="w-4 h-4"/></span>
                                            <span>{formatDuration(slot.start_datetime, slot.end_datetime)}</span>
                                        </div>
                                    </li>
                                ))}
                                {loading === 'loading' && (
                                    <li className="flex gap-6">
                                        <div className="center flex gap-2">
                                            <span><Calendar className="w-4 h-4"/></span>
                                            <span>Loading...</span>
                                        </div>
                                        <div className="center flex gap-2">
                                            <span><Clock10 className="w-4 h-4"/></span>
                                            <span>Loading...</span>
                                        </div>
                                        
                                        <div className="center flex gap-2">
                                            <span><Hourglass className="w-4 h-4"/></span>
                                            <span>Loading...</span>
                                        </div>
                                    </li>
                                )}
                            </ul>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handleParticipantsClick}
                                className="cursor-pointer items-center h-full whitespace-nowrap center flex gap-2 bg-background text-primary border-2 border-primary py-2 px-4 rounded-xl text-sm hover:bg-primary hover:text-text_main transition duration-500"
                            >
                                <span><Users className="w-4 h-4"/></span>
                                <span>Participants</span>
                            </button>
                            <button 
                                onClick={handleAnalyticsClick}
                                className="cursor-pointer items-center h-full whitespace-nowrap center flex gap-2 bg-background text-primary border-2 border-primary py-2 px-4 rounded-xl text-sm hover:bg-primary hover:text-text_main transition duration-500"
                            >
                                <span><ChartColumn className="w-4 h-4"/></span>
                                <span>Analytics</span>
                            </button>
                            <button 
                                onClick={handleCopyLink}
                                className="cursor-pointer items-center h-full whitespace-nowrap center flex gap-2 bg-background text-primary border-2 border-primary py-2 px-4 rounded-xl text-sm hover:bg-primary hover:text-text_main transition duration-500"
                            >
                                <span><Copy className="w-4 h-4"/></span>
                                <span>{linkCopied ? 'Copied!' : 'Copy Join Link'}</span>
                            </button>
                            <button 
                                onClick={handleEditClick}
                                className="cursor-pointer items-center h-full whitespace-nowrap center flex gap-2 bg-background text-primary border-2 border-primary py-2 px-4 rounded-xl text-sm hover:bg-primary hover:text-text_main transition duration-500"
                            >
                                <span><Pencil className="w-4 h-4"/></span>
                                <span>Edit Competition</span>
                            </button>
                        </div>
                    </div>
                </main>
                <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-text_main px-4 py-2 rounded shadow-md transition-opacity duration-500 font-mono ${showMessage ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    {message}
                </div>
            </div>
        </>
    );
}
