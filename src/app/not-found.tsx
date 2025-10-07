'use client';

import {useEffect, useRef, useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); 
  }, []); 

  useEffect(() => {
    if (!mounted) {
      return;
    }

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
  }, [mounted]);

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
          <div className='font-mono text-4xl'>
              Error 404
          </div>
          <p className='font-mono mb-2 tracking-[-.01em] text-center sm:text-left text-sm/6'>
            Oops! The page you&apos;re looking for doesn&apos;t exist.
          </p>
        <Link href='/' className='transition-all duration-300 ease-in-out rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-[#ffd700] text-background gap-2 hover:bg-[#FFC700] dark:hover:bg-[#FFC700] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto'>
            Go to Home
        </Link>
        </main>
      </div>
    </>
  );
}
