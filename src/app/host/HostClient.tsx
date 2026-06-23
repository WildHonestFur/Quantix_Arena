'use client';

import {useState, useEffect, useRef} from 'react';
import Link from 'next/link'
import Image from 'next/image';
import {Users, FileText, Calendar, Plus, Sticker} from "lucide-react";
import {findContests} from '@funcs/actions';
import {useRouter} from 'next/navigation';
import {themeColors} from "@lib/theme";
import {useTheme} from '@lib/themeProvider';
import {Settings} from "lucide-react";
import {motion, AnimatePresence} from "framer-motion"
import {ContestCard} from './contestCard';

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
  participants_count: number;
  submissions: number;
}

export default function HostClient() {
  const router = useRouter();
  const {currentTheme, isMounted, toggleTheme} = useTheme();
  const themeRef = useRef(currentTheme);
  const [loading, setLoading] = useState('loading');
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const transitionRef = useRef({factor: 1, prevTheme: currentTheme});
  const [paletteOpen, setPaletteOpen] = useState(false);
  const paletteRef = useRef<HTMLDivElement>(null);
  const [contests, setContests] = useState<Contest[]>([]);

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
    // CHANGE THIS //

    //const id = parseInt(getCookie('hostId') || '0', 10);
    const id = 1;
    fetchContestData(id);
  }, []);

  const fetchContestData = async (hostId: number) => {   
    setLoading('loading');
    const res = await findContests(hostId);

    if (!res.success) {
      setMessage(res.message);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    setContests(res.data || []);
    setLoading('');
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
        <Link href='/'>
            <Image
              src={currentTheme.logo}
              alt='Quantix Arena logo'
              width={600}
              height={67}
              priority
            />
          </Link>
        <main className='font-mono flex flex-col gap-[18px] row-start-2 items-stretch'>
          <div className="flex items-center justify-between gap-2">
            <div className='transition-all duration-300 font-mono sm:text-2xl text-xl text-text_secondary'>
              Your Competitions
            </div>
            <Link href='/host/contests' className='group md:text-base text-sm transition-all duration-300 ease-in-out rounded-[10] flex items-center justify-center bg-secondary text-text_main hover:bg-secondary_dark dark:hover:bg-secondary_dark font-medium h-10 sm:h-12 px-4 sm:px-5 sm:w-auto'>
              <Plus className="w-4 h-4"/>
              <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-700 ease-in-out md:group-hover:max-w-xs md:group-hover:duration-1000">
                &nbsp;New Competition
              </span>
            </Link>
          </div>
          {contests.map((contest) => (
            <ContestCard key={contest.competition_id} contest={contest} clickable={true}/>
          ))}
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
          {loading !== 'loading' && contests.length === 0 && (
            <div className="md:min-w-150 transition-all duration-300 w-full hover:bg-primary_dark rounded-xl p-6 bg-primary text-text_main hover:scale-102 transition">
              <div className="flex items-center justify-between gap-5">
                  <h2 className="text-lg sm:text-xl font-medium">You have no competitions yet!</h2>
                  <span className="text-sm px-3 py-1 rounded-full bg-background/15">
                    <Sticker className="w-4 h-4"/>
                </span>
              </div>

              <div className="flex flex-col text-sm md:flex-row md:gap-10">
                  <div className="flex gap-2 mt-4 text-sm whitespace-nowrap">
                      <Users className="w-4 h-4"/> Create
                  </div>
                  <div className="center flex gap-2 mt-4 text-sm whitespace-nowrap">
                      <FileText className="w-4 h-4"/> One
                  </div>
                  <div className="center flex gap-2 mt-4 text-sm whitespace-nowrap">
                      <Calendar className="w-4 h-4 shrink-0"/> Now!
                  </div>
              </div>
            </div>
          )}
          <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-text_main px-4 py-2 rounded shadow-md transition-opacity duration-500 font-mono ${showMessage ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {message}
          </div>
        </main>
      </div>
    </>
  );
}
