import type { Concept, Edge, RelationKind } from '../schema';
import { FOUNDATION_CONCEPTS } from './foundations';
import { IDENTITY_CONCEPTS } from './identity';
import { GOVERNANCE_CONCEPTS } from './governance';
import { STORAGE_CONCEPTS } from './storage';
import { NETWORKING_CONCEPTS } from './networking';
import { COMPUTE_CONCEPTS } from './compute';
import { MONITORING_CONCEPTS } from './monitoring';

export const CONCEPTS: Concept[] = [
  ...FOUNDATION_CONCEPTS,
  ...IDENTITY_CONCEPTS,
  ...GOVERNANCE_CONCEPTS,
  ...STORAGE_CONCEPTS,
  ...NETWORKING_CONCEPTS,
  ...COMPUTE_CONCEPTS,
  ...MONITORING_CONCEPTS,
];

export const CONCEPT_INDEX: Record<string, Concept> = Object.fromEntries(CONCEPTS.map((c) => [c.id, c]));

export function getConcept(id: string): Concept | undefined {
  return CONCEPT_INDEX[id];
}

/** Display labels when an edge is seen from its target's point of view. */
const REVERSE_LABELS: Record<RelationKind, string> = {
  dependsOn: 'Required by',
  integratesWith: 'Integrates with',
  security: 'Security & access',
  networking: 'Networking',
  monitoring: 'Monitoring',
  governance: 'Governance',
  contains: 'Part of',
  partOf: 'Contains',
  alternative: 'Alternatives',
};

const FORWARD_LABELS: Record<RelationKind, string> = {
  dependsOn: 'Depends on',
  integratesWith: 'Integrates with',
  security: 'Security & access',
  networking: 'Networking',
  monitoring: 'Monitoring',
  governance: 'Governance',
  contains: 'Contains',
  partOf: 'Part of',
  alternative: 'Alternatives',
};

export const CONNECTION_ORDER = [
  'Depends on',
  'Required by',
  'Part of',
  'Contains',
  'Integrates with',
  'Security & access',
  'Networking',
  'Monitoring',
  'Governance',
  'Alternatives',
];

export interface Connection {
  group: string;
  kind: RelationKind;
  concept: Concept;
  label?: string;
  direction: 'out' | 'in';
}

/**
 * All connections for a concept, merging edges declared on the concept with
 * edges other concepts declare towards it. Duplicates are collapsed so each
 * neighbour appears once per group.
 */
export function connectionsFor(id: string): Connection[] {
  const out: Connection[] = [];
  const seen = new Set<string>();
  const push = (c: Connection) => {
    const key = `${c.group}:${c.concept.id}`;
    if (seen.has(key) || c.concept.id === id) return;
    seen.add(key);
    out.push(c);
  };

  const self = CONCEPT_INDEX[id];
  if (self) {
    for (const [kind, edges] of Object.entries(self.relations) as [RelationKind, Edge[]][]) {
      for (const e of edges ?? []) {
        const target = CONCEPT_INDEX[e.to];
        if (target) push({ group: FORWARD_LABELS[kind], kind, concept: target, label: e.label, direction: 'out' });
      }
    }
  }
  for (const other of CONCEPTS) {
    if (other.id === id) continue;
    for (const [kind, edges] of Object.entries(other.relations) as [RelationKind, Edge[]][]) {
      for (const e of edges ?? []) {
        if (e.to === id) push({ group: REVERSE_LABELS[kind], kind, concept: other, label: e.label, direction: 'in' });
      }
    }
  }
  return out.sort((a, b) => CONNECTION_ORDER.indexOf(a.group) - CONNECTION_ORDER.indexOf(b.group));
}

export function groupConnections(connections: Connection[]): { group: string; items: Connection[] }[] {
  const groups = new Map<string, Connection[]>();
  for (const c of connections) groups.set(c.group, [...(groups.get(c.group) ?? []), c]);
  return CONNECTION_ORDER.filter((g) => groups.has(g)).map((g) => ({ group: g, items: groups.get(g)! }));
}
