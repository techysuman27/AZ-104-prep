import MiniSearch from 'minisearch';
import type { AreaId } from '@/content/schema';
import { CONCEPTS } from '@/content/concepts';
import { LESSONS } from '@/content/curriculum';
import { ALL_SKILLS } from '@/content/exam';
import { LABS } from '@/content/labs';
import { SIMULATORS } from '@/content/simulators';
import { TROUBLE_SCENARIOS } from '@/content/trouble';
import { ARCHITECTURES } from '@/content/architectures';
import { DESIGN_CHALLENGES } from '@/content/design';
import { NAV } from '@/app/nav';

export type SearchKind =
  | 'concept'
  | 'lesson'
  | 'problem'
  | 'simulator'
  | 'troubleshoot'
  | 'lab'
  | 'architecture'
  | 'design'
  | 'skill'
  | 'page';

export interface SearchDoc {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle?: string;
  text: string;
  keywords: string;
  to: string;
  area?: AreaId;
}

export const KIND_LABELS: Record<SearchKind, string> = {
  concept: 'Concepts',
  lesson: 'Lessons',
  problem: 'Problems & troubleshooting',
  simulator: 'Simulators',
  troubleshoot: 'Troubleshooting scenarios',
  lab: 'Guided labs',
  architecture: 'Architectures',
  design: 'Design challenges',
  skill: 'Exam skills',
  page: 'Pages',
};

export const KIND_ORDER: SearchKind[] = [
  'concept',
  'lesson',
  'problem',
  'troubleshoot',
  'simulator',
  'lab',
  'architecture',
  'design',
  'skill',
  'page',
];

function buildDocs(): SearchDoc[] {
  const docs: SearchDoc[] = [];
  for (const c of CONCEPTS) {
    docs.push({
      id: `concept:${c.id}`,
      kind: 'concept',
      title: c.name,
      subtitle: c.summary,
      text: [c.summary, c.simple, c.why, ...(c.useWhen ?? [])].join(' '),
      keywords: [...(c.aliases ?? []), c.id.replace(/-/g, ' ')].join(' '),
      to: `/concepts/${c.id}`,
      area: c.area,
    });
    (c.troubleshooting ?? []).forEach((t, i) => {
      docs.push({
        id: `problem:${c.id}:${i}`,
        kind: 'problem',
        title: t.replace(/\*\*|`|\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, id, label) => label ?? id ?? '').slice(0, 140),
        subtitle: c.name,
        text: t,
        keywords: [c.name, ...(c.aliases ?? [])].join(' '),
        to: `/concepts/${c.id}#troubleshooting`,
        area: c.area,
      });
    });
  }
  for (const l of LESSONS) {
    docs.push({
      id: `lesson:${l.id}`,
      kind: 'lesson',
      title: l.title,
      subtitle: `Module ${l.moduleNumber} · ${l.moduleTitle}`,
      text: l.summary,
      keywords: (l.keywords ?? []).join(' '),
      to: `/learn/${l.moduleId}/${l.id}`,
    });
  }
  for (const s of SIMULATORS) {
    docs.push({ id: `sim:${s.id}`, kind: 'simulator', title: s.title, subtitle: s.summary, text: s.summary, keywords: s.concepts.join(' '), to: `/labs/simulators/${s.id}`, area: s.area });
  }
  for (const t of TROUBLE_SCENARIOS) {
    docs.push({
      id: `trouble:${t.id}`,
      kind: 'troubleshoot',
      title: t.title,
      subtitle: t.summary,
      text: `${t.summary} ${t.ticket.message}`,
      keywords: t.concepts.join(' '),
      to: `/labs/troubleshoot/${t.id}`,
      area: t.area,
    });
  }
  for (const l of LABS) {
    docs.push({ id: `lab:${l.id}`, kind: 'lab', title: `Lab ${l.number}: ${l.title}`, subtitle: l.summary, text: `${l.summary} ${l.objectives.join(' ')}`, keywords: l.concepts.join(' '), to: `/labs/guided/${l.id}` });
  }
  for (const a of ARCHITECTURES) {
    docs.push({ id: `arch:${a.id}`, kind: 'architecture', title: a.title, subtitle: a.subtitle, text: a.scenario, keywords: a.concepts.join(' '), to: `/architectures/${a.id}` });
  }
  for (const d of DESIGN_CHALLENGES) {
    docs.push({ id: `design:${d.id}`, kind: 'design', title: d.title, subtitle: d.company, text: d.brief, keywords: d.concepts.join(' '), to: `/design/${d.id}` });
  }
  for (const s of ALL_SKILLS) {
    docs.push({ id: `skill:${s.id}`, kind: 'skill', title: s.text, subtitle: s.groupTitle, text: s.groupTitle, keywords: '', to: `/skills#${s.id}`, area: s.domain });
  }
  for (const g of NAV) {
    for (const item of g.items) {
      docs.push({ id: `page:${item.to}`, kind: 'page', title: item.label, subtitle: item.description, text: item.description, keywords: g.label, to: item.to });
    }
  }
  return docs;
}

let index: MiniSearch<SearchDoc> | null = null;

function getIndex() {
  if (!index) {
    index = new MiniSearch<SearchDoc>({
      fields: ['title', 'keywords', 'text', 'subtitle'],
      storeFields: ['id', 'kind', 'title', 'subtitle', 'to', 'area'],
      searchOptions: { boost: { title: 4, keywords: 2.5, subtitle: 1.2 }, fuzzy: 0.18, prefix: true, combineWith: 'AND' },
    });
    index.addAll(buildDocs());
  }
  return index;
}

export function search(query: string, limit = 40): SearchDoc[] {
  const q = query.trim();
  if (!q) return [];
  const idx = getIndex();
  let results = idx.search(q);
  if (results.length === 0) results = idx.search(q, { combineWith: 'OR' });
  const kindBoost: Partial<Record<SearchKind, number>> = { concept: 1.35, lesson: 1.15, problem: 0.9, skill: 0.7, page: 0.8 };
  return results
    .map((r) => ({ r, s: r.score * (kindBoost[r.kind as SearchKind] ?? 1) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(({ r }) => r as unknown as SearchDoc);
}
