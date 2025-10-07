'use client';

import Link from 'next/link'
import Image from 'next/image';
import {useState, useEffect, useTransition, useRef} from 'react';
import {getStartTime} from '@funcs/actions';
import {useRouter} from 'next/navigation';

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

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 -z-10 w-screen h-screen"
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
              The competition starts in:
            </p>
            <div className='font-mono text-[2.1rem] sm:text-4xl'>
              <span className='text-[#c0c0c0]'>{String(timeLeft.days).padStart(2, '0')}</span>
              <span className='text-[#ffd700]'>d </span>
              <span className='text-[#c0c0c0]'>{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className='text-[#ffd700]'>h </span>
              <span className='text-[#c0c0c0]'>{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className='text-[#ffd700]'>m </span>
              <span className='text-[#c0c0c0]'>{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className='text-[#ffd700]'>s</span>
            </div>
          </ol>

          <div className='font-mono flex gap-4 items-center flex-col sm:flex-row'>
            <button
              disabled={!isStarted || loading || isPending}
              onClick={() => startTransition(() => {router.push('/contest')})}
              className='transition-all duration-300 ease-in-out rounded-full border border-solid border-transparent transition-colors flex items-center justify-center gap-2 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto bg-[#ffd700] hover:bg-[#FFC700] text-background cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? 'Loading...' : isPending ? 'Joining...' : 'Join Competition'}
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
