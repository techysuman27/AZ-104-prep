/**
 * Spaced repetition (SM-2 family, four grades).
 * Deterministic and dependency-free so it can be unit tested and reused for
 * flashcards and "explain again" review queues.
 */

export type SrsGrade = 0 | 1 | 2 | 3; // Again, Hard, Good, Easy

export interface SrsCard {
  id: string;
  ease: number;
  /** Interval in days. */
  interval: number;
  reps: number;
  lapses: number;
  due: number;
  last?: number;
}

export const DAY = 86_400_000;
const MIN_EASE = 1.3;

export function newCard(id: string, now = Date.now()): SrsCard {
  return { id, ease: 2.5, interval: 0, reps: 0, lapses: 0, due: now };
}

export function reviewCard(card: SrsCard | undefined, id: string, grade: SrsGrade, now = Date.now()): SrsCard {
  const c = card ?? newCard(id, now);
  let { ease, interval, reps, lapses } = c;

  if (grade === 0) {
    reps = 0;
    lapses += 1;
    ease = Math.max(MIN_EASE, ease - 0.2);
    interval = 10 / (60 * 24); // ten minutes
  } else {
    reps += 1;
    if (reps === 1) {
      interval = grade === 3 ? 3 : 1;
    } else if (reps === 2) {
      interval = grade === 1 ? 3 : grade === 3 ? 8 : 6;
    } else {
      const factor = grade === 1 ? 1.2 : grade === 3 ? ease * 1.3 : ease;
      interval = Math.max(interval + 1, Math.round(interval * factor));
    }
    if (grade === 1) ease = Math.max(MIN_EASE, ease - 0.15);
    if (grade === 3) ease = ease + 0.15;
  }

  return { id, ease, interval, reps, lapses, due: now + interval * DAY, last: now };
}

/** Probability of recall now, ≈0.9 when the interval has just elapsed. */
export function retrievability(card: SrsCard, now = Date.now()): number {
  if (!card.last) return 0;
  const elapsedDays = (now - card.last) / DAY;
  const stability = Math.max(card.interval, 0.5);
  return Math.exp((Math.log(0.9) * elapsedDays) / stability);
}

export function isDue(card: SrsCard | undefined, now = Date.now()): boolean {
  return !card || card.due <= now;
}

export function previewIntervals(card: SrsCard | undefined, id: string, now = Date.now()): Record<SrsGrade, number> {
  return {
    0: reviewCard(card, id, 0, now).interval,
    1: reviewCard(card, id, 1, now).interval,
    2: reviewCard(card, id, 2, now).interval,
    3: reviewCard(card, id, 3, now).interval,
  };
}

export function formatInterval(days: number): string {
  if (days < 1 / 24) return `${Math.max(1, Math.round(days * 24 * 60))}m`;
  if (days < 1) return `${Math.round(days * 24)}h`;
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}
