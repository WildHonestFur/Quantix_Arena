'use client';

import Link from 'next/link'
import Image from 'next/image';
import {useState, useEffect, useTransition, useRef} from 'react';
import {getStartTime} from '@funcs/actions';
import {useRouter} from 'next/navigation';
import {motion, AnimatePresence} from 'framer-motion';
import {supabase} from '@lib/supabaseClient';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMessage, setShowMessage] = useState(false);

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

  useEffect(() => {
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
        color: Math.random() > 0.5 ? '#FFD700' : '#C0C0C0',
        speed: Math.random() * 0.4 + 0.3,
        opacity: Math.random() * 0.4 + 0.4,
      }));
    };

    let animationId: number;
    let blocks = getBlocks(canvas.clientWidth, canvas.clientHeight);

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      for (const b of blocks) {
        ctx.fillStyle = `${b.color}${Math.floor(b.opacity * 255)
          .toString(16)
          .padStart(2, '0')}`;
        ctx.fillRect(b.x, b.y, b.size, b.size);

        b.y += b.speed;
        if (b.y > h) {
          b.y = -b.size;
          b.x = Math.random() * w;
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      resizeCanvas();
      blocks = getBlocks(canvas.clientWidth, canvas.clientHeight);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
      }
      else {
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
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 -z-10 w-screen h-screen"
      />
      <div className='font-mono flex flex-col items-center min-h-screen p-8 pb-20 gap-16 sm:p-20'>
        <main className='flex flex-col gap-[32px] row-start-2 items-center sm:items-start'>
          <Link href='/'>
            <Image
              src='/Quantix Arena.png'
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
              className={`transition-all duration-300 ease-in-out rounded-l-full border border-solid border-transparent transition-colors flex items-center justify-center ${mode === 'login' ? "bg-[#ffd700] hover:bg-[#FFC700]" : "bg-[#c0c0c0] hover:bg-[#b4b4b4]"} text-background gap-2 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Log In
            </button>
            <button
              type='submit'
              onClick={() => switchMode('signup')}
              className={`transition-all duration-300 ease-in-out rounded-r-full border border-solid border-transparent transition-colors flex items-center justify-center ${mode === 'signup' ? "bg-[#ffd700] hover:bg-[#FFC700]" : "bg-[#c0c0c0] hover:bg-[#b4b4b4]"} text-background gap-2 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
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
              className='transition-all duration-300 ease-in-out rounded-full border border-solid border-transparent transition-colors bg-[#ffd700] text-background placeholder:text-[#444444] flex items-center justify-center gap-2 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto hover:bg-[#FFC700] focus:bg-[#FFC700] focus:outline-none focus:ring-2 focus:ring-[#FFC700] focus:ring-offset-2 focus:ring-offset-background'
            />
            <input
              key='password'
              type='password'
              placeholder='Password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              className='transition-all duration-300 ease-in-out rounded-full border border-solid border-transparent transition-colors bg-[#ffd700] text-background placeholder:text-[#444444] flex items-center justify-center gap-2 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto hover:bg-[#FFC700] focus:bg-[#FFC700] focus:outline-none focus:ring-2 focus:ring-[#FFC700] focus:ring-offset-2 focus:ring-offset-background'
            />

            <button
              type='submit'
              disabled={loading}
              className='transition-all duration-300 ease-in-out rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-[#c0c0c0] text-background gap-2 hover:bg-[#b4b4b4] dark:hover:bg-[#b4b4b4] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </form>
          <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-[#ffd700] text-background px-4 py-2 rounded shadow-md transition-opacity duration-500 font-mono ${showMessage ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {error}
          </div>
        </main>
      </div>
    </>
  );
}
