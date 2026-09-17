import type { Lab } from '../schema';
import { LABS_PART_1 } from './labs-1';
import { LABS_PART_2 } from './labs-2';

export const LABS: Lab[] = [...LABS_PART_1, ...LABS_PART_2].sort((a, b) => a.number - b.number);

export const LAB_INDEX: Record<string, Lab> = Object.fromEntries(LABS.map((l) => [l.id, l]));
