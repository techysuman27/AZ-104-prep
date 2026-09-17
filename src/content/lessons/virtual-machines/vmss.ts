import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'vmss',
  moduleId: 'virtual-machines',
  verified: '2026-09-14',
  sources: ['vmss-modes', 'vm-availability', 'default-outbound', 'lb-components'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Identical VMs, managed as one',
      blocks: [
        {
          type: 'lead',
          text: 'A **Virtual Machine Scale Set** manages a group of VMs as a single resource: deploy once, scale in and out automatically, and spread instances across zones and fault domains.',
        },
        {
          type: 'explainer',
          technical: [
            '[[vmss|Scale sets]] come in two orchestration modes, chosen at creation and **not changeable**: **Flexible** (recommended) and **Uniform**.',
            '**Flexible** manages standard Azure VMs (up to 1,000), allows mixed sizes and Spot instances, supports Azure Backup and Site Recovery, and has **no default outbound access** — instances need explicit outbound connectivity.',
            '**Uniform** manages identical instances from a VM profile, supports automatic OS image upgrades and upgrade policies, and is used by AKS and Service Fabric.',
            'Both support [[autoscale]] (manual, metric-based or scheduled), instance protection, scale-in policies, automatic instance repair and zones.',
          ],
          simple: [
            'A scale set is a template plus a number: “run five copies of this server”. Change the number and Azure adds or removes copies.',
            'Autoscale changes that number for you based on load or a schedule.',
          ],
        },
      ],
    },
    {
      id: 'compare',
      kind: 'compare',
      title: 'Flexible vs Uniform',
      blocks: [
        {
          type: 'compare',
          items: [
            { name: 'Flexible (recommended)', bestFor: 'Most new deployments', points: ['Standard VM resources you can manage individually', 'Up to 1,000 instances; mixed sizes and Spot', 'Azure Backup and Site Recovery supported', 'No default outbound access — add a NAT gateway', 'User-assigned managed identities only'] },
            { name: 'Uniform', bestFor: 'Large identical fleets and platform services', points: ['Instances created from one VM profile', 'Automatic OS image upgrades and rolling upgrade policies', 'Overprovisioning supported', 'Used by AKS and Service Fabric'] },
          ],
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      title: 'Create a scale set and add autoscale rules',
      blocks: [
        {
          type: 'code',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az vmss create --resource-group rg-web --name vmss-web \\
  --orchestration-mode Flexible --instance-count 3 --zones 1 2 3 \\
  --image Ubuntu2204 --vm-sku Standard_D2s_v5 \\
  --vnet-name vnet-app --subnet snet-web \\
  --admin-username azureuser --generate-ssh-keys

# Autoscale between 3 and 12 instances
az monitor autoscale create --resource-group rg-web --name autoscale-web \\
  --resource vmss-web --resource-type Microsoft.Compute/virtualMachineScaleSets \\
  --min-count 3 --max-count 12 --count 3

az monitor autoscale rule create --resource-group rg-web --autoscale-name autoscale-web \\
  --condition "Percentage CPU > 70 avg 10m" --scale out 2

az monitor autoscale rule create --resource-group rg-web --autoscale-name autoscale-web \\
  --condition "Percentage CPU < 30 avg 10m" --scale in 1`,
              notes: [
                { token: '--orchestration-mode Flexible', note: 'Can’t be changed later. Flexible is Microsoft’s recommendation for most workloads.' },
                { token: '--zones 1 2 3', note: 'Spreads instances across availability zones for the 99.99% SLA.' },
                { token: '--scale out 2 / --scale in 1', note: 'Pair scale-out and scale-in rules, with a gap between the thresholds to avoid flapping.' },
              ],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Flexible scale set instances have no default outbound internet access. Attach a NAT gateway to the subnet (or another explicit method) or instances can’t reach updates and external APIs.',
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
            { mistake: 'Creating a Uniform scale set and later needing Azure Backup per instance.', fix: 'Choose Flexible — the mode can’t be changed after creation.' },
            { mistake: 'Scale-out at 70% CPU and scale-in at 65%.', fix: 'Leave a wide gap between thresholds so instances aren’t added and removed repeatedly.' },
            { mistake: 'Setting minimum instances to 1 for a production web tier.', fix: 'Keep at least two instances across zones so a single failure doesn’t take the service down.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'trap', text: 'Orchestration mode can’t be changed after creation, and Flexible instances need explicit outbound connectivity — both are common distractors.' },
        { type: 'quickcheck', questionIds: ['cmp-vmss-mode', 'cmp-autoscale-rules'] },
      ],
    },
  ],
  takeaways: [
    'Scale sets manage a group of VMs as one resource with autoscale and zone support.',
    'Flexible orchestration is recommended: standard VMs, mixed sizes, Backup and Site Recovery support.',
    'Orchestration mode is fixed at creation.',
    'Flexible instances have no default outbound access.',
    'Pair scale-out and scale-in rules with a threshold gap and a cool down.',
  ],
};

export default lesson;
