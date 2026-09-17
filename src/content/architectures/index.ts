import type { Architecture } from '../schema';
import { ARCHITECTURE_LIST } from './library';

export const ARCHITECTURES: Architecture[] = ARCHITECTURE_LIST;

export const ARCHITECTURE_INDEX: Record<string, Architecture> = Object.fromEntries(ARCHITECTURES.map((a) => [a.id, a]));
