'use client';

import Link from 'next/link'
import Image from 'next/image';
import {useState, useEffect} from 'react';
import {verifyParticipantResults, fetchFields, getContestData, getResults, getAnswers} from '@funcs/actions';
import {MathJax, MathJaxContext} from 'better-react-mathjax';

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

  return (
    <div className='flex flex-col items-center min-h-screen p-8 pb-20 gap-16 sm:p-20'>
      {!showResults && (
        <>
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
                  className='transition-all duration-300 ease-in-out rounded-full border border-solid border-transparent transition-colors bg-[#ffd700] text-background placeholder:text-[#444444] flex items-center justify-center gap-2 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto hover:bg-[#FFC700] focus:bg-[#FFC700] focus:outline-none focus:ring-2 focus:ring-[#FFC700] focus:ring-offset-2 focus:ring-offset-background'
                />
              ))}

              <button
                type='submit'
                disabled={loading === 'loading' || loading === 'submit'}
                className='transition-all duration-300 ease-in-out rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-[#c0c0c0] text-background gap-2 hover:bg-[#b4b4b4] dark:hover:bg-[#b4b4b4] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {loading === 'loading' ? 'Loading...' : loading === 'submit' ? 'Submitting...' : 'Check Results'}
              </button>
            </form>
            <div className={`z-50 fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-[#ffd700] text-background px-4 py-2 rounded shadow-md transition-opacity duration-500 font-mono ${showMessage ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              {message}
            </div>
          </main>
        </>
      )}
      {showResults && (
        <>
          <main className='flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full max-w-5xl'>
            <Image
              src='/Quantix Arena.png'
              alt='Quantix Arena logo'
              width={600}
              height={67}
              priority
            />
            <div className='font-mono text-2xl'>
                {name}
            </div>

            <ol className='font-mono list-inside list-decimal text-sm/6 text-left'>
              {fields.map((fieldName) => (
                fieldName !== 'Password' ? (
                  <div className='overflow-x-auto overflow-y-hidden'>
                    <div className='font-mono text-xl' key={fieldName}>
                      <span className='text-[#c0c0c0]'>{fieldName}: </span>
                      <span className='text-[#ffd700]'>{values[fieldName]}</span>
                    </div>
                  </div>
                ) : null
              ))}
            </ol>
            
            <ol className='font-mono list-inside list-decimal text-sm/6 text-left'>
              <div className='font-mono text-xl'>
                <span className='text-[#c0c0c0]'>Score: </span>
                <span className='text-[#ffd700]'>{score}/{maxScore}</span>
              </div>
            </ol>

            <form className='flex flex-col gap-4 w-full font-mono text-sm space-y-8'>
              <div className='flex flex-col gap-2'>
                <div className='overflow-x-auto overflow-y-hidden'>
                  <div className="inline-block min-w-full">
                    <p className='mb-2 tracking-[-.01em]'>
                      Key:
                    </p>
                  </div>
                </div>

                <div className='flex flex-col gap-4 w-full font-mono text-sm'>
                  <label className='flex items-center gap-3 select-none'>
                    <input
                      type='checkbox'
                      value='Your answer'
                      className='peer hidden'
                      disabled
                    />
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors duration-300 border-[#FFD700] bg-[#FFD700]`}
                    ></div>
                    <span className={`peer-checked:text-[#FFD700] text-[#FFD700]`}>
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
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors duration-300 border-[#C0C0C0] bg-[#C0C0C0]`}
                    ></div>
                    <span className={`peer-checked:text-[#FFD700] text-[#C0C0C0]`}>
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
                      <div className='flex flex-col gap-4 w-full font-mono text-xl'>
                        {q.options.map((option, idx) => {
                          const isCorrect = option === answersDict[q.id];
                          const isSelected = answers[q.id] === option;

                          let borderClass = 'border-[#C0C0C0]';
                          let bgClass = 'bg-background';
                          let textClass = 'text-foreground';

                          if (isCorrect && isSelected) {
                            borderClass = 'border-[#C0C0C0]';
                            bgClass = 'bg-[#C0C0C0]';
                            textClass = 'text-[#C0C0C0]';
                          }
                          else if (isSelected) {
                            borderClass = 'border-[#FFD700]';
                            bgClass = 'bg-[#FFD700]';
                            textClass = 'text-[#FFD700]';
                          } 
                          else if (isCorrect) {
                            borderClass = 'border-[#C0C0C0]';
                            bgClass = 'bg-[#C0C0C0]';
                            textClass = 'text-[#C0C0C0]';
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
                              <span className={`peer-checked:text-[#FFD700] ${textClass}`}>
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
                            className='transition-all duration-300 ease-in-out rounded-full border border-solid border-transparent transition-colors bg-[#ffd700] text-background placeholder:text-[#444444] flex items-center justify-center gap-2 text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto hover:bg-[#FFC700] focus:bg-[#FFC700] focus:outline-none focus:ring-2 focus:ring-[#FFC700] focus:ring-offset-2 focus:ring-offset-background'
                          />
                        </div>
                        <div className='flex flex-col gap-4 w-full font-mono text-xl'>
                          <input
                            type='text'
                            placeholder='Correct answer'
                            value={'Correct answer: ' + (answersDict[q.id] || 'None')}
                            name={`q${i}`}
                            disabled={true}
                            className='transition-all duration-300 ease-in-out rounded-full border border-solid border-transparent transition-colors bg-[#C0C0C0] text-background placeholder:text-[#444444] flex items-center justify-center gap-2 text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto hover:bg-[#b4b4b4] focus:bg-[#b4b4b4] focus:outline-none focus:ring-2 focus:ring-[#b4b4b4] focus:ring-offset-2 focus:ring-offset-background'
                          />
                        </div>
                      </>
                    )}
                    <div className='font-mono text-xl text-right'>
                      <span className='text-[#ffd700]'>{pointsReceived[q.id] || 0}/{pointsDict[q.id]}</span>
                      <span className='text-[#c0c0c0]'> points</span>
                    </div>
                  </div>
                ))}
              </form>
            </MathJaxContext>
            <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-[#ffd700] text-background px-4 py-2 rounded shadow-md transition-opacity duration-500 font-mono ${showMessage ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              {message}
            </div>
          </main>
        </>
      )}
    </div>
  );
}
