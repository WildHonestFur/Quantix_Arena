'use server';

import {supabase} from '@lib/supabaseClient';
import {cookies} from 'next/headers';
import crypto from 'crypto';

type QuestionOption = {option_text: string};
type Question = {
  question: string;
  id: number;
  type: 'mcq' | 'fill';
  options: string[];
  diagram?: string | null;
};
type RawQuestion = {
  question: string;
  type: 'mcq' | 'fill';
  id: number;
  diagram?: string | null;
  question_options: QuestionOption[];
};

function getIdentifiersHash(values: Record<string, string>) {
  const sorted = Object.entries(values)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join(',');
  return crypto.createHash('md5').update(sorted).digest('hex');
}

function getPasswordHash(password: string) {
  return crypto.createHash('md5').update(password).digest('hex');
}

export async function validateCompetition(unprocessed_code: string) {
  const code = unprocessed_code.trim().toLowerCase();

  const {data, error} = await supabase
    .from('competitions')
    .select('id, start_datetime, end_datetime, released_scores')
    .eq('code', code)
    .maybeSingle();

  if (error) {
    return {valid: false, message: 'Server error'};
  }
  if (!data) {
    return {valid: false, message: 'Invalid code'};
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: 'competitionId',
    value: data.id,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });

  const now = new Date();
  if (data.end_datetime && new Date(data.end_datetime) < now) {
    return {valid: true, competitionId: data.id, message: '', ended: true, scores: data.released_scores};
  }

  return {valid: true, competitionId: data.id, message: '', ended: false};
}

export async function fetchFields(competitionId: number) {
  const {data, error} = await supabase
    .from('competition_identifiers')
    .select('identifier_name, like_check')
    .eq('competition_id', competitionId)
    .order('id', {ascending: true});

  if (error) {
    return {success: false, message: 'Server error', data: [], checks: []};
  }

  if (!data || data.length === 0) {
    return {success: true, message: '', data: [], checks: []};
  }

  return {success: true, message: '', data: data.map(row => row.identifier_name), checks: data.map(row => row.like_check)};
}

export async function verifyParticipant(competitionId: number, values: Record<string, string>) {
  const identifiersHash = getIdentifiersHash(values);

  const {data: existing, error: checkError} = await supabase
    .from('participants')
    .select('*')
    .eq('competition_id', competitionId)
    .eq('identifiers_hash', identifiersHash)
    .maybeSingle();

  if (checkError) {
    return {success: false, message: 'Server error'};
  }

  if (existing) {
    return {success: true, message: '', exists: true};
  }

  return {success: true, message: '', exists: false};
}

export async function createParticipant(competitionId: number, values: Record<string, string>, password: string) {
  const identifiersHash = getIdentifiersHash(values);
  const passwordHash = getPasswordHash(password);

  const {data: existing, error: checkError} = await supabase
    .from('participants')
    .select('*')
    .eq('competition_id', competitionId)
    .eq('identifiers_hash', identifiersHash)
    .maybeSingle();

  if (checkError) {
    return {success: false, message: 'Server error'};
  }

  if (existing) {
    if (existing.password_hash === passwordHash) {
      const cookieStore = await cookies();
      cookieStore.set({
        name: 'participantId',
        value: existing.id,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
      return {success: true, message: ''};
    }
    else {
      return {success: false, message: 'Wrong password'};
    }
  }
  else {
    const {data: participant, error: insertError} = await supabase
      .from('participants')
      .insert({competition_id: competitionId, identifiers_hash: identifiersHash, password_hash: passwordHash})
      .select('*')
      .maybeSingle();

    if (insertError) {
      return {success: false, message: 'Server error'};
    }

    const identifiers = Object.entries(values).map(([name, value]) => ({
      participant_id: participant.id,
      identifier_name: name,
      identifier_value: value,
    }));

    const {error: idError} = await supabase
      .from('participant_identifiers')
      .insert(identifiers);

    if (idError) {
      return {success: false, message: 'Server error'};
    }

    const cookieStore = await cookies();
    cookieStore.set({
      name: 'participantId',
      value: participant.id,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });
    return {success: true, message: ''};
  }
}

export async function getStartTime(competitionId: number) {
  const {data, error} = await supabase
    .from('competitions')
    .select('start_datetime, name')
    .eq('id', competitionId)
    .single();

  if (error) {
    return {success: false, message: 'Server error'};
  }

  return {success: true, start: data.start_datetime, name: data.name, message: ''};
}

export async function getContestData(competitionId: number) {
  const {data, error} = await supabase
    .from('competitions')
    .select('end_datetime, name')
    .eq('id', competitionId)
    .single();

  if (error) {
    return {success: false, message: 'Server error'};
  }

  const {data: questionsData, error: qerror} = await supabase
    .from('questions')
    .select('question, type, id, diagram, question_options(option_text)')
    .eq('competition_id', competitionId)
    .order('order_index', {ascending: true});

  if (qerror) {
    return {success: false, message: 'Server error'};
  }

  const formattedQuestions: Question[] = (questionsData || []).map((q: RawQuestion) => ({
    question: q.question,
    type: q.type,
    id: q.id,
    options: q.type === 'mcq' ? q.question_options.map((opt: QuestionOption) => opt.option_text) : [],
    diagram: q.diagram || null
  }));

  return {success: true, end: data.end_datetime, name: data.name, questions: formattedQuestions, message: ''};
}

export async function submit(competitionId: number, participantId: number, values: Record<number, string>) {
  const {data, error} = await supabase
    .from('participants')
    .select('submitted')
    .eq('competition_id', competitionId)
    .eq('id', participantId)
    .single();

  if (error) {
    return {success: false, message: 'Server error'};
  }

  if (data.submitted) {
    return {success: false, message: 'Already submitted'};
  }

  const answerRows = Object.entries(values).map(([questionId, submittedAnswer]) => ({
    participant_id: participantId,
    question_id: Number(questionId),
    submitted_answer: submittedAnswer,
  }));

  const {error: insertError} = await supabase
    .from('answers')
    .insert(answerRows)

  if (insertError) {
    return {success: false, message: 'Server error'};
  }

  const {error: updateError} = await supabase
    .from('participants')
    .update({submitted: true})
    .eq('id', participantId)
    .eq('competition_id', competitionId);

  if (updateError) {
    return {success: false, message: 'Server error'};
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: 'fromContest',
    value: 'true',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30,
  });

  return {success: true, message: ''};
}

export async function strike(participantId: number) {
  const {data: participant, error: fetchError} = await supabase
    .from('participants')
    .select('leave_attempts, last_attempt')
    .eq('id', participantId)
    .single();

  if (fetchError) {
    return {success: false, message: 'Server error'};
  }

  const now = new Date();
  const last = new Date(participant.last_attempt)

  if (now.getTime() - last.getTime() < 5000) {
    return {success: false, message: '', warning: true};
  }

  const {data, error} = await supabase
    .from('participants')
    .update({leave_attempts: participant.leave_attempts + 1, last_attempt: now})
    .eq('id', participantId)
    .select('leave_attempts')
    .single();

  if (error) {
    return {success: false, message: 'Server error'};
  }

  if (data.leave_attempts < 2) {
    return {success: false, message: '', warning: true};
  }
  else if (data.leave_attempts < 3) {
    return {success: true, message: '', warning: true, num: 1};
  }
  else if (data.leave_attempts < 4) {
    return {success: true, message: '', warning: true, num: 2};
  }

  return {success: true, message: '', warning: false};
}

export async function leave(participantId: number) {
  const now = new Date();
  const {error} = await supabase
    .from('participants')
    .update({last_attempt: now})
    .eq('id', participantId)

  if (error) {
    return {success: false, message: 'Server error'};
  }

  return {success: true, message: ''};
}
