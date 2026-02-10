import {redirect} from 'next/navigation';
import {cookies} from 'next/headers';
import {supabase} from '@lib/supabaseClient';
import LoginClient from './LoginClient';

export default async function LoginPage() {
  return <LoginClient/>;
}