import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'governance-strategy',
  moduleId: 'governance',
  verified: '2026-09-14',
  sources: ['management-groups', 'policy-overview', 'rbac-overview', 'tags', 'locks', 'budgets'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Putting the guardrails together',
      blocks: [
        {
          type: 'lead',
          text: 'Each governance tool solves one problem. A strategy combines them so an organization can move fast without losing control: **structure** with management groups, **access** with RBAC, **standards** with Policy, **description** with tags, **protection** with locks and **spend visibility** with budgets.',
        },
        {
          type: 'adminLens',
          answers: [
            { q: 'goal', a: 'Let teams deploy on their own while guaranteeing security, compliance and cost visibility.' },
            { q: 'access', a: 'Groups receive roles at the narrowest scope; only the platform team holds Owner at subscription level.' },
            { q: 'governance', a: 'Initiatives at management groups; audit first, then deny. Tags required and inherited by policy.' },
            { q: 'failure', a: 'CanNotDelete locks on shared networking and vaults so a single mistake can’t take down every workload.' },
            { q: 'cost', a: 'Budgets per subscription and per workload resource group, with forecasted alerts to owners.' },
            { q: 'monitoring', a: 'deployIfNotExists policies create diagnostic settings so every resource sends logs centrally.' },
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'Which tool at which level',
      blocks: [
        {
          type: 'table',
          columns: ['Level', 'Structure', 'Access (RBAC)', 'Standards (Policy)', 'Protection & cost'],
          rows: [
            ['Top management group', 'Company root below Tenant root group', 'Security Reader / auditors: Reader', 'Allowed locations, required tags initiative', 'Budget for overall spend'],
            ['Branch management groups', 'Platform, Landing zones, Sandbox', 'Platform team: Owner on Platform', 'Corp: deny public IPs; Sandbox: audit only', '—'],
            ['Subscription', 'One per workload or environment', 'Workload owners: Owner or Contributor', 'Workload-specific parameters', 'Budget with forecasted alerts'],
            ['Resource group', 'One per lifecycle', 'App team: Contributor', 'Rarely assigned here', 'CanNotDelete on shared infrastructure'],
            ['Resource', '—', 'Narrow exceptions (for example a VM operator)', 'Exemptions with expiry', 'Locks on critical single resources'],
          ],
        },
      ],
    },
    {
      id: 'scenario',
      kind: 'scenario',
      blocks: [
        {
          type: 'scenario',
          company: 'Proseware Inc.',
          context: 'Proseware has 35 subscriptions created ad hoc over five years. A security review found public storage, untagged spend worth 30% of the bill, and 60 people with Owner.',
          problem: 'Leadership wants a governance model in one quarter without blocking the teams that ship features.',
          approach: [
            'Create a shallow management group hierarchy (Proseware → Platform, Corp, Online, Sandbox) and move subscriptions into it.',
            'Assign a baseline initiative (allowed regions, required tags, no public blob access) at Proseware in audit mode; publish compliance weekly; switch to deny after 30 days.',
            'Replace individual Owner assignments with groups: Owner only for the platform team; Contributor for app teams on their resource groups.',
            'Add a modify policy to inherit CostCenter from resource groups and run remediation.',
            'Put CanNotDelete locks on hub networking, Key Vaults and Recovery Services vaults.',
            'Create budgets with forecasted alerts for every subscription, sent to the owners.',
          ],
          outcome: 'Owner assignments drop from 60 to 6, tagged spend reaches 98%, and new subscriptions inherit guardrails on day one.',
        },
      ],
    },
    {
      id: 'decide',
      kind: 'decide',
      title: 'Pick the right guardrail',
      blocks: [
        {
          type: 'decision',
          tree: {
            id: 'guardrail',
            title: 'What are you trying to prevent or ensure?',
            start: 'q1',
            nodes: {
              q1: {
                kind: 'question',
                text: 'Choose the requirement',
                options: [
                  { label: 'Only certain people may change resources', next: 'r-rbac' },
                  { label: 'Nobody may create resources outside approved regions', next: 'r-policy' },
                  { label: 'Nobody may delete the production VNet, even by mistake', next: 'r-lock' },
                  { label: 'Every resource must show its cost center in billing', next: 'r-tags' },
                  { label: 'Teams must be warned before overspending', next: 'r-budget' },
                ],
              },
              'r-rbac': { kind: 'result', title: 'Azure RBAC', text: 'Assign roles to groups at the narrowest scope.', concepts: ['azure-rbac'] },
              'r-policy': { kind: 'result', title: 'Azure Policy with deny', text: 'Assign Allowed locations at the management group.', concepts: ['azure-policy'] },
              'r-lock': { kind: 'result', title: 'CanNotDelete lock', text: 'Locks block deletion for everyone, including Owners.', concepts: ['resource-lock'] },
              'r-tags': { kind: 'result', title: 'Tags enforced by policy', text: 'Require tags and inherit them to resources with a modify policy.', concepts: ['tags', 'azure-policy'] },
              'r-budget': { kind: 'result', title: 'Budget with forecasted alerts', text: 'Alerts notify owners; add an action group for automation.', concepts: ['budget'] },
            },
          },
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Scenario questions often list several guardrails as options. Match the verb in the requirement: “who can” → RBAC, “must be/must not be configured” → Policy, “must not be deleted” → lock, “identify cost by” → tags, “notify when spending” → budget.' },
        { type: 'quickcheck', questionIds: ['gov-guardrail-match'] },
      ],
    },
  ],
  takeaways: [
    'Structure with management groups, access with RBAC, standards with Policy, metadata with tags, protection with locks, visibility with budgets.',
    'Assign policy and RBAC as high as the requirement allows; exceptions go lower.',
    'Start policies in audit mode, then enforce.',
    'Match the requirement’s verb to the guardrail.',
  ],
};

export default lesson;
