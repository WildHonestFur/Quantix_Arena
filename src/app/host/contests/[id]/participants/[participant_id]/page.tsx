import {redirect} from 'next/navigation';
import {cookies} from 'next/headers';
import IndividualParticipantsClient from './IndividualParticipantsClient';

export default async function IndividualParticipantsPage({params,}: {params: Promise<{id: string, participant_id: string}>}) {
    const {id: contestId, participant_id: participantId} = await params;
    return <IndividualParticipantsClient id={contestId} participantId={participantId}/>;
}