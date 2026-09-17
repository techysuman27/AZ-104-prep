import type { ChangeNote, DomainId, ExamDomain, IconKey } from './schema';

/**
 * Official AZ-104 skills outline — "Skills measured as of April 17, 2026".
 * Source: https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104
 * Skill text is reproduced verbatim so learners can map lessons to the outline.
 */
export const EXAM_META = {
  code: 'AZ-104',
  title: 'Microsoft Azure Administrator',
  skillsAsOf: '2026-04-17',
  passingScore: 700,
  sourceId: 'exam-az104',
};

export const EXAM_DOMAINS: ExamDomain[] = [
  {
    id: 'identity-governance',
    title: 'Manage Azure identities and governance',
    shortTitle: 'Identity & governance',
    weight: { min: 20, max: 25 },
    groups: [
      {
        id: 'ig.entra',
        title: 'Manage Microsoft Entra users and groups',
        skills: [
          { id: 'ig.entra.create', text: 'Create users and groups' },
          { id: 'ig.entra.properties', text: 'Manage user and group properties' },
          { id: 'ig.entra.licenses', text: 'Manage licenses in Microsoft Entra ID' },
          { id: 'ig.entra.external', text: 'Manage external users' },
          { id: 'ig.entra.sspr', text: 'Configure self-service password reset (SSPR)' },
        ],
      },
      {
        id: 'ig.access',
        title: 'Manage access to Azure resources',
        skills: [
          { id: 'ig.access.builtin', text: 'Manage built-in Azure roles' },
          { id: 'ig.access.scopes', text: 'Assign roles at different scopes' },
          { id: 'ig.access.interpret', text: 'Interpret access assignments' },
        ],
      },
      {
        id: 'ig.gov',
        title: 'Manage Azure subscriptions and governance',
        skills: [
          { id: 'ig.gov.policy', text: 'Implement and manage Azure Policy' },
          { id: 'ig.gov.locks', text: 'Configure resource locks' },
          { id: 'ig.gov.tags', text: 'Apply and manage tags on resources' },
          { id: 'ig.gov.rg', text: 'Manage resource groups' },
          { id: 'ig.gov.subscriptions', text: 'Manage subscriptions' },
          { id: 'ig.gov.costs', text: 'Manage costs by using alerts, budgets, and Azure Advisor recommendations' },
          { id: 'ig.gov.mg', text: 'Configure management groups' },
        ],
      },
    ],
  },
  {
    id: 'storage',
    title: 'Implement and manage storage',
    shortTitle: 'Storage',
    weight: { min: 15, max: 20 },
    groups: [
      {
        id: 'st.access',
        title: 'Configure access to storage',
        skills: [
          { id: 'st.access.firewall', text: 'Configure Azure Storage firewalls and virtual networks' },
          { id: 'st.access.sas', text: 'Create and use shared access signature (SAS) tokens' },
          { id: 'st.access.policies', text: 'Configure stored access policies' },
          { id: 'st.access.keys', text: 'Manage access keys' },
          { id: 'st.access.files-identity', text: 'Configure identity-based access for Azure Files' },
        ],
      },
      {
        id: 'st.accounts',
        title: 'Configure and manage storage accounts',
        skills: [
          { id: 'st.accounts.create', text: 'Create and configure storage accounts' },
          { id: 'st.accounts.redundancy', text: 'Configure Azure Storage redundancy' },
          { id: 'st.accounts.object-replication', text: 'Configure object replication' },
          { id: 'st.accounts.encryption', text: 'Configure storage account encryption' },
          { id: 'st.accounts.tools', text: 'Manage data by using Azure Storage Explorer and AzCopy' },
        ],
      },
      {
        id: 'st.data',
        title: 'Configure Azure Files and Azure Blob Storage',
        skills: [
          { id: 'st.data.file-share', text: 'Create and configure a file share in Azure Files' },
          { id: 'st.data.container', text: 'Create and configure a container in Azure Blob Storage' },
          { id: 'st.data.tiers', text: 'Configure storage tiers' },
          { id: 'st.data.blob-soft-delete', text: 'Configure soft delete for blobs and containers' },
          { id: 'st.data.files-snapshots', text: 'Configure snapshots and soft delete for Azure Files' },
          { id: 'st.data.lifecycle', text: 'Configure blob lifecycle management' },
          { id: 'st.data.versioning', text: 'Configure blob versioning' },
        ],
      },
    ],
  },
  {
    id: 'compute',
    title: 'Deploy and manage Azure compute resources',
    shortTitle: 'Compute',
    weight: { min: 20, max: 25 },
    groups: [
      {
        id: 'cp.iac',
        title: 'Automate deployment of resources by using Azure Resource Manager (ARM) templates or Bicep files',
        skills: [
          { id: 'cp.iac.interpret', text: 'Interpret an Azure Resource Manager template or a Bicep file' },
          { id: 'cp.iac.modify-arm', text: 'Modify an existing Azure Resource Manager template' },
          { id: 'cp.iac.modify-bicep', text: 'Modify an existing Bicep file' },
          { id: 'cp.iac.deploy', text: 'Deploy resources by using an Azure Resource Manager template or a Bicep file' },
          {
            id: 'cp.iac.export',
            text: 'Export a deployment as an Azure Resource Manager template or convert an Azure Resource Manager template to a Bicep file',
          },
        ],
      },
      {
        id: 'cp.vm',
        title: 'Create and configure virtual machines',
        skills: [
          { id: 'cp.vm.create', text: 'Create a virtual machine' },
          { id: 'cp.vm.encryption', text: 'Configure encryption at host for Azure virtual machines' },
          { id: 'cp.vm.move', text: 'Move a virtual machine to another resource group, subscription, or region' },
          { id: 'cp.vm.sizes', text: 'Manage virtual machine sizes' },
          { id: 'cp.vm.disks', text: 'Manage virtual machine disks' },
          { id: 'cp.vm.availability', text: 'Deploy virtual machines to availability zones and availability sets' },
          { id: 'cp.vm.vmss', text: 'Deploy and configure an Azure Virtual Machine Scale Sets' },
        ],
      },
      {
        id: 'cp.containers',
        title: 'Provision and manage containers in the Azure portal',
        skills: [
          { id: 'cp.containers.acr', text: 'Create and manage an Azure Container Registry' },
          { id: 'cp.containers.aci', text: 'Provision a container by using Azure Container Instances' },
          { id: 'cp.containers.aca', text: 'Provision a container by using Azure Container Apps' },
          {
            id: 'cp.containers.scaling',
            text: 'Manage sizing and scaling for containers, including Azure Container Instances and Azure Container Apps',
          },
        ],
      },
      {
        id: 'cp.app',
        title: 'Create and configure Azure App Service',
        skills: [
          { id: 'cp.app.plan', text: 'Provision an App Service plan' },
          { id: 'cp.app.scaling', text: 'Configure scaling for an App Service plan' },
          { id: 'cp.app.create', text: 'Create an App Service' },
          { id: 'cp.app.tls', text: 'Configure certificates and Transport Layer Security (TLS) for an App Service' },
          { id: 'cp.app.domain', text: 'Map an existing custom DNS name to an App Service' },
          { id: 'cp.app.backup', text: 'Configure backup for an App Service' },
          { id: 'cp.app.networking', text: 'Configure networking settings for an App Service' },
          { id: 'cp.app.slots', text: 'Configure deployment slots for an App Service' },
        ],
      },
    ],
  },
  {
    id: 'networking',
    title: 'Implement and manage virtual networking',
    shortTitle: 'Networking',
    weight: { min: 15, max: 20 },
    groups: [
      {
        id: 'nw.vnet',
        title: 'Configure and manage virtual networks in Azure',
        skills: [
          { id: 'nw.vnet.create', text: 'Create and configure virtual networks and subnets' },
          { id: 'nw.vnet.peering', text: 'Create and configure virtual network peering' },
          { id: 'nw.vnet.public-ip', text: 'Configure public IP addresses' },
          { id: 'nw.vnet.udr', text: 'Configure user-defined routes' },
          { id: 'nw.vnet.troubleshoot', text: 'Troubleshoot network connectivity' },
        ],
      },
      {
        id: 'nw.secure',
        title: 'Configure secure access to virtual networks',
        skills: [
          { id: 'nw.secure.nsg', text: 'Create and configure network security groups (NSGs) and application security groups' },
          { id: 'nw.secure.effective', text: 'Evaluate effective security rules in NSGs' },
          { id: 'nw.secure.bastion', text: 'Implement Azure Bastion' },
          { id: 'nw.secure.service-endpoints', text: 'Configure service endpoints for Azure platform as a service (PaaS)' },
          { id: 'nw.secure.private-endpoints', text: 'Configure private endpoints for Azure PaaS' },
        ],
      },
      {
        id: 'nw.dnslb',
        title: 'Configure name resolution and load balancing',
        skills: [
          { id: 'nw.dnslb.dns', text: 'Configure Azure DNS' },
          { id: 'nw.dnslb.lb', text: 'Configure an internal or public load balancer' },
          { id: 'nw.dnslb.troubleshoot', text: 'Troubleshoot load balancing' },
        ],
      },
    ],
  },
  {
    id: 'monitoring',
    title: 'Monitor and maintain Azure resources',
    shortTitle: 'Monitor & maintain',
    weight: { min: 10, max: 15 },
    groups: [
      {
        id: 'mo.monitor',
        title: 'Monitor resources in Azure',
        skills: [
          { id: 'mo.monitor.metrics', text: 'Interpret metrics in Azure Monitor' },
          { id: 'mo.monitor.logs', text: 'Configure log settings in Azure Monitor' },
          { id: 'mo.monitor.query', text: 'Query and analyze logs in Azure Monitor' },
          { id: 'mo.monitor.alerts', text: 'Set up alert rules, action groups, and alert processing rules in Azure Monitor' },
          {
            id: 'mo.monitor.insights',
            text: 'Configure and interpret monitoring of virtual machines, storage accounts, and networks by using Azure Monitor Insights',
          },
          { id: 'mo.monitor.network-watcher', text: 'Use Azure Network Watcher and Connection monitor' },
        ],
      },
      {
        id: 'mo.backup',
        title: 'Implement backup and recovery',
        skills: [
          { id: 'mo.backup.rsv', text: 'Create a Recovery Services vault' },
          { id: 'mo.backup.bv', text: 'Create an Azure Backup vault' },
          { id: 'mo.backup.policy', text: 'Create and configure a backup policy' },
          { id: 'mo.backup.operations', text: 'Perform backup and restore operations by using Azure Backup' },
          { id: 'mo.backup.asr', text: 'Configure Azure Site Recovery for Azure resources' },
          { id: 'mo.backup.failover', text: 'Perform a failover to a secondary region by using Site Recovery' },
          { id: 'mo.backup.reports', text: 'Configure and interpret reports and alerts for backups' },
        ],
      },
    ],
  },
];

export const DOMAIN_META: Record<DomainId, { icon: IconKey; color: string; soft: string; ink: string; blurb: string }> = {
  'identity-governance': {
    icon: 'identity',
    color: 'var(--color-identity)',
    soft: 'var(--color-identity-soft)',
    ink: 'var(--color-identity-ink)',
    blurb: 'Who can do what, where — and the guardrails that keep an estate consistent.',
  },
  storage: {
    icon: 'storage',
    color: 'var(--color-storage)',
    soft: 'var(--color-storage-soft)',
    ink: 'var(--color-storage-ink)',
    blurb: 'Durable, secure data: accounts, redundancy, access and protection.',
  },
  compute: {
    icon: 'vm',
    color: 'var(--color-compute)',
    soft: 'var(--color-compute-soft)',
    ink: 'var(--color-compute-ink)',
    blurb: 'VMs, scale sets, App Service, containers and infrastructure as code.',
  },
  networking: {
    icon: 'vnet',
    color: 'var(--color-networking)',
    soft: 'var(--color-networking-soft)',
    ink: 'var(--color-networking-ink)',
    blurb: 'How traffic flows, is filtered, resolved and balanced.',
  },
  monitoring: {
    icon: 'monitor',
    color: 'var(--color-monitoring)',
    soft: 'var(--color-monitoring-soft)',
    ink: 'var(--color-monitoring-ink)',
    blurb: 'Seeing what happens, being told when it matters, and recovering.',
  },
};

export const ALL_SKILLS = EXAM_DOMAINS.flatMap((d) =>
  d.groups.flatMap((g) => g.skills.map((s) => ({ ...s, groupId: g.id, groupTitle: g.title, domain: d.id }))),
);

export const SKILL_INDEX = Object.fromEntries(ALL_SKILLS.map((s) => [s.id, s]));

export const DOMAIN_INDEX = Object.fromEntries(EXAM_DOMAINS.map((d) => [d.id, d])) as Record<DomainId, ExamDomain>;

/** Midpoint weight used by the readiness engine and mock exam blueprint. */
export function domainWeight(id: DomainId): number {
  const d = DOMAIN_INDEX[id];
  return (d.weight.min + d.weight.max) / 2;
}

/**
 * What changed — exam outline updates and platform changes that make older
 * preparation material wrong. Each note is grounded in a verified source.
 */
export const PLATFORM_CHANGES: (ChangeNote & { sourceId: string; area: DomainId })[] = [
  {
    area: 'compute',
    topic: 'VM encryption skill',
    previously: 'Older outlines asked candidates to "Configure Azure Disk Encryption" (in-guest BitLocker/DM-Crypt).',
    now: 'The April 2026 outline asks you to "Configure encryption at host". Azure Disk Encryption is scheduled for retirement on September 15, 2028, and Microsoft recommends encryption at host for new VMs.',
    matters: 'Know what encryption at host adds on top of server-side encryption (temp disks, caches, data in flight between compute and storage) and that ADE is the legacy path.',
    sourceId: 'disk-encryption',
  },
  {
    area: 'storage',
    topic: 'Blob and container soft delete',
    previously: 'Soft delete for blobs was often taught only as a side note to versioning.',
    now: '"Configure soft delete for blobs and containers" is an explicit skill in the April 2026 outline.',
    matters: 'Know the 1–365 day retention range, what blob vs container soft delete protects, and that neither protects against deleting the storage account (use a resource lock).',
    sourceId: 'exam-az104',
  },
  {
    area: 'identity-governance',
    topic: 'Azure Active Directory naming',
    previously: 'Azure Active Directory (Azure AD), Azure AD roles, Azure AD Connect.',
    now: 'Microsoft Entra ID, Microsoft Entra roles, Microsoft Entra Connect. The exam uses Entra naming.',
    matters: 'Map old names to new ones when reading older material; the concepts are unchanged.',
    sourceId: 'roles-compare',
  },
  {
    area: 'identity-governance',
    topic: 'Classic subscription administrators',
    previously: 'Account Administrator, Service Administrator and Co-Administrator controlled subscription access.',
    now: 'Classic administrator roles were retired on August 31, 2024 and are fully retired as of May 2026. Access is managed only with Azure RBAC role assignments.',
    matters: 'If a question mentions Co-Administrator, the modern answer is an Azure RBAC role such as Owner at subscription scope.',
    sourceId: 'roles-compare',
  },
  {
    area: 'networking',
    topic: 'Basic SKU public IPs and Basic Load Balancer',
    previously: 'Basic public IPs (dynamic, open by default) and Basic Load Balancer were common in tutorials.',
    now: 'Both were retired on September 30, 2025. Standard public IPs are static and secure by default; Standard Load Balancer is closed to inbound traffic unless an NSG allows it.',
    matters: 'Expect Standard SKU behavior: static allocation, zone redundancy, and the need for NSG rules to allow inbound traffic.',
    sourceId: 'lb-skus',
  },
  {
    area: 'networking',
    topic: 'Default outbound access',
    previously: 'VMs without an explicit outbound method could reach the internet through an implicit, Microsoft-owned IP.',
    now: 'For API versions released after March 31, 2026, subnets in new virtual networks are private by default. VMs need an explicit outbound method such as a NAT gateway, a Standard Load Balancer outbound rule, or a public IP.',
    matters: 'A VM in a new private subnet that "can\'t reach the internet or activate Windows" needs explicit outbound connectivity, not an NSG change.',
    sourceId: 'default-outbound',
  },
  {
    area: 'monitoring',
    topic: 'Log Analytics agent',
    previously: 'The Log Analytics agent (MMA/OMS) collected guest OS data.',
    now: 'The Log Analytics agent was retired in August 2024. The Azure Monitor Agent collects guest data according to data collection rules (DCRs).',
    matters: 'Configuring VM guest monitoring means installing the Azure Monitor Agent and associating a DCR.',
    sourceId: 'ama-overview',
  },
  {
    area: 'networking',
    topic: 'NSG flow logs',
    previously: 'NSG flow logs were the standard way to log IP traffic.',
    now: 'New NSG flow logs can no longer be created and the feature retires on September 30, 2027. Use virtual network flow logs.',
    matters: 'Choose virtual network flow logs (with traffic analytics) for traffic logging questions.',
    sourceId: 'network-watcher',
  },
  {
    area: 'monitoring',
    topic: 'Connection monitor (classic)',
    previously: 'Connection monitor (classic) and Network Performance Monitor monitored connectivity.',
    now: 'Connection monitor (classic) is no longer available. Connection monitor uses test groups, the Network Watcher agent extension on Azure VMs, and Azure Arc plus the Azure Monitor Agent for on-premises sources.',
    matters: 'Know the test group model: sources, destinations, test configurations, and thresholds for checks failed and round-trip time.',
    sourceId: 'connection-monitor',
  },
  {
    area: 'compute',
    topic: 'ARM template complete mode',
    previously: 'Complete mode was commonly used to remove resources not defined in a template.',
    now: 'Microsoft recommends incremental mode and says complete mode will be gradually deprecated; use deployment stacks to delete resources.',
    matters: 'Incremental is still the default. Understand that complete mode deletes resources in the resource group that are not in the template.',
    sourceId: 'arm-deployment-modes',
  },
  {
    area: 'compute',
    topic: 'Standard HDD OS disks',
    previously: 'Standard HDD was a common low-cost OS disk choice.',
    now: 'Using Standard HDD as an OS disk retires on September 8, 2028. Use Standard SSD or Premium SSD for OS disks.',
    matters: 'Prefer SSD-based disks for OS disks in new designs.',
    sourceId: 'disk-types',
  },
  {
    area: 'storage',
    topic: 'Legacy storage account types',
    previously: 'General-purpose v1 and legacy Blob Storage accounts appeared in older labs.',
    now: 'Microsoft lists both as retired or scheduled for retirement. Standard general-purpose v2 is the recommended account type for most scenarios.',
    matters: 'Default to general-purpose v2 unless a premium (block blob, file share, page blob) account is specifically required.',
    sourceId: 'storage-account-overview',
  },
  {
    area: 'compute',
    topic: 'App Service linked database backups',
    previously: 'Custom App Service backups could include linked databases.',
    now: 'Starting March 31, 2028, custom backups will no longer back up linked databases. Microsoft recommends native database backup tools.',
    matters: 'Automatic and custom backups still protect app content and configuration; plan database backups separately.',
    sourceId: 'appservice-backup',
  },
  {
    area: 'monitoring',
    topic: 'Backup management experience',
    previously: 'Backup center, and later Azure Business Continuity Center, centralized backup monitoring.',
    now: 'Current Microsoft Learn documentation refers to this centralized experience as Resiliency.',
    matters: 'Portal names change; the concepts (protected items, jobs, alerts, reports via Log Analytics) are what the exam tests.',
    sourceId: 'backup-monitoring',
  },
];
