import type { ComponentType } from 'react';
import { createBrowserRouter } from 'react-router';
import { AppShell } from './AppShell';
import { RouteError } from './RouteError';

/** Route-level code splitting: each page ships in its own chunk. */
function page(load: () => Promise<{ default: ComponentType }>) {
  return async () => ({ Component: (await load()).default });
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppShell,
    ErrorBoundary: RouteError,
    HydrateFallback: () => null,
    children: [
      {
        ErrorBoundary: RouteError,
        children: [
          { index: true, lazy: page(() => import('@/features/dashboard/DashboardPage')) },

          { path: 'learn', lazy: page(() => import('@/features/learn/LearnPage')) },
          { path: 'learn/:moduleId', lazy: page(() => import('@/features/learn/ModulePage')) },
          { path: 'learn/:moduleId/:lessonId', lazy: page(() => import('@/features/learn/LessonPage')) },

          { path: 'concepts', lazy: page(() => import('@/features/concepts/ConceptsPage')) },
          { path: 'concepts/:conceptId', lazy: page(() => import('@/features/concepts/ConceptPage')) },
          { path: 'map', lazy: page(() => import('@/features/map/KnowledgeMapPage')) },
          { path: 'map/:conceptId', lazy: page(() => import('@/features/map/KnowledgeMapPage')) },
          { path: 'mindset', lazy: page(() => import('@/features/mindset/MindsetPage')) },

          { path: 'practice', lazy: page(() => import('@/features/practice/PracticePage')) },
          { path: 'review', lazy: page(() => import('@/features/review/ReviewPage')) },
          { path: 'exam', lazy: page(() => import('@/features/exam/ExamHomePage')) },
          { path: 'exam/session', lazy: page(() => import('@/features/exam/ExamSessionPage')) },
          { path: 'exam/results/:mockId', lazy: page(() => import('@/features/exam/ExamResultsPage')) },

          { path: 'labs', lazy: page(() => import('@/features/labs/LabsPage')) },
          { path: 'labs/guided/:labId', lazy: page(() => import('@/features/labs/LabPage')) },
          { path: 'labs/simulators/:simId', lazy: page(() => import('@/features/labs/SimulatorPage')) },
          { path: 'labs/troubleshoot/:scenarioId', lazy: page(() => import('@/features/labs/TroubleshootPage')) },

          { path: 'design', lazy: page(() => import('@/features/design/DesignLabPage')) },
          { path: 'design/:challengeId', lazy: page(() => import('@/features/design/DesignChallengePage')) },
          { path: 'architectures', lazy: page(() => import('@/features/architectures/ArchitecturesPage')) },
          { path: 'architectures/:archId', lazy: page(() => import('@/features/architectures/ArchitecturePage')) },

          { path: 'skills', lazy: page(() => import('@/features/reference/SkillsPage')) },
          { path: 'sources', lazy: page(() => import('@/features/reference/SourcesPage')) },
          { path: 'bookmarks', lazy: page(() => import('@/features/reference/BookmarksPage')) },
          { path: 'settings', lazy: page(() => import('@/features/reference/SettingsPage')) },

          { path: '*', lazy: page(() => import('@/features/reference/NotFoundPage')) },
        ],
      },
    ],
  },
]);
