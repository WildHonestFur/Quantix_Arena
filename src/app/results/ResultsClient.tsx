'use client';

import Link from 'next/link'
import Image from 'next/image';
import {useState, useEffect, useRef} from 'react';
import {verifyParticipantResults, fetchFields, getContestData, getResults, getAnswers} from '@funcs/actions';
import {MathJax, MathJaxContext} from 'better-react-mathjax';
import {Settings} from "lucide-react";
import {themeColors} from "@lib/theme";
import {useTheme} from '@lib/themeProvider';
import {motion, AnimatePresence} from "framer-motion"
import {ReactSVG} from 'react-svg';

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift();
  }
  return undefined;
}

type QuestionType = {
  type: 'mcq' | 'fill';
  id: number;
  question: string;
  diagram?: string | null;
  options: string[];
};

export default function Results() {
  const [competitionID, setcompetitionID] = useState(0);
  const [fields, setFields] = useState<string[]>([]);
  const [checks, setChecks] = useState<string[]>([]);
  const [values, setValues] = useState<{[key: string]: string}>({});
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState('loading');
  const [showResults, setShowResults] = useState(false);
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [answersDict, setAnswersDict] = useState<Record<number, string>>({});
  const [pointsDict, setPointsDict] = useState<Record<number, number>>({});
  const [pointsReceived, setPointsReceived] = useState<Record<number, number>>({});
  const [name, setName] = useState('Loading...');
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
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

    res.data.push('Password');
    res.checks.push('.*');
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
    const res = await verifyParticipantResults(competitionID, values);
    setLoading('');

    if (!res.success) {
      setMessage(res.message);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    setShowResults(true);
    await fetchContestData();
    await fetchResults(res.pid);
    await fetchAnswers(res.pid);
  };

  const fetchResults = async (pid: number) => {
    setLoading('load');
    const res = await getResults(competitionID, pid);

    if (!res.success) {
      setMessage(res.message);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    setScore(res.score);
    setMaxScore(res.max);
  }

  const fetchAnswers = async (pid: number) => {
    setLoading('load');
    const res = await getAnswers(competitionID, pid);

    if (!res.success) {
      setMessage(res.message);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    setAnswers(res.answers || []);
    setPointsReceived(res.points || []);
  }

  const fetchContestData = async () => {   
    setLoading('load');
    const res = await getContestData(competitionID);

    if (!res.success) {
      setMessage(res.message);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    setName(res.name);
    setQuestions(res.questions || []);
    setAnswersDict(res.answers || []);
    setPointsDict(res.points || []);
    setLoading('');
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
      <div className='flex flex-col items-center min-h-screen p-8 pb-20 gap-16 sm:p-20'>
        {!showResults && (
          <>
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
              <ol className='font-mono list-inside list-decimal text-sm/6 text-center sm:text-left'>
                <p className='mb-2 tracking-[-.01em] text-text_secondary'>
                  Please fill in the following to access your results:
                </p>
              </ol>
              <form className='font-mono flex flex-col gap-4 w-full' onSubmit={handleSubmit}>
                {fields.map((fieldName) => (
                  <input
                    key={fieldName}
                    type='text'
                    placeholder={fieldName}
                    value={values[fieldName] || ''}
                    onChange={(e) =>
                      setValues((prev) => ({...prev, [fieldName]: e.target.value}))
                    }
                    className='transition-all duration-300 ease-in-out rounded-full border border-solid border-transparent transition-colors bg-primary text-text_main placeholder:text-text_placeholder flex items-center justify-center gap-2 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto hover:bg-primary_dark focus:bg-primary_dark focus:outline-none focus:ring-2 focus:ring-primary_dark focus:ring-offset-2 focus:ring-offset-background'
                  />
                ))}

                <button
                  type='submit'
                  disabled={loading === 'loading' || loading === 'submit'}
                  className='transition-all duration-300 ease-in-out rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-secondary text-text_main gap-2 hover:bg-secondary_dark dark:hover:bg-secondary_dark font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {loading === 'loading' ? 'Loading...' : loading === 'submit' ? 'Submitting...' : 'Check Results'}
                </button>
              </form>
              <div className={`z-50 fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-text_main px-4 py-2 rounded shadow-md transition-opacity duration-500 font-mono ${showMessage ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {message}
              </div>
            </main>
          </>
        )}
        {showResults && (
          <>
            <main className='flex flex-col gap-[32px] row-start-2 items-start w-full max-w-5xl'>
              <Image
                src={currentTheme.logo}
                alt='Quantix Arena logo'
                width={600}
                height={67}
                priority
              />
              <div className='font-mono text-2xl'>
                  {name}
              </div>

              <ol className='font-mono list-inside list-decimal text-sm/6 text-left w-full'>
                {fields.map((fieldName) => (
                  fieldName !== 'Password' ? (
                    <div 
                      className='overflow-x-auto whitespace-nowrap max-w-full font-mono text-lg'
                      key={fieldName}
                    >
                      <span className='text-secondary'>{fieldName}: </span>
                      <span className='text-primary'>{values[fieldName]}</span>
                    </div>
                  ) : null
                ))}
              </ol>
              
              <ol className='font-mono list-inside list-decimal text-sm/6'>
                <div className='font-mono text-xl'>
                  <span className='text-secondary'>Score: </span>
                  <span className='text-primary'>{score}/{maxScore}</span>
                </div>
              </ol>

              <form className='flex flex-col gap-4 w-full font-mono text-md space-y-8'>
                <div className='flex flex-col gap-2'>
                  <div className='overflow-x-auto overflow-y-hidden'>
                    <div className="inline-block min-w-full">
                      <p className='mb-2 tracking-[-.01em]'>
                        Key:
                      </p>
                    </div>
                  </div>

                  <div className='flex flex-col gap-4 w-full font-mono text-md'>
                    <label className='flex items-center gap-3 select-none'>
                      <input
                        type='checkbox'
                        value='Your answer'
                        className='peer hidden'
                        disabled
                      />
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors duration-300 border-primary bg-primary`}
                      ></div>
                      <span className={`peer-checked:text-primary text-primary`}>
                        Your answer
                      </span>
                    </label>
                    <label className='flex items-center gap-3 select-none'>
                      <input
                        type='checkbox'
                        value='Correct answer'
                        className='peer hidden'
                        disabled
                      />
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors duration-300 border-secondary bg-secondary`}
                      ></div>
                      <span className={`peer-checked:text-primary text-secondary`}>
                        Correct answer
                      </span>
                    </label>
                  </div>
                </div>
              </form>
      
              <MathJaxContext>
                <form className='flex flex-col gap-4 w-full font-mono text-xl space-y-8'>
                  {questions.map((q, i) => (
                    <div key={i} className='flex flex-col gap-4'>
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
                        <div className='flex flex-col gap-4 w-full font-mono text-xl'>
                          {q.options.map((option, idx) => {
                            const isCorrect = option === answersDict[q.id];
                            const isSelected = answers[q.id] === option;

                            let borderClass = 'border-secondary';
                            let bgClass = 'bg-background';
                            let textClass = 'text-text_secondary';

                            if (isCorrect && isSelected) {
                              borderClass = 'border-secondary';
                              bgClass = 'bg-secondary';
                              textClass = 'text-secondary';
                            }
                            else if (isSelected) {
                              borderClass = 'border-primary';
                              bgClass = 'bg-primary';
                              textClass = 'text-primary';
                            } 
                            else if (isCorrect) {
                              borderClass = 'border-secondary';
                              bgClass = 'bg-secondary';
                              textClass = 'text-secondary';
                            }

                            return (
                              <label
                                key={`${q.id}-${idx}`}
                                className='flex items-center gap-3 select-none'
                              >
                                <input
                                  type='checkbox'
                                  name={`q${i}`}
                                  value={option}
                                  className='peer hidden'
                                  disabled
                                  checked={isSelected}
                                />
                                <div
                                  className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors duration-300 ${borderClass} ${bgClass}`}
                                ></div>
                                <span className={`peer-checked:text-primary ${textClass}`}>
                                  <MathJax>{option}</MathJax>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
      
                      {q.type === 'fill' && (
                        <>
                          <div className='flex flex-col gap-4 w-full font-mono text-xl'>
                            <input
                              type='text'
                              placeholder='Your answer'
                              value={'Your answer: ' + (answers[q.id] || 'None')}
                              name={`q${i}`}
                              disabled={true}
                              className='transition-all duration-300 ease-in-out rounded-full border border-solid border-transparent transition-colors bg-primary text-text_main placeholder:text-[#444444] flex items-center justify-center gap-2 text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto hover:bg-primary_dark focus:bg-primary_dark focus:outline-none focus:ring-2 focus:ring-primary_dark focus:ring-offset-2 focus:ring-offset-background'
                            />
                          </div>
                          <div className='flex flex-col gap-4 w-full font-mono text-xl'>
                            <input
                              type='text'
                              placeholder='Correct answer'
                              value={'Correct answer: ' + (answersDict[q.id] || 'None')}
                              name={`q${i}`}
                              disabled={true}
                              className='transition-all duration-300 ease-in-out rounded-full border border-solid border-transparent transition-colors bg-secondary text-text_main placeholder:text-[#444444] flex items-center justify-center gap-2 text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto hover:bg-secondary_dark focus:bg-secondary_dark focus:outline-none focus:ring-2 focus:ring-secondary_dark focus:ring-offset-2 focus:ring-offset-background'
                            />
                          </div>
                        </>
                      )}
                      <div className='font-mono text-xl text-right'>
                        <span className='text-primary'>{pointsReceived[q.id] || 0}/{pointsDict[q.id]}</span>
                        <span className='text-secondary'> points</span>
                      </div>
                    </div>
                  ))}
                </form>
              </MathJaxContext>
              <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-text_main px-4 py-2 rounded shadow-md transition-opacity duration-500 font-mono ${showMessage ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {message}
              </div>
            </main>
          </>
        )}
      </div>
    </>
  );
}
