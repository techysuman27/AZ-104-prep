# Architecture

Written for: engineers extending Stratus who need to know where things live and why the
boundaries fall where they do.

---

## The shape of the problem

A certification platform has an unusual constraint: **the content outlives and outnumbers the
code**. There are 75 lessons, 119 concepts and 169 questions against perhaps 60 components.
Any design that makes content changes touch components loses immediately.

So the central decision is: **content is typed data; components render types.** Nothing in
`src/components` contains the word "Azure" in a way that matters. A component knows how to
render a `Block`, a `DiagramSpec`, a `Question`. It does not know what a storage account is.

Everything else follows from that.

---

## Layers

```
content (data)  →  engine (pure functions)  →  features (pages)  →  components (rendering)
                          ↑
                       store (persisted progress)
```

**`src/content`** — the entire corpus, as TypeScript objects checked by the compiler and by
the integrity test suite. No MDX, no markdown files, no CMS. The type system is the schema.

**`src/engine`** — pure, testable functions with no React and no I/O: spaced repetition,
grading, mastery estimation, readiness, mock exam construction. Thirteen unit tests cover the
behaviour that matters.

**`src/store`** — zustand stores persisted to `localStorage`. They hold attempts, card
schedules, lesson progress, bookmarks and settings. Everything derived from them is computed,
never stored.

**`src/features`** — one folder per page-level feature. Features read content, call engines,
and compose components.

**`src/components`** — presentational and interactive. The three interesting sub-folders are
`content` (the block renderers), `diagrams` (the renderer) and `interactive` (the simulators).

---

## Content model

### Lessons are blocks

```ts
interface Lesson {
  id: string;
  moduleId: string;
  sections: Section[];   // each has a kind: intro | how | configure | compare | …
  takeaways: string[];
  interview?: { q: string; a: string }[];
  changes?: ChangeNote[];
  sources: string[];     // must resolve in sources.ts
  verified: ISODate;
}
```

A `Section` holds `Block`s, and `Block` is a discriminated union of about twenty variants:
`p`, `lead`, `explainer`, `analogy`, `callout`, `list`, `steps`, `table`, `code`, `portal`,
`diagram`, `flow`, `interactive`, `decision`, `mistakes`, `scenario`, `compare`, `quickcheck`,
`adminLens`, `connections`, `change`.

`BlockView` in `src/components/content/Blocks.tsx` is a switch over that union. Adding a block
type means adding a variant and a case — and every existing lesson keeps compiling.

The `explainer` block is how the **"Explain it like I'm new to Azure"** toggle works: it
carries both `technical` and `simple` arrays, and a single global setting chooses which to
render. The toggle is not a separate copy of the content; it is a property of one block type.

### Lesson bodies are code-split

`curriculum.ts` holds only metadata — titles, summaries, minutes, skills, concepts, keywords.
It is small, always loaded, and drives navigation, progress and search. Lesson **bodies** are
loaded on demand:

```ts
const modules = import.meta.glob('./*/*.ts');
```

Vite turns each into its own chunk. The build output shows this working: individual lessons
are 5–15 kB chunks rather than one enormous bundle.

### Inline text is a tiny markup language

Lesson prose supports `**bold**`, `*emphasis*`, `` `code` ``, `[label](url)` and — the
important one — `[[concept-id|label]]`. `InlineText.tsx` tokenises with a single regular
expression and renders concept links as buttons that open the concept sheet.

The integrity suite extracts every `[[…]]` from every string in the corpus and asserts it
resolves. A typo in a concept link is a failing test, not a broken link in production.

### Concepts are a graph

```ts
interface Concept {
  id, name, area, kind, short, full,
  relations: Partial<Record<RelationKind, Edge[]>>,
  // dependsOn | integratesWith | security | networking |
  // monitoring | governance | contains | partOf | alternative
  howItWorks?, example?, mistakes?, examTips?, visual?, sources
}
```

This is what makes the **concept connections layer** real rather than decorative. The concept
sheet, the "Connect this concept" button, the knowledge map and the related-concept
suggestions all read the same relations. Every edge target is validated.

---

## The engines

### Spaced repetition (`srs.ts`)

SM-2. An ease factor per card, adjusted by grade, producing an interval and a due date. Cards
that fail drop back to a short interval; cards that succeed grow geometrically.

### Grading (`grading.ts`)

Five question formats with partial credit where it makes sense: `single`, `multi`, `yesno`
(per-statement), `order` (position-aware), `match` (per-prompt). Partial credit matters because
a multi-select question answered two-thirds correctly is genuinely different from one answered
at random.

### Mastery (`mastery.ts`)

Per-skill and per-concept estimates from attempt history, with two corrections:

- **Recency weighting** — a 21-day half-life, so something answered correctly six months ago
  counts for less than something answered yesterday.
- **Bayesian shrinkage** — three attempts at 100% is not mastery. Estimates are pulled toward
  the prior until enough evidence exists to move them.

### Readiness (`readiness.ts`)

The most opinionated file in the repository, because it is the one a learner will trust or
ignore.

```
score = (accuracy × 0.40 + scenario × 0.25 + retention × 0.15 + coverage × 0.20)
        × (0.35 + 0.65 × evidence)
```

- **Evidence** scales the whole thing. With no attempts the score is near zero regardless of
  how many pages have been read.
- The score is **capped at 0.72** until a mock exam has been taken recently. "Ready" requires
  ≥ 0.75 overall *and* a recent mock ≥ 0.75.
- Per-domain scores use the same shape, and a domain with no attempts is reported honestly
  rather than optimistically.

The design goal is that it is **impossible to raise readiness by reading**. That was an
explicit product requirement and it drove the evidence factor and the mock cap.

### Mock exams (`mockExam.ts`)

Three blueprints — full (50 questions, 100 minutes), half and quick. Questions are allocated
across domains by the official weightings using largest-remainder apportionment, then selected
with a seeded `mulberry32` PRNG so a given seed reproduces a given exam.

---

## The diagram renderer

`FlowDiagram.tsx` takes a `DiagramSpec` — a nested tree of groups and nodes, plus edges and
optional flows — and renders it as **nested HTML groups with an SVG edge overlay**.

Why not draw the whole thing in SVG? Because HTML gives you real text layout, wrapping, and
responsive reflow for free, and a diagram of Azure resources is mostly boxes with labels. The
trade-off is that edges must be measured rather than declared.

So the renderer:

1. Renders the HTML tree.
2. Uses a `ResizeObserver` plus `getBoundingClientRect` to measure every node.
3. Computes bezier paths between anchor points (`anchorPath()`).
4. Draws them into an absolutely positioned SVG layer.
5. Animates a "packet" along a flow path with the CSS `offset-path` property.

Every diagram also renders a **text view** — a structured list of the same groups, nodes and
edges — so the content is available without the picture. That is an accessibility requirement,
not an afterthought.

---

## Simulators

Twenty widgets in `src/components/interactive`, registered in one map:

```ts
export const INTERACTIVES: Record<string, { title: string; component: LazyComponent }> = {
  'rbac-evaluator': { title: '…', component: lazy(() => import('./RbacEvaluator')) },
  …
};
```

Lessons reference them by id with an `interactive` block. `simulators.ts` describes them for
the standalone simulator index. The integrity suite asserts that every entry in `simulators.ts`
has a registered widget, real concepts, real skills and a real lesson — so a simulator cannot
be advertised without existing.

Each simulator follows the same contract:

- It models one rule the exam actually tests.
- It has controls that are meaningful, not decorative.
- It explains *why* the result is what it is, in the same panel.
- Its result region is `aria-live`.
- It is `lazy`-loaded, so the twenty widgets cost nothing until one is opened.

---

## Routing and shell

`createBrowserRouter` with a `page()` helper that wraps every route in a lazy import:

```ts
const page = (load: () => Promise<{ default: ComponentType }>) => ({
  lazy: async () => ({ Component: (await load()).default }),
});
```

The root route renders `AppShell` and has a `RouteError` boundary and a null
`HydrateFallback`. Around 24 routes cover the dashboard, learn, lesson, concept, map,
practice, exam, review, labs, simulators, design, architectures, mindset and reference areas.

Navigation is described once, as data, in `src/app/nav.ts`, and consumed by the sidebar, the
mobile dialog nav and the command palette (Ctrl+K or `/`).

---

## Styling

Tailwind CSS 4 with an `@theme` token block in `src/styles/index.css`. The palette is
light-first and deliberately not Fluent: a blue-leaning brand ramp, warm neutrals, and five
domain colours validated for colour-vision deficiency separation:

| Domain | Colour |
| --- | --- |
| Identity & governance | `#4a3aa7` |
| Storage | `#1baf7a` |
| Compute | `#2a78d6` |
| Networking | `#d95926` |
| Monitoring | `#e87ba4` |

Semantic tokens (`--color-ink`, `--color-line`, `--color-surface`, `--color-canvas`) mean a
component never hard-codes a grey.

---

## Testing

Two suites:

- `src/engine/engine.test.ts` — the pure functions, including the readiness properties that
  must hold (reading changes nothing; the mock cap applies; evidence scales the score).
- `src/content/__tests__/content.test.ts` — content integrity, described in the README.

Both run in about two seconds, which is deliberate: a validation suite that is slow to run is
a validation suite that gets skipped.
