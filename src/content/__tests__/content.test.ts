import { describe, expect, it } from 'vitest';
import type { DiagramGroup, DiagramNode, DiagramSpec, Lesson } from '../schema';
import { CONCEPTS, CONCEPT_INDEX } from '../concepts';
import { QUESTIONS } from '../questions';
import { FLASHCARDS } from '../flashcards';
import { LABS } from '../labs';
import { TROUBLE_SCENARIOS } from '../trouble';
import { DESIGN_CHALLENGES } from '../design';
import { ARCHITECTURES } from '../architectures';
import { LESSONS, MODULES } from '../curriculum';
import { SOURCES } from '../sources';
import { ALL_SKILLS, SKILL_INDEX, PLATFORM_CHANGES } from '../exam';
import { SIMULATORS } from '../simulators';
import { INTERACTIVES } from '@/components/interactive/registry';
import { DIAGRAMS } from '@/components/diagrams/registry';

const lessonModules = import.meta.glob<{ default: Lesson }>('../lessons/*/*.ts', { eager: true });
const LESSON_BODIES: Lesson[] = Object.values(lessonModules).map((m) => m.default);

/** Every [[concept-id]] or [[concept-id|label]] inside any string of an object. */
function conceptLinks(value: unknown): string[] {
  const text = JSON.stringify(value);
  return [...text.matchAll(/\[\[([a-z0-9-]+)(?:\|[^\]]+)?\]\]/g)].map((m) => m[1]);
}

function diagramIds(spec: DiagramSpec): Set<string> {
  const ids = new Set<string>();
  const walk = (it: DiagramNode | DiagramGroup) => {
    ids.add(it.id);
    if (it.type === 'group') it.children.forEach(walk);
  };
  walk(spec.root);
  return ids;
}

function checkDiagram(spec: DiagramSpec, where: string) {
  const ids = diagramIds(spec);
  for (const e of spec.edges) {
    expect(ids.has(e.from), `${where}: edge from ${e.from}`).toBe(true);
    expect(ids.has(e.to), `${where}: edge to ${e.to}`).toBe(true);
  }
  for (const f of spec.flows ?? []) for (const p of f.path) expect(ids.has(p), `${where}: flow ${f.id} node ${p}`).toBe(true);
  const walk = (it: DiagramNode | DiagramGroup) => {
    if (it.concept) expect(CONCEPT_INDEX[it.concept], `${where}: node concept ${it.concept}`).toBeTruthy();
    if (it.type === 'group') it.children.forEach(walk);
  };
  walk(spec.root);
}

function uniqueIds(items: { id: string }[], label: string) {
  const seen = new Set<string>();
  for (const i of items) {
    expect(seen.has(i.id), `duplicate ${label} id ${i.id}`).toBe(false);
    seen.add(i.id);
  }
}

describe('content integrity', () => {
  it('has unique ids', () => {
    uniqueIds(CONCEPTS, 'concept');
    uniqueIds(QUESTIONS, 'question');
    uniqueIds(FLASHCARDS, 'flashcard');
    uniqueIds(LABS, 'lab');
    uniqueIds(TROUBLE_SCENARIOS, 'scenario');
    uniqueIds(DESIGN_CHALLENGES, 'design');
    uniqueIds(ARCHITECTURES, 'architecture');
    uniqueIds(LESSONS, 'lesson');
    uniqueIds(MODULES, 'module');
  });

  it('concepts reference existing concepts and sources', () => {
    for (const c of CONCEPTS) {
      for (const edges of Object.values(c.relations)) for (const e of edges ?? []) expect(CONCEPT_INDEX[e.to], `${c.id} → ${e.to}`).toBeTruthy();
      for (const x of c.confusedWith ?? []) expect(CONCEPT_INDEX[x.id], `${c.id} confusedWith ${x.id}`).toBeTruthy();
      for (const p of c.place ?? []) expect(CONCEPT_INDEX[p], `${c.id} place ${p}`).toBeTruthy();
      for (const s of c.sources ?? []) expect(SOURCES[s], `${c.id} source ${s}`).toBeTruthy();
      for (const l of conceptLinks(c)) expect(CONCEPT_INDEX[l], `${c.id} link ${l}`).toBeTruthy();
      if (c.visual?.type === 'flow') checkDiagram(c.visual.spec, `concept ${c.id}`);
    }
  });

  it('every curriculum lesson has a matching lesson body', () => {
    const bodies = new Map(LESSON_BODIES.map((l) => [l.id, l]));
    for (const l of LESSONS) {
      const body = bodies.get(l.id);
      expect(body, `missing lesson body ${l.moduleId}/${l.id}`).toBeTruthy();
      if (body) expect(body.moduleId).toBe(l.moduleId);
    }
  });

  it('lesson metadata references real skills and concepts', () => {
    for (const l of LESSONS) {
      for (const s of l.skills) expect(SKILL_INDEX[s], `${l.id} skill ${s}`).toBeTruthy();
      for (const c of l.concepts) expect(CONCEPT_INDEX[c], `${l.id} concept ${c}`).toBeTruthy();
    }
  });

  it('lesson bodies are well-formed', () => {
    const qIds = new Set(QUESTIONS.map((q) => q.id));
    for (const l of LESSON_BODIES) {
      expect(l.sources.length, `${l.id} has sources`).toBeGreaterThan(0);
      expect(l.takeaways.length, `${l.id} has takeaways`).toBeGreaterThan(0);
      expect(l.verified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const s of l.sources) expect(SOURCES[s], `${l.id} source ${s}`).toBeTruthy();
      for (const l2 of conceptLinks(l)) expect(CONCEPT_INDEX[l2], `${l.id} link ${l2}`).toBeTruthy();
      const sectionIds = new Set<string>();
      for (const section of l.sections) {
        expect(sectionIds.has(section.id), `${l.id} duplicate section ${section.id}`).toBe(false);
        sectionIds.add(section.id);
        for (const b of section.blocks) {
          if (b.type === 'quickcheck') for (const id of b.questionIds) expect(qIds.has(id), `${l.id} quickcheck ${id}`).toBe(true);
          if (b.type === 'interactive') expect(INTERACTIVES[b.id], `${l.id} interactive ${b.id}`).toBeTruthy();
          if (b.type === 'diagram') expect(DIAGRAMS[b.id], `${l.id} diagram ${b.id}`).toBeTruthy();
          if (b.type === 'flow') checkDiagram(b.spec, `${l.id} flow`);
          if (b.type === 'connections') expect(CONCEPT_INDEX[b.conceptId], `${l.id} connections ${b.conceptId}`).toBeTruthy();
          if (b.type === 'decision') {
            for (const n of Object.values(b.tree.nodes)) {
              if (n.kind === 'question') for (const o of n.options) expect(b.tree.nodes[o.next], `${l.id} decision next ${o.next}`).toBeTruthy();
              if (n.kind === 'result') for (const c of n.concepts ?? []) expect(CONCEPT_INDEX[c], `${l.id} decision concept ${c}`).toBeTruthy();
            }
            expect(b.tree.nodes[b.tree.start]).toBeTruthy();
          }
        }
      }
    }
  });

  it('questions are complete and explain every option', () => {
    for (const q of QUESTIONS) {
      const where = `question ${q.id}`;
      expect(q.skills.length, `${where} skills`).toBeGreaterThan(0);
      expect(q.concepts.length, `${where} concepts`).toBeGreaterThan(0);
      expect(q.sources.length, `${where} sources`).toBeGreaterThan(0);
      for (const s of q.skills) expect(SKILL_INDEX[s], `${where} skill ${s}`).toBeTruthy();
      for (const s of q.skills) expect(SKILL_INDEX[s]?.domain, `${where} skill ${s} domain`).toBe(q.domain);
      for (const c of q.concepts) expect(CONCEPT_INDEX[c], `${where} concept ${c}`).toBeTruthy();
      for (const s of q.sources) expect(SOURCES[s], `${where} source ${s}`).toBeTruthy();
      for (const l of conceptLinks(q)) expect(CONCEPT_INDEX[l], `${where} link ${l}`).toBeTruthy();
      expect(q.explanation.correct.length).toBeGreaterThan(20);
      expect(q.explanation.conceptTested.length).toBeGreaterThan(5);
      expect(q.explanation.realWorld.length).toBeGreaterThan(10);
      switch (q.format) {
        case 'single':
          expect(q.options.filter((o) => o.correct).length, `${where} exactly one correct`).toBe(1);
          expect(q.options.length).toBeGreaterThanOrEqual(3);
          q.options.forEach((o) => expect(o.why.length, `${where} option ${o.id} why`).toBeGreaterThan(5));
          break;
        case 'multi':
          expect(q.options.filter((o) => o.correct).length, `${where} at least two correct`).toBeGreaterThanOrEqual(2);
          expect(q.options.length).toBeGreaterThan(q.options.filter((o) => o.correct).length);
          q.options.forEach((o) => expect(o.why.length, `${where} option ${o.id} why`).toBeGreaterThan(5));
          break;
        case 'yesno':
          expect(q.statements.length).toBeGreaterThanOrEqual(2);
          q.statements.forEach((s) => expect(s.why.length).toBeGreaterThan(5));
          break;
        case 'order':
          expect(q.items.length).toBeGreaterThanOrEqual(3);
          expect(q.why.length).toBeGreaterThan(10);
          break;
        case 'match': {
          const choices = new Set(q.choices.map((c) => c.id));
          q.prompts.forEach((p) => {
            expect(choices.has(p.answer), `${where} prompt ${p.id} answer`).toBe(true);
            expect(p.why.length).toBeGreaterThan(5);
          });
          break;
        }
      }
    }
  });

  it('every official skill is taught by a lesson and practised by a question', () => {
    const taught = new Set(LESSONS.flatMap((l) => l.skills));
    const practised = new Set(QUESTIONS.flatMap((q) => q.skills));
    const untaught = ALL_SKILLS.filter((s) => !taught.has(s.id)).map((s) => s.id);
    const unpractised = ALL_SKILLS.filter((s) => !practised.has(s.id)).map((s) => s.id);
    expect(untaught, 'skills without a lesson').toEqual([]);
    expect(unpractised, 'skills without a question').toEqual([]);
  });

  it('flashcards reference real concepts', () => {
    for (const c of FLASHCARDS) {
      expect(CONCEPT_INDEX[c.concept], `card ${c.id} concept ${c.concept}`).toBeTruthy();
      for (const l of conceptLinks(c)) expect(CONCEPT_INDEX[l], `card ${c.id} link ${l}`).toBeTruthy();
    }
  });

  it('labs, scenarios, challenges and architectures are consistent', () => {
    for (const l of LABS) {
      l.skills.forEach((s) => expect(SKILL_INDEX[s], `lab ${l.id} skill ${s}`).toBeTruthy());
      l.concepts.forEach((c) => expect(CONCEPT_INDEX[c], `lab ${l.id} concept ${c}`).toBeTruthy());
      l.sources.forEach((s) => expect(SOURCES[s], `lab ${l.id} source ${s}`).toBeTruthy());
      conceptLinks(l).forEach((c) => expect(CONCEPT_INDEX[c], `lab ${l.id} link ${c}`).toBeTruthy());
      expect(l.tasks.length).toBeGreaterThan(0);
    }
    for (const t of TROUBLE_SCENARIOS) {
      expect(t.causes.filter((c) => c.correct).length, `scenario ${t.id} one correct cause`).toBe(1);
      expect(t.fixes.filter((c) => c.correct).length, `scenario ${t.id} one correct fix`).toBe(1);
      expect(t.tools.some((x) => x.clue), `scenario ${t.id} has a clue tool`).toBe(true);
      t.concepts.forEach((c) => expect(CONCEPT_INDEX[c], `scenario ${t.id} concept ${c}`).toBeTruthy());
      t.sources.forEach((s) => expect(SOURCES[s], `scenario ${t.id} source ${s}`).toBeTruthy());
      conceptLinks(t).forEach((c) => expect(CONCEPT_INDEX[c], `scenario ${t.id} link ${c}`).toBeTruthy());
      checkDiagram(t.environment, `scenario ${t.id}`);
    }
    for (const d of DESIGN_CHALLENGES) {
      const reqs = new Set(d.requirements.map((r) => r.id));
      for (const dec of d.decisions) {
        expect(dec.options.some((o) => o.score === 2), `design ${d.id} ${dec.id} has a best option`).toBe(true);
        dec.requirementIds.forEach((r) => expect(reqs.has(r), `design ${d.id} ${dec.id} requirement ${r}`).toBe(true));
      }
      d.concepts.forEach((c) => expect(CONCEPT_INDEX[c], `design ${d.id} concept ${c}`).toBeTruthy());
      d.sources.forEach((s) => expect(SOURCES[s], `design ${d.id} source ${s}`).toBeTruthy());
      conceptLinks(d).forEach((c) => expect(CONCEPT_INDEX[c], `design ${d.id} link ${c}`).toBeTruthy());
      checkDiagram(d.solution.diagram, `design ${d.id}`);
    }
    for (const a of ARCHITECTURES) {
      a.services.forEach((s) => expect(CONCEPT_INDEX[s.concept], `arch ${a.id} service ${s.concept}`).toBeTruthy());
      a.concepts.forEach((c) => expect(CONCEPT_INDEX[c], `arch ${a.id} concept ${c}`).toBeTruthy());
      a.sources.forEach((s) => expect(SOURCES[s], `arch ${a.id} source ${s}`).toBeTruthy());
      conceptLinks(a).forEach((c) => expect(CONCEPT_INDEX[c], `arch ${a.id} link ${c}`).toBeTruthy());
      checkDiagram(a.diagram, `arch ${a.id}`);
    }
  });

  it('simulators map to registered widgets and real concepts', () => {
    for (const s of SIMULATORS) {
      expect(INTERACTIVES[s.id], `simulator widget ${s.id}`).toBeTruthy();
      s.concepts.forEach((c) => expect(CONCEPT_INDEX[c], `simulator ${s.id} concept ${c}`).toBeTruthy());
      s.skills.forEach((k) => expect(SKILL_INDEX[k], `simulator ${s.id} skill ${k}`).toBeTruthy());
      if (s.lesson) expect(LESSONS.some((l) => l.id === s.lesson!.lessonId && l.moduleId === s.lesson!.moduleId), `simulator ${s.id} lesson`).toBe(true);
    }
  });

  it('platform change notes cite real sources', () => {
    for (const c of PLATFORM_CHANGES) expect(SOURCES[c.sourceId], c.topic).toBeTruthy();
  });
});
