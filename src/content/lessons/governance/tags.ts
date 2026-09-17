import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'tags',
  moduleId: 'governance',
  verified: '2026-09-14',
  sources: ['tags', 'policy-overview', 'budgets'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Labels that answer “who owns this and who pays?”',
      blocks: [
        {
          type: 'lead',
          text: '**Tags** are name-value pairs on subscriptions, resource groups and resources. They turn a list of cryptically named resources into something you can filter by owner, environment, application and cost center.',
        },
        {
          type: 'explainer',
          technical: [
            '[[tags|Tags]] are metadata stored on each object. They appear in cost analysis and usage exports, so costs can be grouped and charged back by tag.',
            'Tags are **not inherited**: a tag on a resource group or subscription doesn’t appear on its resources. Use [[azure-policy|Azure Policy]] to require tags, add them, or inherit them from the resource group.',
            'Each resource, resource group or subscription supports up to 50 tag name-value pairs. Tag names are case-insensitive for operations; values are case-sensitive.',
          ],
          simple: [
            'Tags are sticky notes on your cloud resources: “Owner: web-team”, “Environment: production”, “CostCenter: 4410”.',
            'Unlike permissions, sticky notes don’t copy themselves onto everything inside a box. If every resource needs the note, you need a rule that adds it.',
          ],
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Tag rules and limits',
      blocks: [
        {
          type: 'table',
          columns: ['Rule', 'Detail'],
          rows: [
            ['Where tags can be applied', 'Subscriptions, resource groups and resources — not management groups'],
            ['Inheritance', 'None. Use Azure Policy (for example, inherit a tag from the resource group)'],
            ['Maximum per object', '50 name-value pairs'],
            ['Name length', '512 characters (128 for storage accounts)'],
            ['Value length', '256 characters'],
            ['Forbidden characters in names', '`<`, `>`, `%`, `&`, `\\`, `?`, `/`'],
            ['Case', 'Names case-insensitive; values case-sensitive'],
            ['Security', 'Plain text — never store secrets or personal data'],
          ],
        },
        {
          type: 'p',
          text: 'To tag, you need write access to the resource (for example Contributor), or the **Tag Contributor** role, which manages tags without granting access to the resources themselves.',
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      title: 'Apply tags without wiping existing ones',
      blocks: [
        {
          type: 'code',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# Merge: add or update tags, keep the others
az tag update --resource-id <resource-id> --operation Merge \\
  --tags CostCenter=4410 Environment=Production

# Replace: the resource ends up with ONLY these tags
az tag update --resource-id <resource-id> --operation Replace --tags Owner=web-team

# Find resources with a tag value
az resource list --tag Environment=Production --output table`,
              notes: [
                { token: '--operation Merge', note: 'Adds new tags and updates matching names without removing others.' },
                { token: '--operation Replace', note: 'Removes all existing tags not included in the command.' },
              ],
            },
            {
              lang: 'powershell',
              label: 'PowerShell',
              code: `$tags = @{ CostCenter = "4410"; Environment = "Production" }
Update-AzTag -ResourceId <resource-id> -Tag $tags -Operation Merge`,
            },
          ],
        },
        {
          type: 'callout',
          variant: 'trap',
          text: 'Commands that set the full tag collection (such as `az group update --tags`) replace existing tags. When a question asks to add a tag while keeping existing tags, look for a **merge** operation.',
        },
      ],
    },
    {
      id: 'decide',
      kind: 'decide',
      title: 'Make every resource carry the right tags',
      blocks: [
        {
          type: 'decision',
          tree: {
            id: 'tag-strategy',
            title: 'Which approach enforces tagging?',
            start: 'q1',
            nodes: {
              q1: { kind: 'question', text: 'What do you need to guarantee?', options: [{ label: 'New resource groups must be created with a CostCenter tag', next: 'r-deny' }, { label: 'Resources should automatically get the tag from their resource group', next: 'r-inherit' }, { label: 'I just need a report of what’s missing', next: 'r-audit' }] },
              'r-deny': { kind: 'result', title: 'Deny policy: require a tag on resource groups', text: 'Creation without the tag fails, so the tag is always present at the source.', concepts: ['azure-policy', 'policy-effect'] },
              'r-inherit': { kind: 'result', title: 'Modify policy: inherit a tag from the resource group', text: 'New and updated resources receive the resource group’s tag. Run a remediation task to tag existing resources.', concepts: ['azure-policy', 'tags'] },
              'r-audit': { kind: 'result', title: 'Audit policy', text: 'Non-compliant resources are reported without blocking anyone — a good first step before enforcing.', tone: 'caution', concepts: ['azure-policy'] },
            },
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
            { mistake: 'Tagging resource groups only and building cost reports on resource-level tags.', fix: 'Inherit tags with Azure Policy or tag resources directly.' },
            { mistake: 'Inconsistent values such as “Prod”, “prod” and “Production”.', fix: 'Define allowed values and enforce them with policy parameters; remember values are case-sensitive.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Tags don’t inherit; they can’t be applied to management groups; up to 50 per object. Tag Contributor manages tags without resource access.' },
        { type: 'quickcheck', questionIds: ['gov-tags-inheritance', 'gov-tag-contributor'] },
      ],
    },
  ],
  takeaways: [
    'Tags are name-value metadata on subscriptions, resource groups and resources — not management groups.',
    'Tags aren’t inherited; enforce or inherit them with Azure Policy.',
    'Up to 50 tag pairs per object; names are case-insensitive, values case-sensitive.',
    'Use merge operations to add tags without removing existing ones.',
    'Tag Contributor can manage tags without access to the resources.',
  ],
};

export default lesson;
