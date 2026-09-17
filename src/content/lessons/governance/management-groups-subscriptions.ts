import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'management-groups-subscriptions',
  moduleId: 'governance',
  verified: '2026-09-14',
  sources: ['management-groups', 'subscription-tenant', 'roles-compare', 'policy-overview'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Governance at the scale of many subscriptions',
      blocks: [
        {
          type: 'lead',
          text: 'Most organizations don’t stay at one subscription. **Management groups** sit above subscriptions so policy and access can be set once for a whole branch of the organization.',
        },
        {
          type: 'explainer',
          technical: [
            'Each directory has one hierarchy rooted at the **Tenant root group** (ID = tenant ID). [[management-group|Management groups]] nest up to six levels below the root, and every management group and [[subscription]] has exactly one parent.',
            'Azure Policy assignments and Azure role assignments at a management group are inherited by all child management groups, subscriptions, resource groups and resources.',
            'A subscription is the billing boundary and a common access and quota boundary; it trusts exactly one Microsoft Entra tenant.',
          ],
          simple: [
            'Subscriptions are like separate bank accounts for different parts of the company. Management groups are the folders you file those accounts into — “Production”, “Development”, “Sandbox”.',
            'Put a rule on a folder and every account inside follows it, including accounts added later.',
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'A practical hierarchy',
      blocks: [
        {
          type: 'flow',
          title: 'Management groups organized by governance need',
          alt: 'Tenant root group contains Contoso; Contoso contains Platform, Landing zones and Sandbox; Landing zones contains Corp and Online, each containing subscriptions.',
          caption: 'Organize by the governance each branch needs (for example “internet-facing” vs “internal”) rather than copying the org chart.',
          spec: {
            root: {
              type: 'group',
              id: 'h',
              label: 'Hierarchy',
              kind: 'hierarchy',
              children: [
                { type: 'node', id: 'root', label: 'Tenant root group', sub: 'Can’t be moved or deleted', icon: 'management-group', concept: 'management-group' },
                { type: 'node', id: 'contoso', label: 'Contoso', sub: 'Allowed locations policy', icon: 'management-group', detail: 'Tenant-wide policy and auditor Reader access are assigned here once.' },
                {
                  type: 'group',
                  id: 'l2',
                  label: 'Level 2',
                  kind: 'plain',
                  children: [
                    { type: 'node', id: 'platform', label: 'Platform', sub: 'Connectivity, identity, management', icon: 'management-group' },
                    { type: 'node', id: 'lz', label: 'Landing zones', sub: 'Workload guardrails', icon: 'management-group' },
                    { type: 'node', id: 'sandbox', label: 'Sandbox', sub: 'Budgets, relaxed policy', icon: 'management-group' },
                  ],
                },
                {
                  type: 'group',
                  id: 'l3',
                  label: 'Level 3',
                  kind: 'plain',
                  children: [
                    { type: 'node', id: 'corp', label: 'Corp', sub: 'Deny public IPs', icon: 'management-group' },
                    { type: 'node', id: 'online', label: 'Online', sub: 'Internet-facing allowed', icon: 'management-group' },
                  ],
                },
                {
                  type: 'group',
                  id: 'subs',
                  label: 'Subscriptions',
                  kind: 'plain',
                  children: [
                    { type: 'node', id: 's1', label: 'HR-Prod', icon: 'subscription', concept: 'subscription' },
                    { type: 'node', id: 's2', label: 'Shop-Prod', icon: 'subscription' },
                  ],
                },
              ],
            },
            edges: [
              { from: 'root', to: 'contoso' },
              { from: 'contoso', to: 'platform' },
              { from: 'contoso', to: 'lz' },
              { from: 'contoso', to: 'sandbox' },
              { from: 'lz', to: 'corp' },
              { from: 'lz', to: 'online' },
              { from: 'corp', to: 's1' },
              { from: 'online', to: 's2' },
            ],
            flows: [{ id: 'deny-pip', label: 'Deny public IP policy', path: ['corp', 's1'], tone: 'deny', description: 'HR-Prod inherits the Corp policy that denies public IP addresses, while Shop-Prod under Online can still expose internet-facing endpoints.' }],
          },
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Rules of the hierarchy',
      blocks: [
        {
          type: 'table',
          caption: 'Management group facts to know',
          columns: ['Fact', 'Detail'],
          rows: [
            ['Maximum count', '10,000 management groups per directory'],
            ['Depth', 'Up to six levels, not counting the root level or the subscription level'],
            ['Parents', 'Each management group and subscription has exactly one parent'],
            ['Root', '“Tenant root group”, ID equals the tenant ID; can’t be moved or deleted'],
            ['New subscriptions', 'Placed under the root management group by default (a different default can be configured)'],
            ['Default access', 'No one has access to the root by default; a Global Administrator can elevate access'],
            ['Not supported', 'Resource locks and tags can’t be applied to management groups'],
            ['Propagation', 'Hierarchy changes can take up to 30 minutes to be reflected'],
          ],
        },
        {
          type: 'table',
          caption: 'Who can do what with management groups',
          columns: ['Role', 'Create, rename, move, delete', 'Assign access', 'Assign policy'],
          rows: [
            ['Owner', 'Yes', 'Yes', 'Yes'],
            ['Contributor', 'Yes', 'No', 'No'],
            ['Management Group Contributor', 'Yes', 'No', 'No'],
            ['Reader / Management Group Reader', 'Read only', 'No', 'No'],
            ['Resource Policy Contributor', 'No', 'No', 'Yes'],
            ['User Access Administrator', 'No', 'Yes', 'Yes'],
          ],
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      title: 'Create a management group and move a subscription',
      blocks: [
        {
          type: 'code',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# Create a management group under Contoso
az account management-group create --name mg-corp --display-name "Corp" --parent mg-contoso

# Move a subscription into it
az account management-group subscription add --name mg-corp --subscription <subscription-id>`,
              notes: [
                { token: '--name', note: 'The management group ID (used in resource IDs). It can’t be changed later; the display name can.' },
                { token: '--parent', note: 'The parent management group ID. Omit it to create the group under the root.' },
              ],
            },
            {
              lang: 'powershell',
              label: 'PowerShell',
              code: `New-AzManagementGroup -GroupId mg-corp -DisplayName "Corp" -ParentId "/providers/Microsoft.Management/managementGroups/mg-contoso"

New-AzManagementGroupSubscription -GroupId mg-corp -SubscriptionId <subscription-id>`,
            },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Moving subscriptions needs permissions on three places',
          text: 'You need management group write access on the **current parent** and the **target parent**, plus Owner-level rights (role assignment write) on the subscription being moved. If your Owner role on the subscription is inherited from the current management group, you can only move it to a management group where you are also Owner.',
        },
      ],
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      blocks: [
        {
          type: 'mistakes',
          items: [
            { mistake: 'Building a seven-level tree that mirrors every department.', fix: 'Keep the hierarchy shallow and organized by governance needs; use tags for reporting detail.' },
            { mistake: 'Leaving new subscriptions under the root with no guardrails.', fix: 'Configure a default management group for new subscriptions that carries baseline policy.' },
            { mistake: 'Planning to tag or lock a management group.', fix: 'Apply tags and locks at subscription, resource group or resource level.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        {
          type: 'callout',
          variant: 'exam',
          text: 'Numbers and limits appear often: six levels deep, one parent, 10,000 per directory. So do permissions: Contributor can create management groups but can’t assign policy or access on them.',
        },
        { type: 'quickcheck', questionIds: ['gov-mg-depth', 'gov-mg-move-permissions'] },
      ],
    },
  ],
  takeaways: [
    'Management groups organize subscriptions so policy and RBAC apply once to a whole branch.',
    'Up to six levels below the root; every management group and subscription has one parent.',
    'The Tenant root group can’t be moved or deleted and nobody has default access to it.',
    'Tags and locks can’t be applied to management groups.',
    'Subscriptions are billing and access boundaries that trust one Microsoft Entra tenant.',
  ],
};

export default lesson;
