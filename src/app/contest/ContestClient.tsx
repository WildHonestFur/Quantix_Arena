'use client';

import Image from 'next/image';
import {useState, useEffect, useTransition, useCallback, useRef} from 'react';
import {getContestData, submit, strike, leave, setTestingWindow} from '@funcs/actions';
import {useRouter} from 'next/navigation';
import {MathJax, MathJaxContext} from 'better-react-mathjax';
import {Settings, Move, X, Calculator} from "lucide-react";
import {themeColors} from "@lib/theme";
import {useTheme} from '@lib/themeProvider';
import {motion, AnimatePresence, useDragControls, useMotionValue} from "framer-motion"
import {ReactSVG} from 'react-svg';
import Script from 'next/script';

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
  const [ackRequired, setAckRequired] = useState(false);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const [otherTabDetected, setOtherTabDetected] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState('load');
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const tabIdRef = useRef('');
  const otherTabDetectedRef = useRef(false);
  const activeTabIntervalRef = useRef<number | null>(null);
  const [timeUp, setTimeUp] = useState(false);
  const {currentTheme, isMounted, toggleTheme} = useTheme();
  const themeRef = useRef(currentTheme);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const paletteRef = useRef<HTMLDivElement>(null);
  const acknowledgeButtonRef = useRef<HTMLButtonElement | null>(null);

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const calculatorRef = useRef<HTMLDivElement | null>(null);
  const desmosInstance = useRef<Desmos.BasicCalculator | null>(null);
  const constraintsRef = useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();

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

  const enterFullScreen = useCallback(async () => {
    if (typeof document === 'undefined' || !document.documentElement.requestFullscreen) {
      return;
    }

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setFullscreenActive(true);
    } catch (error) {
      setMessage('Please allow fullscreen mode for the contest.');
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 4000);
    }
  }, []);

  useEffect(() => {
    const cid = parseInt(getCookie('competitionId') || '0', 10);
    const pid = parseInt(getCookie('participantId') || '0', 10);
    if (!cid || !pid) {
      return;
    }

    const tabId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    tabIdRef.current = tabId;
    const heartbeatKey = `contest-heartbeat-${cid}-${pid}`;

    const setHeartbeat = () => {
      localStorage.setItem(heartbeatKey, JSON.stringify({tabId, timestamp: Date.now()}));
    };

    const checkForOtherTab = () => {
      const raw = localStorage.getItem(heartbeatKey);
      if (!raw) {
        return;
      }

      try {
        const parsed = JSON.parse(raw) as {tabId: string; timestamp: number};
        const now = Date.now();
        const stale = now - parsed.timestamp > 5000;

        if (parsed.tabId !== tabId && !stale) {
          if (!otherTabDetectedRef.current) {
            otherTabDetectedRef.current = true;
            setOtherTabDetected(true);
          }
          return;
        }
      }
      catch {
        // ignore malformed storage entries
      }

      if (otherTabDetectedRef.current) {
        otherTabDetectedRef.current = false;
        setOtherTabDetected(false);
      }
    };

    setHeartbeat();
    checkForOtherTab();

    const updateLoop = () => {
      setHeartbeat();
      checkForOtherTab();
    };

    activeTabIntervalRef.current = window.setInterval(updateLoop, 1000);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === heartbeatKey) {
        checkForOtherTab();
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      if (activeTabIntervalRef.current !== null) {
        window.clearInterval(activeTabIntervalRef.current);
      }
      window.removeEventListener('storage', handleStorage);
      const current = localStorage.getItem(heartbeatKey);
      if (current) {
        try {
          const parsed = JSON.parse(current) as {tabId: string};
          if (parsed.tabId === tabId) {
            localStorage.removeItem(heartbeatKey);
          }
        }
        catch {
          localStorage.removeItem(heartbeatKey);
        }
      }
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = async () => {
      const active = Boolean(document.fullscreenElement);
      setFullscreenActive(active);

      if (!active) {
        const pid = parseInt(getCookie('participantId') || '0', 10);
        setMessage('Full screen was exited. Please remain in full screen or your submission may be affected.');
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 4000);
        if (pid) {
          await strike(pid);
        }
      }
    };

    const handleWindowBlur = async () => {
      const pid = parseInt(getCookie('participantId') || '0', 10);
      showWarningModal('Window lost focus during contest. Stay focused and in full screen.');
      if (pid) {
        await strike(pid);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const blocked = 
        e.key === 'F12' ||
        (e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a', 's', 'p', 'u', 'i'].includes(e.key.toLowerCase()) ||
        (e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase());

      if (blocked) {
        e.preventDefault();
        showWarningModal('Shortcuts are disabled during the contest.');
      }
    };

    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible') {
        await handleWindowBlur();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibility);

    enterFullScreen();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enterFullScreen]);

  useEffect(() => {
    if (!otherTabDetected) {
      return;
    }

    showWarningModal('Multiple contest tabs detected — answers are locked and your submission is being sent.');

    (async () => {
      const cid = parseInt(getCookie('competitionId') || '0', 10);
      const pid = parseInt(getCookie('participantId') || '0', 10);
      await submit(cid, pid, answersRef.current);
    })();
  }, [otherTabDetected]);

  const handleTestingWindow = useCallback(async () => {
    const pid = parseInt(getCookie('participantId') || '0', 10);
    const res = await setTestingWindow(pid);
    if (!res.success) {
      setMessage(res.message);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    }
  }, []);

  useEffect(() => {
    handleTestingWindow();
  }, []);

  const answersRef = useRef(answers);
  answersRef.current = answers;

  const showWarningModal = (text: string) => {
    setMessage(text);
    setAckRequired(true);
    setShowMessage(true);
  };

  const showToast = (text: string, duration = 3000) => {
    setMessage(text);
    setAckRequired(false);
    setShowMessage(true);
    window.setTimeout(() => {
      setShowMessage(false);
    }, duration);
  };

  const handleAcknowledge = () => {
    setShowMessage(false);
    setAckRequired(false);
  };

  useEffect(() => {
    if (ackRequired && showMessage && acknowledgeButtonRef.current) {
      acknowledgeButtonRef.current.focus();
    }
  }, [ackRequired, showMessage]);

  const answerCount = Object.values(answers).filter((value) => value && value.trim() !== '').length;

  const handleSubmit = useCallback(async () => {
    if (otherTabDetected) {
      showWarningModal('Multiple contest tabs detected — submission is blocked.');
      return;
    }

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

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => null);
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
        showWarningModal(res.num === 1 ? 
          "Warning: please don't leave competition page" : 
          "Warning: next leave will trigger auto-submit"
        );
      }
      else if (res.success && !res.warning) {
        showToast('Automatic Submission');
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

  useEffect(() => {
    if (scriptLoaded && calculatorRef.current && typeof Desmos !== 'undefined' && !desmosInstance.current) {
      const calc = Desmos.ScientificCalculator(calculatorRef.current, {
        settingsMenu: false,
      });
      calc.updateSettings({ fontSize: 15 });
      desmosInstance.current = calc;
    }
  }, [scriptLoaded]);

  useEffect(() => {
    const updateZoom = () => {
      setCalcOpen(false);
    };
    updateZoom();
    window.addEventListener('resize', updateZoom);
    return () => window.removeEventListener('resize', updateZoom);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.desmos.com/api/v1.11/calculator.js?apiKey=${process.env.NEXT_PUBLIC_DESMOS_API_KEY}`}
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-40"/>
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
            <p className='mt-3 text-sm text-text_secondary'>Answered {answerCount} / {questions.length} questions</p>
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
                        <div className='max-h-80'>
                          <ReactSVG
                            src={q.diagram}
                            beforeInjection={(svg) => {
                              svg.removeAttribute('width');
                              svg.removeAttribute('height');
                              svg.setAttribute('class', 'h-auto max-h-80 w-auto max-w-full text-primary fill-primary');
                              const paths = svg.querySelectorAll('path, circle, rect, ellipse, polyline, polygon');
                              paths.forEach((path) => {
                                if (path.getAttribute('fill') !== 'none') {
                                  path.setAttribute('fill', 'currentColor');
                                }
                                if (path.getAttribute('stroke') && path.getAttribute('stroke') !== 'none') {
                                  path.setAttribute('stroke', 'currentColor');
                                }
                              });
                            }}
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
                            disabled={timeUp || loading !== '' || isPending || otherTabDetected}
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
                disabled={loading !== '' || isPending || otherTabDetected}
                onClick={handleSubmit}
                className='transition-all duration-300 ease-in-out rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-secondary text-text_main gap-2 hover:bg-secondary_dark dark:hover:bg-secondary_dark font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {loading === 'load' ? 'Loading...' : isPending || loading === 'submit' ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </MathJaxContext>
          <AnimatePresence>
            {ackRequired && showMessage && (
              <motion.div
                className='fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4'
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                exit={{opacity: 0}}
                role='alertdialog'
                aria-modal='true'
                aria-describedby='warning-modal-description'
              >
                <motion.div
                  className='w-full max-w-lg rounded-3xl bg-background p-8 shadow-2xl border border-primary'
                  initial={{scale: 0.95, opacity: 0}}
                  animate={{scale: 1, opacity: 1}}
                  exit={{scale: 0.95, opacity: 0}}
                >
                  <p id='warning-modal-description' className='mb-6 text-text_secondary'>{message}</p>
                  <button
                    ref={acknowledgeButtonRef}
                    onClick={handleAcknowledge}
                    className='w-full rounded-full bg-secondary px-5 py-3 text-sm font-medium text-text_main transition hover:bg-secondary_dark'
                  >
                    I understand
                  </button>
                </motion.div>
              </motion.div>
            )}
            {!ackRequired && showMessage && (
              <motion.div
                className='fixed bottom-4 left-1/2 z-50 transform -translate-x-1/2 bg-primary text-text_main px-4 py-2 rounded shadow-md transition-opacity duration-500 font-mono'
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: 20}}
                role='status'
                aria-live='polite'
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            drag
            dragControls={dragControls}
            dragListener={false} 
            dragConstraints={constraintsRef}
            dragMomentum={false}
            dragElastic={0}
            initial={false}
            animate={{ 
              opacity: calcOpen ? 1 : 0,
              scale: calcOpen ? 1 : 0.8,
              pointerEvents: calcOpen ? 'auto' : 'none'
            }}
            transition={{duration: 0.2}}
            style={{visibility: calcOpen ? 'visible' : 'hidden'}}
            className="fixed bottom-4 right-4 sm:bottom-10 sm:right-10 z-50"
          >
            <div className="transition-all duration-700 border-2 border-primary rounded-xl overflow-hidden shadow-xl bg-background flex flex-col origin-bottom-right">
              <div 
                onPointerDown={(e) => {e.preventDefault(); dragControls.start(e);}} 
                className="touch-none bg-background border-b border-primary/20 px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
              >
                <div className="flex items-center gap-3 text-text_secondary text-sm font-mono">
                  <Move className="w-4 h-4 text-primary"/>
                  <span>Calculator</span>
                </div>
                <button 
                  onClick={() => setCalcOpen(false)}
                  className="text-text_secondary hover:text-primary transition-colors p-0.5 sm:p-1 rounded-md hover:bg-primary/20 hover:cursor-pointer"
                >
                  <X className="w-4 h-4"/>
                </button>
              </div>

              <div className="w-full bg-white overflow-auto max-w-[calc(80vw-2rem)] max-h-[60vh]">
                <div
                  ref={calculatorRef} 
                  style={{width: '350px', height: '350px'}}
                />
              </div>
            </div>
          </motion.div>
        </main>
        {!calcOpen && (
          <button 
            onClick={() => setCalcOpen(true)}
            className="fixed shadow-xl sm:bottom-10 sm:right-10 bottom-7 right-7 bg-primary font-bold px-2 py-2 rounded-lg shadow hover:bg-primary_dark transition-all duration-500 cursor-pointer"
          >
            <Calculator className="sm:w-8 sm:h-8 w-6 h-6 text-text_main transition-all duration-500"/>
          </button>
        )}
      </div>
    </>
  );
}
