'use client';

import {useState, useEffect, useRef, useTransition} from 'react';
import {useRouter} from 'next/navigation';
import Image from 'next/image';
import {Settings} from 'lucide-react';
import {findParticularContest, updateContestHonorCode} from '@funcs/actions';
import {themeColors} from '@lib/theme';
import {useTheme} from '@lib/themeProvider';
import {motion} from 'framer-motion';

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
  participants_count: number | string;
  submissions: number | string;
};

export default function EditContestClient({id}: {id: string}) {
  const router = useRouter();
  const {currentTheme, isMounted, toggleTheme} = useTheme();
  const themeRef = useRef(currentTheme);
  const transitionRef = useRef({factor: 1, prevTheme: currentTheme});
  const [paletteOpen, setPaletteOpen] = useState(false);
  const paletteRef = useRef<HTMLDivElement>(null);
  const [contest, setContest] = useState<Contest | null>(null);
  const [honorCode, setHonorCode] = useState('');
  const [loading, setLoading] = useState('loading');
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (paletteRef.current && !paletteRef.current.contains(event.target as Node)) {
        setPaletteOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const root = window.document.documentElement;
      const themeNames = Object.keys(themeColors);
      root.classList.remove(...themeNames);
      root.classList.add(currentTheme.name.replace(/\s+/g, ''));
      transitionRef.current = {
        factor: 0,
        prevTheme: themeRef.current,
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
    fetchContest();
  }, []);

  const fetchContest = async () => {
    setLoading('loading');
    const contestId = parseInt(id, 10);
    const res = await findParticularContest(contestId);

    if (!res.success) {
      setMessage(res.message);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      setLoading('');
      return;
    }

    setContest(res.data);
    const honorCode = localStorage.getItem(`honor-code-${contestId}`) || '';
    setHonorCode(honorCode);
    setLoading('');
  };

  const handleSaveHonor = async () => {
    if (!contest) {
      return;
    }
    setLoading('saving');
    const contestId = parseInt(id, 10);
    const res = await updateContestHonorCode(contestId, honorCode);
    setLoading('');

    if (!res.success) {
      setMessage(res.message);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    localStorage.setItem(`honor-code-${contestId}`, honorCode);
    setMessage('Honor code saved successfully.');
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);
  };

  const handleThemeChange = (preference: string) => {
    const nextTheme = preference.replace(/\s+/g, '');
    toggleTheme(nextTheme);
  };

  const handleBack = () => {
    startTransition(() => {
      router.push(`/host/contests/${id}`);
    });
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className='flex flex-col min-h-screen p-8 pb-20 gap-10 sm:p-20'>
      <div ref={paletteRef} className='absolute top-0 right-0 z-20'>
        <div onClick={() => setPaletteOpen(!paletteOpen)} className='text-text_secondary transition-all duration-300 flex group items-center p-4 cursor-pointer'>
          <Settings className='w-5 h-5 transition-transform duration-500 group-hover:rotate-90 group-hover:scale-110' />
        </div>
        {paletteOpen && (
          <motion.div
            initial={{opacity: 0, y: -6}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, y: -6}}
            transition={{duration: 0.2}}
            className='transition-colors duration-700 font-mono text-text_secondary absolute top-13 right-5 z-55 bg-background border-2 border-primary p-4 rounded-xl flex flex-col gap-2.5'
          >
            <p className='mb-1'>Theme</p>
            {Object.values(themeColors).map((theme) => (
              <button
                key={theme.name}
                onClick={() => handleThemeChange(theme.name)}
                className='text-sm flex items-center gap-2.5 rounded-md cursor-pointer group'
              >
                <div className='flex w-15 h-5 rounded-lg overflow-hidden border-2 border-[#555555]'>
                  <div style={{backgroundColor: theme.primary}} className='flex-1 border-r-2 border-[#555555]' />
                  <div style={{backgroundColor: theme.secondary}} className='flex-1' />
                  <div style={{backgroundColor: theme.background}} className='flex-1 border-l-2 border-[#555555]' />
                </div>
                <span className={`group-hover:scale-105 transition-transform duration-200 capitalize ${theme.name === currentTheme.name ? 'font-bold' : ''}`}>
                  {theme.name}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </div>

      <div className='flex flex-col gap-6 max-w-5xl w-full mx-auto'>
        <div className='flex flex-col gap-3'>
          <button
            onClick={handleBack}
            className='w-fit rounded-full border border-primary px-4 py-2 text-sm text-primary transition hover:bg-primary/10'
          >
            Back to contest
          </button>
          <h1 className='text-2xl font-semibold'>Edit Honor Code</h1>
          <p className='text-sm text-text_secondary'>Update the honor code participants must agree to before starting the competition.</p>
        </div>

        <textarea
          value={honorCode}
          onChange={(e) => setHonorCode(e.target.value)}
          placeholder='Enter the honor code here...'
          className='min-h-[260px] w-full rounded-3xl border border-solid border-secondary/30 bg-primary p-5 text-text_main shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
        />

        <div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
          <button
            onClick={handleSaveHonor}
            disabled={loading === 'saving' || !contest}
            className='rounded-full bg-secondary px-5 py-3 text-sm font-medium text-text_main transition hover:bg-secondary_dark disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading === 'saving' ? 'Saving...' : 'Save Honor Code'}
          </button>
        </div>

        <div className={`fixed bottom-6 left-1/2 z-50 w-[min(90vw,420px)] -translate-x-1/2 rounded-2xl bg-primary px-4 py-3 text-center text-sm text-text_main transition-opacity duration-300 ${showMessage ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {message}
        </div>
      </div>
    </div>
  );
}
