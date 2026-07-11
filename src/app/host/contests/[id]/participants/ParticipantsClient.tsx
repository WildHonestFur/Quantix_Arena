'use client';

import Link from 'next/link'
import Image from 'next/image';
import {Settings, Users, FileText, Calendar, Search, ArrowUpDown, GripHorizontal, ArrowUp, ArrowDown, RotateCcw, X, Plus, ChevronLeft, ChevronRight} from "lucide-react";
import {useState, useEffect, useTransition, useRef} from 'react';
import {useRouter} from 'next/navigation';
import {themeColors} from "@lib/theme";
import {useTheme} from '@lib/themeProvider';
import {motion, AnimatePresence} from "framer-motion"
import {findParticularContest, getParticipantData, getIdentifiers} from '@funcs/actions';
import {ContestCard} from '@/app/host/contestCard';
import {ParticipantTable} from './participantsTable';
import {
  DndContext,
  closestCenter,
  PointerSensor, 
  TouchSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  UniqueIdentifier
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import {CSS} from "@dnd-kit/utilities"
import {restrictToVerticalAxis, restrictToParentElement} from '@dnd-kit/modifiers'


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

type SortRule = {
    id: string
    key: string
    direction: "asc" | "desc"
}

type SortableItemProps = {
    rule: SortRule;
    toggleDirection: (id: string) => void;
    removeRule: (id: string) => void;
}

export default function ParticipantsClient({id}: {id: string}) {
    const router = useRouter();
    const contest_id = parseInt(id || '0', 10);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const metricRef = useRef<HTMLDivElement>(null);
    const page = 1;
    const [showMetricDropdown, setShowMetricDropdown] = useState(false)
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(TouchSensor)
    );

    const [sortRules, setSortRules] = useState<SortRule[]>([])
    const availableMetrics = [
        {id: '1', key: 'Score'},
        {id: '2', key: 'Completion Time'},
        {id: '3', key: 'Status'},
        {id: '4', key: 'Random'}
    ]
    const unusedMetrics = availableMetrics.filter(metric => !sortRules.some(rule => rule.id === metric.id))

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
    const [contest, setContest] = useState<Contest>(loadingContest);

    const [contestIdentifiers, setContestIdentifiers] = useState<string[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [participantsSorted, setParticipantsSorted] = useState<Participant[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [pageNumber, setPageNumber] = useState(1);
    const itemsPerPage = 10;

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
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
                setShowMetricDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (metricRef.current && !metricRef.current.contains(event.target as Node)) {
                setShowMetricDropdown(false);
            }
        }
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [])

    function addMetric(metric: {id: string; key: string}) {
        setSortRules(prev => [
            ...prev,
            {
                id: metric.id,
                key: metric.key,
                direction: 'asc'
            }
        ]);

        setShowMetricDropdown(false);
    }

    function handleDragEnd(event: DragEndEvent) {
        const {active, over} = event

        if (over && active.id !== over.id) {
            setSortRules((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);

                return arrayMove(items, oldIndex, newIndex);
            })
        }
    }

    function toggleDirection(id: string) {
        setSortRules(items => 
            items.map(rule =>
                rule.id === id ? {...rule, direction: rule.direction == 'asc' ?  'desc' : 'asc'} : rule
            )
        );
    }

    function removeRule(id: string) {
        setSortRules(items => items.filter(rule => rule.id !== id));
    }

    function clearRules() {
        setSortRules([]);
    }

    function SortableItem({rule, toggleDirection, removeRule}: SortableItemProps) {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging
        } = useSortable({id: rule.id});

        const style = {
            transform: CSS.Translate.toString(transform),
            transition,
        };

        return (
            <div ref={setNodeRef} style={style} className={`${isDragging ? "z-10 border-text_main" : "border-secondary"} border-2 flex items-center justify-between px-2 py-1 rounded-lg bg-secondary text-sm gap-1`} {...attributes}>
                <div className="flex items-center gap-2" onPointerDown={() => setShowMetricDropdown(false)}>
                    <GripHorizontal {...listeners} className="h-4 w-4 cursor-grab" style={{touchAction: 'none'}}/>
                    <span>{rule.key}</span>
                </div>
                <div className='flex gap-1'>
                    <button type="button" className="p-1 hover:bg-secondary_dark rounded-lg cursor-pointer" onClick={() => toggleDirection(rule.id)}>
                        {rule.direction === "asc" ? <ArrowUp className="h-4 w-4"/> : <ArrowDown className="h-4 w-4"/>}
                    </button>
                    <button type="button" className="p-1 hover:bg-secondary_dark rounded-lg cursor-pointer" onClick={() => removeRule(rule.id)}>
                        <X className='h-4 w-4'/>
                    </button>
                </div>
            </div>
        );
    }

    useEffect(() => {
        fetchContestData();
        fetchIdentifiers();
        fetchParticipantData();
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
        const res = await getParticipantData(contest_id);

        if (!res.success) {
            setMessage(res.message);
            setShowMessage(true);
            setTimeout(() => setShowMessage(false), 3000);
            return;
        }

        setParticipants(Array.isArray(res.data) ? res.data : []);
        setParticipantsSorted(Array.isArray(res.data) ? res.data : []);
        setLoading('');
    };

    useEffect(() => {
        const filteredParticipants = participants.filter((participant) =>
            participant.identifiers.some((id) => id.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setParticipantsSorted([...filteredParticipants].sort((a, b) => {
            for (const rule of sortRules) {
                const {key, direction} = rule;
                let multiplier = 1;
                if (direction == 'desc') {
                    multiplier = -1;
                }

                if (key === 'Completion Time') {
                    if ((!a.started_at || !a.submitted_at) && (!b.started_at || !b.submitted_at)) {
                        continue
                    }
                    if ((!a.started_at || !a.submitted_at) && b.started_at && b.submitted_at) {
                        return 1*multiplier;
                    }
                    if (a.started_at && a.submitted_at && (!b.started_at || !b.submitted_at)) {
                        return -1*multiplier;
                    }

                    const a_startTime = new Date(a.started_at || '').getTime();
                    const a_endTime = new Date(a.submitted_at || '').getTime(); 
                    const a_diffMs = a_endTime - a_startTime;

                    const b_startTime = new Date(b.started_at || '').getTime();
                    const b_endTime = new Date(b.submitted_at || '').getTime(); 
                    const b_diffMs = b_endTime - b_startTime;

                    if (a_diffMs === b_diffMs) {
                        continue;
                    }
                    return (a_diffMs - b_diffMs)*multiplier;
                }
                else if (key === 'Status') {
                    const status: Record<string, number> = {
                        "Completed": 3,
                        "In Progress": 2,
                        "Not Started": 1,
                        "Blocked": 0
                    };
                    if (status[findStatus(a)] === status[findStatus(b)]) {
                        continue;
                    }
                    return (status[findStatus(a)]-status[findStatus(b)])*multiplier;
                }
                else if (key === 'Score') {
                    if (a.total_score === b.total_score) {
                        continue;
                    }
                    return (a.total_score-b.total_score)*multiplier;
                }
                else if (key === 'Random') {
                    return Math.random() < 0.5 ? -1 : 1;
                }
            }
            return 0;
        }));
        setPageNumber(1);
    }, [sortRules, searchTerm]);

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
                    <div className="w-full rounded-xl p-6 bg-secondary text-text_main">
                        <div className="flex flex-col sm:flex-row items-center sm:justify-between sm:items-center items-start sm:gap-5">
                            <h2 className="text-base font-medium sm:mb-1 mb-2">Participants</h2>
                            <div className="transition-all duration-300 flex items-center gap-3 w-full sm:w-auto">
                                <div className="mb-1 relative w-full sm:max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text_main"/>
                                    <input
                                        type="text"
                                        placeholder="Search"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="block sm:hidden w-full pl-10 pr-4 py-2 rounded-lg border-2 border-secondary_dark bg-secondary_dark text-xs text-text_main placeholder:text-text_placeholder_secondary focus:outline-none focus:ring-2 focus:ring-secondary_dark focus:ring focus:ring-offset-2 focus:ring-offset-secondary hover:bg-secondary transition duration-300"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search participants"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="sm:block hidden w-full pl-10 pr-4 py-2 rounded-lg border-2 border-secondary_dark bg-secondary_dark text-sm text-text_main placeholder:text-text_placeholder_secondary focus:outline-none focus:ring-2 focus:ring-secondary_dark focus:ring focus:ring-offset-2 focus:ring-offset-secondary hover:bg-secondary transition duration-300"
                                    />
                                </div>
                                <div className="mb-1 relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setOpen(!open)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-secondary_dark bg-secondary_dark sm:text-sm text-xs hover:bg-secondary cursor-pointer transition duration-300"
                                    >
                                        <ArrowUpDown className="h-4 w-4"/>
                                        Sort
                                    </button>
                                    {open && (
                                        <motion.div
                                            initial={{opacity: 0, y: -6}}
                                            animate={{opacity: 1, y: 0, scale: 1}}
                                            exit={{opacity: 0, y: -6}}
                                            transition={{duration: 0.2}}
                                            className="absolute right-0 mt-2 w-83 bg-secondary_dark border-2 border-text_main rounded-lg shadow-lg p-4 z-45"
                                        >
                                            <p className="text-sm font-[475] mb-3">Sort by</p>

                                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis, restrictToParentElement]}>
                                                <SortableContext items={sortRules.map(rule => rule.id)} strategy={verticalListSortingStrategy}>
                                                    <div className="flex flex-col gap-1">
                                                    {sortRules.map(rule => (
                                                        <SortableItem
                                                            key={rule.id}
                                                            rule={rule}
                                                            toggleDirection={toggleDirection}
                                                            removeRule={removeRule}
                                                        />
                                                    ))}
                                                    </div>
                                                </SortableContext>
                                            </DndContext>
                                            <div className={`flex gap-2 ${sortRules.length !== 0 ? "mt-3" : "mt-0"}`}>
                                                <div className='relative w-full' ref={metricRef}>
                                                    <div className="whitespace-nowrap w-full bg-secondary_dark hover:bg-secondary transition duration-300 cursor-pointer border-2 border-secondary flex items-center justify-between px-2 py-1 rounded-lg text-sm" onClick={() => setShowMetricDropdown(!showMetricDropdown)}>
                                                        <div className="flex items-center gap-2">
                                                            <Plus className="h-4 w-4"/>
                                                            <span>Add Metric</span>
                                                        </div>
                                                    </div>
                                                    {showMetricDropdown && (
                                                        <motion.div
                                                            initial={{opacity: 0, y: -8, scale: 0.95}}
                                                            animate={{opacity: 1, y: 0, scale: 1}}
                                                            exit={{opacity: 0, y: -8, scale: 0.95}}
                                                            transition={{duration: 0.18}}
                                                            className="absolute mt-1 w-55 bg-secondary_dark border-2 border-text_main rounded-lg shadow-lg z-50 origin-top"
                                                        >
                                                            {unusedMetrics.length === 0 ? (
                                                                <div className="px-3 py-2 text-sm text-text_placeholder_secondary">
                                                                    All metrics added
                                                                </div>
                                                            ) : (
                                                                unusedMetrics.map(metric => (
                                                                    <div
                                                                        key={metric.id}
                                                                        className="px-3 py-2 text-sm hover:bg-secondary cursor-pointer rounded-lg"
                                                                        onClick={() => addMetric(metric)}
                                                                    >
                                                                        {metric.key}
                                                                    </div>
                                                                ))
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </div>
                                                <div className="whitespace-nowrap w-full bg-secondary_dark hover:bg-secondary transition duration-300 cursor-pointer border-2 border-secondary flex items-center justify-between px-2 py-1 rounded-lg text-sm" onClick={() => clearRules()}>
                                                    <div className="flex items-center gap-2">
                                                        <RotateCcw className="h-4 w-4"/>
                                                        <span>Clear Metrics</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <ParticipantTable
                            participants={participantsSorted} 
                            contestIdentifiers={contestIdentifiers} 
                            itemsPerPage={itemsPerPage}
                            currentPage={pageNumber}
                        />
                        <div className="flex items-center justify-between mt-4 px-1 sm:text-sm text-xs text-text_main">
                            <button className='w-24 flex justify-start items-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-75' onClick={() => setPageNumber(p => Math.max(p - 1, 1))} disabled={pageNumber === 1}>
                                <span>
                                    <ChevronLeft/>
                                </span>
                                <span className="sm:block hidden">
                                    Previous
                                </span>
                            </button>
                            <div className="text-center flex-1">
                                {participantsSorted.length === 0 ? (
                                    <>
                                        <span className="text-text_placeholder_secondary hidden sm:block">
                                            Showing 0-0 of 0
                                        </span>
                                        <span className="text-text_placeholder_secondary block sm:hidden">
                                            0-0 of 0
                                        </span>
                                    </>
                                ) : (
                                    <div>
                                        <span className="text-text_placeholder_secondary hidden sm:block">
                                            Showing {(pageNumber-1)*itemsPerPage+1}-{Math.min(pageNumber*itemsPerPage, participantsSorted.length)} of {participantsSorted.length}
                                        </span>
                                        <span className="text-text_placeholder_secondary block sm:hidden">
                                            {(pageNumber-1)*itemsPerPage+1}-{Math.min(pageNumber*itemsPerPage, participantsSorted.length)} of {participantsSorted.length}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <button className='w-24 flex justify-end items-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-75' onClick={() => setPageNumber(p => Math.min(p+1, Math.ceil(participantsSorted.length/itemsPerPage)))} disabled={pageNumber === Math.max(1, Math.ceil(participantsSorted.length/itemsPerPage))}>
                                <span className="sm:block hidden">
                                    Next
                                </span>
                                <span>
                                    <ChevronRight/>
                                </span>
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
