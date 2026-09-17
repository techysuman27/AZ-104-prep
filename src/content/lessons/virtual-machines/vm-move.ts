import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'vm-move',
  moduleId: 'virtual-machines',
  verified: '2026-09-14',
  sources: ['move-resources', 'vm-availability'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Moving VMs: groups, subscriptions and regions',
      blocks: [
        {
          type: 'lead',
          text: 'Moving a VM to another resource group or subscription is a metadata change: the VM keeps running and stays in the same region. Moving it to another **region** is a different operation entirely.',
        },
        {
          type: 'explainer',
          technical: [
            'Resource group and subscription moves happen in the same Microsoft Entra tenant; [[resource-move|dependent resources]] (disks, NICs, public IPs, NSG, VNet) must move together across subscriptions.',
            'The resource ID changes, direct role assignments don’t move, and both resource groups are locked against changes during the move (up to four hours).',
            'To change region, use **Azure Resource Mover** for supported resources, or redeploy from a template or image.',
          ],
          simple: [
            'Moving a VM between resource groups is like re-filing a document: nothing physically moves and the VM keeps running.',
            'Moving to another region means the VM physically runs somewhere else — that’s a rebuild or a replication job, not a re-file.',
          ],
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      blocks: [
        {
          type: 'steps',
          steps: [
            { title: 'List the dependencies', detail: 'A VM move across subscriptions includes its disks, NIC, public IP, NSG and the virtual network — they must be in the same resource group and move together.' },
            { title: 'Check blockers', detail: 'Read-only locks on the source or destination, or policies at the destination, will stop the move.' },
            { title: 'Validate', detail: 'Run the validateMoveResources operation before attempting the move.' },
            { title: 'Move and repair', detail: 'After the move, recreate role assignments, update scripts that used the old resource IDs, and check diagnostic settings.' },
          ],
        },
        {
          type: 'code',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# Move a VM and its dependencies to another resource group
ids=$(az resource list --resource-group rg-old --query "[].id" -o tsv | tr '\\n' ' ')
az resource move --destination-group rg-new --ids $ids

# Cross-subscription move
az resource move --destination-group rg-new \\
  --destination-subscription-id <target-subscription-id> --ids $ids`,
              notes: [{ token: '--destination-subscription-id', note: 'Both subscriptions must trust the same Microsoft Entra tenant.' }],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'trap',
          text: 'A resource move never changes the region. For “move this VM from East US to West Europe”, the answer is Azure Resource Mover or a redeployment.',
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Expect statements about downtime (none), region (unchanged), role assignments (not moved) and locks (read-only blocks the move).' },
        { type: 'quickcheck', questionIds: ['cmp-vm-move-region'] },
      ],
    },
  ],
  takeaways: [
    'Resource group and subscription moves keep VMs running and in the same region.',
    'Dependent resources must move together across subscriptions.',
    'Role assignments and resource IDs don’t survive the move unchanged.',
    'Region changes need Azure Resource Mover or a redeploy.',
  ],
};

export default lesson;
