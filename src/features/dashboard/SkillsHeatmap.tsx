import { Link } from 'react-router';
import type { MasteryStat } from '@/engine/mastery';
import { EXAM_DOMAINS, DOMAIN_META } from '@/content/exam';
import { Tooltip } from '@/components/ui/Overlay';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';

type CellState = 'unseen' | 'lesson' | 'learning' | 'practicing' | 'strong' | 'mastered';

/** One-hue ordinal ramp (brand blue) — state is also given in text in every tooltip and in the legend. */
const STATE_STYLE: Record<CellState, { cls: string; label: string }> = {
  unseen: { cls: 'bg-surface border-line-strong border-dashed', label: 'Not started' },
  lesson: { cls: 'bg-brand-50 border-brand-150', label: 'Lesson studied, no practice yet' },
  learning: { cls: 'bg-brand-150 border-brand-200', label: 'Learning (below 50%)' },
  practicing: { cls: 'bg-brand-300 border-brand-300', label: 'Practising' },
  strong: { cls: 'bg-brand-500 border-brand-500', label: 'Strong' },
  mastered: { cls: 'bg-brand-800 border-brand-800', label: 'Mastered' },
};

export function SkillsHeatmap({ skillStats, studiedSkills }: { skillStats: Record<string, MasteryStat>; studiedSkills: Set<string> }) {
  const stateFor = (id: string): CellState => {
    const s = skillStats[id];
    if (!s) return studiedSkills.has(id) ? 'lesson' : 'unseen';
    return s.state === 'unseen' ? 'unseen' : s.state;
  };
  const all = EXAM_DOMAINS.flatMap((d) => d.groups.flatMap((g) => g.skills));
  const practised = all.filter((s) => skillStats[s.id]).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">Exam skills coverage</h2>
          <p className="mt-0.5 text-xs text-ink-3">
            Every skill in the official outline. {practised} of {all.length} have practice evidence.
          </p>
        </div>
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1" aria-label="Legend">
          {(Object.keys(STATE_STYLE) as CellState[]).map((k) => (
            <li key={k} className="flex items-center gap-1.5 text-2xs text-ink-3">
              <span className={cn('size-3 rounded-[3px] border', STATE_STYLE[k].cls)} aria-hidden="true" />
              {STATE_STYLE[k].label.split(' (')[0].replace(', no practice yet', '')}
            </li>
          ))}
        </ul>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {EXAM_DOMAINS.map((d) => {
          const meta = DOMAIN_META[d.id];
          return (
            <div key={d.id} className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-md" style={{ background: meta.soft, color: meta.ink }}>
                  <Icon name={meta.icon} className="size-3.5" />
                </span>
                <span className="truncate text-[13px] font-semibold text-ink">{d.shortTitle}</span>
              </div>
              <div className="space-y-2.5">
                {d.groups.map((g) => (
                  <div key={g.id}>
                    <div className="mb-1 truncate text-2xs text-ink-3" title={g.title}>
                      {g.title}
                    </div>
                    <ul className="flex flex-wrap gap-1">
                      {g.skills.map((s) => {
                        const st = stateFor(s.id);
                        const stat = skillStats[s.id];
                        return (
                          <li key={s.id}>
                            <Tooltip
                              content={
                                <span className="block">
                                  <span className="block font-semibold">{s.text}</span>
                                  <span className="mt-0.5 block text-white/75">
                                    {STATE_STYLE[st].label}
                                    {stat ? ` · ${stat.correct}/${stat.attempts} correct` : ''}
                                  </span>
                                </span>
                              }
                            >
                              <Link
                                to={`/skills#${s.id}`}
                                aria-label={`${s.text}: ${STATE_STYLE[st].label}`}
                                className={cn('block size-5 rounded-[5px] border transition-transform hover:scale-110', STATE_STYLE[st].cls)}
                              />
                            </Tooltip>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
