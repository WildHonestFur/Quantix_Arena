'use client';

import Link from 'next/link'
import Image from 'next/image';
import {Users, FileText, Calendar, Search, ArrowUpDown, GripHorizontal, ArrowUp, ArrowDown, RotateCcw, X, Plus, ChevronLeft, ChevronRight} from "lucide-react";
import {useState, useEffect, useTransition, useRef} from 'react';
import {useRouter} from 'next/navigation';
import {motion, AnimatePresence} from "framer-motion"
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

export default function ParticipantsClient({id}: {id: string}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const metricRef = useRef<HTMLDivElement>(null);
    const page = 1;
    const [showMetricDropdown, setShowMetricDropdown] = useState(false)
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(TouchSensor)
    );
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

    const [sortRules, setSortRules] = useState<SortRule[]>([])

    const availableMetrics = [
        {id: '1', key: 'Score'},
        {id: '2', key: 'Completion Time'},
        {id: '3', key: 'First Incorrect Answer'},
        {id: '4', key: 'Status'},
        {id: '5', key: 'Random'}
    ]
    const unusedMetrics = availableMetrics.filter(metric => !sortRules.some(rule => rule.id === metric.id))

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
            <div ref={setNodeRef} style={style} className={`${isDragging ? "z-10 border-black" : "border-[#c0c0c0]"} border-2 flex items-center justify-between px-2 py-1 rounded-lg bg-[#c0c0c0] text-sm gap-1`} {...attributes}>
                <div className="flex items-center gap-2" onPointerDown={() => setShowMetricDropdown(false)}>
                    <GripHorizontal {...listeners} className="h-4 w-4 cursor-grab" style={{touchAction: 'none'}}/>
                    <span>{rule.key}</span>
                </div>
                <div className='flex gap-1'>
                    <button type="button" className="p-1 hover:bg-[#b1b1b1] rounded-lg cursor-pointer" onClick={() => toggleDirection(rule.id)}>
                        {rule.direction === "asc" ? <ArrowUp className="h-4 w-4"/> : <ArrowDown className="h-4 w-4"/>}
                    </button>
                    <button type="button" className="p-1 hover:bg-[#b1b1b1] rounded-lg cursor-pointer" onClick={() => removeRule(rule.id)}>
                        <X className='h-4 w-4'/>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
        <div className='font-mono flex flex-col items-center min-h-screen p-8 pb-20 gap-10 sm:p-20'>
            <Link href='/host'>
                <Image
                src='/Quantix Arena.png'
                alt='Quantix Arena logo'
                width={600}
                height={67}
                priority
                />
            </Link>
            <main className='font-mono flex flex-col gap-[20px] row-start-2 items-stretch max-w-[90vw]'>
                <div className="w-full hover:bg-[#FFC700] cursor-pointer rounded-xl p-6 bg-[#ffd700] text-background hover:scale-102 transition">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-xl font-medium">Contest Name</h2>

                        <span className="text-sm px-3 py-1 rounded-full bg-background/15">
                            Completed
                        </span>
                    </div>

                    <div className="flex flex-col text-sm sm:flex-row sm:gap-10">
                        <div className="flex gap-2 mt-4 text-sm">
                            <Users className="w-4 h-4"/> 128 participants
                        </div>
                        <div className="center flex gap-2 mt-4 text-sm">
                            <FileText className="w-4 h-4"/> 128 submissions
                        </div>
                        <div className="center flex gap-2 mt-4 text-sm">
                            <Calendar className="w-4 h-4"/> Feb 28, 2026 - Mar 31, 2026
                        </div>
                    </div>
                </div>
                <div className="w-full rounded-xl p-6 bg-[#c0c0c0] text-background">
                    <div className="flex flex-col sm:flex-row items-center sm:justify-between sm:items-center items-start sm:gap-5">
                        <h2 className="text-base font-medium sm:mb-1 mb-2">Participants</h2>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="mb-1 relative w-full sm:max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707070]"/>

                                <input
                                    type="text"
                                    placeholder="Search"
                                    className="block sm:hidden w-full pl-10 pr-4 py-2 rounded-lg border-2 border-[#b1b1b1] bg-[#b1b1b1] text-xs focus:outline-none focus:ring-2 focus:ring-[#b1b1b1] focus:ring focus:ring-offset-2 focus:ring-offset-[#c0c0c0] hover:bg-[#c0c0c0] transition duration-300"
                                />
                                <input
                                    type="text"
                                    placeholder="Search participants"
                                    className="sm:block hidden w-full pl-10 pr-4 py-2 rounded-lg border-2 border-[#b1b1b1] bg-[#b1b1b1] text-sm focus:outline-none focus:ring-2 focus:ring-[#b1b1b1] focus:ring focus:ring-offset-2 focus:ring-offset-[#c0c0c0] hover:bg-[#c0c0c0] transition duration-300"
                                />
                            </div>
                            <div className="mb-1 relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setOpen(!open)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-[#b1b1b1] bg-[#b1b1b1] sm:text-sm text-xs hover:bg-[#c0c0c0] cursor-pointer transition duration-300"
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
                                        className="absolute right-0 mt-2 w-83 bg-[#b1b1b1] border-2 border-background rounded-lg shadow-lg p-4 z-45"
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
                                                <div className="whitespace-nowrap w-full bg-[#b1b1b1] hover:bg-[#c0c0c0] transition duration-300 cursor-pointer border-2 border-[#c0c0c0] flex items-center justify-between px-2 py-1 rounded-lg text-sm" onClick={() => setShowMetricDropdown(!showMetricDropdown)}>
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
                                                        className="absolute mt-1 w-55 bg-[#b1b1b1] border-2 border-background rounded-lg shadow-lg z-50 origin-top"
                                                    >
                                                        {unusedMetrics.length === 0 ? (
                                                            <div className="px-3 py-2 text-sm text-[#707070]">
                                                                All metrics added
                                                            </div>
                                                        ) : (
                                                            unusedMetrics.map(metric => (
                                                                <div
                                                                    key={metric.id}
                                                                    className="px-3 py-2 text-sm hover:bg-[#c0c0c0] cursor-pointer rounded-lg"
                                                                    onClick={() => addMetric(metric)}
                                                                >
                                                                    {metric.key}
                                                                </div>
                                                            ))
                                                        )}
                                                    </motion.div>
                                                )}
                                            </div>
                                            <div className="whitespace-nowrap w-full bg-[#b1b1b1] hover:bg-[#c0c0c0] transition duration-300 cursor-pointer border-2 border-[#c0c0c0] flex items-center justify-between px-2 py-1 rounded-lg text-sm" onClick={() => clearRules()}>
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
                    <div className="max-w-full overflow-hidden border-2 rounded-xl bg-[#ffc700] mt-3">
                        <div className='overflow-x-auto'>
                            <table className="w-full text-sm overflow-hidden">
                                <thead className="text-left">
                                <tr className='whitespace-nowrap'>
                                    <th></th>
                                    <th className="p-4 font-medium">First Name + Last Inital</th>
                                    <th className="p-4 font-medium">Schoolhouse Profile</th>
                                    <th className="p-4 font-medium">Score</th>
                                    <th className="p-4 font-medium">Completion Time</th>
                                    <th className="p-4 font-medium">Status</th>
                                </tr>
                                </thead>

                                <tbody>
                                    <tr
                                    key={1}
                                    className="border-t border-background/20 hover:bg-[#FFD700] cursor-pointer transition duration-300 hover:shadow-sm"
                                    >
                                    <td className="p-4">1</td>
                                    <td className="p-4">Hello</td>
                                    <td className="p-4">5</td>
                                    <td className="p-4">1/1</td>
                                    <td className="p-4">01h 35m 06s</td>
                                    <td className="p-4">
                                        <span className="whitespace-nowrap px-3 py-1 rounded-full bg-background/15">
                                            Completed
                                        </span>
                                    </td>
                                    </tr>
                                    <tr
                                    key={2}
                                    className="border-t border-background/20 hover:bg-[#ffd700] cursor-pointer transition duration-300 hover:shadow-sm"
                                    >
                                    <td className="p-4">2</td>
                                    <td className="p-4">Bye Bye</td>
                                    <td className="p-4">6</td>
                                    <td className="p-4">1/1</td>
                                    <td className="p-4">00h 55m 51s</td>
                                    <td className="p-4">
                                        <span className="whitespace-nowrap px-3 py-1 rounded-full bg-background/15">
                                            In Progress
                                        </span>
                                    </td>
                                    </tr>
                                    <tr
                                    key={3}
                                    className="border-t border-background/20 hover:bg-[#ffd700] cursor-pointer transition duration-300 hover:shadow-sm"
                                    >
                                    <td className="p-4">3</td>
                                    <td className="p-4">Back Again</td>
                                    <td className="p-4">8</td>
                                    <td className="p-4">1/1</td>
                                    <td className="p-4">01h 15m 18s</td>
                                    <td className="p-4">
                                        <span className="whitespace-nowrap px-3 py-1 rounded-full bg-background/15">
                                            Blocked
                                        </span>
                                    </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 px-1 sm:text-sm text-xs text-background">
                        <div className='flex items-center cursor-pointer'>
                            <span>
                                <ChevronLeft/>
                            </span>
                            <span className="sm:block hidden">
                                Previous
                            </span>
                        </div>
                        <div>
                            <span className="text-[#707070] hidden sm:block">
                                Showing 51-100 of 128
                            </span>
                            <span className="text-[#707070] block sm:hidden">
                                51-100 of 128
                            </span>
                        </div>
                        <div className='flex items-center cursor-pointer'>
                            <span className="sm:block hidden">
                                Next
                            </span>
                            <span>
                                <ChevronRight/>
                            </span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
        </>
    );
}
