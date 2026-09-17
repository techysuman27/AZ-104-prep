import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'rbac-fundamentals',
  moduleId: 'identity',
  verified: '2026-09-14',
  sources: ['rbac-overview', 'roles-compare'],
  changes: [
    {
      topic: 'Classic subscription administrators',
      previously: 'Account Administrator, Service Administrator and Co-Administrator roles managed subscription access.',
      now: 'Classic administrator roles are retired. Subscription access is granted only with Azure RBAC role assignments.',
      matters: 'Answer access questions with Azure roles such as Owner, Contributor or Reader at the right scope.',
    },
  ],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Who, what, where',
      blocks: [
        {
          type: 'lead',
          text: 'Every Azure permission is the answer to three questions: **who** (a security principal), **what** (a role definition) and **where** (a scope). Put the three together and you have a **role assignment**.',
        },
        {
          type: 'explainer',
          technical: [
            '[[azure-rbac|Azure RBAC]] authorizes control plane and data plane actions on Azure resources. A [[role-assignment|role assignment]] binds a security principal (user, group, service principal or managed identity) to a [[role-definition|role definition]] at a [[rbac-scope|scope]].',
            'Scopes are hierarchical — management group, subscription, resource group, resource — and assignments are **inherited** by child scopes.',
            'RBAC is **additive**: a principal’s effective permissions are the union of all their assignments, including those received through group membership.',
          ],
          simple: [
            'Think of an office building. **Who** is the employee. **What** is their access card type — visitor, staff or facilities manager. **Where** is which floor or room the card works on.',
            'Give someone a “staff” card for the whole building and it works on every floor. Give them a card for one room and it works only there.',
            'If someone holds two cards, they can use whichever opens more doors — permissions add up.',
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'Anatomy of a role assignment',
      blocks: [
        {
          type: 'flow',
          title: 'Principal + role + scope',
          alt: 'The App Team security group is assigned the Contributor role at scope rg-shop-prod, which is inherited by the web app, SQL database and storage account inside the resource group.',
          spec: {
            root: {
              type: 'group',
              id: 'root',
              label: 'Role assignment',
              kind: 'plain',
              children: [
                {
                  type: 'group',
                  id: 'who',
                  label: 'Who',
                  sub: 'Security principal',
                  kind: 'boundary',
                  direction: 'col',
                  children: [{ type: 'node', id: 'group', label: 'App Team – Prod', sub: 'Security group', icon: 'users', concept: 'entra-group', detail: 'Assign roles to groups. Nested group members also receive the role.' }],
                },
                {
                  type: 'group',
                  id: 'what',
                  label: 'What',
                  sub: 'Role definition',
                  kind: 'boundary',
                  direction: 'col',
                  children: [{ type: 'node', id: 'role', label: 'Contributor', sub: 'Actions: *  NotActions: authorization writes', icon: 'role', concept: 'role-definition', detail: 'Contributor can manage all resources but cannot assign roles or manage Azure Policy assignments.' }],
                },
                {
                  type: 'group',
                  id: 'where',
                  label: 'Where',
                  sub: 'Scope',
                  kind: 'rg',
                  direction: 'col',
                  concept: 'rbac-scope',
                  children: [
                    { type: 'node', id: 'rg', label: 'rg-shop-prod', sub: 'Resource group scope', icon: 'resource-group', concept: 'resource-group' },
                    { type: 'node', id: 'app', label: 'app-shop', sub: 'Inherits', icon: 'app-service' },
                    { type: 'node', id: 'sql', label: 'sql-shop', sub: 'Inherits', icon: 'database' },
                  ],
                },
              ],
            },
            edges: [
              { from: 'group', to: 'role', label: 'is assigned' },
              { from: 'role', to: 'rg', label: 'at scope' },
              { from: 'rg', to: 'app', tone: 'allow', style: 'dashed' },
              { from: 'rg', to: 'sql', tone: 'allow', style: 'dashed' },
            ],
            flows: [{ id: 'inherit', label: 'Inheritance', path: ['group', 'role', 'rg', 'app'], tone: 'allow', description: 'Members of **App Team – Prod** can manage every resource in **rg-shop-prod**, including resources created later — but nothing outside it.' }],
          },
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'The fundamental built-in roles',
      blocks: [
        {
          type: 'table',
          caption: 'Five roles every administrator must know',
          columns: ['Role', 'Manage resources', 'Grant access to others', 'Typical use'],
          rows: [
            ['Owner', 'Yes', 'Yes', 'Subscription or workload owners'],
            ['Contributor', 'Yes', '**No**', 'Engineers who build and operate resources'],
            ['Reader', 'View only', 'No', 'Auditors, support staff, dashboards'],
            ['User Access Administrator', 'No', 'Yes', 'Delegated access management'],
            ['Role Based Access Control Administrator', 'No', 'Yes (role assignments only)', 'Access management without other capabilities such as Azure Policy'],
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          text: 'Hundreds of service-specific roles narrow the scope further, such as **Virtual Machine Contributor**, **Network Contributor** or **Storage Blob Data Reader** (a data plane role).',
        },
        {
          type: 'compare',
          title: 'Azure roles vs Microsoft Entra roles',
          items: [
            { name: 'Azure roles (Azure RBAC)', bestFor: 'Access to Azure resources', points: ['Owner, Contributor, Reader, service roles', 'Scopes: management group, subscription, resource group, resource', 'Managed in **Access control (IAM)**'] },
            { name: 'Microsoft Entra roles', bestFor: 'Administering the directory', points: ['Global Administrator, User Administrator, Guest Inviter', 'Scopes: tenant, administrative unit, object', 'A Global Administrator has no Azure resource access until they elevate access or receive an Azure role'] },
          ],
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      title: 'Assign a role',
      blocks: [
        {
          type: 'portal',
          title: 'Assign Contributor on a resource group',
          path: ['Resource groups', 'rg-shop-prod', 'Access control (IAM)', 'Add role assignment'],
          steps: [
            { label: 'Role', detail: 'Search for and select **Contributor**. The Privileged administrator roles tab lists Owner, Contributor and the access-management roles.' },
            { label: 'Members', fields: [{ name: 'Assign access to', value: 'User, group, or service principal', hint: 'Choose Managed identity for Azure resources.' }, { name: 'Members', value: 'App Team – Prod' }] },
            { label: 'Review + assign', detail: 'The assignment applies to the resource group and everything in it.' },
          ],
        },
        {
          type: 'code',
          title: 'Assign and list roles',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# Assign Contributor to a group at resource group scope
az role assignment create \\
  --assignee-object-id <group-object-id> \\
  --assignee-principal-type Group \\
  --role "Contributor" \\
  --scope "/subscriptions/<subscription-id>/resourceGroups/rg-shop-prod"

# Everything a user can do, including inherited assignments
az role assignment list --assignee ada@contoso.com --all --include-inherited --output table`,
              notes: [
                { token: '--assignee-principal-type Group', note: 'Avoids a directory lookup and prevents errors when the principal was just created.' },
                { token: '--scope', note: 'A resource ID for the management group, subscription, resource group or resource.' },
                { token: '--include-inherited', note: 'Also lists assignments at parent scopes that apply here.' },
              ],
            },
            {
              lang: 'powershell',
              label: 'PowerShell',
              code: `New-AzRoleAssignment -ObjectId <group-object-id> \`
  -RoleDefinitionName "Contributor" \`
  -ResourceGroupName rg-shop-prod

Get-AzRoleAssignment -SignInName ada@contoso.com -ExpandPrincipalGroups`,
              notes: [{ token: '-ExpandPrincipalGroups', note: 'Includes assignments the user receives through group membership.' }],
            },
          ],
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
            { mistake: 'Granting Owner so a developer can deploy resources.', fix: 'Contributor lets them build everything without being able to grant access to others.' },
            { mistake: 'Assigning a role at subscription scope when the team only works in one resource group.', fix: 'Assign at the narrowest scope that meets the need.' },
            { mistake: 'Expecting a Global Administrator to manage VMs immediately.', fix: 'Entra roles don’t grant Azure resource access. Assign an Azure role or elevate access temporarily.' },
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
          company: 'Wide World Importers',
          context: 'The company has a Production subscription with resource groups for networking, shared data and three applications.',
          problem: 'The network team must manage networking only; each app team must manage its own resource group; the security team must see everything; and only the platform team may grant access.',
          approach: [
            'Platform team group → **Owner** at the Production subscription.',
            'Security team group → **Reader** at the subscription.',
            'Network team group → **Network Contributor** on rg-network.',
            'Each app team group → **Contributor** on its own resource group.',
          ],
          outcome: 'Four role assignment patterns cover every team with least privilege, and access changes are group membership changes.',
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
          text: 'Contributor **cannot** assign roles. If a question requires someone to both manage resources and grant access, the answer is Owner — or Contributor plus User Access Administrator (or Role Based Access Control Administrator).',
        },
        { type: 'quickcheck', questionIds: ['id-rbac-contributor-assign', 'id-rbac-least-privilege'] },
      ],
    },
  ],
  takeaways: [
    'A role assignment = security principal + role definition + scope.',
    'Assignments at a scope are inherited by all child scopes.',
    'Owner manages and grants access; Contributor manages but can’t grant access; Reader views.',
    'User Access Administrator and Role Based Access Control Administrator manage access without managing resources.',
    'Microsoft Entra roles administer the directory; Azure roles administer resources.',
  ],
  interview: [
    {
      q: 'What is the difference between Owner, Contributor and User Access Administrator?',
      a: 'Owner has full management access and can assign roles. Contributor has full management access but can’t assign roles. User Access Administrator can manage role assignments but doesn’t get management permissions on resources. I’d use Contributor for engineers and keep role assignment rights with a small platform team.',
    },
  ],
};

export default lesson;
