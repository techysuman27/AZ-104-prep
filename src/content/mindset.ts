import type { AdminQuestionId, IconKey } from './schema';

/** "Think like an Azure administrator" — the ten questions asked of every design. */
export const ADMIN_QUESTIONS: Record<
  AdminQuestionId,
  { label: string; question: string; icon: IconKey; prompt: string; examples: string[] }
> = {
  goal: {
    label: 'Goal',
    question: 'What is the goal?',
    icon: 'globe',
    prompt: 'State the business outcome in one sentence before touching a service. Requirements drive every later answer.',
    examples: ['Host an internal HR portal for 400 employees', 'Keep 7 years of invoices at the lowest cost'],
  },
  service: {
    label: 'Service',
    question: 'Which Azure service fits?',
    icon: 'app-service',
    prompt: 'Choose the least-management service that meets the requirement. Only drop to IaaS when you need OS-level control.',
    examples: ['App Service for a standard web app', 'VM for software that needs a specific OS configuration'],
  },
  security: {
    label: 'Security',
    question: 'What are the security requirements?',
    icon: 'shield',
    prompt: 'Identify what must be protected, from whom, and how: identity-based access, private networking, encryption and secrets.',
    examples: ['Use managed identities instead of connection strings', 'Disable public network access on storage'],
  },
  network: {
    label: 'Networking',
    question: 'What networking is required?',
    icon: 'vnet',
    prompt: 'Trace every connection: who connects, from where, to what, over which path, and how names resolve.',
    examples: ['Private endpoint + private DNS zone for SQL', 'NSG allowing 443 only from the application gateway subnet'],
  },
  access: {
    label: 'Access',
    question: 'Who needs access?',
    icon: 'role',
    prompt: 'Grant the smallest role at the narrowest scope, to groups rather than individuals.',
    examples: ['Reader for auditors at subscription scope', 'Contributor for the app team on one resource group'],
  },
  governance: {
    label: 'Governance',
    question: 'What governance rules apply?',
    icon: 'policy',
    prompt: 'Decide which standards must be enforced automatically (Policy), described (tags) or protected (locks).',
    examples: ['Deny resources outside approved regions', 'CanNotDelete lock on production networking'],
  },
  monitoring: {
    label: 'Monitoring',
    question: 'How will it be monitored?',
    icon: 'monitor',
    prompt: 'Decide which signals prove the workload is healthy, where they are stored, and who is alerted.',
    examples: ['Diagnostic settings to a Log Analytics workspace', 'Metric alert on CPU with an action group'],
  },
  backup: {
    label: 'Backup',
    question: 'How will it be backed up?',
    icon: 'backup',
    prompt: 'Match backup frequency and retention to how much data the business can lose and how far back it must restore.',
    examples: ['Enhanced VM backup policy every 4 hours', 'Blob soft delete and versioning for documents'],
  },
  failure: {
    label: 'Failure',
    question: 'What happens if it fails?',
    icon: 'recovery',
    prompt: 'Walk through failures at each level — instance, zone, region, human error — and name the design that survives each.',
    examples: ['Zone-redundant storage survives a zone outage', 'Site Recovery replicates VMs to another region'],
  },
  cost: {
    label: 'Cost',
    question: 'How can cost be controlled?',
    icon: 'cost',
    prompt: 'Right-size, scale automatically, choose appropriate tiers, and make spend visible with budgets and tags.',
    examples: ['Autoscale App Service between 2 and 6 instances', 'Lifecycle rule moves old blobs to cool or cold tier'],
  },
};

export const ADMIN_QUESTION_ORDER: AdminQuestionId[] = [
  'goal',
  'service',
  'security',
  'network',
  'access',
  'governance',
  'monitoring',
  'backup',
  'failure',
  'cost',
];
