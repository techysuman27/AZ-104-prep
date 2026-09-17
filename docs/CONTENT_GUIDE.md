# Content guide

Written for: anyone adding or editing Stratus content. Read `docs/CONTENT_VALIDATION.md`
first if you are adding facts rather than rewording existing ones.

The rule that matters most: **run `npm run validate:content` before you commit.** It catches
every dangling reference, every unexplained option and every untaught skill in about two
seconds.

---

## Adding a lesson

A lesson exists in two places: **metadata** in `curriculum.ts` and a **body** in
`src/content/lessons/<module>/<lesson-id>.ts`. Both are required; the integrity suite fails if
either is missing.

### 1. Metadata

In `src/content/curriculum.ts`, inside the right module's chapter:

```ts
{
  id: 'vm-disks',
  title: 'Managed disks: types, caching and resizing',
  summary: 'One sentence a learner can scan in the module list.',
  minutes: 16,
  level: 2,            // 1 Understand … 6 Master
  tier: 'must',        // must | should | advanced
  skills: ['cp.vm.disks'],        // must exist in exam.ts
  concepts: ['managed-disk'],     // must exist in concepts/
  keywords: ['Premium SSD', 'caching', 'expand'],  // feeds search
}
```

### 2. Body

```ts
import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'vm-disks',                 // must match the metadata id
  moduleId: 'virtual-machines',   // must match the module
  verified: '2026-09-16',         // the date YOU checked the sources
  sources: ['disk-types'],        // must exist in sources.ts
  sections: [ /* … */ ],
  takeaways: [ /* 3–5 one-line facts */ ],
};

export default lesson;
```

The file is picked up automatically by the `import.meta.glob` in the lesson loader. There is
no index to update.

### The section shape that works

Most lessons follow this arc. Deviate when the topic calls for it, but start here:

| Section `kind` | Purpose |
| --- | --- |
| `intro` | A `lead` sentence, then an `explainer` block with technical and simple versions |
| `how` | Tables, lists and the mechanism |
| `visual` | An `interactive` or `flow` block, where one helps |
| `configure` | `code` and `portal` blocks — how you actually do it |
| `compare` | A `compare` or `table` block when the topic is a choice |
| `decide` | A `decision` tree when the topic is "which one?" |
| `mistakes` | A `mistakes` block — real errors and their fixes |
| `troubleshoot` | A `decision` tree from symptom to cause |
| `exam` | A `callout` with `variant: 'exam'` or `'trap'`, then a `quickcheck` |

### Writing rules

**Every `explainer` needs both voices.** `technical` is for someone who has used Azure;
`simple` is for someone who has not. The simple version is not a summary — it is the same idea
in different language, usually with a concrete analogy. Do not write a simple version that
says less; write one that says the same thing without jargon.

**Lead with the discriminator.** If the exam tests "private endpoint is inbound, VNet
integration is outbound", that sentence belongs near the top, not buried in paragraph four.

**Quote numbers exactly or not at all.** `93 days`, `14 additional days`, `5 slots on
Standard` — either from the documentation, or absent. See CONTENT_VALIDATION.

**Cite what you used.** The `sources` array is not decoration; the integrity suite checks it
resolves, and the source-freshness page shows learners what a lesson was built from.

**`changes` for anything that moved recently.** A `ChangeNote` has `topic`, `previously`,
`now` and `matters`. Use it when older study material would mislead — that is a stated product
requirement.

---

## Adding a question

Questions live in `src/content/questions/<domain>.ts`.

```ts
{
  id: 'cmp-vm-deallocate',
  domain: 'compute',              // must match every skill's domain
  skills: ['cp.vm.create'],
  concepts: ['virtual-machine'],
  kind: 'discrimination',         // knowledge | discrimination | configuration |
                                  // scenario | troubleshooting | architecture |
                                  // first-step | multi-step
  difficulty: 2,                  // 1–3
  format: 'single',               // single | multi | yesno | order | match
  stem: '…',
  options: [
    { id: 'a', text: '…', correct: true, why: 'Why this is right.' },
    { id: 'b', text: '…', why: 'Why this is wrong — specifically.' },
  ],
  explanation: {
    correct: 'The full reasoning.',
    conceptTested: 'The one idea underneath the question.',
    realWorld: 'Why this matters outside the exam.',
    trap: 'Optional — the specific misconception.',
  },
  sources: ['vm-availability'],
}
```

### Non-negotiables

- **Every option carries a `why`**, including the correct one. The integrity suite enforces
  this. A distractor with no explanation teaches nothing.
- **Distractors must be plausible.** "Delete the resource group" is not a distractor; it is
  filler. Good distractors are things a reasonable person would actually consider — usually a
  correct answer to a slightly different question.
- **Skills must match the domain.** `mo.monitor.*` skills cannot appear on a `networking`
  question. The suite checks this.
- **Quickcheck ids must exist.** If a lesson references `cmp-vm-resize` in a `quickcheck`
  block, a question with that id must exist.

### Choosing a format

| Format | Use it when |
| --- | --- |
| `single` | There is one best answer — the default |
| `multi` | Two or more things are independently true; say "Select two" in the stem |
| `yesno` | Three related statements can each be judged true or false |
| `order` | Sequence is the knowledge being tested |
| `match` | Several items map to several categories |

---

## Adding a concept

`src/content/concepts/<area>.ts`.

```ts
{
  id: 'managed-disk',
  name: 'Managed disk',
  aliases: ['disk'],
  area: 'compute',
  kind: 'resource',
  short: 'One sentence for the tooltip.',
  full: 'A paragraph for the concept sheet.',
  howItWorks: ['…'],
  example: '…',
  mistakes: ['…'],
  examTips: ['…'],
  relations: {
    dependsOn: [{ to: 'virtual-machine', label: 'attaches to' }],
    security: [{ to: 'encryption-at-host' }],
    alternative: [{ to: 'azure-files' }],
  },
  sources: ['disk-types'],
}
```

**Spend the effort on `relations`.** They are what makes the connections layer work. A concept
with no relations is an orphan in the knowledge map. Aim for at least three, across different
relation kinds — and remember that relations are directional and not automatically reciprocal.

---

## Adding a simulator

Three steps.

**1. The component**, in `src/components/interactive/MyWidget.tsx`, with a default export.
Follow the existing contract:

- Model one rule the exam actually tests.
- Controls change the answer, not just the picture.
- The result panel explains *why*, not just *what*.
- The result region is `aria-live`.
- Semantic tokens for colour; status carries an icon and a label, never colour alone.
- No network calls, no external state.

**2. Register it** in `src/components/interactive/registry.tsx`:

```ts
'my-widget': { title: 'Human-readable title', component: lazy(() => import('./MyWidget')) },
```

**3. Describe it** in `src/content/simulators.ts` with its area, level, skills, concepts and
the lesson it belongs to. The integrity suite checks all four resolve.

Then reference it from a lesson with `{ type: 'interactive', id: 'my-widget', intro: '…' }`.

---

## Adding flashcards

`src/content/flashcards/<area>.ts`. One card, one fact.

```ts
{
  id: 'fc-metrics-retention',
  front: 'How long are platform and custom metrics retained?',
  back: '**93 days** — but a single chart can only span 30 days at a time.',
  concept: 'metrics',        // must exist
  domain: 'monitoring',
  tier: 'must',
}
```

If the answer needs a paragraph, it is not a flashcard — it is a lesson section. Cards are
scheduled by the SM-2 engine, so each one should be gradeable in a few seconds.

---

## Adding a lab

`src/content/labs/labs-1.ts` or `labs-2.ts`. A lab is a real exercise in a real subscription,
so it carries obligations:

- **`estimatedCost`** must be honest. If it creates a Standard App Service plan, say so.
- **Every task needs a `verify`** with something the learner can actually check.
- **`cleanup` must remove everything**, and in the right order — locks before resource groups,
  backup protection with `--delete-backup-data` before vaults.
- **`why`** on a task is where the teaching happens. The steps are mechanical; the `why` is
  the reason the lab exists.

---

## Adding a troubleshooting scenario

`src/content/trouble/network.ts` or `platform.ts`. The structure is a ticket, a diagram, a set
of tools, a cause list and a fix list.

- **Exactly one cause and exactly one fix are `correct: true`.** Enforced by the suite.
- **Exactly one tool carries `clue: true`** — the one that reveals the decisive evidence. The
  scoring uses it to distinguish reasoning from clicking everything.
- **Wrong causes need real feedback.** "Incorrect" teaches nothing; "the guest check shows
  nginx returning 200 locally, so the guest is fine" teaches the diagnostic habit.
- Tool output uses `table`, `lines` or `kv` — there is no `code` variant.

---

## Adding a design challenge or architecture

Both are in their own folders and both are validated the same way: concepts, sources and
diagram node references must resolve.

For a **design challenge**, every decision needs at least one option scored `2`, and every
`requirementIds` entry must match a declared requirement. Score `1` for defensible-but-not-best
— that distinction is most of the teaching value.

For an **architecture**, fill in all six `aspects` (security, networking, monitoring,
governance, availability, cost). The point of the library is that the same six lenses are
applied to every design, so they can be compared.

---

## Checklist before you commit

```bash
npm run validate:content    # content integrity — always
npm run typecheck           # types
npm run lint                # style
npm test                    # everything, including the engines
```
