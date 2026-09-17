import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'vnets-subnets',
  moduleId: 'networking',
  verified: '2026-09-14',
  sources: ['vnet-faq', 'default-outbound', 'bastion-config', 'peering'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Your private network in Azure',
      blocks: [
        {
          type: 'lead',
          text: 'Almost every IaaS design starts with a **virtual network**. Its address space and subnets are hard to change later, so thoughtful IP planning now prevents painful re-addressing when you peer networks or connect on-premises.',
        },
        {
          type: 'explainer',
          technical: [
            'A [[vnet|virtual network]] is an isolated Layer 3 network in one region, defined by one or more CIDR address spaces. It spans the region’s availability zones.',
            '[[subnet|Subnets]] divide the address space. Azure reserves **five addresses** in each subnet, the smallest IPv4 subnet is /29 and the largest is /2.',
            'Address spaces must not overlap with networks you will peer with or connect to (on-premises included).',
          ],
          simple: [
            'A virtual network is like a private office building in one city. The address space is the range of room numbers you own.',
            'Subnets are floors. You put web servers on one floor and databases on another so each floor can have its own security rules.',
            'If two buildings use the same room numbers, you can’t connect them later — so plan numbers that don’t clash.',
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'Anatomy of a VNet',
      blocks: [
        {
          type: 'flow',
          title: 'vnet-app 10.1.0.0/16',
          alt: 'Virtual network 10.1.0.0/16 with subnets for web, app, data and AzureBastionSubnet, showing address ranges and usable address counts.',
          spec: {
            root: {
              type: 'group',
              id: 'vnet',
              label: 'vnet-app · 10.1.0.0/16',
              kind: 'vnet',
              concept: 'vnet',
              detail: '65,536 addresses in the address space. Only a fraction is allocated to subnets, leaving room to grow.',
              children: [
                { type: 'group', id: 'web', label: 'snet-web', sub: '10.1.1.0/24 · 251 usable', kind: 'subnet', concept: 'subnet', children: [{ type: 'node', id: 'vm-web', label: 'Web VMs', icon: 'vm' }] },
                { type: 'group', id: 'app', label: 'snet-app', sub: '10.1.2.0/24 · 251 usable', kind: 'subnet', children: [{ type: 'node', id: 'vm-app', label: 'App VMs', icon: 'vm' }] },
                { type: 'group', id: 'data', label: 'snet-data', sub: '10.1.3.0/24', kind: 'subnet', children: [{ type: 'node', id: 'pe', label: 'Private endpoints', icon: 'private-endpoint' }] },
                { type: 'group', id: 'bas', label: 'AzureBastionSubnet', sub: '10.1.255.0/26', kind: 'subnet', children: [{ type: 'node', id: 'bastion', label: 'Bastion', icon: 'bastion', concept: 'bastion', detail: 'Must be named exactly AzureBastionSubnet and be /26 or larger.' }] },
              ],
            },
            edges: [],
          },
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Addressing rules that matter',
      blocks: [
        {
          type: 'table',
          caption: 'The five reserved addresses in 10.1.1.0/24',
          columns: ['Address', 'Reserved for'],
          rows: [
            ['10.1.1.0', 'Network address'],
            ['10.1.1.1', 'Default gateway'],
            ['10.1.1.2 and 10.1.1.3', 'Map Azure DNS IPs to the VNet space'],
            ['10.1.1.255', 'Network broadcast address'],
          ],
        },
        {
          type: 'table',
          caption: 'Usable addresses by subnet size',
          columns: ['Prefix', 'Total addresses', 'Usable in Azure'],
          rows: [
            ['/29', '8', '3'],
            ['/28', '16', '11'],
            ['/27', '32', '27'],
            ['/26', '64', '59'],
            ['/24', '256', '251'],
          ],
        },
        {
          type: 'list',
          style: 'check',
          items: [
            'Use private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 (or 100.64.0.0/10).',
            'You can’t use 224.0.0.0/4 (multicast), 255.255.255.255/32, 127.0.0.0/8, 169.254.0.0/16 or 168.63.129.16/32.',
            'Address spaces can be added to or modified on a VNet; a subnet can be resized only when nothing is deployed in it.',
            'After changing a peered VNet’s address space, sync the peering.',
            'Some services need dedicated subnets with exact names, such as `AzureBastionSubnet` and `GatewaySubnet`.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Private subnets by default',
          text: 'For API versions released after March 31, 2026, subnets in new virtual networks are private by default: VMs have no implicit internet access and need an explicit outbound method such as a NAT gateway.',
        },
      ],
    },
    {
      id: 'challenge',
      kind: 'challenge',
      title: 'Plan an address space',
      blocks: [{ type: 'interactive', id: 'subnet-planner', intro: 'Add subnets to a VNet, see usable addresses after Azure’s reservations, and catch overlaps with a network you plan to peer.' }],
    },
    {
      id: 'configure',
      kind: 'configure',
      blocks: [
        {
          type: 'code',
          title: 'Create a VNet with subnets',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az network vnet create --resource-group rg-net --name vnet-app --location westeurope \\
  --address-prefixes 10.1.0.0/16 \\
  --subnet-name snet-web --subnet-prefixes 10.1.1.0/24

az network vnet subnet create --resource-group rg-net --vnet-name vnet-app \\
  --name snet-app --address-prefixes 10.1.2.0/24

az network vnet subnet create --resource-group rg-net --vnet-name vnet-app \\
  --name AzureBastionSubnet --address-prefixes 10.1.255.0/26`,
              notes: [
                { token: '--address-prefixes 10.1.0.0/16', note: 'The VNet address space. You can add more ranges later.' },
                { token: '--subnet-prefixes', note: 'The first subnet created with the VNet.' },
              ],
            },
            {
              lang: 'powershell',
              label: 'PowerShell',
              code: `$web = New-AzVirtualNetworkSubnetConfig -Name snet-web -AddressPrefix 10.1.1.0/24
$app = New-AzVirtualNetworkSubnetConfig -Name snet-app -AddressPrefix 10.1.2.0/24

New-AzVirtualNetwork -Name vnet-app -ResourceGroupName rg-net -Location westeurope \`
  -AddressPrefix 10.1.0.0/16 -Subnet $web, $app`,
            },
            {
              lang: 'bicep',
              label: 'Bicep',
              code: `resource vnet 'Microsoft.Network/virtualNetworks@2024-05-01' = {
  name: 'vnet-app'
  location: resourceGroup().location
  properties: {
    addressSpace: { addressPrefixes: [ '10.1.0.0/16' ] }
    subnets: [
      { name: 'snet-web', properties: { addressPrefix: '10.1.1.0/24' } }
      { name: 'snet-app', properties: { addressPrefix: '10.1.2.0/24' } }
    ]
  }
}`,
              notes: [{ token: 'subnets', note: 'Define subnets inside the VNet’s subnets property so redeployments don’t remove them.' }],
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
            { mistake: 'Giving every VNet 10.0.0.0/16.', fix: 'Allocate unique ranges per VNet from an IP plan, including on-premises ranges.' },
            { mistake: 'Creating a /28 for a scale set expected to grow to 20 instances.', fix: 'Size for growth — a /28 has only 11 usable addresses.' },
            { mistake: 'Forgetting subnets can’t be resized while in use.', fix: 'Leave spare address space and create new subnets when needed.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Subnet math appears often: subtract **5** from the total addresses. A /27 gives 27 usable, a /28 gives 11, a /29 gives 3.' },
        { type: 'quickcheck', questionIds: ['nw-subnet-usable', 'nw-vnet-overlap'] },
      ],
    },
  ],
  takeaways: [
    'A VNet lives in one region and spans its availability zones.',
    'Azure reserves five addresses per subnet; /29 is the smallest subnet.',
    'Plan non-overlapping address spaces before peering or hybrid connectivity.',
    'Subnets can be resized only when empty; VNet address spaces can be extended.',
    'New VNets’ subnets are private by default for newer API versions — plan explicit outbound access.',
  ],
};

export default lesson;
