"use client";

import {Users, FileText, Calendar} from "lucide-react";
import {useRouter} from 'next/navigation';

type Contest = {
  competition_id: number;
  name: string;
  start_datetime: string;
  end_datetime: string;
  participants_count: number | string;
  submissions: number | string;
}

const getContestStatus = (startStr: string, endStr: string) => {
  const now = new Date();
  const start = new Date(startStr);
  const end = new Date(endStr);

  if (now < start) {
    return 'Upcoming';
  }
  if (now >= start && now <= end) {
    return 'Active';
  }
  return 'Completed';
};

const formatDateRange = (startStr: string, endStr: string) => {
  const options: Intl.DateTimeFormatOptions = {month: 'short', day: 'numeric', year: 'numeric'};
  const start = new Date(startStr).toLocaleDateString('en-US', options);
  const end = new Date(endStr).toLocaleDateString('en-US', options);
  return `${start} - ${end}`;
};


export function ContestCard({contest, clickable}: {contest: Contest, clickable: boolean}) {
  const status = getContestStatus(contest.start_datetime, contest.end_datetime);
  const dateRange = formatDateRange(contest.start_datetime, contest.end_datetime);
  const router = useRouter();

  const handleCardClick = () => {
    if (clickable) {
      router.push(`/host/contests/${contest.competition_id}`);
    }
  };

  return(
    <div 
      onClick={handleCardClick}
      className={`transition-all duration-300 w-full rounded-xl p-6 bg-primary text-text_main ${clickable ? 'cursor-pointer hover:scale-102 hover:bg-primary_dark' : ''}`}
    >
        <div className="flex items-center justify-between gap-5">
            <h2 className="text-lg sm:text-xl font-medium">{contest.name}</h2>
            <span className="text-sm px-3 py-1 rounded-full bg-background/15">
                {status}
            </span>
        </div>

        <div className="flex flex-col text-sm md:flex-row md:gap-10">
            <div className="flex gap-2 mt-4 text-sm whitespace-nowrap">
                <Users className="w-4 h-4"/> {contest.participants_count || 0} participants
            </div>
            <div className="center flex gap-2 mt-4 text-sm whitespace-nowrap">
                <FileText className="w-4 h-4"/> {contest.submissions || 0} submissions
            </div>
            <div className="center flex gap-2 mt-4 text-sm whitespace-nowrap">
                <Calendar className="w-4 h-4 shrink-0"/> {dateRange}
            </div>
        </div>
    </div>
  )
}