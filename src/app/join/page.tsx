'use client';

import Link from 'next/link'
import {useEffect, useRef} from 'react';
import Image from 'next/image';
import {useState, useTransition} from 'react';
import {validateCompetition} from '@funcs/actions';
import {useRouter} from 'next/navigation';

export default function Join() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    let numBlocks: number;
    let size_mult: number;
    if (w < 640) {
      numBlocks = 70;
      size_mult = 2
    } 
    else if (w < 1024) {
      numBlocks = 120;
      size_mult = 3
    } 
    else {
      numBlocks = 180;
      size_mult = 4
    }
    const blocks = Array.from({length: numBlocks}, () => {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * size_mult + 1,
        color: Math.random() > 0.5 ? '#FFD700' : '#C0C0C0',
        speed: Math.random() * 0.4 + 0.3,
        opacity: Math.random() * 0.4 + 0.4,
      };
    });

    let animationId: number;

    const draw = () => {
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
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
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
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const checkCode = async () => {
    setLoading(true);
    const res = await validateCompetition(code);
    setLoading(false);

    if (!res.valid) {
      setMessage(res.message);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    if (res.ended && res.scores) {
      startTransition(() => {
        router.push('/results');
      });
    }
    else if (res.ended && !res.scores) {
      startTransition(() => {
        router.push('/over');
      });
    }
    else {
      startTransition(() => {
        router.push('/details');
      });
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 -z-10"
      />
      <div className='font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20'>
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
          <div className='font-mono flex gap-4 items-center flex-col sm:flex-row'>
            <input
              type='text'
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder='Competition Code'
              className='transition-all duration-300 ease-in-out rounded-full border border-solid border-transparent transition-colors bg-[#ffd700] text-background placeholder:text-[#444444] flex items-center justify-center gap-2 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto hover:bg-[#FFC700] focus:bg-[#FFC700] focus:outline-none focus:ring-2 focus:ring-[#FFC700] focus:ring-offset-2 focus:ring-offset-background'
            />
            <button
              onClick={checkCode}
              disabled={loading || isPending}
              className='transition-all duration-300 ease-in-out  cursor-pointer rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-[#c0c0c0] text-background gap-2 hover:bg-[#b4b4b4] dark:hover:bg-[#b4b4b4] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading || isPending ? 'Checking...' : 'Enter Competition'}
            </button>
          </div>
          <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-[#ffd700] text-background px-4 py-2 rounded shadow-md transition-opacity duration-500 font-mono ${showMessage ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {message}
          </div>
        </main>
      </div>
    </>
  );
}
