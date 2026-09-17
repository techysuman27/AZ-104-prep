import { NavLink } from 'react-router';
import { CreatorCard } from '@/components/brand/CreatorCredit';
import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Logo } from '@/components/brand/Logo';
import { Kbd } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/Progress';
import { Switch } from '@/components/ui/Switch';
import { LESSONS } from '@/content/curriculum';
import { useLearner } from '@/store/learner';
import { useUi } from '@/store/ui';
import { NAV } from './nav';

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const setSearchOpen = useUi((s) => s.setSearchOpen);
  const lessons = useLearner((s) => s.lessons);
  const mode = useLearner((s) => s.settings.explanationMode);
  const setSetting = useLearner((s) => s.setSetting);
  const completed = LESSONS.filter((l) => lessons[l.id]?.completedAt).length;

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-5 pb-4">
        <NavLink to="/" onClick={onNavigate} className="inline-flex rounded-lg" aria-label="Stratus home">
          <Logo />
        </NavLink>
      </div>

      <div className="px-3">
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            setSearchOpen(true);
          }}
          className="flex h-9 w-full items-center gap-2 rounded-lg border border-line bg-subtle px-3 text-left text-[13px] text-ink-3 transition-colors hover:border-line-strong hover:bg-surface"
        >
          <Search className="size-4" aria-hidden="true" />
          <span className="flex-1">Search</span>
          <Kbd>Ctrl K</Kbd>
        </button>
      </div>

      <nav aria-label="Primary" className="scrollbar-thin mt-3 min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map((group) => (
          <div key={group.id} className="mt-3 first:mt-1">
            {group.id !== 'home' && (
              <div className="px-2.5 pt-2 pb-1.5 text-2xs font-semibold tracking-[0.08em] text-ink-4 uppercase">
                {group.label}
              </div>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] font-medium transition-colors',
                        isActive ? 'bg-brand-50 text-brand-800' : 'text-ink-2 hover:bg-subtle hover:text-ink',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute top-2 bottom-2 -left-3 w-[3px] rounded-r-full bg-brand-600" aria-hidden="true" />
                        )}
                        <item.icon
                          className={cn('size-[18px] shrink-0', isActive ? 'text-brand-600' : 'text-ink-3 group-hover:text-ink-2')}
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-4 border-t border-line px-5 py-4">
        <Switch
          checked={mode === 'simple'}
          onCheckedChange={(v) => setSetting('explanationMode', v ? 'simple' : 'technical')}
          label="Explain like I'm new"
          description="Plain-language explanations"
        />
        <div>
          <div className="mb-1.5 flex items-center justify-between text-2xs font-medium text-ink-3">
            <span>Course progress</span>
            <span className="tabular">
              {completed}/{LESSONS.length} lessons
            </span>
          </div>
          <ProgressBar value={completed / LESSONS.length} size="sm" label="Course progress" />
        </div>
        <CreatorCard />
      </div>
    </div>
  );
}

export function Sidebar({ className }: { className?: string }) {
  return (
    <aside className={cn('z-30 flex-col border-r border-line bg-surface', className)}>
      <SidebarContent />
    </aside>
  );
}
