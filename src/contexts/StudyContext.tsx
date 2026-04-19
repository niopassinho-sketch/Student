import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Study, ReviewType } from '@/lib/types';
import {
  loadStudiesFromDB, createStudyInDB,
  completeReviewInDB, rescheduleReviewInDB,
  completeStudyInDB, deleteStudyInDB, updateStudyInDB, markStudyAsWatchedInDB, updateReviewNotesInDB,
  getTodayReviews, hasReviewOnDate,
} from '@/lib/studyStore';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface StudyContextType {
  studies: Study[];
  todayReviews: ReturnType<typeof getTodayReviews>;
  loading: boolean;
  addStudy: (discipline: string, subject: string, studyDate: string, description?: string, url?: string) => Promise<void>;
  updateStudy: (studyId: string, discipline: string, subject: string, studyDate: string, description?: string, url?: string) => Promise<void>;
  markStudyAsWatched: (studyId: string, completionDate: string) => Promise<void>;
  markReviewComplete: (studyId: string, reviewId: string, type: ReviewType) => Promise<void>;
  updateReviewNotes: (studyId: string, reviewId: string, notes: string) => Promise<void>;
  rescheduleReview: (studyId: string, reviewId: string, newDate: string) => Promise<void>;
  checkDateConflict: (date: string, excludeReviewId?: string) => boolean;
  deleteStudy: (studyId: string) => Promise<void>;
}

const StudyContext = createContext<StudyContextType | null>(null);

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setStudies([]); setLoading(false); return; }
    setLoading(true);
    loadStudiesFromDB(user.id).then(data => {
      setStudies(data);
      setLoading(false);
    });
  }, [user]);

  const todayReviews = getTodayReviews(studies);

  const addStudy = useCallback(async (discipline: string, subject: string, studyDate: string, description?: string, url?: string) => {
    if (!user) return;
    const study = await createStudyInDB(user.id, discipline, subject, studyDate, description, url);
    if (study) {
      setStudies(prev => [study, ...prev]);
      toast.success('Aula agendada!');
    } else {
      toast.error('Erro ao agendar aula');
    }
  }, [user]);

  const updateStudyFn = useCallback(async (studyId: string, discipline: string, subject: string, studyDate: string, description?: string, url?: string) => {
    const ok = await updateStudyInDB(studyId, discipline, subject, studyDate, description, url);
    if (ok) {
      setStudies(prev => prev.map(s => s.id === studyId ? { ...s, discipline, subject, studyDate, description, url } : s));
      toast.success('Estudo atualizado!');
    } else {
      toast.error('Erro ao atualizar estudo');
    }
  }, []);

  const markStudyAsWatched = useCallback(async (studyId: string, completionDate: string) => {
    if (!user) return;
    const reviews = await markStudyAsWatchedInDB(user.id, studyId, completionDate);
    if (reviews) {
      setStudies(prev => prev.map(s => s.id === studyId
        ? { ...s, completed: true, completionDate, reviews }
        : s
      ));
      toast.success('Aula marcada como assistida!');
    } else {
      toast.error('Erro ao marcar aula como assistida');
    }
  }, [user]);

  const markReviewComplete = useCallback(async (_studyId: string, reviewId: string, type: ReviewType) => {
    const ok = await completeReviewInDB(reviewId, type);
    if (ok) {
      setStudies(prev => prev.map(study => ({
        ...study,
        reviews: study.reviews.map(r =>
          r.id === reviewId
            ? { ...r, completed: true, completedDate: new Date().toISOString().split('T')[0], type }
            : r
        ),
      })));
      toast.success('Revisão concluída!');
    }
  }, []);

  const updateReviewNotes = useCallback(async (_studyId: string, reviewId: string, notes: string) => {
    const ok = await updateReviewNotesInDB(reviewId, notes);
    if (ok) {
      setStudies(prev => prev.map(study => ({
        ...study,
        reviews: study.reviews.map(r =>
          r.id === reviewId
            ? { ...r, notes }
            : r
        ),
      })));
      toast.success('Impressões salvas!');
    } else {
      toast.error('Erro ao salvar impressões');
    }
  }, []);

  const reschedule = useCallback(async (_studyId: string, reviewId: string, newDate: string) => {
    // Find current scheduled date
    let oldDate = '';
    for (const s of studies) {
      const r = s.reviews.find(r => r.id === reviewId);
      if (r) { oldDate = r.scheduledDate; break; }
    }
    const ok = await rescheduleReviewInDB(reviewId, newDate, oldDate);
    if (ok) {
      setStudies(prev => prev.map(study => ({
        ...study,
        reviews: study.reviews.map(r =>
          r.id === reviewId
            ? { ...r, scheduledDate: newDate, rescheduledFrom: oldDate }
            : r
        ),
      })));
      toast.success('Revisão remarcada!');
    }
  }, [studies]);

  const checkDateConflict = useCallback((date: string, excludeReviewId?: string) => {
    return hasReviewOnDate(studies, date, excludeReviewId);
  }, [studies]);

  const deleteStudyFn = useCallback(async (studyId: string) => {
    const ok = await deleteStudyInDB(studyId);
    if (ok) {
      setStudies(prev => prev.filter(s => s.id !== studyId));
      toast.success('Estudo excluído');
    }
  }, []);

  return (
    <StudyContext.Provider value={{
      studies, todayReviews, loading, addStudy, updateStudy: updateStudyFn, markStudyAsWatched,
      markReviewComplete, updateReviewNotes, rescheduleReview: reschedule, checkDateConflict, deleteStudy: deleteStudyFn,
    }}>
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy() {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error('useStudy must be used within StudyProvider');
  return ctx;
}
