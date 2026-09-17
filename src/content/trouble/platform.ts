import type { TroubleScenario } from '../schema';

/**
 * Identity, governance, storage, compute and operations scenarios — the
 * non-networking half of the troubleshooting library.
 */
export const PLATFORM_SCENARIOS: TroubleScenario[] = [
  // ---------------------------------------------------------------- scenario 5
  {
    id: 'ts-rbac-scope',
    title: 'The contributor who cannot grant access',
    summary: 'A team lead with Contributor cannot add a colleague to a resource group and does not understand why.',
    difficulty: 1,
    area: 'identity-governance',
    ticket: {
      from: 'Elena, team lead',
      message:
        'I have Contributor on rg-app-prod and I can create and delete anything in it. But when I try to add Tom as a Reader I get "you do not have permission to perform action Microsoft.Authorization/roleAssignments/write". Surely Contributor is enough?',
    },
    environment: {
      root: {
        type: 'group',
        id: 'sub',
        label: 'Subscription',
        kind: 'subscription',
        concept: 'subscription',
        direction: 'col',
        children: [
          {
            type: 'group',
            id: 'rg',
            label: 'rg-app-prod',
            kind: 'rg',
            concept: 'resource-group',
            direction: 'row',
            children: [
              { type: 'node', id: 'elena', label: 'Elena', sub: 'Contributor', icon: 'user', tone: 'warn', concept: 'role-assignment' },
              { type: 'node', id: 'res', label: 'Resources', icon: 'server', concept: 'azure-resource' },
            ],
          },
          { type: 'node', id: 'tom', label: 'Tom', sub: 'no assignment', icon: 'user', tone: 'muted', concept: 'entra-user' },
        ],
      },
      edges: [
        { from: 'elena', to: 'res', label: 'manage', tone: 'allow' },
        { from: 'elena', to: 'tom', label: 'grant access', style: 'dashed', tone: 'deny' },
      ],
    },
    tools: [
      {
        id: 'role-def',
        label: 'Contributor role definition',
        group: 'Configuration',
        description: 'The Actions and NotActions of the built-in Contributor role.',
        clue: true,
        output: {
          kind: 'table',
          columns: ['Section', 'Entry'],
          rows: [
            ['Actions', '*'],
            ['NotActions', 'Microsoft.Authorization/*/Delete'],
            ['NotActions', 'Microsoft.Authorization/*/Write'],
            ['NotActions', 'Microsoft.Authorization/elevateAccess/Action'],
          ],
          highlight: [2],
          note: 'NotActions subtracts from Actions. Contributor can do everything except write authorization objects — that is, role assignments.',
        },
      },
      {
        id: 'assignments',
        label: 'Elena’s role assignments',
        group: 'Configuration',
        description: 'Every assignment that applies to Elena at or above rg-app-prod.',
        output: {
          kind: 'table',
          columns: ['Principal', 'Role', 'Scope'],
          rows: [['Elena', 'Contributor', '/subscriptions/…/resourceGroups/rg-app-prod']],
          note: 'One assignment only. No inherited Owner or User Access Administrator from the subscription or a management group.',
        },
      },
      {
        id: 'activity',
        label: 'Activity log',
        group: 'Monitoring',
        description: 'The failed operation as Azure recorded it.',
        output: {
          kind: 'lines',
          lines: [
            'Operation: Microsoft.Authorization/roleAssignments/write',
            'Status: Failed (AuthorizationFailed)',
            'Caller: elena@contoso.com',
            'Scope: /subscriptions/…/resourceGroups/rg-app-prod',
          ],
        },
      },
      {
        id: 'compare',
        label: 'Compare built-in roles',
        group: 'Configuration',
        description: 'What the three general-purpose roles can do.',
        output: {
          kind: 'table',
          columns: ['Role', 'Manage resources', 'Grant access'],
          rows: [
            ['Owner', 'Yes', 'Yes'],
            ['Contributor', 'Yes', 'No'],
            ['User Access Administrator', 'No', 'Yes'],
            ['Reader', 'No', 'No'],
          ],
        },
      },
    ],
    causes: [
      {
        id: 'c1',
        text: 'Contributor excludes Microsoft.Authorization write actions through NotActions, so it cannot create role assignments',
        correct: true,
        feedback: 'Correct. That single NotActions entry is the entire difference between Contributor and Owner.',
      },
      {
        id: 'c2',
        text: 'Elena’s assignment is at the wrong scope',
        feedback: 'The scope is exactly the resource group she is trying to grant access to. Scope is not the problem; the role is.',
      },
      {
        id: 'c3',
        text: 'Tom does not exist in the directory yet',
        feedback: 'The error names an authorization failure for Elena’s own action, not a missing principal.',
      },
      {
        id: 'c4',
        text: 'A deny assignment is blocking her',
        feedback: 'There is no deny assignment listed — this is a plain absence of permission.',
      },
    ],
    fixes: [
      {
        id: 'f1',
        text: 'Grant Elena User Access Administrator on rg-app-prod, in addition to Contributor',
        correct: true,
        feedback: 'Correct, and least privilege: she gains the ability to grant access at that resource group only, while Contributor still covers resource management. Assignments are additive, so both apply.',
      },
      {
        id: 'f2',
        text: 'Grant Elena Owner on the subscription',
        feedback: 'It works, and it hands her full control of everything in the subscription to solve a resource-group-scoped problem.',
      },
      {
        id: 'f3',
        text: 'Create a custom role that copies Contributor without the NotActions',
        feedback: 'That is Owner, rebuilt by hand and now unmaintained. Use the built-in roles.',
      },
      {
        id: 'f4',
        text: 'Have Elena use Azure CLI instead of the portal',
        feedback: 'RBAC is enforced by Resource Manager, so every client gets the same answer.',
      },
    ],
    explanation:
      'Contributor’s definition is `Actions: *` minus the `Microsoft.Authorization/*/Write` and `Delete` NotActions. That is deliberate: it separates managing resources from managing who can manage them. Owner has both; User Access Administrator has only the second.',
    prevention: [
      'Teach the three-role model early: Owner = manage + grant, Contributor = manage, User Access Administrator = grant.',
      'Grant User Access Administrator at the narrowest scope that solves the problem.',
      'Use Check access in the portal before assuming a role is sufficient.',
    ],
    concepts: ['azure-rbac', 'role-definition', 'role-assignment', 'rbac-scope'],
    sources: ['rbac-overview', 'roles-compare'],
  },

  // ---------------------------------------------------------------- scenario 6
  {
    id: 'ts-policy-deny',
    title: 'The deployment that keeps being rejected',
    summary: 'A pipeline that worked last week now fails for every new resource, with an error nobody recognises.',
    difficulty: 2,
    area: 'identity-governance',
    ticket: {
      from: 'Jonas, DevOps engineer',
      message:
        'Our deployment pipeline has started failing with RequestDisallowedByPolicy on every storage account it creates. Nothing changed in our Bicep file. The service principal has Contributor on the resource group.',
    },
    environment: {
      root: {
        type: 'group',
        id: 'mg',
        label: 'mg-corp',
        kind: 'hierarchy',
        concept: 'management-group',
        direction: 'col',
        children: [
          { type: 'node', id: 'policy', label: 'Initiative: Corp baseline', sub: 'assigned 4 days ago', icon: 'policy', tone: 'warn', concept: 'policy-initiative' },
          {
            type: 'group',
            id: 'sub',
            label: 'Subscription',
            kind: 'subscription',
            concept: 'subscription',
            direction: 'col',
            children: [
              {
                type: 'group',
                id: 'rg',
                label: 'rg-app-prod',
                kind: 'rg',
                concept: 'resource-group',
                direction: 'row',
                children: [
                  { type: 'node', id: 'sp', label: 'sp-pipeline', sub: 'Contributor', icon: 'identity', concept: 'service-principal' },
                  { type: 'node', id: 'sa', label: 'new storage account', sub: 'rejected', icon: 'storage', tone: 'bad', concept: 'storage-account' },
                ],
              },
            ],
          },
        ],
      },
      edges: [
        { from: 'policy', to: 'sub', label: 'inherited', tone: 'deny' },
        { from: 'sp', to: 'sa', label: 'create', style: 'dashed', tone: 'deny' },
      ],
    },
    tools: [
      {
        id: 'error',
        label: 'Deployment error detail',
        group: 'Monitoring',
        description: 'The full error from the failed deployment.',
        clue: true,
        output: {
          kind: 'lines',
          lines: [
            'Code: RequestDisallowedByPolicy',
            'Message: Resource \'stapp2026\' was disallowed by policy.',
            'Policy definition: "Secure transfer to storage accounts should be enabled"',
            'Policy assignment: "Corp baseline" (scope: /providers/Microsoft.Management/managementGroups/mg-corp)',
            'Effect: deny',
          ],
          note: 'The error names the definition, the assignment and the scope — everything needed to act.',
        },
      },
      {
        id: 'compliance',
        label: 'Policy compliance',
        group: 'Configuration',
        description: 'Current compliance state for the assignment.',
        output: {
          kind: 'table',
          columns: ['Policy', 'Effect', 'Compliant', 'Non-compliant'],
          rows: [
            ['Secure transfer required', 'Deny', '42', '0'],
            ['Require env tag', 'Deny', '42', '0'],
            ['Allowed locations', 'Audit', '39', '3'],
          ],
          note: 'The initiative was assigned at the management group four days ago.',
        },
      },
      {
        id: 'rbac',
        label: 'Service principal permissions',
        group: 'Configuration',
        description: 'What the pipeline identity is allowed to do.',
        output: {
          kind: 'kv',
          items: [
            { k: 'Principal', v: 'sp-pipeline' },
            { k: 'Role', v: 'Contributor', tone: 'good' },
            { k: 'Scope', v: 'rg-app-prod', tone: 'good' },
            { k: 'Deny assignments', v: 'none', tone: 'good' },
          ],
          note: 'RBAC is not the constraint — the identity is permitted to create storage accounts.',
        },
      },
      {
        id: 'template',
        label: 'The Bicep resource',
        group: 'Configuration',
        description: 'The storage account definition the pipeline deploys.',
        output: {
          kind: 'lines',
          lines: [
            "resource st 'Microsoft.Storage/storageAccounts@2025-06-01' = {",
            '  name: storageAccountName',
            '  location: location',
            "  sku: { name: 'Standard_LRS' }",
            "  kind: 'StorageV2'",
            '  properties: {',
            "    minimumTlsVersion: 'TLS1_2'",
            '    // supportsHttpsTrafficOnly is not specified',
            '  }',
            '}',
          ],
          note: 'The property the policy requires is simply absent from the template.',
        },
      },
    ],
    causes: [
      {
        id: 'c1',
        text: 'A Deny policy inherited from the management group requires secure transfer, and the template does not set it',
        correct: true,
        feedback: 'Correct. Policy is evaluated by Resource Manager before the resource provider acts, so the deployment is rejected outright regardless of RBAC.',
      },
      {
        id: 'c2',
        text: 'The service principal lost its Contributor assignment',
        feedback: 'The assignment is intact, and the error is RequestDisallowedByPolicy rather than AuthorizationFailed.',
      },
      {
        id: 'c3',
        text: 'The storage account name is already taken',
        feedback: 'That would produce a name-availability error, not a policy error.',
      },
      {
        id: 'c4',
        text: 'The Bicep API version is too old for the policy',
        feedback: 'The API version is current, and policy evaluates the resulting resource properties rather than the API version.',
      },
    ],
    fixes: [
      {
        id: 'f1',
        text: 'Set supportsHttpsTrafficOnly to true in the template so the deployment satisfies the policy',
        correct: true,
        feedback: 'Correct. The policy exists to enforce a real security control; the right response is to comply with it, and the fix belongs in source control where it is permanent.',
      },
      {
        id: 'f2',
        text: 'Create a policy exemption for the resource group',
        feedback: 'Exemptions are for genuine, time-boxed exceptions with an owner and an expiry — not for avoiding a one-line template change.',
      },
      {
        id: 'f3',
        text: 'Change the policy effect from Deny to Audit',
        feedback: 'That weakens the control for the whole management group to unblock one pipeline.',
      },
      {
        id: 'f4',
        text: 'Grant the service principal Owner on the resource group',
        feedback: 'Policy applies regardless of role. Even an Owner cannot deploy something a Deny policy rejects.',
      },
    ],
    explanation:
      'RBAC and Policy are evaluated independently: RBAC decides whether you may perform the action, Policy decides whether the resulting resource is acceptable. A Deny effect inherited from a management group applies to every subscription beneath it, which is why a pipeline that changed nothing suddenly started failing.',
    prevention: [
      'Assign new policies in Audit or DoNotEnforce mode first and measure the impact before switching to Deny.',
      'Read the error — it names the definition, the assignment and the scope.',
      'Keep templates aligned with the organisation’s policy baseline so compliance is the default, not a reaction.',
    ],
    concepts: ['azure-policy', 'policy-effect', 'policy-exemption', 'azure-rbac', 'management-group'],
    sources: ['policy-overview', 'policy-effects', 'policy-exemptions'],
  },

  // ---------------------------------------------------------------- scenario 7
  {
    id: 'ts-sas-expired',
    title: 'The partner integration that stopped overnight',
    summary: 'A partner’s automated upload started returning 403 with no change on either side.',
    difficulty: 2,
    area: 'storage',
    ticket: {
      from: 'Nadia, integrations lead',
      message:
        'Our partner uploads a nightly file to the uploads container using a SAS URL we issued. It has worked for months. Last night every request came back 403 AuthenticationFailed. We have not touched the storage account.',
    },
    environment: {
      root: {
        type: 'group',
        id: 'sub',
        label: 'Subscription',
        kind: 'subscription',
        direction: 'col',
        children: [
          {
            type: 'group',
            id: 'sa',
            label: 'stpartnerdata',
            kind: 'boundary',
            concept: 'storage-account',
            direction: 'row',
            children: [
              { type: 'node', id: 'uploads', label: 'uploads', sub: 'container', icon: 'blob', concept: 'blob-storage' },
              { type: 'node', id: 'keys', label: 'key1 / key2', sub: 'key1 rotated', icon: 'key-vault', tone: 'warn', concept: 'access-keys' },
            ],
          },
          { type: 'node', id: 'partner', label: 'Partner job', sub: 'SAS URL', icon: 'laptop', tone: 'bad', concept: 'sas' },
        ],
      },
      edges: [
        { from: 'partner', to: 'uploads', label: 'PUT blob → 403', style: 'dashed', tone: 'deny' },
        { from: 'keys', to: 'uploads', label: 'signs SAS', tone: 'muted' },
      ],
    },
    tools: [
      {
        id: 'activity',
        label: 'Activity log (last 48 hours)',
        group: 'Monitoring',
        description: 'Control-plane operations on the storage account.',
        clue: true,
        output: {
          kind: 'table',
          columns: ['Time', 'Operation', 'Caller', 'Status'],
          rows: [
            ['Yesterday 22:14', 'Microsoft.Storage/storageAccounts/regenerateKey/action', 'automation@contoso.com', 'Succeeded'],
            ['Yesterday 09:02', 'Microsoft.Storage/storageAccounts/read', 'nadia@contoso.com', 'Succeeded'],
          ],
          highlight: [0],
          note: 'key1 was regenerated by a scheduled rotation runbook at 22:14 — shortly before the failures began.',
        },
      },
      {
        id: 'sas-detail',
        label: 'SAS token properties',
        group: 'Configuration',
        description: 'Decoded parameters of the SAS the partner is using.',
        output: {
          kind: 'kv',
          items: [
            { k: 'Type', v: 'Service SAS' },
            { k: 'Signed with', v: 'Account key 1', tone: 'bad' },
            { k: 'Permissions', v: 'racw' },
            { k: 'Expiry', v: '2027-01-01 (not yet expired)', tone: 'good' },
            { k: 'Stored access policy', v: 'none', tone: 'bad' },
          ],
        },
      },
      {
        id: 'firewall',
        label: 'Storage firewall',
        group: 'Configuration',
        description: 'Network rules on the account.',
        output: {
          kind: 'kv',
          items: [
            { k: 'Default action', v: 'Allow' },
            { k: 'Network rules', v: 'none' },
          ],
          note: 'The network path is not the constraint.',
        },
      },
      {
        id: 'metrics',
        label: 'Storage metrics',
        group: 'Monitoring',
        description: 'Transaction responses by type, last 24 hours.',
        output: {
          kind: 'table',
          columns: ['Response type', 'Count'],
          rows: [
            ['Success', '0'],
            ['AuthenticationError', '312'],
            ['ClientOtherError', '0'],
          ],
          note: 'Every request is failing authentication, not authorization of a specific blob.',
        },
      },
    ],
    causes: [
      {
        id: 'c1',
        text: 'The account key that signed the SAS was regenerated, invalidating every SAS signed with it',
        correct: true,
        feedback: 'Correct. A service SAS is a signature over the account key. Rotate the key and every SAS signed with it becomes invalid immediately.',
      },
      {
        id: 'c2',
        text: 'The SAS expired',
        feedback: 'The decoded expiry is in 2027 — the token is still within its validity window.',
      },
      {
        id: 'c3',
        text: 'The storage firewall now blocks the partner’s IP range',
        feedback: 'The default action is Allow with no network rules configured.',
      },
      {
        id: 'c4',
        text: 'The uploads container was deleted',
        feedback: 'That would return a container-not-found error, not AuthenticationError on every request.',
      },
    ],
    fixes: [
      {
        id: 'f1',
        text: 'Issue a new SAS bound to a stored access policy so future rotations do not break the integration',
        correct: true,
        feedback: 'Correct. A stored access policy is server-side, so the SAS can be revoked or adjusted without touching the key — and re-issuing against the current key restores service now.',
      },
      {
        id: 'f2',
        text: 'Regenerate key1 again to restore the original value',
        feedback: 'Regeneration produces a new random key; the old value cannot be recovered.',
      },
      {
        id: 'f3',
        text: 'Give the partner the account key directly',
        feedback: 'That hands over full control of the entire account with no expiry and no scope. It is the opposite of what a SAS is for.',
      },
      {
        id: 'f4',
        text: 'Disable key rotation',
        feedback: 'Rotation is a good control. The problem is that the SAS was issued in a way that could not survive it.',
      },
    ],
    explanation:
      'A service or account SAS is signed with an account key. Rotating that key invalidates every SAS signed with it, all at once — which is why the failure looks sudden and total. Binding a SAS to a stored access policy moves expiry and permissions server-side, so access can be managed and revoked independently of the keys.',
    prevention: [
      'Prefer a user delegation SAS, signed with Entra credentials rather than an account key.',
      'When an account key must be used, bind the SAS to a stored access policy.',
      'Alert on AuthenticationError in storage metrics — the count goes vertical the moment this happens.',
    ],
    concepts: ['sas', 'stored-access-policy', 'access-keys', 'storage-account'],
    sources: ['sas-overview', 'stored-access-policy', 'access-keys'],
  },

  // ---------------------------------------------------------------- scenario 8
  {
    id: 'ts-vm-unreachable',
    title: 'The VM that will not come back',
    summary: 'A production VM stopped responding overnight and nobody can connect to it.',
    difficulty: 2,
    area: 'compute',
    ticket: {
      from: 'Chris, service desk',
      message:
        'vm-lob01 is not responding on RDP and the application it hosts is down. The portal says the VM is running. We did not deploy anything yesterday.',
    },
    environment: {
      root: {
        type: 'group',
        id: 'rg',
        label: 'rg-lob-prod',
        kind: 'rg',
        concept: 'resource-group',
        direction: 'col',
        children: [
          { type: 'node', id: 'vm', label: 'vm-lob01', sub: 'Running', icon: 'vm', tone: 'warn', concept: 'virtual-machine' },
          { type: 'node', id: 'disk', label: 'osdisk-lob01', sub: 'Premium SSD · 128 GiB', icon: 'disk', concept: 'managed-disk' },
          { type: 'node', id: 'nsg', label: 'nsg-lob', sub: 'RDP allowed from corp', icon: 'nsg', concept: 'nsg' },
        ],
      },
      edges: [
        { from: 'vm', to: 'disk', tone: 'muted' },
        { from: 'nsg', to: 'vm', label: '3389 allowed', tone: 'allow' },
      ],
    },
    tools: [
      {
        id: 'boot-diag',
        label: 'Boot diagnostics',
        group: 'Monitoring',
        description: 'Screenshot and serial log from the VM.',
        clue: true,
        output: {
          kind: 'lines',
          lines: [
            'Serial log (last lines):',
            '  [  12.884] EXT4-fs (sda1): warning: mounting fs with errors',
            '  [  13.002] Failed to start Load/Save Random Seed.',
            '  [  13.118] You are in emergency mode. After logging in, type "journalctl -xb".',
            '  Give root password for maintenance (or press Control-D to continue):',
          ],
          note: 'The guest is stuck at an emergency-mode prompt. The VM is "running" from Azure’s point of view because the platform only sees the virtual hardware.',
        },
      },
      {
        id: 'resource-health',
        label: 'Resource Health',
        group: 'Monitoring',
        description: 'Azure’s view of this specific resource.',
        output: {
          kind: 'kv',
          items: [
            { k: 'Current status', v: 'Available', tone: 'good' },
            { k: 'Last change', v: 'None in the last 7 days' },
            { k: 'Platform events', v: 'None' },
          ],
          note: 'Azure considers the VM healthy — so the problem is inside the guest.',
        },
      },
      {
        id: 'ip-flow',
        label: 'IP flow verify (3389)',
        group: 'Network Watcher',
        description: 'Would an RDP connection from the corporate range be allowed?',
        output: {
          kind: 'kv',
          items: [
            { k: 'Direction', v: 'Inbound' },
            { k: 'Protocol / port', v: 'TCP 3389' },
            { k: 'Result', v: 'Allowed', tone: 'good' },
            { k: 'Matched rule', v: 'AllowRdpFromCorp (priority 120)' },
          ],
          note: 'The network path is open — nothing is being blocked.',
        },
      },
      {
        id: 'activity',
        label: 'Activity log',
        group: 'Monitoring',
        description: 'Control-plane operations in the last 48 hours.',
        output: {
          kind: 'table',
          columns: ['Time', 'Operation', 'Caller', 'Status'],
          rows: [['Yesterday 03:12', 'Microsoft.Compute/virtualMachines/restart/action', 'Azure platform', 'Succeeded']],
          note: 'A platform-initiated restart occurred during the maintenance window. The guest did not come back cleanly.',
        },
      },
    ],
    causes: [
      {
        id: 'c1',
        text: 'The guest operating system failed to boot cleanly and is sitting at an emergency-mode prompt',
        correct: true,
        feedback: 'Correct. Azure reports the VM as running because the virtual hardware is running; the operating system inside it never finished starting.',
      },
      {
        id: 'c2',
        text: 'An NSG rule is blocking RDP',
        feedback: 'IP flow verify shows the connection allowed by AllowRdpFromCorp at priority 120.',
      },
      {
        id: 'c3',
        text: 'Azure is having a platform incident in the region',
        feedback: 'Resource Health reports Available with no platform events.',
      },
      {
        id: 'c4',
        text: 'The VM was deallocated by an automation schedule',
        feedback: 'The portal and the activity log both show it running; the only recorded operation is a platform restart.',
      },
    ],
    fixes: [
      {
        id: 'f1',
        text: 'Use the serial console to log in and repair the file system, then reboot',
        correct: true,
        feedback: 'Correct. The serial console gives keyboard access independent of the network, which is exactly what an emergency-mode prompt needs.',
      },
      {
        id: 'f2',
        text: 'Redeploy the VM to a different host',
        feedback: 'Redeploy moves the VM to new hardware, which does not repair a corrupt file system inside the guest.',
      },
      {
        id: 'f3',
        text: 'Restore the VM from the most recent backup',
        feedback: 'A valid fallback if the repair fails, but it loses everything written since the recovery point. Try the serial console first.',
      },
      {
        id: 'f4',
        text: 'Resize the VM to force it onto a healthy host',
        feedback: 'Same problem as redeploy — the guest’s disk state travels with it.',
      },
    ],
    explanation:
      '"Running" in the Azure portal describes the virtual hardware, not the operating system. When a VM is running but unreachable and the network path is open, boot diagnostics is the fastest way to see what the guest is actually doing — and the serial console is the way to fix it without a network path.',
    prevention: [
      'Enable boot diagnostics on every VM at creation; it costs nothing and is useless to enable during an incident.',
      'Check Resource Health first to separate platform problems from guest problems.',
      'Keep backups current so a failed repair has a fallback with a known RPO.',
    ],
    concepts: ['virtual-machine', 'resource-health', 'nsg', 'azure-backup'],
    sources: ['vm-availability', 'network-watcher', 'vm-restore'],
  },
];
