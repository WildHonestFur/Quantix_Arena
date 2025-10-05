'use client';

import Link from 'next/link'
import Image from 'next/image';
import {useState, useEffect, useTransition, useRef} from 'react';
import {verifyParticipant, createParticipant, fetchFields} from '@funcs/actions';
import {useRouter} from 'next/navigation';
import {motion, AnimatePresence} from 'framer-motion';

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift();
  }
  return undefined;
}

export default function Details() {
  const router = useRouter();
  const [competitionID, setcompetitionID] = useState(0);
  const [fields, setFields] = useState<string[]>([]);
  const [checks, setChecks] = useState<string[]>([]);
  const [values, setValues] = useState<{[key: string]: string}>({});
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState('loading');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordPrompt, setPasswordPrompt] = useState('Please create a password:');
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
    const id = parseInt(getCookie('competitionId') || '0', 10);
    setcompetitionID(id);
    getFields(id);
  }, []);

  const getFields = async (id: number) => {
    setLoading('loading');
    const res = await fetchFields(id);
    setLoading('');

    if (!res.success) {
      setMessage(res.message);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    setFields(res.data);
    setChecks(res.checks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasEmpty = fields.some(fieldName => {
      const val = values[fieldName];
      return !val || val.trim() === '';
    });

    if (hasEmpty) {
      setMessage('All fields must be filled');
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    const hasInvalid = fields.some((field, i) => {
      const val = values[field];
      const pattern = checks[i];
      
      const regex = new RegExp(pattern);
      return !regex.test(val);
    });

    if (hasInvalid) {
      setMessage('Invalid field format');
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    setLoading('submit');
    const res = await verifyParticipant(competitionID, values);
    setLoading('');

    if (!res.success) {
      setMessage(res.message);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    setShowPassword(true);
    if (res.exists) {
      setPasswordPrompt('Please enter your password to continue:');
    }
    else {
      setPasswordPrompt('Please create a password:');
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      setMessage('Password cannot be empty');
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    setLoading('p_submit');
    const res = await createParticipant(competitionID, values, password);
    setLoading('');

    if (!res.success) {
      setMessage(res.message);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    startTransition(() => {
      router.push('/waiting');
    });
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
          <ol className='font-mono list-inside list-decimal text-sm/6 text-center sm:text-left'>
            <p className='mb-2 tracking-[-.01em]'>
              Please fill in the following:
            </p>
          </ol>
          <form className='font-mono flex flex-col gap-4 w-full' onSubmit={handleSubmit}>
            {fields.map((fieldName) => (
              <input
                key={fieldName}
                type='text'
                placeholder={fieldName}
                value={values[fieldName] || ''}
                disabled={showPassword}
                onChange={(e) =>
                  setValues((prev) => ({...prev, [fieldName]: e.target.value}))
                }
                className='transition-all duration-300 ease-in-out rounded-full border border-solid border-transparent transition-colors bg-[#ffd700] text-background placeholder:text-[#444444] flex items-center justify-center gap-2 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto hover:bg-[#FFC700] focus:bg-[#FFC700] focus:outline-none focus:ring-2 focus:ring-[#FFC700] focus:ring-offset-2 focus:ring-offset-background'
              />
            ))}

            <button
              type='submit'
              disabled={loading === 'loading' || loading === 'submit' || showPassword}
              className='transition-all duration-300 ease-in-out rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-[#c0c0c0] text-background gap-2 hover:bg-[#b4b4b4] dark:hover:bg-[#b4b4b4] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading === 'loading' ? 'Loading...' : loading === 'submit' ? 'Submitting...' : 'Enter Competition'}
            </button>
          </form>
          <AnimatePresence>
            {showPassword && (
              <motion.div 
                className='fixed inset-0 bg-black/80 z-40 font-mono transition-opacity' 
                onClick={() => {
                  if (!isPending && loading !== 'p_submit') {
                    setShowPassword(false); 
                    setPassword('');
                  }
                }}
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                exit={{opacity: 0}}
                transition={{duration: 0.3, ease: 'easeInOut'}}
              >
                <div className='fixed inset-0 flex items-center justify-center z-50 text-foreground'>
                  <motion.div 
                    className='bg-background dark:bg-background rounded-xl p-8 shadow-lg w-full max-w-md border-2 border-[#ffd700]' 
                    onClick={(e) => e.stopPropagation()}
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    exit={{opacity: 0}}
                    transition={{duration: 0.3, ease: 'easeInOut'}}
                  >
                    <p className='mb-6 tracking-[-.01em] text-sm/6 text-center sm:text-left'>
                      {passwordPrompt}
                    </p>

                    <input
                      type='text'
                      placeholder='Password'
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      className='transition-all duration-300 ease-in-out mb-4 rounded-full border border-solid border-transparent transition-colors bg-[#ffd700] text-background placeholder:text-[#444444] flex items-center justify-center gap-2 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-full hover:bg-[#FFC700] focus:bg-[#FFC700] focus:outline-none focus:ring-2 focus:ring-[#FFC700] focus:ring-offset-2 focus:ring-offset-background'
                    />

                    <button
                      type='submit'
                      disabled={isPending || loading === 'p_submit'}
                      onClick={handlePasswordSubmit}
                      className='transition-all duration-300 ease-in-out rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-[#c0c0c0] text-background gap-2 hover:bg-[#b4b4b4] dark:hover:bg-[#b4b4b4] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {isPending || loading === 'p_submit' ? 'Submitting...' : 'Enter Competition'}
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className={`z-50 fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-[#ffd700] text-background px-4 py-2 rounded shadow-md transition-opacity duration-500 font-mono ${showMessage ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {message}
          </div>
        </main>
      </div>
    </>
  );
}
