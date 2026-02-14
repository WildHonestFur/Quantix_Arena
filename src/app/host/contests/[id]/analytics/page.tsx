import {redirect} from 'next/navigation';
import {cookies} from 'next/headers';
import AnalyticsClient from './AnalyticsClient';

export default async function AnalyticsPage({params,}: {params: Promise<{id: string}>}) {
    const {id: contestId} = await params;
    return <AnalyticsClient id={contestId}/>;
}