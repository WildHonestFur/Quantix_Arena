import {redirect} from 'next/navigation';
import {cookies} from 'next/headers';
import {supabase} from '@lib/supabaseClient';
import ContestsClient from './ContestsClient';

export default async function ContestsPage({params,}: {params: Promise<{id: string}>}) {
    const {id: contestId} = await params;
    return <ContestsClient id={contestId}/>;
}