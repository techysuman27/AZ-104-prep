import type { DesignChallenge } from '../schema';
import { DESIGN_CHALLENGES_LIST } from './challenges';
import { DESIGN_CHALLENGES_PART_2 } from './challenges-2';

export const DESIGN_CHALLENGES: DesignChallenge[] = [...DESIGN_CHALLENGES_LIST, ...DESIGN_CHALLENGES_PART_2];

export const DESIGN_INDEX: Record<string, DesignChallenge> = Object.fromEntries(DESIGN_CHALLENGES.map((d) => [d.id, d]));

export const DESIGN_DOMAINS = Object.fromEntries(DESIGN_CHALLENGES.map((d) => [d.id, d.domains]));
