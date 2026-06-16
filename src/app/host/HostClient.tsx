'use client';

import {useState, useEffect, useRef} from 'react';
import Link from 'next/link'
import Image from 'next/image';
import {Users, FileText, Calendar, Plus} from "lucide-react";
import {useRouter} from 'next/navigation';
import {themeColors} from "@lib/theme";
import {useTheme} from '@lib/themeProvider';
import {Settings} from "lucide-react";
import {motion, AnimatePresence} from "framer-motion"

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift();
  }
  return undefined;
}

export default function HostClient() {
  const router = useRouter();
  const {currentTheme, isMounted, toggleTheme} = useTheme();
  const themeRef = useRef(currentTheme);
  const transitionRef = useRef({factor: 1, prevTheme: currentTheme});
  const [paletteOpen, setPaletteOpen] = useState(false);
  const paletteRef = useRef<HTMLDivElement>(null);

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
            <div className='transition-all duration-300 font-mono text-2xl text-text_secondary'>
              Your Competitions
            </div>
            <Link href='/host/contests' className='group text-base transition-all duration-300 ease-in-out rounded-[10] flex items-center justify-center bg-secondary text-text_main hover:bg-secondary_dark dark:hover:bg-secondary_dark font-medium h-10 sm:h-12 px-4 sm:px-5 sm:w-auto'>
              <Plus className="w-4 h-4"/>
              <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-700 ease-in-out sm:group-hover:max-w-xs sm:group-hover:duration-1000">
                &nbsp;New Competition
              </span>
            </Link>
          </div>
          <div className="transition-all duration-300 w-full hover:bg-primary_dark cursor-pointer rounded-xl p-6 bg-primary text-text_main hover:scale-102 transition">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-medium">Contest Name</h2>

              <span className="text-sm px-3 py-1 rounded-full bg-background/15">
                Upcoming
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
          <div className="transition-all duration-300 w-full hover:bg-primary_dark cursor-pointer rounded-xl p-6 bg-primary text-text_main hover:scale-102 transition">
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
        </main>
      </div>
    </>
  );
}
