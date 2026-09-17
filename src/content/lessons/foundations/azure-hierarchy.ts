import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'azure-hierarchy',
  moduleId: 'foundations',
  verified: '2026-09-14',
  sources: ['management-groups', 'arm-overview', 'subscription-tenant', 'tags', 'locks', 'policy-overview', 'budgets'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Five levels, one idea: settings flow downward',
      blocks: [
        {
          type: 'lead',
          text: 'Everything you build in Azure sits inside a hierarchy: a **tenant** holds identities, **management groups** organize **subscriptions**, subscriptions contain **resource groups**, and resource groups contain **resources**.',
        },
        {
          type: 'explainer',
          technical: [
            'The [[entra-tenant|Microsoft Entra tenant]] is the identity boundary. Every [[subscription]] trusts exactly one tenant, and all management groups in a hierarchy belong to that tenant.',
            'Azure provides four levels of management scope — [[management-group|management groups]], subscriptions, [[resource-group|resource groups]] and [[azure-resource|resources]]. Access (Azure RBAC) and Azure Policy assigned at a level are inherited by everything below it.',
            'Not everything inherits. **Tags are not inherited**, **locks cannot be placed on management groups**, and a budget only sends notifications for the costs in its scope.',
          ],
          simple: [
            'Imagine a large company. HR keeps the list of every employee — that’s the **tenant**. The company is split into divisions — **management groups**. Each division has its own budget account — a **subscription**. Inside, teams keep related equipment in labeled cabinets — **resource groups**. The equipment itself is the **resources**.',
            'Rules set for a division automatically apply to every team and cabinet in it. That is why administrators set rules as high up as makes sense: set it once, and it applies everywhere below.',
          ],
        },
      ],
    },
    {
      id: 'why',
      kind: 'why',
      blocks: [
        {
          type: 'p',
          text: 'Without a hierarchy, an organization with 30 subscriptions would assign the same auditor role 30 times, repeat every security policy 30 times, and miss the 31st subscription when it appears. The hierarchy turns *repeat for every subscription* into *apply once, inherit everywhere*.',
        },
        {
          type: 'table',
          caption: 'What each level is for',
          columns: ['Level', 'Primary purpose', 'Typical things applied here'],
          rows: [
            ['Microsoft Entra tenant', 'Identity boundary: users, groups, apps', 'Microsoft Entra roles, self-service password reset, external collaboration settings'],
            ['Management group', 'Organize subscriptions by governance need', 'Azure Policy and role assignments that must reach many subscriptions'],
            ['Subscription', 'Billing, quota and access boundary', 'Budgets, role assignments, policy, resource provider registration'],
            ['Resource group', 'Lifecycle container for related resources', 'Role assignments for a team, locks, tags, budgets for a workload'],
            ['Resource', 'The thing you actually run or store', 'Resource-specific access, locks, tags, diagnostic settings'],
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'See how governance flows through the hierarchy',
      blocks: [
        {
          type: 'diagram',
          id: 'resource-hierarchy',
          alt: 'A hierarchy from the Microsoft Entra tenant to the Tenant root group, then Contoso, Production and Non-production management groups, subscriptions, resource groups and resources. Choosing a governance feature shows where it can be applied and whether it is inherited.',
          caption: 'Choose a feature, then select the level where you apply it. Inherited scopes light up; tags visibly do **not** flow down.',
        },
      ],
    },
    {
      id: 'analogy',
      kind: 'explain',
      title: 'An analogy you can reuse',
      blocks: [
        {
          type: 'analogy',
          title: 'A corporate campus',
          story: 'A company campus has a security office that issues ID badges, several buildings, floors with their own electricity meters, rooms holding a project’s equipment, and the equipment itself. A rule posted at a building entrance (“no food in labs”) applies to every floor and room in that building.',
          mapping: [
            { analogy: 'Security office and badge registry', azure: '[[entra-tenant|Microsoft Entra tenant]]' },
            { analogy: 'Buildings grouped by division', azure: '[[management-group|Management groups]]' },
            { analogy: 'A floor with its own electricity meter', azure: '[[subscription|Subscription]] (billing boundary)' },
            { analogy: 'A room for one project’s equipment', azure: '[[resource-group|Resource group]]' },
            { analogy: 'Each piece of equipment', azure: '[[azure-resource|Resource]]' },
            { analogy: 'A rule posted at the building entrance', azure: 'Policy or role assignment inherited by all child scopes' },
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          text: 'Analogies break down somewhere. Here: a resource can talk to resources in other “rooms” (a web app can use a database in another resource group), and a resource group’s region does not limit where its resources run.',
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'How each level works',
      blocks: [
        {
          type: 'steps',
          steps: [
            {
              title: 'Tenant: the identity boundary',
              detail: 'A subscription trusts only one tenant; a tenant can be trusted by many subscriptions. If a subscription is associated with a different tenant, its Azure role assignments are lost and must be recreated.',
            },
            {
              title: 'Root management group',
              detail: 'Each tenant has one hierarchy with a root management group called **Tenant root group**, whose ID is the tenant ID. It cannot be moved or deleted. New subscriptions land under the root by default. No one has access to it by default — a Global Administrator can elevate access to grant it.',
            },
            {
              title: 'Management groups',
              detail: 'Up to 10,000 management groups per directory, nested up to **six levels** deep (not counting the root level or the subscription level). Each management group and subscription has exactly **one parent**.',
            },
            {
              title: 'Subscriptions',
              detail: 'The unit of billing and a common access boundary. Subscriptions also carry quotas and resource provider registrations. All subscriptions in a management group trust the same tenant.',
            },
            {
              title: 'Resource groups',
              detail: 'Group resources that share a lifecycle — deployed, updated and deleted together. Each resource belongs to exactly one resource group. Deleting a resource group deletes everything in it. The resource group’s location stores its metadata; its resources can be in other regions.',
            },
            {
              title: 'Resources',
              detail: 'Individual services such as VMs and storage accounts. Each has a unique [[resource-id|resource ID]] that includes its subscription and resource group.',
            },
          ],
        },
        {
          type: 'table',
          caption: 'Where governance features apply — and whether they inherit',
          columns: ['Feature', 'Can be applied at', 'Inherited by child scopes?'],
          rows: [
            ['Azure RBAC role assignment', 'Management group, subscription, resource group, resource', 'Yes'],
            ['Azure Policy assignment', 'Management group, subscription, resource group, resource', 'Yes (a child cannot override a parent deny)'],
            ['Resource lock', 'Subscription, resource group, resource — **not** management groups', 'Yes; the most restrictive lock wins'],
            ['Tags', 'Subscription, resource group, resource — **not** management groups', '**No** — use Azure Policy to inherit or require tags'],
            ['Budget', 'Management group, subscription, resource group (and billing scopes)', 'Tracks costs of everything in scope; never stops resources'],
          ],
        },
      ],
    },
    {
      id: 'example',
      kind: 'example',
      title: 'Explore a real hierarchy from the command line',
      blocks: [
        {
          type: 'p',
          text: 'You can inspect each level with the Azure CLI or Azure PowerShell. These commands only read information, so they are safe to run in any environment you have Reader access to.',
        },
        {
          type: 'code',
          title: 'Walk the hierarchy',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# Management groups you can see
az account management-group list --output table

# Subscriptions available to your account
az account list --output table

# Resource groups in the current subscription
az group list --output table

# Resources inside one resource group
az resource list --resource-group rg-web-prod --output table`,
              notes: [
                { token: 'az account management-group list', note: 'Lists management groups visible to you. Visibility depends on your role assignments.' },
                { token: '--output table', note: 'Formats results as a readable table instead of JSON.' },
                { token: '--resource-group', note: 'Limits results to one resource group.' },
              ],
            },
            {
              lang: 'powershell',
              label: 'PowerShell',
              code: `# Management groups you can see
Get-AzManagementGroup

# Subscriptions available to your account
Get-AzSubscription

# Resource groups in the current subscription
Get-AzResourceGroup | Select-Object ResourceGroupName, Location

# Resources inside one resource group
Get-AzResource -ResourceGroupName rg-web-prod | Select-Object Name, ResourceType, Location`,
              notes: [{ token: 'Get-AzResource -ResourceGroupName', note: 'Returns resource objects you can filter or pipe to other cmdlets.' }],
            },
          ],
        },
        {
          type: 'flow',
          title: 'Contoso’s hierarchy',
          alt: 'Tenant root group contains the Contoso management group, which contains Production and Non-production management groups. Production contains two subscriptions; Non-production contains a Dev/Test subscription.',
          spec: {
            root: {
              type: 'group',
              id: 'root',
              label: 'Contoso hierarchy',
              kind: 'hierarchy',
              direction: 'col',
              children: [
                { type: 'node', id: 'trg', label: 'Tenant root group', sub: 'ID = tenant ID', icon: 'management-group', concept: 'management-group', detail: 'Created automatically for the tenant. Cannot be moved or deleted.' },
                { type: 'node', id: 'contoso', label: 'Contoso', sub: 'Management group', icon: 'management-group', detail: 'Company-wide policies, such as allowed regions, are assigned here once.' },
                {
                  type: 'group',
                  id: 'row-mg',
                  label: 'Branches',
                  kind: 'plain',
                  children: [
                    { type: 'node', id: 'prod', label: 'Production', sub: 'Management group', icon: 'management-group', detail: 'Stricter policies: deny public IPs on VMs, require diagnostic settings.' },
                    { type: 'node', id: 'nonprod', label: 'Non-production', sub: 'Management group', icon: 'management-group', detail: 'Looser policies and budgets for experimentation.' },
                  ],
                },
                {
                  type: 'group',
                  id: 'row-subs',
                  label: 'Subscriptions',
                  kind: 'plain',
                  children: [
                    { type: 'node', id: 'sub-apps', label: 'Prod-Apps', sub: 'Subscription', icon: 'subscription', concept: 'subscription' },
                    { type: 'node', id: 'sub-data', label: 'Prod-Data', sub: 'Subscription', icon: 'subscription', concept: 'subscription' },
                    { type: 'node', id: 'sub-dev', label: 'DevTest', sub: 'Subscription', icon: 'subscription', concept: 'subscription' },
                  ],
                },
              ],
            },
            edges: [
              { from: 'trg', to: 'contoso' },
              { from: 'contoso', to: 'prod' },
              { from: 'contoso', to: 'nonprod' },
              { from: 'prod', to: 'sub-apps' },
              { from: 'prod', to: 'sub-data' },
              { from: 'nonprod', to: 'sub-dev' },
            ],
            flows: [
              {
                id: 'policy',
                label: 'Allowed locations policy',
                path: ['contoso', 'prod', 'sub-apps'],
                tone: 'allow',
                description: 'Assigned once at **Contoso**, the policy is inherited by both branches and every subscription below them.',
              },
            ],
          },
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
            {
              mistake: 'Tagging a resource group and expecting its resources to inherit the tag for cost reports.',
              fix: 'Tags are not inherited. Use an Azure Policy such as *Inherit a tag from the resource group* (modify effect) or tag resources directly.',
            },
            {
              mistake: 'Assigning the same policy separately to every subscription.',
              fix: 'Assign it once at a management group so current and future subscriptions under it inherit it.',
            },
            {
              mistake: 'Putting resources with different lifecycles (a shared VNet and a short-lived test app) in the same resource group.',
              fix: 'Group by lifecycle: resources you deploy, update and delete together belong together.',
            },
            {
              mistake: 'Trying to add a delete lock at a management group to protect everything below it.',
              fix: 'Locks can be applied only at subscription, resource group or resource scope. Use them at subscription or resource group level.',
            },
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
          company: 'Fabrikam Retail',
          context: 'Fabrikam has grown from 3 to 24 subscriptions after acquiring two companies. Every subscription currently sits directly under the Tenant root group.',
          problem: 'The security team must enforce “resources may only be created in EU regions” on all production subscriptions, and auditors need read access to everything — including subscriptions created next year.',
          approach: [
            'Create a **Fabrikam** management group under the root, with **Production** and **Non-production** children.',
            'Move each subscription under the right branch (requires management group write permissions on the source and target parents, and Owner-level rights on the subscription).',
            'Assign the built-in *Allowed locations* policy (deny effect) at **Production** — every production subscription inherits it.',
            'Assign the **Reader** role to the auditors’ group at **Fabrikam** so existing and future subscriptions inherit it.',
            'Configure new subscriptions to land in the right branch, and remember the hierarchy can take up to 30 minutes to reflect changes.',
          ],
          outcome: 'Two assignments replace 48 manual ones, and new subscriptions are governed the moment they join the branch.',
        },
      ],
    },
    {
      id: 'challenge',
      kind: 'challenge',
      title: 'Build the hierarchy yourself',
      blocks: [
        {
          type: 'interactive',
          id: 'hierarchy-builder',
          intro: 'Put the levels in order from broadest to narrowest, then decide which level you would use for real administrative tasks.',
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
          variant: 'trap',
          text: 'Questions often offer “apply the tag to the resource group” as a way to tag every resource. It does not work — tags are not inherited. The correct answer involves Azure Policy or tagging each resource.',
        },
        {
          type: 'callout',
          variant: 'exam',
          text: 'Know the numbers that appear in scenarios: management groups nest up to **six levels** below the root, each child has **one parent**, and locks and tags **cannot** be applied to management groups.',
        },
        { type: 'quickcheck', questionIds: ['gov-mg-scope-policy', 'gov-tags-inheritance'] },
      ],
    },
  ],
  takeaways: [
    'The hierarchy is tenant → management groups → subscriptions → resource groups → resources.',
    'Azure RBAC and Azure Policy assigned at a scope are inherited by all child scopes.',
    'Tags are **not** inherited, and neither tags nor locks can be applied to management groups.',
    'Management groups nest up to six levels below the root; every subscription and management group has exactly one parent.',
    'Group resources by lifecycle: deleting a resource group deletes everything inside it.',
  ],
  interview: [
    {
      q: 'How would you structure management groups for a company with production and development environments across several business units?',
      a: 'Start from governance needs rather than the org chart: a top-level company management group for tenant-wide policy, then branches such as Production and Non-production (or platform versus landing zones) so different policy sets and access apply. Keep the tree shallow, assign policy and RBAC as high as the requirement allows, and use subscriptions to separate billing and blast radius.',
    },
    {
      q: 'A developer says their resources are missing the CostCenter tag even though the resource group has it. What is going on and how do you fix it?',
      a: 'Resources do not inherit tags from their resource group or subscription. I would assign a policy that inherits the tag from the resource group (modify effect) and run a remediation task for existing resources, or require the tag at creation with a deny policy.',
    },
  ],
};

export default lesson;
