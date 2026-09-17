import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'resource-manager',
  moduleId: 'foundations',
  verified: '2026-09-14',
  sources: ['arm-overview', 'control-data-plane', 'resource-providers', 'locks', 'policy-overview', 'activity-log'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'One front door for every change',
      blocks: [
        {
          type: 'lead',
          text: 'Whether you click **Create** in the portal, run `az vm create`, or deploy a Bicep file, the request lands in the same place: **Azure Resource Manager**. Understanding that single path explains why RBAC, Policy, locks and the activity log behave the same way everywhere.',
        },
        {
          type: 'explainer',
          technical: [
            '[[azure-resource-manager|Azure Resource Manager (ARM)]] is the deployment and management service for Azure. It receives every management request, **authenticates** the caller with Microsoft Entra ID and **authorizes** it with Azure RBAC before forwarding it to the right [[resource-provider|resource provider]].',
            'Along the way ARM enforces governance: [[azure-policy|Azure Policy]], [[resource-lock|resource locks]], and records the operation in the [[activity-log|activity log]].',
            'These are **control plane** operations sent to `https://management.azure.com`. Working with what is inside a resource — reading blobs, RDP to a VM — is the **data plane**, which uses the resource’s own endpoint and often different permissions.',
          ],
          simple: [
            'Imagine a large office building with one reception desk. Everyone who wants to build, move or remove anything must go through reception.',
            'Reception checks your ID (who are you?), checks your access list (are you allowed?), checks the building rules (is this allowed here?), writes your visit in the logbook, and then calls the right team to do the work.',
            'Using the things inside a room — like reading documents in a filing cabinet — doesn’t go through reception. That’s why some rules, like locks, only apply to building work and not to using what’s inside.',
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'Follow a request through Resource Manager',
      blocks: [
        {
          type: 'flow',
          title: 'Control plane vs data plane',
          alt: 'The portal, Azure CLI, PowerShell and templates send requests to Azure Resource Manager, which authenticates with Entra ID, authorizes with RBAC, checks Policy and locks, logs to the activity log, and forwards to resource providers. Data plane requests go directly to the resource endpoint.',
          spec: {
            root: {
              type: 'group',
              id: 'root',
              label: 'Request path',
              kind: 'plain',
              children: [
                {
                  type: 'group',
                  id: 'tools',
                  label: 'Tools',
                  kind: 'boundary',
                  direction: 'col',
                  children: [
                    { type: 'node', id: 'portal', label: 'Azure portal', icon: 'globe', concept: 'azure-portal' },
                    { type: 'node', id: 'cli', label: 'Azure CLI / PowerShell', icon: 'code', concept: 'azure-cli' },
                    { type: 'node', id: 'iac', label: 'ARM template / Bicep', icon: 'code', concept: 'bicep' },
                  ],
                },
                {
                  type: 'group',
                  id: 'arm-g',
                  label: 'management.azure.com',
                  kind: 'boundary',
                  direction: 'col',
                  children: [
                    { type: 'node', id: 'arm', label: 'Azure Resource Manager', sub: 'Authenticate & authorize', icon: 'cloud', tone: 'accent', concept: 'azure-resource-manager', detail: 'Validates the token issued by Microsoft Entra ID and checks Azure RBAC for the requested action at the requested scope.' },
                    { type: 'node', id: 'gov', label: 'Policy & locks', sub: 'Governance checks', icon: 'policy', concept: 'azure-policy', detail: 'Azure Policy evaluates create and update requests (for example a deny effect). Locks block delete or write operations for everyone.' },
                    { type: 'node', id: 'log', label: 'Activity log', sub: 'Who did what, when', icon: 'log-analytics', concept: 'activity-log' },
                  ],
                },
                {
                  type: 'group',
                  id: 'rps',
                  label: 'Resource providers',
                  kind: 'boundary',
                  direction: 'col',
                  children: [
                    { type: 'node', id: 'compute', label: 'Microsoft.Compute', sub: 'Creates the VM', icon: 'vm', concept: 'resource-provider' },
                    { type: 'node', id: 'storage', label: 'Microsoft.Storage', sub: 'Creates the account', icon: 'storage' },
                  ],
                },
                {
                  type: 'group',
                  id: 'data',
                  label: 'Data plane',
                  kind: 'boundary',
                  direction: 'col',
                  children: [
                    { type: 'node', id: 'blob', label: 'myaccount.blob.core.windows.net', sub: 'Read and write data', icon: 'blob', concept: 'control-plane-data-plane', detail: 'Data plane requests go straight to the resource endpoint. Locks don’t apply here, and access uses data roles, SAS tokens or keys.' },
                  ],
                },
              ],
            },
            edges: [
              { from: 'portal', to: 'arm', tone: 'data' },
              { from: 'cli', to: 'arm', tone: 'data' },
              { from: 'iac', to: 'arm', tone: 'data' },
              { from: 'arm', to: 'gov' },
              { from: 'gov', to: 'log', style: 'dashed' },
              { from: 'gov', to: 'compute', tone: 'allow' },
              { from: 'gov', to: 'storage', tone: 'allow' },
              { from: 'cli', to: 'blob', label: 'data plane', style: 'dashed', tone: 'muted' },
            ],
            flows: [
              { id: 'create-vm', label: 'Create a VM', path: ['cli', 'arm', 'gov', 'compute'], tone: 'allow', description: 'ARM authorizes `Microsoft.Compute/virtualMachines/write`, policy allows the size and region, the operation is logged, and **Microsoft.Compute** builds the VM.' },
              { id: 'denied', label: 'Blocked by policy', path: ['portal', 'arm', 'gov'], tone: 'deny', description: 'The user has Contributor, but an *Allowed locations* policy denies the region. The request fails with **RequestDisallowedByPolicy** — permission is not the same as compliance.' },
            ],
          },
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'What happens at each step',
      blocks: [
        {
          type: 'steps',
          steps: [
            { title: 'A tool sends a REST request', detail: 'Every tool — portal, CLI, PowerShell, SDKs, templates — calls the same Resource Manager REST API. That’s why anything you can do in the portal can also be scripted.' },
            { title: 'Authentication', detail: 'ARM validates the caller’s Microsoft Entra ID token. The token carries the identity of a user, group member, service principal or managed identity.' },
            { title: 'Authorization', detail: 'Azure RBAC checks whether that identity has a role granting the requested action (for example `Microsoft.Storage/storageAccounts/write`) at the target scope or above.' },
            { title: 'Governance', detail: 'Azure Policy evaluates the requested resource configuration, and resource locks can block delete or update operations — even for Owners.' },
            { title: 'Resource provider does the work', detail: 'ARM forwards the request to the provider namespace, such as `Microsoft.Network`. The subscription must be registered for that provider.' },
            { title: 'Logged', detail: 'The operation appears in the activity log, so you can later answer “who changed this?”' },
          ],
        },
        {
          type: 'table',
          caption: 'Control plane vs data plane',
          columns: ['', 'Control plane', 'Data plane'],
          rows: [
            ['Purpose', 'Manage resources (create, configure, delete)', 'Use a resource (read blobs, query a database, RDP)'],
            ['Endpoint', '`https://management.azure.com`', 'The resource’s own endpoint, e.g. `https://<account>.blob.core.windows.net`'],
            ['Authorization', 'Azure RBAC `Actions`', 'RBAC `DataActions`, SAS, keys, or service-specific logins'],
            ['Locks apply?', 'Yes', 'No'],
            ['Logged in', 'Activity log', 'Resource logs (via diagnostic settings)'],
          ],
        },
        {
          type: 'p',
          text: 'Every resource also has a [[resource-id|resource ID]]: `/subscriptions/{id}/resourceGroups/{rg}/providers/{namespace}/{type}/{name}`. Scopes for role assignments, locks and policy exemptions are written the same way.',
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      title: 'Work with resource providers',
      blocks: [
        {
          type: 'p',
          text: 'Most of the time the portal and template deployments register providers for you. When a deployment fails because the subscription isn’t registered for a namespace, register it yourself (Contributor or Owner includes the required `register/action` permission).',
        },
        {
          type: 'code',
          title: 'Check and register a resource provider',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# Registration state of all providers
az provider list --query "[].{Provider:namespace, Status:registrationState}" --output table

# Register one provider
az provider register --namespace Microsoft.Batch

# Inspect it (types, locations, API versions)
az provider show --namespace Microsoft.Batch`,
              notes: [
                { token: '--namespace', note: 'The provider namespace, such as `Microsoft.Compute` or `Microsoft.Network`.' },
                { token: 'registrationState', note: '`Registered`, `Registering` or `NotRegistered`. Registration completes region by region.' },
              ],
            },
            {
              lang: 'powershell',
              label: 'PowerShell',
              code: `Get-AzResourceProvider -ListAvailable | Select-Object ProviderNamespace, RegistrationState

Register-AzResourceProvider -ProviderNamespace Microsoft.Batch`,
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
            { mistake: 'Putting a delete lock on a storage account to protect its blobs.', fix: 'Locks protect the control plane only. Protect data with soft delete, versioning and least-privilege data roles.' },
            { mistake: 'Assuming Owner can do anything, so a failed deployment “must be a bug”.', fix: 'Check for Azure Policy denials (RequestDisallowedByPolicy) and locks — both override role permissions.' },
            { mistake: 'Giving someone Contributor so they can read blobs.', fix: 'Contributor is a control plane role. Assign a data role such as Storage Blob Data Reader.' },
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
          company: 'Adventure Works',
          context: 'A developer with the Owner role on a subscription tries to create a storage account in Brazil South and gets an error. Their colleague can create accounts in West Europe without problems.',
          problem: 'The developer insists they have full permissions and asks why Azure is “broken”.',
          approach: [
            'Open the failed deployment’s error: it reports **RequestDisallowedByPolicy**, naming an *Allowed locations* assignment.',
            'Explain that RBAC passed — the developer is authorized — but Azure Policy evaluated the request and denied the region.',
            'Check the activity log to show the denied operation and the policy details.',
            'Deploy to an allowed region, or request an exemption if there is a business reason.',
          ],
          outcome: 'The developer understands that authorization and compliance are separate checks in the same request path.',
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
          text: 'Expect questions that hinge on the difference between control plane and data plane permissions — especially for storage (Contributor vs Storage Blob Data roles) and locks (which don’t protect data).',
        },
        { type: 'quickcheck', questionIds: ['gov-lock-data-plane', 'gov-policy-vs-rbac'] },
      ],
    },
  ],
  takeaways: [
    'Every management request from every tool goes through Azure Resource Manager.',
    'ARM authenticates with Entra ID, authorizes with RBAC, enforces Policy and locks, and records the activity log.',
    'Control plane = managing resources at management.azure.com; data plane = using a resource at its own endpoint.',
    'Locks and most governance features apply to the control plane only.',
    'Resource providers supply resource types; subscriptions must be registered for a provider before using it.',
  ],
  interview: [
    {
      q: 'Someone with Owner on a storage account gets 403 errors reading blobs with Azure CLI using --auth-mode login. Why?',
      a: 'Owner is a control plane role. Reading blobs with Microsoft Entra authorization requires a data plane role such as Storage Blob Data Reader, because blob reads are DataActions. The Owner could list keys and use key-based access, but the right fix is assigning the data role.',
    },
  ],
};

export default lesson;
