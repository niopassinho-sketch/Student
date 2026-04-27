import { Study, Review, REVIEW_SCHEDULE, ReviewType } from './types';
import { addDays, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

// ── Database helpers ──

export async function loadStudiesFromDB(userId: string): Promise<Study[]> {
  const { data: studiesData, error: sErr } = await supabase
    .from('studies')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (sErr || !studiesData) return [];

  const { data: reviewsData, error: rErr } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userId);

  if (rErr) return [];

  const reviewsByStudy = new Map<string, Review[]>();
  for (const r of reviewsData || []) {
    const review: Review = {
      id: r.id,
      studyId: r.study_id,
      reviewNumber: r.review_number as 1 | 2 | 3 | 4,
      scheduledDate: r.scheduled_date,
      originalDate: r.original_date,
      completed: r.completed,
      completedDate: r.completed_date ?? undefined,
      notes: r.notes ?? undefined,
      type: (r.review_type as ReviewType) ?? undefined,
      rescheduledFrom: r.rescheduled_from ?? undefined,
      timeSpentMinutes: r.time_spent_minutes ?? undefined,
    };
    const list = reviewsByStudy.get(r.study_id) || [];
    list.push(review);
    reviewsByStudy.set(r.study_id, list);
  }

  return studiesData.map(s => ({
    id: s.id,
    discipline: s.discipline ?? undefined,
    subject: s.subject,
    description: s.description ?? undefined,
    url: s.url ?? undefined,
    studyDate: s.study_date,
    totalHoursMinutes: s.total_hours_minutes ?? undefined,
    completionDate: s.completion_date ?? undefined,
    completed: s.completed,
    completedDate: s.completed_date ?? undefined,
    reviews: (reviewsByStudy.get(s.id) || []).sort((a, b) => a.reviewNumber - b.reviewNumber),
    createdAt: s.created_at,
  }));
}

export async function createStudyInDB(userId: string, discipline: string, subject: string, studyDate: string, description?: string, url?: string, totalHoursMinutes?: string): Promise<Study | null> {
  const { data: study, error: sErr } = await supabase
    .from('studies')
    .insert({ user_id: userId, discipline, subject, description, url, study_date: studyDate, total_hours_minutes: totalHoursMinutes })
    .select()
    .single();

  if (sErr || !study) return null;

  return {
    id: study.id,
    discipline: study.discipline ?? undefined,
    subject: study.subject,
    description: study.description ?? undefined,
    url: study.url ?? undefined,
    studyDate: study.study_date,
    completionDate: study.completion_date ?? undefined,
    totalHoursMinutes: study.total_hours_minutes ?? undefined,
    completed: study.completed,
    reviews: [],
    createdAt: study.created_at,
  };
}

export async function markStudyAsWatchedInDB(userId: string, studyId: string, completionDate: string): Promise<Review[] | null> {
  const { error: sErr } = await supabase
    .from('studies')
    .update({ completion_date: completionDate, completed: true })
    .eq('id', studyId);

  if (sErr) return null;

  const baseDate = new Date(completionDate + 'T12:00:00');

  const reviewInserts = REVIEW_SCHEDULE.map(schedule => ({
    study_id: studyId,
    user_id: userId,
    review_number: schedule.number,
    scheduled_date: format(addDays(baseDate, schedule.daysAfter), 'yyyy-MM-dd'),
    original_date: format(addDays(baseDate, schedule.daysAfter), 'yyyy-MM-dd'),
  }));

  const { data: reviews, error: rErr } = await supabase
    .from('reviews')
    .insert(reviewInserts)
    .select();

  if (rErr || !reviews) return null;

  return reviews.map(r => ({
    id: r.id,
    studyId: r.study_id,
    reviewNumber: r.review_number as 1 | 2 | 3 | 4,
    scheduledDate: r.scheduled_date,
    originalDate: r.original_date,
    completed: r.completed,
    type: undefined,
  })).sort((a, b) => a.reviewNumber - b.reviewNumber);
}

export async function completeReviewInDB(reviewId: string, type: ReviewType, timeSpentMinutes?: number): Promise<boolean> {
  const { error } = await supabase
    .from('reviews')
    .update({ completed: true, completed_date: format(new Date(), 'yyyy-MM-dd'), review_type: type, time_spent_minutes: timeSpentMinutes })
    .eq('id', reviewId);
  return !error;
}

export async function rescheduleReviewInDB(reviewId: string, newDate: string, oldDate: string): Promise<boolean> {
  const { error } = await supabase
    .from('reviews')
    .update({ scheduled_date: newDate, rescheduled_from: oldDate })
    .eq('id', reviewId);
  return !error;
}

export async function updateReviewNotesInDB(reviewId: string, notes: string): Promise<boolean> {
  const { error } = await supabase
    .from('reviews')
    .update({ notes })
    .eq('id', reviewId);
  return !error;
}

export async function completeStudyInDB(studyId: string): Promise<boolean> {
  const { error } = await supabase
    .from('studies')
    .update({ completed: true, completed_date: format(new Date(), 'yyyy-MM-dd') })
    .eq('id', studyId);
  return !error;
}

export async function deleteStudyInDB(studyId: string): Promise<boolean> {
  const { error } = await supabase
    .from('studies')
    .delete()
    .eq('id', studyId);
  return !error;
}

export async function updateStudyInDB(studyId: string, discipline: string, subject: string, completionDate: string, description?: string, url?: string, totalHoursMinutes?: string): Promise<boolean> {
  const { error } = await supabase
    .from('studies')
    .update({ discipline, subject, completion_date: completionDate, description, url, total_hours_minutes: totalHoursMinutes })
    .eq('id', studyId);
  return !error;
}

// ── Derived data helpers ──

export function getTodayReviews(studies: Study[]): (Review & { subjectName: string; studyUrl?: string })[] {
  const today = format(new Date(), 'yyyy-MM-dd');
  const results: (Review & { subjectName: string; studyUrl?: string })[] = [];
  for (const study of studies) {
    for (const review of study.reviews) {
      if (review.scheduledDate === today && !review.completed) {
        results.push({ ...review, subjectName: study.subject, studyUrl: study.url });
      }
    }
  }
  return results;
}

export function hasReviewOnDate(studies: Study[], date: string, excludeReviewId?: string): boolean {
  for (const study of studies) {
    for (const review of study.reviews) {
      if (review.scheduledDate === date && !review.completed && review.id !== excludeReviewId) {
        return true;
      }
    }
  }
  return false;
}
