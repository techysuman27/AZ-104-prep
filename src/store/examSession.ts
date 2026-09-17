import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Blueprint } from '@/engine/mockExam';
import type { Answer } from '@/engine/grading';

/**
 * The in-progress mock exam. Persisted separately from learner progress so a
 * refresh or accidental tab close doesn't lose an exam, and so an abandoned exam
 * never pollutes readiness data.
 */
export interface ExamSession {
  id: string;
  blueprint: Blueprint;
  questionIds: string[];
  answers: Record<string, Answer>;
  flagged: string[];
  current: number;
  startedAt: number;
  endsAt: number;
}

interface ExamSessionState {
  session: ExamSession | null;
  start: (session: ExamSession) => void;
  answer: (questionId: string, answer: Answer) => void;
  toggleFlag: (questionId: string) => void;
  goTo: (index: number) => void;
  clear: () => void;
}

export const useExamSession = create<ExamSessionState>()(
  persist(
    (set) => ({
      session: null,
      start: (session) => set({ session }),
      answer: (questionId, answer) =>
        set((s) => (s.session ? { session: { ...s.session, answers: { ...s.session.answers, [questionId]: answer } } } : {})),
      toggleFlag: (questionId) =>
        set((s) =>
          s.session
            ? {
                session: {
                  ...s.session,
                  flagged: s.session.flagged.includes(questionId)
                    ? s.session.flagged.filter((f) => f !== questionId)
                    : [...s.session.flagged, questionId],
                },
              }
            : {},
        ),
      goTo: (index) => set((s) => (s.session ? { session: { ...s.session, current: index } } : {})),
      clear: () => set({ session: null }),
    }),
    {
      name: 'stratus-exam-session',
      version: 1,
      storage: createJSONStorage(() => {
        try {
          window.localStorage.setItem('__stratus_probe__', '1');
          window.localStorage.removeItem('__stratus_probe__');
          return window.localStorage;
        } catch {
          const mem = new Map<string, string>();
          return {
            getItem: (k: string) => mem.get(k) ?? null,
            setItem: (k: string, v: string) => void mem.set(k, v),
            removeItem: (k: string) => void mem.delete(k),
          };
        }
      }),
    },
  ),
);
