import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'azure-policy',
  moduleId: 'governance',
  verified: '2026-09-14',
  sources: ['policy-overview', 'policy-effects', 'policy-exemptions', 'management-groups'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Rules for what resources may look like',
      blocks: [
        {
          type: 'lead',
          text: 'RBAC decides **who** can make a change. **Azure Policy** decides whether the **result** is acceptable — the right region, SKU, tags and security settings — no matter who makes it.',
        },
        {
          type: 'explainer',
          technical: [
            'A **policy definition** is a JSON rule with an `if` condition and a `then` effect. An [[policy-initiative|initiative]] groups definitions. An **assignment** applies a definition or initiative to a management group, subscription, resource group or resource, with parameters, exclusions and optionally a managed identity.',
            'Resources are evaluated when they are created or updated, when an assignment or definition changes, and in a standard compliance scan every 24 hours. [[policy-effect|Effects]] such as deny, audit, modify and deployIfNotExists decide the outcome.',
            'Policy is **explicit-deny**: an assignment at a child scope can’t override a deny inherited from a parent. Use exclusions or [[policy-exemption|exemptions]] for exceptions.',
          ],
          simple: [
            'Policies are the building regulations for your cloud. You don’t need to watch every contractor; the regulations reject non-compliant work automatically.',
            'Some rules block the work (deny), some just write it in a report (audit), and some fix it on the spot, like adding a missing label (modify).',
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'See effects in action',
      blocks: [
        {
          type: 'interactive',
          id: 'policy-effects',
          intro: 'Send create requests through assignments with different effects. Watch what gets blocked, changed, reported or deployed — and in what order effects are evaluated.',
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Effects and evaluation',
      blocks: [
        {
          type: 'table',
          caption: 'The effects you must know',
          columns: ['Effect', 'What happens', 'Typical use'],
          rows: [
            ['deny', 'The create or update request fails', 'Allowed locations, allowed VM SKUs'],
            ['audit', 'Allowed, but marked non-compliant', 'Measure impact before enforcing'],
            ['modify', 'Adds, replaces or removes properties or tags during the request (needs a managed identity)', 'Add or inherit tags'],
            ['append', 'Adds fields to the request', 'Add IP rules to a storage account'],
            ['auditIfNotExists', 'After the resource is created, checks a related resource exists', 'Audit VMs without an extension'],
            ['deployIfNotExists', 'After creation, deploys the missing related resource (needs a managed identity)', 'Create diagnostic settings automatically'],
            ['denyAction', 'Blocks specific actions, such as delete', 'Prevent deletion of critical resource types'],
            ['disabled', 'The assignment doesn’t evaluate', 'Temporarily switch off a policy'],
          ],
        },
        {
          type: 'steps',
          title: 'Order of evaluation during a request',
          steps: [
            { title: 'disabled', detail: 'Checked first to decide whether the rule is evaluated at all.' },
            { title: 'append and modify', detail: 'Can change the request before it is judged.' },
            { title: 'deny', detail: 'Blocks non-compliant requests.' },
            { title: 'audit', detail: 'Records non-compliance for allowed requests.' },
            { title: 'After the resource provider succeeds', detail: 'auditIfNotExists and deployIfNotExists evaluate related resources.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Existing resources',
          text: 'A new **deny** assignment doesn’t delete or stop existing non-compliant resources — they show as non-compliant. **modify** and **deployIfNotExists** fix existing resources only when you run a **remediation task**.',
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      title: 'Assign policies',
      blocks: [
        {
          type: 'portal',
          title: 'Assign the Allowed locations policy to a management group',
          path: ['Policy', 'Authoring', 'Assignments', 'Assign policy'],
          steps: [
            { label: 'Basics', fields: [{ name: 'Scope', value: 'Contoso / Landing zones', hint: 'Choose the management group, subscription or resource group. Optionally add exclusions.' }, { name: 'Policy definition', value: 'Allowed locations', hint: 'A built-in definition with the deny effect.' }] },
            { label: 'Parameters', fields: [{ name: 'Allowed locations', value: 'West Europe, North Europe' }] },
            { label: 'Remediation', detail: 'Not needed for deny policies. For modify or deployIfNotExists policies, a managed identity is created here, and you can create a remediation task for existing resources.' },
            { label: 'Non-compliance messages', detail: 'Add a friendly message that users see when a request is denied.' },
          ],
        },
        {
          type: 'code',
          title: 'Script policy assignments',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# Find the built-in definition name
def=$(az policy definition list --query "[?displayName=='Allowed locations'].name" -o tsv)

# Deny resources outside two regions for a subscription
az policy assignment create --name allowed-locations \\
  --policy $def \\
  --scope /subscriptions/<subscription-id> \\
  --params '{ "listOfAllowedLocations": { "value": ["westeurope", "northeurope"] } }'

# Trigger an on-demand compliance scan
az policy state trigger-scan --resource-group rg-shop`,
              notes: [
                { token: 'listOfAllowedLocations', note: 'The parameter name defined by the built-in Allowed locations policy.' },
                { token: 'trigger-scan', note: 'Starts evaluation now instead of waiting for the 24-hour cycle.' },
              ],
            },
            {
              lang: 'json',
              label: 'Custom rule',
              code: `{
  "if": {
    "allOf": [
      { "field": "type", "equals": "Microsoft.Resources/subscriptions/resourceGroups" },
      { "field": "tags['CostCenter']", "exists": "false" }
    ]
  },
  "then": { "effect": "deny" }
}`,
              notes: [{ token: 'tags[\'CostCenter\']', note: 'Policy aliases and fields let rules inspect resource properties, including tags.' }],
            },
          ],
        },
      ],
    },
    {
      id: 'compare',
      kind: 'compare',
      title: 'Policy, RBAC and locks — which guardrail?',
      blocks: [
        {
          type: 'compare',
          items: [
            { name: 'Azure RBAC', bestFor: 'Who may perform an action', points: ['Grants permissions to principals at scopes', 'Additive', 'Doesn’t check configuration'] },
            { name: 'Azure Policy', bestFor: 'What configurations are allowed', points: ['Evaluates resource properties', 'Applies to everyone, including Owners', 'Can deny, audit, fix or deploy'] },
            { name: 'Resource locks', bestFor: 'Protecting specific resources from delete or change', points: ['CanNotDelete or ReadOnly', 'Applies to everyone until removed', 'Control plane only'] },
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
            { mistake: 'Assigning deny policies straight to production.', fix: 'Start with audit to measure impact, communicate, then switch to deny.' },
            { mistake: 'Assigning a less restrictive policy at a child scope to “override” a parent deny.', fix: 'Policy is explicit-deny. Exclude the child scope from the parent assignment or create an exemption.' },
            { mistake: 'Expecting a modify policy to fix existing resources on its own.', fix: 'Create a remediation task for existing non-compliant resources.' },
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
          company: 'Litware Finance',
          context: 'Litware must prove that every resource group has a CostCenter tag and that storage accounts never allow public blob access. 60 subscriptions exist.',
          problem: 'Teams keep creating untagged resource groups, and last quarter a public container was discovered by an auditor.',
          approach: [
            'Create an initiative “Litware baseline” containing *Require a tag on resource groups* and a storage policy that denies allowing public blob access.',
            'Assign it in **audit** mode at the Litware management group for two weeks and share the compliance report.',
            'Switch the assignment to **deny** once teams have cleaned up.',
            'Add a modify policy that inherits CostCenter from the resource group to resources, and run a remediation task.',
            'Grant exemptions (category **Waiver**, with an expiry date) for two legacy systems.',
          ],
          outcome: 'Compliance is enforced and measurable across every subscription, with documented, time-boxed exceptions.',
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
          text: 'Owners are not exempt from policy. If a scenario says an Owner can’t deploy to a region, the answer is a policy assignment — not a missing permission.',
        },
        { type: 'quickcheck', questionIds: ['gov-policy-effects-match', 'gov-policy-remediation'] },
      ],
    },
  ],
  takeaways: [
    'Definitions describe rules; initiatives group them; assignments apply them at a scope.',
    'Know the effects: deny, audit, modify, append, auditIfNotExists, deployIfNotExists, denyAction, disabled.',
    'modify and deployIfNotExists need a managed identity and remediation tasks for existing resources.',
    'Evaluation happens on create/update, on assignment changes and every 24 hours.',
    'Policy is explicit-deny; use exclusions or exemptions for exceptions.',
  ],
};

export default lesson;
