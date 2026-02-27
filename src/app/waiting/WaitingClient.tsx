'use client';

import Link from 'next/link'
import Image from 'next/image';
import {useState, useEffect, useTransition, useRef} from 'react';
import {getStartTime} from '@funcs/actions';
import {useRouter} from 'next/navigation';
import {Settings} from "lucide-react";
import {themeColors} from "@lib/theme";
import {useTheme} from '@lib/themeProvider';
import {motion, AnimatePresence} from "framer-motion"

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift();
  }
  return undefined;
}

export default function WaitingClient() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [name, setName] = useState('Loading...');
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  useEffect(() => {
    if (!isMounted) {
      return;
    }
    
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();

    const getBlocks = (w: number, h: number) => {
      let numBlocks: number;
      let size_mult: number;

      if (w < 640) {
        numBlocks = 70;
        size_mult = 2;
      }
      else if (w < 1024) {
        numBlocks = 120;
        size_mult = 3;
      }
      else if (w < 2000) {
        numBlocks = 180;
        size_mult = 4;
      }
      else {
        numBlocks = 250;
        size_mult = 5;
      }
      return Array.from({length: numBlocks}, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * size_mult + 1,
        isPrimary: Math.random() > 0.5,
        speed: Math.random() * 0.4 + 0.3,
        opacity: Math.random() * 0.4 + 0.4,
      }));
    };

    let animationId: number;
    let blocks = getBlocks(canvas.clientWidth, canvas.clientHeight);

    const getBlendedColor = (color1: string, color2: string, f: number) => {
      const parse = (c: string) => c.match(/\w\w/g)!.map(x => parseInt(x, 16));
      const c1 = parse(color1);
      const c2 = parse(color2);
      const blended = c1.map((val, i) => Math.round(val + (c2[i] - val) * f));
      return `rgb(${blended.join(',')})`;
    };

    const draw = () => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, w, h);

      if (transitionRef.current.factor < 1) {
        transitionRef.current.factor += 0.02;
      }

      const blendedPrimary = getBlendedColor(
        transitionRef.current.prevTheme.primary, 
        themeRef.current.primary, 
        transitionRef.current.factor
      );
      const blendedSecondary = getBlendedColor(
        transitionRef.current.prevTheme.secondary, 
        themeRef.current.secondary, 
        transitionRef.current.factor
      );

      for (const b of blocks) {
        ctx.globalAlpha = b.opacity;
        ctx.fillStyle = b.isPrimary ? blendedPrimary : blendedSecondary;
        ctx.fillRect(b.x, b.y, b.size, b.size);

        b.y += b.speed;
        if (b.y > h) {
          b.y = -b.size;
          b.x = Math.random() * w;
        }
      }

      if (transitionRef.current.factor >= 1) {
        transitionRef.current.prevTheme = themeRef.current;
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      resizeCanvas();
      blocks = getBlocks(canvas.clientWidth, canvas.clientHeight);
    };

    const handleVisibility = () => {
      cancelAnimationFrame(animationId);
      if (!document.hidden) {
        draw();
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isMounted]);

  useEffect(() => {
    fetchStartTime();
  }, []);

  const fetchStartTime = async () => {
    const id = parseInt(getCookie('competitionId') || '0', 10);

    setLoading(true);
    const res = await getStartTime(id);

    if (!res.success) {
      setMessage(res.message);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    const start = new Date(res.start);
    const now = new Date();
    const distance = start.getTime() - now.getTime();

    if (distance < 0) {
      setTimeLeft({days: 0, hours: 0, minutes: 0, seconds: 0});
    }
    else {
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }

    setName(res.name);
    setStartTime(start);
    setLoading(false);
  };

  useEffect(() => {
    if (!startTime) {
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = startTime.getTime() - now;

      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeft({days: 0, hours: 0, minutes: 0, seconds: 0});
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({days, hours, minutes, seconds});
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const isStarted = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (!isMounted) {
    return null;
  }
  
  return (
    <>
      <div ref={paletteRef}>
        <div onClick={togglePalette} className="text-text_secondary transition-all duration-300 flex group items-center fixed top-0 right-0 p-8 z-10 cursor-pointer mt-3 mr-3 px-2 py-1 rounded-lg">
            <Settings className="transition-transform duration-500 ease-in-out w-5 h-5 group-hover:rotate-90 group-hover:scale-110"/>
        </div>
        {paletteOpen && (
          <motion.div
              initial={{opacity: 0, y: -6}}
              animate={{opacity: 1, y: 0, scale: 1}}
              exit={{opacity: 0, y: -6}}
              transition={{duration: 0.2}}
              className="transition-colors duration-700 font-mono text-text_secondary fixed top-13 right-5 z-55 bg-background border-2 border-primary p-4 rounded-xl flex flex-col gap-2.5"
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
      <canvas
        ref={canvasRef}
        className="fixed inset-0 -z-10 w-screen h-screen"
      />
      <div className='flex flex-col items-center min-h-screen p-8 pb-20 gap-16 sm:p-20'>
        <main className='flex flex-col gap-[32px] row-start-2 items-center sm:items-start'>
          <Link href='/'>
            <Image
              src={currentTheme.logo}
              alt='Quantix Arena logo'
              width={600}
              height={67}
              priority
            />
          </Link>
          <div className='font-mono text-2xl text-text_secondary transition-all duration-700'>
              {name}
          </div>
          <ol className='font-mono list-inside list-decimal text-sm/6 text-center sm:text-left text-text_secondary transition-all duration-700'>
            <p className='mb-2 tracking-[-.01em]'>
              The competition starts in:
            </p>
            <div className='font-mono text-[2.1rem] sm:text-4xl transition-all duration-700'>
              <span className='text-secondary'>{String(timeLeft.days).padStart(2, '0')}</span>
              <span className='text-primary'>d </span>
              <span className='text-secondary'>{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className='text-primary'>h </span>
              <span className='text-secondary'>{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className='text-primary'>m </span>
              <span className='text-secondary'>{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className='text-primary'>s</span>
            </div>
          </ol>

          <div className='font-mono flex gap-4 items-center flex-col sm:flex-row'>
            <button
              disabled={!isStarted || loading || isPending}
              onClick={() => startTransition(() => {router.push('/contest')})}
              className='transition-all duration-300 ease-in-out rounded-full border border-solid border-transparent transition-colors flex items-center justify-center gap-2 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto bg-primary hover:bg-primary_dark text-text_main cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? 'Loading...' : isPending ? 'Joining...' : 'Join Competition'}
            </button>
          </div>
          <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-text_main px-4 py-2 rounded shadow-md transition-opacity duration-500 font-mono ${showMessage ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {message}
          </div>
        </main>
      </div>
    </>
  );
}
