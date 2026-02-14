'use client';

import Link from 'next/link'
import Image from 'next/image';
import {Users, FileText, Calendar, Plus} from "lucide-react";
import {useRouter} from 'next/navigation';

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift();
  }
  return undefined;
}

export default function HostClient() {
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
        <main className='font-mono flex flex-col gap-[18px] row-start-2 items-stretch'>
          <div className="flex items-center justify-between gap-2">
            <div className='font-mono text-2xl'>
              Your Competitions
            </div>
            <Link href='/host/contests' className='group text-base transition-all duration-300 ease-in-out rounded-[10] flex items-center justify-center bg-[#c0c0c0] text-background hover:bg-[#b4b4b4] dark:hover:bg-[#b4b4b4] font-medium h-10 sm:h-12 px-4 sm:px-5 sm:w-auto'>
              <Plus className="w-4 h-4"/>
              <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-700 ease-in-out sm:group-hover:max-w-xs sm:group-hover:duration-1000">
                &nbsp;New Competition
              </span>
            </Link>
          </div>
          <div className="w-full hover:bg-[#FFC700] cursor-pointer rounded-xl p-6 bg-[#ffd700] text-background hover:scale-102 transition">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-medium">Contest Name</h2>

              <span className="text-sm px-3 py-1 rounded-full bg-background/15">
                Upcoming
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
          <div className="w-full hover:bg-[#FFC700] cursor-pointer rounded-xl p-6 bg-[#ffd700] text-background hover:scale-102 transition">
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
        </main>
      </div>
    </>
  );
}
