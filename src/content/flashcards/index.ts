import type { Flashcard } from '../schema';
import { FOUNDATION_CARDS } from './foundations';
import { IDENTITY_CARDS } from './identity';
import { STORAGE_CARDS } from './storage';
import { NETWORKING_CARDS } from './networking';
import { COMPUTE_CARDS } from './compute';
import { MONITORING_CARDS } from './monitoring';

export const FLASHCARDS: Flashcard[] = [
  ...FOUNDATION_CARDS,
  ...IDENTITY_CARDS,
  ...STORAGE_CARDS,
  ...NETWORKING_CARDS,
  ...COMPUTE_CARDS,
  ...MONITORING_CARDS,
];

export const CARD_INDEX: Record<string, Flashcard> = Object.fromEntries(FLASHCARDS.map((c) => [c.id, c]));

export const CARD_DOMAIN: Record<string, Flashcard['domain']> = Object.fromEntries(FLASHCARDS.map((c) => [c.id, c.domain]));
