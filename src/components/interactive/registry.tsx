import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export interface InteractiveEntry {
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: LazyExoticComponent<ComponentType<any>>;
}

/**
 * Interactive learning widgets. Content embeds them with
 * { type: 'interactive', id: '<key>' } and the Labs page lists the simulators
 * described in src/content/simulators.ts.
 */
export const INTERACTIVES: Record<string, InteractiveEntry> = {
  'hierarchy-builder': { title: 'Arrange the Azure hierarchy', component: lazy(() => import('./HierarchyBuilder')) },
  'rbac-evaluator': { title: 'RBAC access evaluator', component: lazy(() => import('./RbacEvaluator')) },
  'policy-effects': { title: 'Azure Policy effect simulator', component: lazy(() => import('./PolicyEffects')) },
  'lock-evaluator': { title: 'Resource lock evaluator', component: lazy(() => import('./LockEvaluator')) },
  'storage-account-builder': { title: 'Storage account builder', component: lazy(() => import('./StorageAccountBuilder')) },
  'redundancy-explorer': { title: 'Redundancy failure explorer', component: lazy(() => import('./RedundancyExplorer')) },
  'sas-builder': { title: 'SAS token builder', component: lazy(() => import('./SasBuilder')) },
  'blob-protection': { title: 'Blob data protection simulator', component: lazy(() => import('./BlobProtection')) },
  'subnet-planner': { title: 'Subnet and CIDR planner', component: lazy(() => import('./SubnetPlanner')) },
  'nsg-evaluator': { title: 'NSG effective rules evaluator', component: lazy(() => import('./NsgEvaluator')) },
  'route-simulator': { title: 'Route and next hop simulator', component: lazy(() => import('./RouteSimulator')) },
  'peering-simulator': { title: 'Peering connectivity simulator', component: lazy(() => import('./PeeringSimulator')) },
  'private-endpoint-dns': { title: 'Private endpoint DNS resolver', component: lazy(() => import('./PrivateEndpointDns')) },
  'lb-probe-simulator': { title: 'Load balancer health probe simulator', component: lazy(() => import('./LbProbeSimulator')) },
  'availability-simulator': { title: 'VM availability failure simulator', component: lazy(() => import('./AvailabilitySimulator')) },
  'deployment-modes': { title: 'ARM deployment mode simulator', component: lazy(() => import('./DeploymentModes')) },
  'autoscale-simulator': { title: 'Autoscale simulator', component: lazy(() => import('./AutoscaleSimulator')) },
  'slot-swap': { title: 'Deployment slot swap visualizer', component: lazy(() => import('./SlotSwap')) },
  'kql-builder': { title: 'KQL query builder', component: lazy(() => import('./KqlBuilder')) },
  'backup-dr-timeline': { title: 'Backup vs disaster recovery timeline', component: lazy(() => import('./BackupDrTimeline')) },
};
