'use client';

import Link from 'next/link'
import Image from 'next/image';
import {Users, FileText, Calendar, Hourglass, Clock8, Clock10, Clock12, ChartColumn, Pencil} from "lucide-react";
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
    const data = Array.from({length: 25}, (_, i) => ({
        name: `Q${i + 1}`,
        value: Math.floor(Math.random() * 700) + 200,
    }));
    const chartWidth = Math.max(data.length * 60, 800);

  return (
    <>
      <div className='font-mono flex flex-col items-center min-h-screen p-8 pb-20 gap-10 sm:p-20'>
        <Link href='/host'>
            <Image
              src='/Quantix Arena.png'
              alt='Quantix Arena logo'
              width={600}
              height={67}
              priority
            />
          </Link>
        <main className='font-mono flex flex-col gap-[20px] row-start-2 items-stretch max-w-[90vw]'>
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
            <div className="w-full flex flex-col lg:flex-row gap-6">
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
                <div className="flex flex-col gap-3">
                    <button className="cursor-pointer items-center h-full whitespace-nowrap center flex gap-2 bg-background text-[#ffd700] border-2 border-[#ffd700] py-2 px-4 rounded-xl text-sm hover:bg-[#ffd700] hover:text-background transition duration-500">
                        <span><Users className="w-4 h-4"/></span>
                        <span>Participants</span>
                    </button>
                    <button className="cursor-pointer items-center h-full whitespace-nowrap center flex gap-2 bg-background text-[#ffd700] border-2 border-[#ffd700] py-2 px-4 rounded-xl text-sm hover:bg-[#ffd700] hover:text-background transition duration-500">
                        <span><ChartColumn className="w-4 h-4"/></span>
                        <span>Analytics</span>
                    </button>
                    <button className="cursor-pointer items-center h-full whitespace-nowrap center flex gap-2 bg-background text-[#ffd700] border-2 border-[#ffd700] py-2 px-4 rounded-xl text-sm hover:bg-[#ffd700] hover:text-background transition duration-500">
                        <span><Pencil className="w-4 h-4"/></span>
                        <span>Edit Competition</span>
                    </button>
                </div>
            </div>
        </main>
      </div>
    </>
  );
}
