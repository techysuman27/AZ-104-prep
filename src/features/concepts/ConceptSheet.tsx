import { Link } from 'react-router';
import { ArrowRight, ChevronRight, Orbit, Sprout, Target } from 'lucide-react';
import { CONCEPT_INDEX } from '@/content/concepts';
import { LESSONS } from '@/content/curriculum';
import { Sheet } from '@/components/ui/Overlay';
import { AreaChip, TierBadge } from '@/components/ui/Badge';
import { InlineText } from '@/components/content/InlineText';
import { ConceptChip, ConnectionsPanel } from '@/components/content/ConnectionsPanel';
import { useLearner } from '@/store/learner';
import { useUi } from '@/store/ui';

export function ConceptPlace({ conceptId }: { conceptId: string }) {
  const concept = CONCEPT_INDEX[conceptId];
  const openConcept = useUi((s) => s.openConcept);
  if (!concept?.place?.length) return null;
  const trail = [...concept.place, concept.id];
  return (
    <nav aria-label="Where this concept fits in Azure" className="flex flex-wrap items-center gap-1 text-xs">
      {trail.map((id, i) => {
        const c = CONCEPT_INDEX[id];
        const last = i === trail.length - 1;
        return (
          <span key={`${id}-${i}`} className="inline-flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3 text-ink-4" aria-hidden="true" />}
            {last || !c ? (
              <span className="rounded-md bg-brand-50 px-1.5 py-0.5 font-semibold text-brand-800">{c?.name ?? id}</span>
            ) : (
              <button type="button" onClick={() => openConcept(id)} className="rounded-md bg-subtle px-1.5 py-0.5 font-medium text-ink-2 hover:bg-muted">
                {c.name}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export default function ConceptSheet({ conceptId, onClose }: { conceptId: string; onClose: () => void }) {
  const concept = CONCEPT_INDEX[conceptId];
  const mode = useLearner((s) => s.settings.explanationMode);
  if (!concept) return null;
  const lessons = LESSONS.filter((l) => l.concepts.includes(conceptId));

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={concept.name} description="Connect this concept" className="w-[min(100vw,480px)]">
      <div className="space-y-5 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <AreaChip area={concept.area} />
          <TierBadge tier={concept.tier} />
        </div>

        {concept.place && concept.place.length > 0 && (
          <div>
            <div className="mb-1.5 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Where it fits inside Azure</div>
            <ConceptPlace conceptId={conceptId} />
          </div>
        )}

        <div className={mode === 'simple' ? 'rounded-xl bg-success-50/60 p-3.5' : ''}>
          {mode === 'simple' && (
            <div className="mb-1 flex items-center gap-1.5 text-2xs font-semibold tracking-wide text-success-700 uppercase">
              <Sprout className="size-3.5" aria-hidden="true" /> New to Azure
            </div>
          )}
          <p className="text-[15px] leading-relaxed text-ink">
            <InlineText text={mode === 'simple' ? concept.simple : concept.summary} />
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
            <span className="font-semibold text-ink">Why it exists: </span>
            <InlineText text={concept.why} />
          </p>
        </div>

        {(concept.useWhen?.length || concept.avoidWhen?.length) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {concept.useWhen && concept.useWhen.length > 0 && (
              <div className="rounded-xl border border-success-100 bg-success-50/50 p-3">
                <div className="text-2xs font-semibold tracking-wide text-success-700 uppercase">Use it when</div>
                <ul className="mt-1.5 space-y-1 text-[13px] leading-snug text-ink-2">
                  {concept.useWhen.map((u) => (
                    <li key={u}>
                      <InlineText text={u} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {concept.avoidWhen && concept.avoidWhen.length > 0 && (
              <div className="rounded-xl border border-warning-100 bg-warning-50/60 p-3">
                <div className="text-2xs font-semibold tracking-wide text-warning-700 uppercase">Not the right choice when</div>
                <ul className="mt-1.5 space-y-1 text-[13px] leading-snug text-ink-2">
                  {concept.avoidWhen.map((u) => (
                    <li key={u}>
                      <InlineText text={u} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {concept.confusedWith && concept.confusedWith.length > 0 && (
          <div>
            <div className="mb-2 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Often confused with</div>
            <ul className="space-y-2">
              {concept.confusedWith.map((c) => (
                <li key={c.id} className="rounded-xl border border-line p-3">
                  <ConceptChip id={c.id} />
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
                    <InlineText text={c.difference} />
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <ConnectionsPanel conceptId={conceptId} />

        {lessons.length > 0 && (
          <div>
            <div className="mb-2 text-2xs font-semibold tracking-wide text-ink-4 uppercase">Learn it in</div>
            <ul className="space-y-1.5">
              {lessons.map((l) => (
                <li key={l.id}>
                  <Link
                    to={`/learn/${l.moduleId}/${l.id}`}
                    onClick={onClose}
                    className="group flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-[13.5px] hover:border-brand-300 hover:bg-brand-25"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">{l.title}</span>
                      <span className="block text-xs text-ink-3">
                        Module {l.moduleNumber} · {l.moduleTitle}
                      </span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-ink-4 group-hover:text-brand-600" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <Link
            to={`/concepts/${conceptId}`}
            onClick={onClose}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-[13px] font-medium text-white hover:bg-brand-700"
          >
            Full concept page <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
          <Link
            to={`/map/${conceptId}`}
            onClick={onClose}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-medium text-ink-2 hover:bg-subtle"
          >
            <Orbit className="size-3.5" aria-hidden="true" /> Knowledge map
          </Link>
          <Link
            to={`/practice?concept=${conceptId}`}
            onClick={onClose}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-medium text-ink-2 hover:bg-subtle"
          >
            <Target className="size-3.5" aria-hidden="true" /> Practice
          </Link>
        </div>
      </div>
    </Sheet>
  );
}
