import {redirect} from 'next/navigation';
import {cookies} from 'next/headers';
import {supabase} from '@lib/supabaseClient';
import WaitingClient from './WaitingClient';

type CompetitionStatus = {
  valid: boolean;
  over: boolean;
  results_out: boolean;
  started: boolean;
  id: number;
};

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

async function checkParticipantId(cid: CompetitionStatus, participant_id: number | null) {
  if (participant_id === null) {
    return {valid: false, submitted: false};
  }

  const {data, error} = await supabase
    .from('participants')
    .select('competition_id, submitted')
    .eq('id', participant_id)
    .maybeSingle();

  if (error || !data || data.competition_id != cid.id) {
    return {valid: false, submitted: false};
  }

  return {valid: true, submitted: data.submitted};
}

export default async function WaitingPage() {
  const cookieStore = await cookies();
  const competition_id = cookieStore.get('competitionId');
  const competition_id_parsed = competition_id ? parseInt(competition_id.value, 10) : null;
  const cid = await checkCompetitionId(competition_id_parsed);
  if (!cid.valid) {
    console.log('cid');
    return redirect('/join');
  }
  const participant_id = cookieStore.get('participantId');
  const participant_id_parsed = participant_id ? parseInt(participant_id.value, 10) : null;
  const pid = await checkParticipantId(cid, participant_id_parsed);

  if (cid.over) {
    if (cid.results_out) {
      return redirect('/results');
    }
    else {
      return redirect('/over');
    }
  }
  else if (pid.submitted) {
    return redirect('/thanks');
  }
  if (!pid.valid) {
    console.log('pid');
    return redirect('/join');
  }

  return <WaitingClient/>;
}