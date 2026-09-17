import type { LucideIcon } from 'lucide-react';
import {
  BadgeCheck,
  Bookmark,
  BookOpen,
  Brain,
  Compass,
  DraftingCompass,
  FlaskConical,
  LayoutDashboard,
  LayoutTemplate,
  Library,
  ListChecks,
  Orbit,
  Settings,
  Target,
  Timer,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Match nested routes as active. */
  end?: boolean;
  description: string;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    id: 'home',
    label: 'Home',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, description: 'Readiness, progress and what to do next' },
    ],
  },
  {
    id: 'learn',
    label: 'Learn',
    items: [
      { to: '/learn', label: 'Learning path', icon: BookOpen, description: 'Twelve modules from foundations to recovery' },
      { to: '/concepts', label: 'Concept library', icon: Library, description: 'Every Azure concept and how it connects' },
      { to: '/map', label: 'Knowledge map', icon: Orbit, description: 'Explore how services relate to each other' },
      { to: '/mindset', label: 'Think like an admin', icon: Compass, description: 'The ten questions administrators ask' },
    ],
  },
  {
    id: 'practice',
    label: 'Practice',
    items: [
      { to: '/practice', label: 'Practice questions', icon: Target, description: 'Targeted questions with full explanations' },
      { to: '/review', label: 'Flashcard review', icon: Brain, description: 'Spaced repetition for long-term recall' },
      { to: '/exam', label: 'Mock exams', icon: Timer, description: 'Timed, weighted, exam-style practice' },
      { to: '/labs', label: 'Labs & simulators', icon: FlaskConical, description: 'Guided labs, simulators and troubleshooting' },
    ],
  },
  {
    id: 'design',
    label: 'Design',
    items: [
      { to: '/design', label: 'Solution design lab', icon: DraftingCompass, description: 'Turn requirements into architectures' },
      { to: '/architectures', label: 'Architecture library', icon: LayoutTemplate, description: 'Real-world reference architectures' },
    ],
  },
  {
    id: 'reference',
    label: 'Reference',
    items: [
      { to: '/skills', label: 'Exam skills outline', icon: ListChecks, description: 'The official outline mapped to lessons' },
      { to: '/sources', label: 'Sources & freshness', icon: BadgeCheck, description: 'How content is validated and what changed' },
      { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark, description: 'Saved lessons, concepts and questions' },
      { to: '/settings', label: 'Settings & data', icon: Settings, description: 'Exam date, progress export and reset' },
    ],
  },
];
