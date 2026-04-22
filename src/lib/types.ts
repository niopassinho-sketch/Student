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
}

export interface Study {
  id: string;
  discipline?: string;
  subject: string;
  description?: string;
  url?: string;
  studyDate: string; // ISO date string YYYY-MM-DD
  completionDate?: string; // Date when the study was completed
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
  1: { title: 'Flashcard / Feynman Rápido', instruction: 'Tente explicar o conceito em voz alta para si mesmo ANTES de consultar. Depois, force a memória com questões.' },
  2: { title: 'Resumo Ativo / PDF', instruction: 'Mentalize os tópicos principais antes de abrir o PDF. Desenhe um mapa mental rápido do que lembra.' },
  3: { title: 'Explicação Feynman', instruction: 'Explique o conceito como se estivesse ensinando uma criança. Se travar, essa é sua lacuna.' },
  4: { title: 'Simulação Complexa', instruction: 'Foco em questões difíceis e explicação em profundidade. Objetivo: fluidez total.' },
};
