'use client';

import {useRouter, usePathname} from 'next/navigation';

type Participant = {
  participant_id: number;
  identifiers: string[];
  total_score: number;
  max_score: number;
  submitted: boolean;
  started_at: string | null;
  submitted_at: string | null;
  warnings: number;
}

interface ParticipantTableProps {
  participants: Participant[];
  contestIdentifiers: string[];
  currentPage?: number;
  itemsPerPage?: number;
}

export const ParticipantTable: React.FC<ParticipantTableProps> = ({ 
  participants, 
  contestIdentifiers,
  currentPage = 1,
  itemsPerPage = 50
}) => {
  const formatDuration = (start: string | null, end: string | null): string => {
    if (!start || !end) {
        return '-- -- --';
    }
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime(); 
    const diffMs = endTime - startTime;
    
    if (diffMs <= 0) {
        return '00h 00m 00s';
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  };
  const offset = (currentPage - 1) * itemsPerPage;
  const displayedParticipants = participants.slice(offset, offset + itemsPerPage);
  const router = useRouter();
  const pathname = usePathname();

  const participantRedirect = (participant_id: number) => {
    router.push(`${pathname}/${participant_id}`);
  };

  return (
    <div className="max-w-full overflow-hidden border-2 border-text_main rounded-xl bg-primary_dark mt-3">
        <div className='overflow-x-auto'>
            <table className="w-full text-sm overflow-hidden">
                <thead className="text-left">
                <tr className='whitespace-nowrap'>
                    <th className="p-4 font-medium"></th>
                    {contestIdentifiers.map((identifier, index) => (
                        <th key={index} className="p-4 font-medium">{identifier}</th>
                    ))}
                    <th className="p-4 font-medium">Score</th>
                    <th className="p-4 font-medium">Completion Time</th>
                    <th className="p-4 font-medium">Status</th>
                </tr>
                </thead>

                <tbody>
                    {displayedParticipants.map((participant, index) => {
                        let statusText = 'Not Started';
                        if (participant.submitted) {
                            statusText = 'Completed';
                        }
                        else if (participant.started_at) {
                            statusText = 'In Progress';
                        }
                        if (participant.warnings > 3) {
                            statusText = 'Blocked';
                        }

                        return (
                            <tr
                                key={participant.participant_id}
                                className="border-t border-text_main/20 hover:bg-primary cursor-pointer transition duration-300 hover:shadow-sm"
                                onClick={() => participantRedirect(participant.participant_id)}
                            >
                                <td className="p-4">{offset+index+1}</td>
                                {contestIdentifiers.map((_, identifier_index) => (
                                    <td key={identifier_index} className="p-4">
                                        {participant.identifiers[identifier_index] || '--'}
                                    </td>
                                ))}
                                <td className="p-4">{participant.total_score}/{participant.max_score}</td>
                                <td className="p-4">{formatDuration(participant.started_at, participant.submitted_at)}</td>
                                <td className="p-4">
                                    <span className="whitespace-nowrap px-3 py-1 rounded-full bg-background/15">
                                        {statusText}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                    {participants.length === 0 &&
                        <tr className="border-t border-text_main/20 text-center transition duration-300">
                            <td colSpan={4 + contestIdentifiers.length} className="p-4 text-text_placeholder_secondary">
                                No participant data!
                            </td>
                        </tr>
                    }
                </tbody>
            </table>
        </div>
    </div>
  );
};