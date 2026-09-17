import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * Purpose-built diagrams that go beyond the generic FlowDiagram renderer.
 * Content references them by id: { type: 'diagram', id: 'resource-hierarchy' }.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DIAGRAMS: Record<string, LazyExoticComponent<ComponentType<any>>> = {
  'resource-hierarchy': lazy(() => import('./special/ResourceHierarchy')),
  'access-tiers': lazy(() => import('./special/AccessTiers')),
};
