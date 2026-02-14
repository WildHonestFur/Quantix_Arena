'use client';

import Link from 'next/link'
import Image from 'next/image';
import {Users, FileText, Calendar} from "lucide-react";
import {useRouter} from 'next/navigation';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    TooltipProps,
} from 'recharts';

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
    interface CustomTooltipProps {
        active?: boolean;
        payload?: {value: number}[];
        label?: string;
    }
    const chartWidth = Math.max(data.length * 60, 800);
    const CustomTooltip = ({active, payload, label}: CustomTooltipProps) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background text-[#c0c0c0] px-4 py-2 rounded-xl font-mono">
                    <span className="text-xs sm:text-sm">{label}: </span>
                    <span className="text-xs sm:text-sm text-[#ffd700]">
                        {payload[0].value}
                    </span>
                </div>
            );
        }
        return null;
    };

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
            <div className="w-full rounded-xl p-6 bg-[#c0c0c0] text-background">
                <h2 className="text-base font-medium mb-3">Analytics</h2>
                <div className="w-full bg-[#b4b4b4] border-2 rounded-xl overflow-hidden">
                    <div className="p-4 overflow-x-auto">
                        <h6 className="text-base font-[420] mb-3">Answer Distribution</h6>
                        <div style={{width: chartWidth}} className="h-80 overflow-hidden">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} margin={{top: 10, right: 10, left: 10, bottom: 5}}>
                                    <XAxis padding={{left: 5, right: 5}} dataKey="name" stroke='var(--background)' tickLine={false} tick={{fontSize: 14}}/>
                                    <YAxis stroke='var(--background)' tick={{fontSize: 14}}/>
                                    <Tooltip content={<CustomTooltip/>} cursor={false}/>
                                    <defs>
                                    <linearGradient id="normalColor" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#ffc700" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#ffe700" stopOpacity={1} />
                                    </linearGradient>
                                    <linearGradient id="hoverColor" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#ffa700" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#ffc700" stopOpacity={1} />
                                    </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--background)" opacity={0.6}/>
                                    <Bar
                                        tabIndex={-1}
                                        dataKey="value"
                                        fill="url(#normalColor)"
                                        stroke="var(--background)"
                                        strokeWidth={2}
                                        radius={[6, 6, 0, 0]}
                                        activeBar={{
                                            fill: 'url(#hoverColor)',
                                        }}
                                        style={{outline: "none"}}
                                        maxBarSize={80}
                                        isAnimationActive={true}
                                        animationDuration={1200}
                                        animationEasing={'ease-in-out'}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </main>
      </div>
    </>
  );
}
