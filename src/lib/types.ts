export type ReviewType = 'video' | 'pdf' | 'questions';

export interface Review {
  id: string;
  studyId: string;
  reviewNumber: 1 | 2 | 3 | 4;
  scheduledDate: string; // ISO date string YYYY-MM-DD
  originalDate: string; // original scheduled date
  completed: boolean;
  completedDate?: string;
  type?: ReviewType;
  rescheduledFrom?: string;
  notes?: string;
  timeSpentMinutes?: number;
}

export interface Study {
  id: string;
  discipline?: string;
  subject: string;
  description?: string;
  url?: string;
  studyDate: string; // ISO date string YYYY-MM-DD
  completionDate?: string; // Date when the study was completed
  totalHoursMinutes?: string;
  completed: boolean;
  completedDate?: string;
  reviews: Review[];
  createdAt: string;
}

export const REVIEW_SCHEDULE = [
  { number: 1 as const, daysAfter: 1, label: '1ª Revisão', description: '24 horas após o estudo' },
  { number: 2 as const, daysAfter: 7, label: '2ª Revisão', description: '7 dias após o estudo' },
  { number: 3 as const, daysAfter: 15, label: '3ª Revisão', description: '15 dias após o estudo' },
  { number: 4 as const, daysAfter: 30, label: '4ª Revisão', description: '30 dias após o estudo' },
];

export const REVIEW_TYPE_LABELS: Record<ReviewType, string> = {
  video: 'Vídeo-aula',
  pdf: 'Apostila PDF',
  questions: 'Resolução de Questões',
};

export const REVIEW_METHODOLOGY_GUIDE: Record<1 | 2 | 3 | 4, { title: string; instruction: string }> = {
  1: { title: '1ª Revisão - Vídeo Acelerado', instruction: 'Assistir videoaula acelerada em 1,25x. Seguida de resolução de questões e anotações.' },
  2: { title: '2ª Revisão - Material PDF', instruction: 'Revisar aula através do material em PDF. Seguida de resolução de questões e anotações.' },
  3: { title: '3ª Revisão - Vídeo Acelerado', instruction: 'Assistir videoaula acelerada em 1,50x. Seguida de resolução de questões e anotações.' },
  4: { title: '4ª Revisão - Vídeo Acelerado', instruction: 'Assistir videoaula acelerada em 1,50x. Seguida de resolução de questões e anotações.' },
};
