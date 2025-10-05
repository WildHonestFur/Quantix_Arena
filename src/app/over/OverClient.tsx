'use client';

import Link from 'next/link'
import Image from 'next/image';
import {useState, useEffect, useRef} from 'react';
import {getStartTime} from '@funcs/actions';

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift();
  }
  return undefined;
}

export default function OverClient() {
  const [name, setName] = useState('Loading...');
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
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
      numBlocks = 50;
      size_mult = 2
    } 
    else if (w < 1024) {
      numBlocks = 100;
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
        ctx.fillRect(Math.floor(b.x), Math.floor(b.y), b.size, b.size);

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

  useEffect(() => {
    fetchStartTime();
  }, []);

  const fetchStartTime = async () => {
    const id = parseInt(getCookie('competitionId') || '0', 10);
    const res = await getStartTime(id);

    if (!res.success) {
      setMessage(res.message);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    setName(res.name);
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 -z-10"
      />
      <div className='flex flex-col items-center min-h-screen p-8 pb-20 gap-16 sm:p-20'>
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
          <div className='font-mono text-2xl'>
            {name}
          </div>
          <ol className='font-mono list-inside list-decimal text-sm/6 text-center sm:text-left'>
            <p className='mb-2 tracking-[-.01em]'>
              <span className='text-[#ffd700]'>The competition is over, </span>
              <span className='text-[#ffd700]'>but results aren&apos;t out yet!</span>
            </p>
            <p className='mb-2 tracking-[-.01em]'>
              We know that you&apos;re eager to check your scores, so 
              <span className='text-[#c0c0c0]'> hang tight and come back later </span>
              to see how you did!
            </p>
          </ol>
          <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-[#ffd700] text-background px-4 py-2 rounded shadow-md transition-opacity duration-500 font-mono ${showMessage ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {message}
          </div>
        </main>
      </div>
    </>
  );
}
