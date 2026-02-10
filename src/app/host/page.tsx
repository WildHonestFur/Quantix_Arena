import {redirect} from 'next/navigation';
import {cookies} from 'next/headers';
import {supabase} from '@lib/supabaseClient';
import HostClient from './HostClient';

export default async function HostPage() {
  return <HostClient/>;
}