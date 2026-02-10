'use client';

import Link from 'next/link'
import Image from 'next/image';
import {Users, FileText, Calendar, Hourglass, Clock8, Clock10, Clock12} from "lucide-react";
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

export default function ContestsClient({id}: {id: string}) {
  const router = useRouter();

  return (
    <>
      <div className='font-mono flex flex-col items-center min-h-screen p-8 pb-20 gap-10 sm:p-20'>
        <Link href='/'>
            <Image
              src='/Quantix Arena.png'
              alt='Quantix Arena logo'
              width={600}
              height={67}
              priority
            />
          </Link>
        <main className='font-mono flex flex-col gap-[20px] row-start-2 items-stretch'>
            <div className="w-full rounded-xl p-6 bg-[#ffd700] text-background">
                <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xl font-medium">Contest Name</h2>

                    <span className="text-sm px-3 py-1 rounded-full bg-background/15">
                        Completed
                    </span>
                </div>

                <div className="flex flex-col text-sm sm:flex-row sm:gap-10">
                    <div className="flex gap-2 mt-4 text-sm">
                        <Users className="w-4 h-4"/> 128 participants
                    </div>
                    <div className="center flex gap-2 mt-4 text-sm">
                        <FileText className="w-4 h-4"/> 128 submissions
                    </div>
                    <div className="center flex gap-2 mt-4 text-sm">
                        <Calendar className="w-4 h-4"/> Feb 28, 2026 - Mar 31, 2026
                    </div>
                </div>
            </div>
            <div className="w-full rounded-xl p-6 bg-[#c0c0c0] text-background">
                <h2 className="text-base font-medium mb-3">Sessions</h2>
                <ul className="mt-2 list-disc pl-5 space-y-3 text-sm">
                    <li className="flex gap-6">
                        <div className="center flex gap-2 text-sm">
                            <span><Calendar className="w-4 h-4"/></span>
                            <span>Feb 28, 2026</span>
                        </div>
                        <div className="center flex gap-2 text-sm">
                            <span><Clock10 className="w-4 h-4"/></span>
                            <span>10:00 A.M.</span>
                        </div>
                        
                        <div className="center flex gap-2 text-sm">
                            <span><Hourglass className="w-4 h-4"/></span>
                            <span>45 min</span>
                        </div>
                    </li>
                    <li className="flex gap-6">
                        <div className="center flex gap-2 text-sm">
                            <span><Calendar className="w-4 h-4"/></span>
                            <span>Feb 29, 2026</span>
                        </div>
                        <div className="center flex gap-2 text-sm">
                            <span><Clock8 className="w-4 h-4"/></span>
                            <span>08:00 A.M.</span>
                        </div>
                        
                        <div className="center flex gap-2 text-sm">
                            <span><Hourglass className="w-4 h-4"/></span>
                            <span>45 min</span>
                        </div>
                    </li>
                    <li className="flex gap-6">
                        <div className="center flex gap-2 text-sm">
                            <span><Calendar className="w-4 h-4"/></span>
                            <span>Mar 01, 2026</span>
                        </div>
                        <div className="center flex gap-2 text-sm">
                            <span><Clock12 className="w-4 h-4"/></span>
                            <span>12:00 A.M.</span>
                        </div>
                        
                        <div className="center flex gap-2 text-sm">
                            <span><Hourglass className="w-4 h-4"/></span>
                            <span>45 min</span>
                        </div>
                    </li>
                </ul>
            </div>
            <div className="w-full rounded-xl p-6 bg-[#ffd700] text-background max-w-[90vw] sm:max-w-[80vw]">
                <h2 className="text-base font-medium mb-3">Participants</h2>
                <div className="max-w-full overflow-x-auto border-2 rounded-xl bg-[#FFC700]">
                    <table className="w-full text-sm">
                        <thead className="bg-[#FFC700] text-left">
                        <tr className='whitespace-nowrap'>
                            <th></th>
                            <th className="p-4">First Name + Last Inital</th>
                            <th className="p-4">Schoolhouse Profile</th>
                            <th className="p-4">Score</th>
                            <th className="p-4">Status</th>
                        </tr>
                        </thead>

                        <tbody>
                            <tr
                            key={1}
                            className="border-t hover:bg-[#ffd700] transition"
                            >
                            <td className="p-4 font-medium">1</td>
                            <td className="p-4 font-medium">Hello</td>
                            <td className="p-4">5</td>
                            <td className="p-4">1/1</td>
                            <td className="p-4">
                                <span className="whitespace-nowrap px-3 py-1 rounded-full bg-background/15">
                                    Completed
                                </span>
                            </td>
                            </tr>
                            <tr
                            key={2}
                            className="border-t hover:bg-[#ffd700] transition"
                            >
                            <td className="p-4 font-medium">2</td>
                            <td className="p-4 font-medium">Bye Bye</td>
                            <td className="p-4">6</td>
                            <td className="p-4">1/1</td>
                            <td className="p-4">
                                <span className="whitespace-nowrap px-3 py-1 rounded-full bg-background/15">
                                    In Progress
                                </span>
                            </td>
                            </tr>
                            <tr
                            key={3}
                            className="whitespace-nowrap border-t hover:bg-[#ffd700] transition"
                            >
                            <td className="p-4 font-medium">3</td>
                            <td className="p-4 font-medium">Back Again</td>
                            <td className="p-4">8</td>
                            <td className="p-4">1/1</td>
                            <td className="p-4">
                                <span className="px-3 py-1 rounded-full bg-background/15">
                                    Blocked
                                </span>
                            </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="w-full rounded-xl p-6 bg-[#c0c0c0] text-background">
                <h2 className="text-base font-medium mb-3">Analytics</h2>
                
            </div>
        </main>
      </div>
    </>
  );
}
