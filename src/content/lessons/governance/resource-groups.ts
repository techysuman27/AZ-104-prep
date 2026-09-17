import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'resource-groups',
  moduleId: 'governance',
  verified: '2026-09-14',
  sources: ['arm-overview', 'move-resources', 'locks'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Containers for things that live and die together',
      blocks: [
        {
          type: 'lead',
          text: 'A **resource group** holds resources that share a lifecycle. Get the grouping right and deployment, access, cost reporting and clean-up become simple; get it wrong and every change is a puzzle.',
        },
        {
          type: 'explainer',
          technical: [
            'Every [[azure-resource|resource]] belongs to exactly one [[resource-group|resource group]]. The resource group has a location where its metadata is stored, but its resources can be in any region.',
            'Resource groups are common scopes for RBAC, locks, policy and budgets. Deleting a resource group deletes every resource inside it.',
            'Resources can be [[resource-move|moved]] to another resource group or subscription in the same tenant. The move changes the resource ID but not the region, and role assignments on moved resources don’t move with them.',
          ],
          simple: [
            'A resource group is a labeled box for one project. Everything the project needs goes in the box.',
            'When the project ends, you throw away the box and everything inside goes with it — no forgotten leftovers still costing money.',
          ],
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'How to group resources',
      blocks: [
        {
          type: 'compare',
          items: [
            { name: 'Group by lifecycle (recommended)', bestFor: 'Resources deployed, updated and deleted together', points: ['rg-shop-prod-web holds the web app, plan and Application Insights', 'Deleting the environment is one operation', 'Team access maps to the group'] },
            { name: 'Separate shared resources', bestFor: 'Things many workloads depend on', points: ['rg-network-prod holds the hub VNet and firewall', 'Different owners and a longer lifecycle', 'Often protected with a delete lock'] },
          ],
        },
        {
          type: 'list',
          style: 'check',
          items: [
            'A resource can connect to resources in other resource groups — a web app can use a database elsewhere.',
            'Tags on a resource group aren’t inherited by its resources.',
            'You can deploy up to 800 instances of a resource type per resource group (some types are exempt).',
            'A delete lock on any resource makes deleting its resource group fail entirely.',
          ],
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      title: 'Move resources safely',
      blocks: [
        {
          type: 'steps',
          steps: [
            { title: 'Check support and dependencies', detail: 'Not every resource type can move. Across subscriptions, dependent resources (VM, disks, NICs, public IPs, VNet) must move together, and the destination subscription must have the resource providers registered.' },
            { title: 'Check locks and policy', detail: 'A read-only lock on the source or destination resource group or subscription blocks the move. Policies at the destination are enforced.' },
            { title: 'Validate the move', detail: 'Run the validateMoveResources operation to find problems without moving anything.' },
            { title: 'Move', detail: 'Both resource groups are locked against changes during the move (up to four hours); the resources keep running.' },
            { title: 'Fix what didn’t move', detail: 'Recreate role assignments on the moved resources and update scripts that use the old resource IDs.' },
          ],
        },
        {
          type: 'code',
          title: 'Move a storage account to another resource group',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `id=$(az storage account show --name stcontracts01 --resource-group rg-legacy --query id -o tsv)

az resource move --destination-group rg-finance --ids $id
# Add --destination-subscription-id <id> to move across subscriptions`,
              notes: [{ token: '--ids', note: 'Space-separated resource IDs. Only top-level resources are listed; child resources move with them.' }],
            },
            {
              lang: 'powershell',
              label: 'PowerShell',
              code: `$st = Get-AzResource -ResourceGroupName rg-legacy -ResourceName stcontracts01
Move-AzResource -DestinationResourceGroupName rg-finance -ResourceId $st.ResourceId`,
            },
          ],
        },
        {
          type: 'callout',
          variant: 'trap',
          text: 'Moving resources never changes their region. To relocate a VM from East US to West Europe you need Azure Resource Mover (for supported resources) or a redeployment.',
        },
      ],
    },
    {
      id: 'troubleshoot',
      kind: 'troubleshoot',
      title: 'When a move fails',
      blocks: [
        {
          type: 'table',
          columns: ['Error or symptom', 'Likely cause', 'Fix'],
          rows: [
            ['MissingMoveDependentResources', 'Dependent resources weren’t included', 'Move the VM together with its disks, NICs and other dependencies'],
            ['RequestDisallowedByPolicy', 'A policy at the destination blocks the resource', 'Comply with the policy or get an exemption'],
            ['Move blocked by a scope lock', 'Read-only lock on a resource group or subscription', 'Remove the read-only lock temporarily'],
            ['Users lost access after the move', 'Direct role assignments stayed behind', 'Recreate the role assignments at the new location'],
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
          text: 'Expect statements to judge: resources keep running during a move (yes), the region changes (no), role assignments move with the resource (no), both resource groups are locked during the move (yes).',
        },
        { type: 'quickcheck', questionIds: ['gov-move-facts', 'gov-rg-delete-lock'] },
      ],
    },
  ],
  takeaways: [
    'Group resources by shared lifecycle; each resource lives in exactly one resource group.',
    'A resource group’s location stores metadata; its resources can be in other regions.',
    'Deleting a resource group deletes everything in it — unless a delete lock makes the operation fail.',
    'Moves keep resources running, change resource IDs, don’t change regions and don’t carry role assignments.',
    'Read-only locks and destination policies can block moves.',
  ],
};

export default lesson;
