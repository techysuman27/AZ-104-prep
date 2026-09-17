import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { DomainId } from '@/content/schema';
import { reviewCard, type SrsCard, type SrsGrade } from '@/engine/srs';

/**
 * Learner state — local-first and persisted to localStorage.
 * Everything the readiness engine needs is derived from these raw records,
 * so the store never holds computed scores that could drift out of sync.
 * Swap the storage adapter to sync with a backend later.
 */

export type AttemptMode = 'lesson' | 'practice' | 'mock' | 'review';

export interface Attempt {
  questionId: string;
  correct: boolean;
  /** 0..1 partial credit */
  score: number;
  at: number;
  mode: AttemptMode;
  ms?: number;
}

export interface LessonProgress {
  startedAt: number;
  lastVisited: number;
  sectionsSeen: string[];
  completedAt?: number;
}

export interface MockResult {
  id: string;
  blueprint: 'full' | 'half' | 'quick';
  startedAt: number;
  finishedAt: number;
  durationMs: number;
  questionIds: string[];
  answers: Record<string, unknown>;
  flagged: string[];
  results: Record<string, { correct: boolean; score: number }>;
  byDomain: Record<DomainId, { correct: number; total: number }>;
  percent: number;
}

export interface BookmarkEntry {
  kind: 'lesson' | 'concept' | 'question' | 'lab' | 'architecture' | 'scenario';
  id: string;
  at: number;
}

export interface Settings {
  explanationMode: 'technical' | 'simple';
  examDate?: string;
  sidebarCollapsed: boolean;
}

export interface LearnerState {
  version: number;
  lessons: Record<string, LessonProgress>;
  attempts: Attempt[];
  srs: Record<string, SrsCard>;
  bookmarks: BookmarkEntry[];
  recent: BookmarkEntry[];
  mocks: MockResult[];
  labs: Record<string, { tasksDone: string[]; completedAt?: number }>;
  trouble: Record<string, { solvedAt: number; toolsUsed: number; firstTry: boolean; score: number }>;
  design: Record<string, { score: number; max: number; completedAt: number }>;
  activityDays: string[];
  settings: Settings;

  visitLesson: (lessonId: string) => void;
  markSectionSeen: (lessonId: string, sectionId: string) => void;
  completeLesson: (lessonId: string) => void;
  resetLesson: (lessonId: string) => void;
  recordAttempts: (attempts: Attempt[]) => void;
  gradeCard: (cardId: string, grade: SrsGrade, now?: number) => void;
  toggleBookmark: (entry: Omit<BookmarkEntry, 'at'>) => void;
  pushRecent: (entry: Omit<BookmarkEntry, 'at'>) => void;
  saveMock: (result: MockResult) => void;
  toggleLabTask: (labId: string, taskId: string) => void;
  completeLab: (labId: string) => void;
  saveTrouble: (scenarioId: string, result: { toolsUsed: number; firstTry: boolean; score: number }) => void;
  saveDesign: (challengeId: string, score: number, max: number) => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  importState: (data: Partial<LearnerState>) => void;
  resetAll: () => void;
}

const MAX_ATTEMPTS = 5000;
const MAX_RECENT = 24;

function today(now = Date.now()) {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function withActivity(days: string[], now = Date.now()) {
  const t = today(now);
  return days.includes(t) ? days : [...days, t].slice(-400);
}

const initial = {
  version: 1,
  lessons: {},
  attempts: [],
  srs: {},
  bookmarks: [],
  recent: [],
  mocks: [],
  labs: {},
  trouble: {},
  design: {},
  activityDays: [],
  settings: { explanationMode: 'technical' as const, sidebarCollapsed: false },
};

export const useLearner = create<LearnerState>()(
  persist(
    (set) => ({
      ...initial,

      visitLesson: (lessonId) =>
        set((s) => {
          const now = Date.now();
          const prev = s.lessons[lessonId];
          return {
            lessons: {
              ...s.lessons,
              [lessonId]: prev
                ? { ...prev, lastVisited: now }
                : { startedAt: now, lastVisited: now, sectionsSeen: [] },
            },
          };
        }),

      markSectionSeen: (lessonId, sectionId) =>
        set((s) => {
          const now = Date.now();
          const prev = s.lessons[lessonId] ?? { startedAt: now, lastVisited: now, sectionsSeen: [] };
          if (prev.sectionsSeen.includes(sectionId)) return {};
          return {
            lessons: { ...s.lessons, [lessonId]: { ...prev, sectionsSeen: [...prev.sectionsSeen, sectionId] } },
          };
        }),

      completeLesson: (lessonId) =>
        set((s) => {
          const now = Date.now();
          const prev = s.lessons[lessonId] ?? { startedAt: now, lastVisited: now, sectionsSeen: [] };
          return {
            lessons: { ...s.lessons, [lessonId]: { ...prev, completedAt: prev.completedAt ?? now } },
            activityDays: withActivity(s.activityDays, now),
          };
        }),

      resetLesson: (lessonId) =>
        set((s) => {
          const next = { ...s.lessons };
          delete next[lessonId];
          return { lessons: next };
        }),

      recordAttempts: (attempts) =>
        set((s) => ({
          attempts: [...s.attempts, ...attempts].slice(-MAX_ATTEMPTS),
          activityDays: withActivity(s.activityDays),
        })),

      gradeCard: (cardId, grade, now = Date.now()) =>
        set((s) => ({
          srs: { ...s.srs, [cardId]: reviewCard(s.srs[cardId], cardId, grade, now) },
          activityDays: withActivity(s.activityDays, now),
        })),

      toggleBookmark: (entry) =>
        set((s) => {
          const exists = s.bookmarks.some((b) => b.kind === entry.kind && b.id === entry.id);
          return {
            bookmarks: exists
              ? s.bookmarks.filter((b) => !(b.kind === entry.kind && b.id === entry.id))
              : [{ ...entry, at: Date.now() }, ...s.bookmarks],
          };
        }),

      pushRecent: (entry) =>
        set((s) => ({
          recent: [
            { ...entry, at: Date.now() },
            ...s.recent.filter((r) => !(r.kind === entry.kind && r.id === entry.id)),
          ].slice(0, MAX_RECENT),
        })),

      saveMock: (result) =>
        set((s) => ({ mocks: [...s.mocks, result].slice(-50), activityDays: withActivity(s.activityDays) })),

      toggleLabTask: (labId, taskId) =>
        set((s) => {
          const prev = s.labs[labId] ?? { tasksDone: [] };
          const done = prev.tasksDone.includes(taskId)
            ? prev.tasksDone.filter((t) => t !== taskId)
            : [...prev.tasksDone, taskId];
          return { labs: { ...s.labs, [labId]: { ...prev, tasksDone: done } } };
        }),

      completeLab: (labId) =>
        set((s) => {
          const prev = s.labs[labId] ?? { tasksDone: [] };
          return {
            labs: { ...s.labs, [labId]: { ...prev, completedAt: prev.completedAt ?? Date.now() } },
            activityDays: withActivity(s.activityDays),
          };
        }),

      saveTrouble: (scenarioId, result) =>
        set((s) => {
          const prev = s.trouble[scenarioId];
          const best = prev && prev.score >= result.score ? prev : { ...result, solvedAt: Date.now() };
          return { trouble: { ...s.trouble, [scenarioId]: best }, activityDays: withActivity(s.activityDays) };
        }),

      saveDesign: (challengeId, score, max) =>
        set((s) => {
          const prev = s.design[challengeId];
          const best = prev && prev.score >= score ? prev : { score, max, completedAt: Date.now() };
          return { design: { ...s.design, [challengeId]: best }, activityDays: withActivity(s.activityDays) };
        }),

      setSetting: (key, value) => set((s) => ({ settings: { ...s.settings, [key]: value } })),

      importState: (data) =>
        set(() => ({
          ...initial,
          ...data,
          settings: { ...initial.settings, ...(data.settings ?? {}) },
        })),

      resetAll: () => set(() => ({ ...initial })),
    }),
    {
      name: 'stratus-learner',
      version: 1,
      storage: createJSONStorage(() => {
        try {
          const probe = '__stratus_probe__';
          window.localStorage.setItem(probe, '1');
          window.localStorage.removeItem(probe);
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
      partialize: (s) => ({
        version: s.version,
        lessons: s.lessons,
        attempts: s.attempts,
        srs: s.srs,
        bookmarks: s.bookmarks,
        recent: s.recent,
        mocks: s.mocks,
        labs: s.labs,
        trouble: s.trouble,
        design: s.design,
        activityDays: s.activityDays,
        settings: s.settings,
      }),
    },
  ),
);

export function isBookmarked(state: Pick<LearnerState, 'bookmarks'>, kind: BookmarkEntry['kind'], id: string) {
  return state.bookmarks.some((b) => b.kind === kind && b.id === id);
}
