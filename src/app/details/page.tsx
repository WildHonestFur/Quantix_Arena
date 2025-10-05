import {redirect} from 'next/navigation';
import {cookies} from 'next/headers';
import {supabase} from '@lib/supabaseClient';
import DetailsClient from './DetailsClient';

async function checkCompetitionId(competition_id: number | null) {
  if (competition_id === null) {
    return {valid: false, over: false, results_out: false, started: false, id: 0};
  }

  const {data, error} = await supabase
    .from('competitions')
    .select('id, end_datetime, start_datetime, released_scores')
    .eq('id', competition_id)
    .maybeSingle();

  if (error || !data) {
    return {valid: false, over: false, results_out: false, started: false, id: 0};
  }

  const now = new Date();
  return {valid: true, over: new Date(data.end_datetime) < now, results_out: data.released_scores, started: new Date(data.start_datetime) < now, id: data.id};
}

export default async function DetailsPage() {
  const cookieStore = await cookies();
  const competition_id = cookieStore.get('competitionId');
  const competition_id_parsed = competition_id ? parseInt(competition_id.value, 10) : null;
  const cid = await checkCompetitionId(competition_id_parsed);
  if (!cid.valid) {
    return redirect('/join');
  }

  if (cid.over) {
    if (cid.results_out) {
      return redirect('/results');
    }
    else {
      return redirect('/over');
    }
  }

  return <DetailsClient/>;
}