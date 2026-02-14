import {redirect} from 'next/navigation';
import {cookies} from 'next/headers';
import ParticipantsClient from './ParticipantsClient';

export default async function ParticipantsPage({params,}: {params: Promise<{id: string}>}) {
    const {id: contestId} = await params;
    return <ParticipantsClient id={contestId}/>;
}