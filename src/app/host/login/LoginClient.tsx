'use client';

import Link from 'next/link'
import Image from 'next/image';
import {useState, useEffect, useTransition, useRef} from 'react';
import {getStartTime} from '@funcs/actions';
import {useRouter} from 'next/navigation';
import {motion, AnimatePresence} from 'framer-motion';
import {supabase} from '@lib/supabaseClient';
import {themeColors} from "@lib/theme";
import {useTheme} from '@lib/themeProvider';
import {Settings} from "lucide-react";

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift();
  }
  return undefined;
}

export default function LoginClient() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMessage, setShowMessage] = useState(false);
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

  const switchMode = async (currentMode: string) => {
    if (currentMode === 'signup') {
      setMode('signup');
    }
    else {
      setMode('login');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const {error} = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    }
    else {
      router.push('/host');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const {error} = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    }
    else {
      router.push('/host');
    }
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
      <canvas
        ref={canvasRef}
        className="fixed inset-0 -z-10 w-screen h-screen"
      />
      <div className='font-mono flex flex-col items-center min-h-screen p-8 pb-20 gap-16 sm:p-20'>
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
          <div className='flex gap-2 min-w-60'>
            <button
              type='submit'
              onClick={() => switchMode('login')}
              className={`transition-all duration-300 ease-in-out rounded-l-full border border-solid border-transparent transition-colors flex items-center justify-center ${mode === 'login' ? "bg-primary hover:bg-primary_dark" : "bg-secondary hover:bg-secondary_dark"} text-text_main gap-2 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Log In
            </button>
            <button
              type='submit'
              onClick={() => switchMode('signup')}
              className={`transition-all duration-300 ease-in-out rounded-r-full border border-solid border-transparent transition-colors flex items-center justify-center ${mode === 'signup' ? "bg-primary hover:bg-primary_dark" : "bg-secondary hover:bg-secondary_dark"} text-text_main gap-2 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Sign Up
            </button>
          </div>
          <form className='font-mono flex flex-col gap-4 w-full' onSubmit={mode === 'login' ? handleLogin : handleSignup}>
            <input
              key='email'
              type='text'
              placeholder='Email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              className='transition-all duration-300 ease-in-out rounded-full border border-solid border-transparent transition-colors bg-primary text-text_main placeholder:text-text_placeholder flex items-center justify-center gap-2 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto hover:bg-primary_dark focus:bg-primary_dark focus:outline-none focus:ring-2 focus:ring-primary_dark focus:ring-offset-2 focus:ring-offset-background'
            />
            <input
              key='password'
              type='password'
              placeholder='Password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              className='transition-all duration-300 ease-in-out rounded-full border border-solid border-transparent transition-colors bg-primary text-text_main placeholder:text-text_placeholder flex items-center justify-center gap-2 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto hover:bg-primary_dark focus:bg-primary_dark focus:outline-none focus:ring-2 focus:ring-primary_dark focus:ring-offset-2 focus:ring-offset-background'
            />

            <button
              type='submit'
              disabled={loading}
              className='transition-all duration-300 ease-in-out rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-secondary text-text_main gap-2 hover:bg-secondary_dark dark:hover:bg-secondary_dark font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </form>
          <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-text_main px-4 py-2 rounded shadow-md transition-opacity duration-500 font-mono ${showMessage ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {error}
          </div>
        </main>
      </div>
    </>
  );
}
