import { LESSONS, type LessonRef } from '@/content/curriculum';
import type { LessonProgress } from '@/store/learner';

export type LessonStatus = 'not-started' | 'in-progress' | 'completed';

export function lessonStatus(progress: Record<string, LessonProgress>, lessonId: string): LessonStatus {
  const p = progress[lessonId];
  if (!p) return 'not-started';
  return p.completedAt ? 'completed' : 'in-progress';
}

export function moduleProgress(progress: Record<string, LessonProgress>, moduleId: string) {
  const lessons = LESSONS.filter((l) => l.moduleId === moduleId);
  const completed = lessons.filter((l) => progress[l.id]?.completedAt).length;
  const started = lessons.filter((l) => progress[l.id]).length;
  return { total: lessons.length, completed, started, ratio: lessons.length ? completed / lessons.length : 0 };
}

/** The lesson to continue: most recently visited unfinished lesson, else the first unfinished lesson in path order. */
export function continueLesson(progress: Record<string, LessonProgress>): LessonRef | undefined {
  const inProgress = LESSONS.filter((l) => progress[l.id] && !progress[l.id].completedAt).sort(
    (a, b) => progress[b.id].lastVisited - progress[a.id].lastVisited,
  );
  if (inProgress[0]) return inProgress[0];
  return LESSONS.find((l) => !progress[l.id]?.completedAt);
}
