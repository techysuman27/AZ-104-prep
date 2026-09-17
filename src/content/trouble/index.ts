import type { TroubleScenario } from '../schema';
import { NETWORK_SCENARIOS } from './network';
import { PLATFORM_SCENARIOS } from './platform';

export const TROUBLE_SCENARIOS: TroubleScenario[] = [...NETWORK_SCENARIOS, ...PLATFORM_SCENARIOS];

export const TROUBLE_INDEX: Record<string, TroubleScenario> = Object.fromEntries(TROUBLE_SCENARIOS.map((s) => [s.id, s]));

export const TROUBLE_DOMAIN = Object.fromEntries(TROUBLE_SCENARIOS.map((s) => [s.id, s.area]));
