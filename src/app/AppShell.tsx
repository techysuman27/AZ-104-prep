import { lazy, Suspense, useEffect } from 'react';
import { Link, Outlet, ScrollRestoration, useLocation, useNavigation } from 'react-router';
import { Menu, Search } from 'lucide-react';
import { Dialog as RDialog } from 'radix-ui';
import { LogoMark } from '@/components/brand/Logo';
import { IconButton } from '@/components/ui/Button';
import { useUi } from '@/store/ui';
import { Sidebar, SidebarContent } from './Sidebar';

const CommandPalette = lazy(() => import('@/features/search/CommandPalette'));
const ConceptSheet = lazy(() => import('@/features/concepts/ConceptSheet'));

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

export function AppShell() {
  const navigation = useNavigation();
  const location = useLocation();
  const searchOpen = useUi((s) => s.searchOpen);
  const setSearchOpen = useUi((s) => s.setSearchOpen);
  const conceptId = useUi((s) => s.conceptId);
  const mobileNavOpen = useUi((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUi((s) => s.setMobileNavOpen);
  const closeConcept = useUi((s) => s.closeConcept);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(!useUi.getState().searchOpen);
      } else if (e.key === '/' && !isTypingTarget(e.target) && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setSearchOpen]);

  useEffect(() => {
    setMobileNavOpen(false);
    closeConcept();
  }, [location.pathname, setMobileNavOpen, closeConcept]);

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-ink focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <Sidebar className="fixed inset-y-0 left-0 hidden w-[264px] lg:flex" />

      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-line bg-surface/90 px-3 backdrop-blur lg:hidden">
        <IconButton label="Open navigation" onClick={() => setMobileNavOpen(true)}>
          <Menu className="size-5" />
        </IconButton>
        <Link to="/" className="flex items-center gap-2 font-semibold text-ink" aria-label="Stratus home">
          <LogoMark className="size-7" />
          Stratus
        </Link>
        <div className="flex-1" />
        <IconButton label="Search" onClick={() => setSearchOpen(true)}>
          <Search className="size-5" />
        </IconButton>
      </header>

      <RDialog.Root open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <RDialog.Portal>
          <RDialog.Overlay className="fixed inset-0 z-50 animate-fade-in bg-ink/30 lg:hidden" />
          <RDialog.Content className="fixed inset-y-0 left-0 z-50 w-[min(86vw,300px)] animate-fade-in border-r border-line bg-surface shadow-pop focus:outline-none lg:hidden">
            <RDialog.Title className="sr-only">Navigation</RDialog.Title>
            <RDialog.Description className="sr-only">Primary navigation</RDialog.Description>
            <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
          </RDialog.Content>
        </RDialog.Portal>
      </RDialog.Root>

      <div className="lg:pl-[264px]">
        {navigation.state === 'loading' && (
          <div className="fixed top-0 right-0 left-0 z-[70] h-0.5 overflow-hidden lg:left-[264px]" role="progressbar" aria-label="Loading page">
            <div className="h-full w-1/3 animate-loading bg-brand-500" />
          </div>
        )}
        <main id="main" tabIndex={-1} className="focus:outline-none">
          <Outlet />
        </main>
      </div>

      <Suspense fallback={null}>
        {searchOpen && <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />}
        {conceptId && <ConceptSheet conceptId={conceptId} onClose={closeConcept} />}
      </Suspense>

      <ScrollRestoration />
    </div>
  );
}
