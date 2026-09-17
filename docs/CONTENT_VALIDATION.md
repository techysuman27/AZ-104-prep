# Content validation

Written for: anyone adding facts to Stratus, and anyone deciding whether to trust what is
already in it.

---

## The standard

Stratus states things about a live cloud platform that people are paying to be tested on.
That sets the bar:

1. **Microsoft documentation is the authority.** Microsoft Learn, the AZ-104 study guide, and
   Azure CLI and PowerShell reference. Nothing else overrides them.
2. **Third-party material is for understanding, never for facts.** A blog post can explain why
   something works; it cannot establish that it does.
3. **Nothing is invented.** Not a feature, not a CLI parameter, not a portal blade, not a
   limit, not a price, not an exam objective. If it cannot be verified, it is not stated as
   fact.
4. **Outdated is as bad as wrong.** Older preparation material is full of retired agents,
   renamed services and superseded defaults. A fact that *used* to be true is a defect.

---

## The process

### 1. Research before writing

Every content batch starts by fetching the relevant Microsoft Learn pages and extracting the
facts into `docs/validation/research-ledger/facts-NN-<area>.md`:

```
## Availability zones — https://learn.microsoft.com/…/availability-zones-overview (ms.date 2026-02-11)
- AZ = separated groups of datacenters within a region, independent power, cooling, networking
- Zone-redundant resources: replicated across zones by the service
- Zonal resources: pinned to one zone you select
- AZs don't protect against a full-region outage
```

Each entry records the URL and the page's own `ms.date` or `updated_at`. The ledger is the
working record: seven files covering foundations, identity, governance, storage, networking,
compute, and monitoring and backup.

Writing happens **from the ledger**, not from memory. This is the single most important habit
in the process, because recalled facts about Azure are exactly the ones that quietly go stale.

### 2. Register the source

Every page used becomes an entry in `src/content/sources.ts`:

```ts
{
  id: 'availability-zones',
  title: 'What are Azure availability zones?',
  url: 'https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview',
  publisher: 'Microsoft Learn',
  pageUpdated: '2026-02-11',   // the page's own date, NOT today's
  verified: V,                 // when Stratus last checked it
}
```

The distinction between `pageUpdated` and `verified` matters. `pageUpdated` tells a reader how
fresh Microsoft's documentation is; `verified` tells them how recently we looked at it. Both
are shown on the source freshness page.

### 3. Cite from the content

Every lesson, question, concept, lab, scenario, design challenge and architecture carries a
`sources` array. The integrity suite asserts every id resolves. A learner can therefore open
any lesson and see exactly what it was written from.

### 4. Hedge what cannot be confirmed

Where the documentation is ambiguous or a detail could not be pinned down, the content says
less rather than guessing. Examples of deliberate softening in the current corpus:

- SSPR scope is described as "Selected (specific groups)" because that is the documented
  wording, rather than a paraphrase that might not match the portal.
- Alert severities are described as "Sev 0 (most severe) to Sev 4 (least severe)" without
  asserting the label for each number, because the label list was not on the page consulted.
- Zone-redundancy claims for individual services are stated only where the service's own
  documentation states them.

This is a feature. A hedged true statement is worth more than a confident wrong one.

### 5. Record what changed

When current behaviour differs from what older study material says, the lesson carries a
`ChangeNote`:

```ts
changes: [{
  topic: 'Complete deployment mode',
  previously: 'Complete mode was used to make a resource group match a template exactly.',
  now: 'Microsoft recommends incremental mode and says complete mode will be gradually deprecated.',
  matters: 'Incremental is still the default, and the exam still expects you to know that complete mode deletes.',
}]
```

These surface in the lesson and on the platform changes page. They exist because a learner who
studied from a two-year-old course needs to be told specifically what has moved.

---

## What the machine checks

`npm run validate:content` runs in about two seconds and enforces:

| Check | Catches |
| --- | --- |
| Unique ids across every content type | Copy-paste collisions |
| Every `sources` entry resolves | Citing a source that was never registered |
| Every `concepts` entry resolves | Renamed or mistyped concept ids |
| Every `[[concept-id]]` inline link resolves | Broken concept links in prose |
| Every concept relation target exists | Orphan edges in the knowledge graph |
| Every curriculum lesson has a body | A lesson advertised but not written |
| Every lesson body is well formed | Empty sections, missing takeaways |
| Every question option has a `why` | Distractors that teach nothing |
| Question `skills` match the question `domain` | A monitoring skill on a networking question |
| Every exam skill is taught **and** practised | A skill in the official outline with no coverage |
| Every quickcheck id exists | A lesson pointing at a question that was never written |
| Every simulator has a widget, concepts, skills and a lesson | An advertised simulator that does not exist |
| Every diagram edge and flow references a real node | Diagrams that render with missing arrows |
| Every platform change note cites a real source | An unsourced claim about what changed |

This is a **consistency** floor, not a truth check. It cannot tell you that a number is wrong —
only that everything points at something that exists.

---

## What only a human can check

- **Is the number right?** The suite does not know that metrics are retained 93 days.
- **Is it still right?** Azure changes. A fact verified in September may be stale by March.
- **Is the emphasis right?** A technically correct lesson that buries the discriminator the
  exam tests is a bad lesson.
- **Is the simple explanation actually simple?** And does it say the same thing as the
  technical one, rather than less?

---

## Re-verification

The `verified` date on every source and every lesson exists so that staleness is visible
rather than invisible. The intended cadence:

- **Before an exam-outline revision takes effect** — Microsoft publishes the change date on
  the study guide; re-check everything touching the changed skills.
- **Every six months otherwise** — re-fetch the sources whose `pageUpdated` has moved since
  `verified`, and update the ledger and the content together.
- **Immediately** for anything a learner reports as wrong.

When re-verifying, update the ledger entry, the source's `pageUpdated` and `verified`, and the
`verified` date on every lesson that cites it. If behaviour changed, add a `ChangeNote` rather
than silently editing the text — learners who studied the old version need to know.

---

## If you find an error

1. Check the source. If Microsoft's page says something different from Stratus, Stratus is
   wrong.
2. Fix the content **and** the ledger entry, so the next person does not re-derive the mistake.
3. If the behaviour changed rather than the content being wrong, add a `ChangeNote`.
4. Run `npm run validate:content`.
