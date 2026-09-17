import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type { Flashcard } from '@/content/schema';
import { InlineText } from '@/components/content/InlineText';
import { AreaChip } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

/** Compact, self-contained flashcard used outside the review queue. */
export function FlipCard({ card, className }: { card: Flashcard; className?: string }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      aria-pressed={flipped}
      className={cn(
        'group flex min-h-[132px] w-full flex-col rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-px hover:shadow-raised',
        flipped ? 'border-brand-200 bg-brand-25' : 'border-line bg-surface',
        className,
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <AreaChip area={card.domain} compact />
        <span className="inline-flex items-center gap-1 text-2xs font-medium text-ink-4">
          <RotateCcw className="size-3" aria-hidden="true" /> {flipped ? 'Answer' : 'Tap to reveal'}
        </span>
      </span>
      <span key={String(flipped)} className="mt-2 block animate-fade-in text-[14px] leading-relaxed text-ink">
        <InlineText text={flipped ? card.back : card.front} />
      </span>
    </button>
  );
}
