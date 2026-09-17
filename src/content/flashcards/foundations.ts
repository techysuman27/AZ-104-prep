import type { Flashcard } from '../schema';

/**
 * Foundations and governance. Cards state one fact each — the unit the spaced
 * repetition engine schedules. Anything needing a paragraph belongs in a lesson.
 */
export const FOUNDATION_CARDS: Flashcard[] = [
  // --------------------------------------------------------------- hierarchy
  {
    id: 'fc-hierarchy-order',
    front: 'Name the five levels of the Azure hierarchy, from the top down.',
    back: 'Microsoft Entra tenant → management groups → subscriptions → resource groups → resources. Permissions and policy assigned at one level are inherited by everything below it.',
    concept: 'management-group',
    domain: 'foundations',
    tier: 'must',
  },
  {
    id: 'fc-mg-root',
    front: 'How many management groups can a subscription belong to?',
    back: 'Exactly one. Every management group and subscription in a tenant sits under a single root management group.',
    concept: 'management-group',
    domain: 'identity-governance',
    tier: 'must',
  },
  {
    id: 'fc-rg-location',
    front: 'What does a resource group’s location actually determine?',
    back: 'Where the group’s **metadata** is stored — not where its resources run. Resources in a group can live in different regions from the group and from each other.',
    concept: 'resource-group',
    domain: 'identity-governance',
    tier: 'must',
  },
  {
    id: 'fc-rg-membership',
    front: 'Can a resource belong to two resource groups?',
    back: 'No. A resource is in exactly one resource group at a time, though it can be moved to another.',
    concept: 'resource-group',
    domain: 'identity-governance',
    tier: 'must',
  },
  {
    id: 'fc-subscription-boundary',
    front: 'What kind of boundary is an Azure subscription?',
    back: 'A billing boundary and a scale boundary — quotas and limits apply per subscription. It trusts exactly one [[entra-tenant|Microsoft Entra tenant]] for authentication.',
    concept: 'subscription',
    domain: 'identity-governance',
    tier: 'must',
  },

  // ----------------------------------------------------------------- regions
  {
    id: 'fc-zone-definition',
    front: 'What is an Azure availability zone?',
    back: 'A physically separate location inside one region, with independent power, cooling and networking. Spreading instances across zones survives the loss of a whole datacentre.',
    concept: 'availability-zone',
    domain: 'foundations',
    tier: 'must',
  },
  {
    id: 'fc-zonal-vs-zone-redundant',
    front: 'Zonal versus zone-redundant — what is the difference?',
    back: 'A **zonal** resource is pinned to one zone (a VM, a zonal public IP). A **zone-redundant** resource is replicated across zones by the service itself (ZRS storage, a zone-redundant load balancer).',
    concept: 'availability-zone',
    domain: 'foundations',
    tier: 'must',
  },
  {
    id: 'fc-paired-region',
    front: 'What is a region pair used for?',
    back: 'It is the secondary region that geo-redundant services replicate to. Platform updates are staged across a pair and, in a broad outage, one region of a pair is prioritised for recovery. Not every region has a pair.',
    concept: 'paired-region',
    domain: 'foundations',
    tier: 'should',
  },

  // --------------------------------------------------------------------- ARM
  {
    id: 'fc-arm-role',
    front: 'What does Azure Resource Manager do with every management request?',
    back: 'Authenticates the caller, checks [[azure-rbac|RBAC]], evaluates [[azure-policy|Azure Policy]] and locks, then hands the work to the resource provider. Portal, CLI, PowerShell and templates all go through it.',
    concept: 'azure-resource-manager',
    domain: 'foundations',
    tier: 'must',
  },
  {
    id: 'fc-control-vs-data-plane',
    front: 'Control plane or data plane: reading a blob from a storage account?',
    back: 'Data plane — it goes to the service endpoint, not to Resource Manager. Creating the storage account is a control-plane operation and appears in the [[activity-log|activity log]].',
    concept: 'control-plane-data-plane',
    domain: 'foundations',
    tier: 'must',
  },
  {
    id: 'fc-resource-provider',
    front: 'What must be true before you can create a resource of a given type?',
    back: 'Its resource provider must be registered in the subscription — for example `Microsoft.Compute` for virtual machines.',
    concept: 'resource-provider',
    domain: 'foundations',
    tier: 'should',
  },
  {
    id: 'fc-resource-id',
    front: 'What are the parts of an Azure resource ID?',
    back: '`/subscriptions/{id}/resourceGroups/{name}/providers/{provider}/{type}/{resourceName}`. It is unique, and it changes when a resource is moved.',
    concept: 'resource-id',
    domain: 'foundations',
    tier: 'should',
  },

  // ------------------------------------------------------------------- tools
  {
    id: 'fc-cloud-shell',
    front: 'What is Azure Cloud Shell?',
    back: 'A browser-based shell offering Bash and PowerShell, already authenticated as you, with the Azure CLI and Azure PowerShell modules pre-installed.',
    concept: 'cloud-shell',
    domain: 'foundations',
    tier: 'should',
  },

  // -------------------------------------------------------------- governance
  {
    id: 'fc-policy-vs-rbac',
    front: 'Azure Policy or RBAC: which controls *what* can be created versus *who* can create it?',
    back: 'RBAC controls **who** can perform an action. Policy controls **what** the resulting resource may look like. Both are evaluated — you need permission and the request must satisfy policy.',
    concept: 'azure-policy',
    domain: 'identity-governance',
    tier: 'must',
  },
  {
    id: 'fc-policy-deny-vs-audit',
    front: 'What is the difference between the Deny and Audit policy effects?',
    back: 'Deny blocks the request outright. Audit allows it and records non-compliance, which is how you measure impact before switching to Deny.',
    concept: 'policy-effect',
    domain: 'identity-governance',
    tier: 'must',
  },
  {
    id: 'fc-policy-deployifnotexists',
    front: 'What does the DeployIfNotExists policy effect require that Audit does not?',
    back: 'A [[managed-identity|managed identity]] on the policy assignment, with permissions to deploy the related resource. The same is true of Modify.',
    concept: 'policy-effect',
    domain: 'identity-governance',
    tier: 'must',
  },
  {
    id: 'fc-initiative',
    front: 'What is a policy initiative?',
    back: 'A set of policy definitions assigned and reported on as one unit, so a whole standard is applied and measured together.',
    concept: 'policy-initiative',
    domain: 'identity-governance',
    tier: 'should',
  },
  {
    id: 'fc-lock-types',
    front: 'What do the two resource lock types prevent?',
    back: '**CanNotDelete** allows changes but blocks deletion. **ReadOnly** blocks deletion *and* modification — including operations that look like reads, such as listing storage account keys.',
    concept: 'resource-lock',
    domain: 'identity-governance',
    tier: 'must',
  },
  {
    id: 'fc-lock-inheritance',
    front: 'How do resource locks interact with scope?',
    back: 'Locks are inherited by child scopes, and the **most restrictive** lock in the chain wins. Managing locks requires Owner or User Access Administrator.',
    concept: 'resource-lock',
    domain: 'identity-governance',
    tier: 'must',
  },
  {
    id: 'fc-tags-inheritance',
    front: 'Do resources inherit tags from their resource group?',
    back: 'No — not automatically. Use an Azure Policy with the Modify effect (and a remediation task) to apply inherited tags.',
    concept: 'tags',
    domain: 'identity-governance',
    tier: 'must',
  },
  {
    id: 'fc-budget-action',
    front: 'Does an Azure budget stop spending when it is exceeded?',
    back: 'No. A budget raises alerts at the thresholds you set; stopping anything requires an action group that triggers automation.',
    concept: 'budget',
    domain: 'identity-governance',
    tier: 'must',
  },
  {
    id: 'fc-advisor-categories',
    front: 'What does Azure Advisor analyse?',
    back: 'Your actual usage, producing recommendations in reliability, security, performance, cost and operational excellence.',
    concept: 'azure-advisor',
    domain: 'identity-governance',
    tier: 'should',
  },
  {
    id: 'fc-resource-move-region',
    front: 'Does moving a resource to another resource group change its region?',
    back: 'No. Resource group and subscription moves are metadata operations — the resource keeps running in the same region. Changing region means Azure Resource Mover or a redeployment.',
    concept: 'resource-move',
    domain: 'identity-governance',
    tier: 'must',
  },
  {
    id: 'fc-resource-move-rbac',
    front: 'What does *not* survive a resource move?',
    back: 'The resource ID changes, and direct role assignments do not move with the resource. Both resource groups are locked against changes during the move.',
    concept: 'resource-move',
    domain: 'identity-governance',
    tier: 'should',
  },
];
