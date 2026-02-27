'use client';

import Image from 'next/image';
import {useState, useEffect, useTransition, useCallback, useRef} from 'react';
import {getContestData, submit, strike, leave} from '@funcs/actions';
import {useRouter} from 'next/navigation';
import {MathJax, MathJaxContext} from 'better-react-mathjax';
import {Settings} from "lucide-react";
import {themeColors} from "@lib/theme";
import {useTheme} from '@lib/themeProvider';
import {motion, AnimatePresence} from "framer-motion"

type QuestionType = {
  type: 'mcq' | 'fill';
  id: number;
  question: string;
  diagram?: string | null;
  options: string[];
};

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift();
  }
  return undefined;
}

export default function ContestClient() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [name, setName] = useState('Loading...');
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState('load');
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeUp, setTimeUp] = useState(false);
  const {currentTheme, isMounted, toggleTheme} = useTheme();
  const themeRef = useRef(currentTheme);
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
      themeRef.current = currentTheme;
    }
  }, [currentTheme, isMounted]);

  useEffect(() => {
    if (isMounted) {
      themeRef.current = currentTheme;
    }
  }, [isMounted]);

  useEffect(() => {
    fetchContestData();
    const cid = parseInt(getCookie('competitionId') || '0', 10);
    const pid = parseInt(getCookie('participantId') || '0', 10);
    const saved = localStorage.getItem(`answers-${cid}-${pid}`);
    if (saved) {
      setAnswers(JSON.parse(saved));
    }
  }, []);

  const answersRef = useRef(answers);
  answersRef.current = answers;

  const handleSubmit = useCallback(async () => {
    const cid = parseInt(getCookie('competitionId') || '0', 10);
    const pid = parseInt(getCookie('participantId') || '0', 10);

    setLoading('submit');
    const res = await submit(cid, pid, answersRef.current);

    if (!res.success) {
      setMessage(res.message);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      if (res.message !== 'Already submitted') {
        return;
      }
    }

    localStorage.removeItem(`answers-${cid}-${pid}`);
    setLoading('');
    startTransition(() => {
      router.push('/thanks');
    });
  }, [router, startTransition]);

  const fetchContestData = async () => {
    const id = parseInt(getCookie('competitionId') || '0', 10);
    
    setLoading('load');
    const res = await getContestData(id);

    if (!res.success) {
      setMessage(res.message);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    const end = new Date(res.end);
    const now = new Date();
    const distance = end.getTime() - now.getTime();

    if (distance < 0) {
      setTimeLeft({hours: 0, minutes: 0, seconds: 0});
    }
    else {
      setTimeLeft({
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }

    setName(res.name);
    setEndTime(end);
    setQuestions(res.questions || []);
    setLoading('');
  };

  useEffect(() => {
    const cid = parseInt(getCookie('competitionId') || '0', 10);
    const pid = parseInt(getCookie('participantId') || '0', 10);
    localStorage.setItem(
      `answers-${cid}-${pid}`,
      JSON.stringify(answers)
    );
  }, [answers]);

  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      const message = "Sorry! You can't copy questions from the competition page :)";

      if (e.clipboardData) {
        e.clipboardData.setData('text/plain', message);
        e.clipboardData.setData('text/html', message);
      }
    };

    const handleContextMenu = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', (e) => e.preventDefault());
    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', (e) => e.preventDefault());
    };
  }, [])

  useEffect(() => {
    const trackPageOpen = async () => {
      const pid = parseInt(getCookie('participantId') || '0', 10);
      const res = await strike(pid);
      if (res.success && res.warning) {
        setMessage(res.num === 1 ? 
          "Warning: please don't leave competition page" : 
          "Warning: next leave will trigger auto-submit"
        );
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000);
      }
      else if (res.success && !res.warning) {
        setMessage('Automatic Submission');
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000);
        await handleSubmit();
      }
    };

    trackPageOpen();
    
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        trackPageOpen();
      }
      else {
        const pid = parseInt(getCookie('participantId') || '0', 10);
        await leave(pid);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [handleSubmit]);

  useEffect(() => {
    const handleBeforeUnload = async () => {
      const pid = parseInt(getCookie('participantId') || '0', 10);
      await leave(pid);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  
  useEffect(() => {
    const handlePopState = async () => {
      const pid = parseInt(getCookie('participantId') || '0', 10);
      await leave(pid);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!endTime) {
      return;
    }

    const interval = setInterval(async () => {
      const now = new Date().getTime();
      const distance = endTime.getTime() - now;

      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeft({hours: 0, minutes: 0, seconds: 0});
        setTimeUp(true);
        setMessage('Time\'s up');
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000);
        await handleSubmit();
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({hours, minutes, seconds});
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, handleSubmit]);

  function handleChange(questionId: number, value: string) {
    setAnswers(prev => ({...prev, [questionId]: value}));
  }

  function handleRadioToggle(questionId: number, value: string) {
    setAnswers(prev => ({...prev, [questionId]: prev[questionId] === value ? '' : value}));
  }

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
      <div className='flex flex-col items-center min-h-screen p-8 pb-20 gap-16 sm:p-20'>
        <main className='flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full max-w-5xl'>
          <Image
            src={currentTheme.logo}
            alt='Quantix Arena logo'
            width={600}
            height={67}
            priority
          />
          <div className='font-mono text-2xl text-text_secondary transition-all duration-700'>
              {name}
          </div>
          <ol className='font-mono list-inside list-decimal text-sm/6 text-center sm:text-left text-text_secondary transition-all duration-700'>
            <p className='mb-2 tracking-[-.01em]'>
              Time remaining:
            </p>
            <div className='font-mono text-[2.1rem] sm:text-4xl'>
              <span className='text-secondary'>{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className='text-primary'>h </span>
              <span className='text-secondary'>{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className='text-primary'>m </span>
              <span className='text-secondary'>{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className='text-primary'>s</span>
            </div>
          </ol>

          <MathJaxContext>
            <form className='flex flex-col gap-4 w-full font-mono text-xl space-y-8'>
              {questions.map((q, i) => (
                <div key={i} className='flex flex-col gap-4 text-text_secondary transition-all duration-700'>
                  <div className='overflow-x-auto overflow-y-hidden'>
                    <div className="inline-block min-w-full">
                      <p className='mb-2 tracking-[-.01em]'>
                        <MathJax>{`${i + 1}. ${q.question}`}</MathJax>
                      </p>
                      
                      {q.diagram && (
                        <div className='h-80'>
                          <img
                            src={q.diagram}
                            alt="Diagram"
                            className="h-full w-auto max-w-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {q.type === 'mcq' && (
                    <div className='flex flex-col gap-4 w-full font-mono text-xl transition-all duration-700'>
                      {q.options.map((option, idx) => (
                        <label
                          key={idx}
                          className='flex items-center gap-3 cursor-pointer select-none'
                        >
                          <input
                            type='checkbox'
                            name={`q${i}`}
                            value={option}
                            className='peer hidden transition-all duration-700'
                            disabled={timeUp || loading !== '' || isPending}
                            checked={answers[q.id] === option}
                            onChange={() => handleRadioToggle(q.id, option)}
                          />
                          <div className='w-4 h-4 rounded-full border-2 border-secondary flex-shrink-0 peer-checked:border-primary peer-checked:bg-primary transition-colors duration-300'></div>
                          <span className='text-text_secondary peer-checked:text-primary'>
                            <MathJax>{option}</MathJax>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'fill' && (
                    <div className='flex flex-col gap-4 w-full font-mono text-xl'>
                      <input
                        type='text'
                        placeholder='Answer'
                        value={answers[q.id] || ''}
                        name={`q${i}`}
                        disabled={timeUp || loading !== '' || isPending}
                        onChange={(e) => handleChange(q.id, e.target.value)}
                        className='transition-all duration-300 ease-in-out rounded-full border border-solid border-transparent transition-colors bg-primary text-text_main placeholder:text-text_placeholder flex items-center justify-center gap-2 text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto hover:bg-primary_dark focus:bg-primary_dark focus:outline-none focus:ring-2 focus:ring-primary_dark focus:ring-offset-2 focus:ring-offset-background'
                      />
                    </div>
                  )}
                </div>
              ))}
              <button
                type='submit'
                disabled={loading !== '' || isPending}
                onClick={handleSubmit}
                className='transition-all duration-300 ease-in-out rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-secondary text-text_main gap-2 hover:bg-secondary_dark dark:hover:bg-secondary_dark font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {loading === 'load' ? 'Loading...' : isPending || loading === 'submit' ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </MathJaxContext>
          <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-text_main px-4 py-2 rounded shadow-md transition-opacity duration-500 font-mono ${showMessage ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {message}
          </div>
        </main>
      </div>
    </>
  );
}
