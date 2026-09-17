import { Link } from 'react-router';
import { Bookmark, Trash } from 'lucide-react';
import { LESSON_INDEX } from '@/content/curriculum';
import { CONCEPT_INDEX } from '@/content/concepts';
import { QUESTION_INDEX } from '@/content/questions';
import { LAB_INDEX } from '@/content/labs';
import { ARCHITECTURE_INDEX } from '@/content/architectures';
import { TROUBLE_INDEX } from '@/content/trouble';
import { PageContainer } from '@/components/layout/Page';
import { Card, EmptyState, PageHeader } from '@/components/ui/Card';
import { AreaChip } from '@/components/ui/Badge';
import { useLearner, type BookmarkEntry } from '@/store/learner';
import { relativeTime } from '@/lib/format';

function resolve(b: Pick<BookmarkEntry, 'kind' | 'id'>): { title: string; subtitle: string; to: string } | null {
  switch (b.kind) {
    case 'lesson': {
      const l = LESSON_INDEX[b.id];
      return l ? { title: l.title, subtitle: `Lesson · Module ${l.moduleNumber}`, to: `/learn/${l.moduleId}/${l.id}` } : null;
    }
    case 'concept': {
      const c = CONCEPT_INDEX[b.id];
      return c ? { title: c.name, subtitle: 'Concept', to: `/concepts/${c.id}` } : null;
    }
    case 'question': {
      const q = QUESTION_INDEX[b.id];
      return q ? { title: q.stem.length > 140 ? `${q.stem.slice(0, 140)}…` : q.stem, subtitle: 'Question', to: `/practice?concept=${q.concepts[0] ?? ''}` } : null;
    }
    case 'lab': {
      const l = LAB_INDEX[b.id];
      return l ? { title: `Lab ${l.number}: ${l.title}`, subtitle: 'Guided lab', to: `/labs/guided/${l.id}` } : null;
    }
    case 'architecture': {
      const a = ARCHITECTURE_INDEX[b.id];
      return a ? { title: a.title, subtitle: 'Architecture', to: `/architectures/${a.id}` } : null;
    }
    case 'scenario': {
      const s = TROUBLE_INDEX[b.id];
      return s ? { title: s.title, subtitle: 'Troubleshooting scenario', to: `/labs/troubleshoot/${s.id}` } : null;
    }
  }
}

export default function BookmarksPage() {
  const bookmarks = useLearner((s) => s.bookmarks);
  const recent = useLearner((s) => s.recent);
  const toggleBookmark = useLearner((s) => s.toggleBookmark);

  return (
    <PageContainer>
      <PageHeader
        eyebrow={<span className="text-xs font-semibold tracking-wide text-brand-700 uppercase">Bookmarks</span>}
        title="Saved for later"
        description="Lessons, concepts and questions you bookmarked, plus everything you viewed recently."
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="p-5">
          <h2 className="text-[15px] font-semibold text-ink">Bookmarks</h2>
          {bookmarks.length === 0 ? (
            <EmptyState
              className="mt-4"
              icon={<Bookmark className="size-6" />}
              title="No bookmarks yet"
              description="Use the Bookmark button on any lesson, concept or question explanation."
            />
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {bookmarks.map((b) => {
                const r = resolve(b);
                if (!r) return null;
                const concept = b.kind === 'concept' ? CONCEPT_INDEX[b.id] : undefined;
                return (
                  <li key={`${b.kind}-${b.id}`} className="flex items-center gap-3 py-3">
                    {concept && <AreaChip area={concept.area} compact />}
                    <Link to={r.to} className="min-w-0 flex-1">
                      <span className="line-clamp-2 block text-[14px] font-medium text-ink hover:text-brand-800">{r.title}</span>
                      <span className="block text-xs text-ink-3">
                        {r.subtitle} · saved {relativeTime(b.at)}
                      </span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleBookmark({ kind: b.kind, id: b.id })}
                      className="grid size-8 place-items-center rounded-lg text-ink-4 hover:bg-subtle hover:text-danger-600"
                      aria-label={`Remove bookmark: ${r.title}`}
                    >
                      <Trash className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="text-[15px] font-semibold text-ink">Recently viewed</h2>
          {recent.length === 0 ? (
            <p className="mt-2 text-[13.5px] text-ink-3">Nothing yet.</p>
          ) : (
            <ul className="mt-3 space-y-1">
              {recent.map((b) => {
                const r = resolve(b);
                if (!r) return null;
                return (
                  <li key={`${b.kind}-${b.id}`}>
                    <Link to={r.to} className="block rounded-lg px-2 py-1.5 hover:bg-subtle">
                      <span className="block truncate text-[13.5px] font-medium text-ink-2">{r.title}</span>
                      <span className="block text-2xs text-ink-4">
                        {r.subtitle} · {relativeTime(b.at)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
