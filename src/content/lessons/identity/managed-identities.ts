import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'managed-identities',
  moduleId: 'identity',
  verified: '2026-09-14',
  sources: ['managed-identities', 'rbac-overview', 'acr-auth'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Identities for workloads, without secrets',
      blocks: [
        {
          type: 'lead',
          text: 'Apps and scripts need to authenticate too. A **managed identity** gives an Azure resource its own Microsoft Entra identity whose credentials Azure creates, rotates and protects — so no secret ever lands in your code.',
        },
        {
          type: 'explainer',
          technical: [
            'A [[managed-identity|managed identity]] is a special kind of [[service-principal|service principal]]. Code running on the resource requests a token from a local endpoint, then presents it to any service that accepts Microsoft Entra authentication.',
            '**System-assigned**: enabled on one resource, shares its lifecycle (deleted with it) and can’t be shared.',
            '**User-assigned**: a standalone Azure resource with its own lifecycle that can be attached to many resources; Microsoft recommends it for Microsoft services.',
            'Grant access with normal [[role-assignment|Azure role assignments]] — for example Storage Blob Data Reader on a container.',
          ],
          simple: [
            'A managed identity is a work badge for a program instead of a person.',
            'Azure hands the badge to your web app or VM and renews it automatically. The app shows the badge to storage or Key Vault — no password stored anywhere.',
            'A **system-assigned** badge belongs to one resource and is shredded when the resource is deleted. A **user-assigned** badge is its own thing that several resources can share.',
          ],
        },
      ],
    },
    {
      id: 'compare',
      kind: 'compare',
      title: 'System-assigned vs user-assigned',
      blocks: [
        {
          type: 'compare',
          items: [
            { name: 'System-assigned', bestFor: 'One resource with its own permissions', points: ['Created by enabling it on the resource', 'Deleted automatically with the resource', 'Can’t be shared', 'Service principal named after the resource'] },
            { name: 'User-assigned', bestFor: 'Shared or pre-provisioned permissions', points: ['Created as its own resource', 'Survives deleting the resources that use it', 'Attach to many resources', 'Grant roles before the workload is even deployed'] },
          ],
        },
        {
          type: 'decision',
          tree: {
            id: 'mi-type',
            title: 'Which managed identity should you use?',
            start: 'q1',
            nodes: {
              q1: { kind: 'question', text: 'Do several resources (for example every VM in a scale set, or many function apps) need exactly the same permissions?', options: [{ label: 'Yes', next: 'r-user' }, { label: 'No', next: 'q2' }] },
              q2: { kind: 'question', text: 'Must the identity and its role assignments survive if the resource is deleted and recreated?', options: [{ label: 'Yes', next: 'r-user' }, { label: 'No', next: 'r-system' }] },
              'r-user': { kind: 'result', title: 'User-assigned managed identity', text: 'Create the identity once, grant its roles, and attach it to each resource. Recreating a resource doesn’t break access.', concepts: ['managed-identity'] },
              'r-system': { kind: 'result', title: 'System-assigned managed identity', text: 'Enable it on the resource. The identity and its permissions disappear cleanly when the resource is deleted.', concepts: ['managed-identity'] },
            },
          },
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      blocks: [
        {
          type: 'code',
          title: 'Let a web app read blobs without a connection string',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# 1. Enable a system-assigned identity on the web app
principalId=$(az webapp identity assign --name app-shop --resource-group rg-shop --query principalId -o tsv)

# 2. Grant it read access to blob data in one storage account
az role assignment create \\
  --assignee-object-id $principalId \\
  --assignee-principal-type ServicePrincipal \\
  --role "Storage Blob Data Reader" \\
  --scope $(az storage account show --name stshopimages --resource-group rg-shop --query id -o tsv)`,
              notes: [
                { token: 'az webapp identity assign', note: 'Enables the system-assigned identity and returns its principal (object) ID.' },
                { token: 'Storage Blob Data Reader', note: 'A data plane role: read blob contents, nothing more.' },
                { token: '--assignee-principal-type ServicePrincipal', note: 'Managed identities are service principals.' },
              ],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'The same pattern works for container image pulls: give a Container App’s or Container Instance’s identity the **AcrPull** role on the registry instead of enabling the registry admin user.',
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
            { mistake: 'Enabling a managed identity and expecting access to work immediately.', fix: 'The identity has no permissions until you assign roles to it.' },
            { mistake: 'Giving the identity Contributor on the storage account to read blobs.', fix: 'Contributor is control plane only. Use a data role such as Storage Blob Data Reader.' },
            { mistake: 'Using system-assigned identities on 50 scale set VMs and assigning 50 roles.', fix: 'Use one user-assigned identity with one role assignment.' },
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
          text: 'Look for requirement words: “without storing credentials” → managed identity; “shared by multiple resources” or “independent lifecycle” → user-assigned; “deleted with the resource” → system-assigned.',
        },
        { type: 'quickcheck', questionIds: ['id-mi-user-assigned'] },
      ],
    },
  ],
  takeaways: [
    'Managed identities remove secrets from code; Azure manages the credentials.',
    'System-assigned: tied to one resource’s lifecycle. User-assigned: standalone and shareable.',
    'Managed identities need role assignments like any other principal.',
    'Use data plane roles for data access (for example Storage Blob Data Reader, AcrPull).',
  ],
};

export default lesson;
