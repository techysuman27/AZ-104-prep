import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'rbac-interpret',
  moduleId: 'identity',
  verified: '2026-09-14',
  sources: ['rbac-overview', 'rbac-custom-roles', 'roles-compare'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Reading access like Azure does',
      blocks: [
        {
          type: 'lead',
          text: 'Exam questions and real incidents both ask the same thing: “given these assignments, can this person do that?” Azure answers it with a precise, repeatable evaluation — and so can you.',
        },
        {
          type: 'explainer',
          technical: [
            'When a request arrives, Azure Resource Manager collects the principal’s identity and group memberships, then looks for **deny assignments** that apply. A matching deny assignment blocks the request.',
            'Otherwise it gathers every role assignment at the target scope **and all parent scopes**, for the user and every group they belong to (group membership is transitive).',
            'For each role, the allowed permissions are `Actions` minus `NotActions` (and `DataActions` minus `NotDataActions` for data). If any role allows the action, it is allowed. Conditions on an assignment can narrow data access further.',
          ],
          simple: [
            'Azure first asks: is there an explicit “no entry” sign for this person here? If so, stop.',
            'Then it collects every access card the person holds — their own and their groups’ — that works on this room or any bigger area containing it.',
            'If **any** card opens the door, the door opens. Cards never take access away from other cards.',
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'Try the evaluation yourself',
      blocks: [
        {
          type: 'interactive',
          id: 'rbac-evaluator',
          intro: 'Choose who is acting, what they want to do and where. The evaluator walks up the hierarchy, collects assignments and shows exactly why the answer is allow or deny.',
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Rules that decide every access question',
      blocks: [
        {
          type: 'steps',
          steps: [
            { title: 'Inheritance flows down, never up', detail: 'An assignment at a resource group applies to its resources — not to the subscription above it or sibling resource groups.' },
            { title: 'Permissions add up', detail: 'Contributor at the subscription plus Reader on one resource group means the person is still Contributor on that resource group.' },
            { title: 'NotActions subtract — they don’t deny', detail: 'A role’s NotActions only remove permissions from that role. Another role that grants the permission still allows it.' },
            { title: 'Deny assignments win', detail: 'Deny assignments block actions even if a role allows them. You can’t create them directly; Azure creates them for features such as managed applications and deployment stacks.' },
            { title: 'Groups count, including nested groups', detail: 'Assignments to a group apply to its members and members of groups nested inside it.' },
            { title: 'Control plane and data plane are separate', detail: 'Owner on a storage account doesn’t grant DataActions such as reading blob contents with Microsoft Entra authorization.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'In the portal, **Access control (IAM) → Check access** shows a user’s effective role assignments at that scope, including inherited ones.',
        },
      ],
    },
    {
      id: 'example',
      kind: 'example',
      title: 'Worked example',
      blocks: [
        {
          type: 'table',
          caption: 'Assignments for Maria (member of groups Dev and Ops)',
          columns: ['Principal', 'Role', 'Scope'],
          rows: [
            ['Maria', 'Reader', 'Subscription Prod'],
            ['Group Dev', 'Contributor', 'Resource group rg-web'],
            ['Group Ops', 'Virtual Machine Contributor', 'VM vm-batch-01 (in rg-batch)'],
          ],
        },
        {
          type: 'list',
          style: 'number',
          items: [
            '**Delete a web app in rg-web?** Yes — Contributor through Dev at rg-web.',
            '**Restart vm-batch-01?** Yes — Virtual Machine Contributor at the VM.',
            '**Create a storage account in rg-batch?** No — at rg-batch she only inherits Reader from the subscription; VM Contributor is scoped to one VM.',
            '**Assign Reader to a colleague on rg-web?** No — Contributor can’t assign roles.',
            '**View resources in any resource group?** Yes — Reader at the subscription is inherited everywhere.',
          ],
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      title: 'When no built-in role fits: custom roles',
      blocks: [
        {
          type: 'p',
          text: 'If a built-in role grants too much, create a [[custom-role|custom role]]. Start from a built-in role, remove what isn’t needed and set assignable scopes.',
        },
        {
          type: 'code',
          title: 'A VM operator custom role',
          tabs: [
            {
              lang: 'json',
              label: 'vm-operator.json',
              code: `{
  "Name": "VM Operator",
  "IsCustom": true,
  "Description": "Start, restart and deallocate VMs.",
  "Actions": [
    "Microsoft.Compute/virtualMachines/read",
    "Microsoft.Compute/virtualMachines/start/action",
    "Microsoft.Compute/virtualMachines/restart/action",
    "Microsoft.Compute/virtualMachines/deallocate/action",
    "Microsoft.Resources/subscriptions/resourceGroups/read"
  ],
  "NotActions": [],
  "DataActions": [],
  "NotDataActions": [],
  "AssignableScopes": [
    "/subscriptions/00000000-0000-0000-0000-000000000000"
  ]
}`,
              notes: [
                { token: 'Actions', note: 'Control plane operations the role allows.' },
                { token: 'AssignableScopes', note: 'Where the role can be assigned. Can’t be the root scope “/”, can’t use wildcards, and can include only one management group.' },
              ],
            },
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az role definition create --role-definition @vm-operator.json

az role assignment create --assignee-object-id <ops-group-id> \\
  --assignee-principal-type Group --role "VM Operator" \\
  --scope "/subscriptions/<subscription-id>/resourceGroups/rg-batch"`,
            },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Custom role limits: up to 5,000 custom roles per tenant; custom roles with DataActions can’t be assigned at management group scope; creating one requires `Microsoft.Authorization/roleDefinitions/write` on every assignable scope; remove assignments before deleting a custom role.',
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
            { mistake: 'Adding Reader on a child scope to “downgrade” someone who has Contributor higher up.', fix: 'Remove or rescope the higher assignment. RBAC only adds permissions.' },
            { mistake: 'Using NotActions to block a dangerous action for everyone.', fix: 'NotActions only shape one role. Use narrower roles, Azure Policy (denyAction) or locks for guardrails.' },
            { mistake: 'Ignoring group memberships when investigating access.', fix: 'Use Check access or list assignments with inherited and group-expanded results.' },
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
          text: '“Interpret access assignments” questions give a table of assignments at different scopes. Work top-down: collect every assignment at or above the target scope for the user and their groups, then ask whether any role allows the action.',
        },
        { type: 'quickcheck', questionIds: ['id-rbac-interpret-table', 'id-custom-role-scope'] },
      ],
    },
  ],
  takeaways: [
    'Deny assignments are checked first; then any role at the scope or a parent scope can allow the action.',
    'RBAC is additive and inherited downward; child assignments can’t remove inherited access.',
    'NotActions subtract from a role, they are not a deny.',
    'Group membership is transitive for Azure RBAC.',
    'Custom roles: AssignableScopes can’t be “/”, can’t use wildcards and can include only one management group.',
  ],
};

export default lesson;
