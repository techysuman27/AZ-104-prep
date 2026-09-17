import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'azure-bastion',
  moduleId: 'networking',
  verified: '2026-09-14',
  sources: ['bastion-config', 'nsg-overview'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Administer VMs without exposing them',
      blocks: [
        {
          type: 'lead',
          text: 'Public RDP and SSH ports are scanned and attacked constantly. **Azure Bastion** lets administrators reach VMs over TLS from the Azure portal — so the VMs don’t need public IP addresses at all.',
        },
        {
          type: 'explainer',
          technical: [
            '[[bastion|Azure Bastion]] is deployed into a subnet named exactly **AzureBastionSubnet** (/26 or larger) in the VNet. Most SKUs need a **Standard, static** public IP.',
            'Users connect from the portal over HTTPS (443) to Bastion, which opens RDP (3389) or SSH (22) to the VM’s private IP — including VMs in peered VNets.',
            'SKUs: **Developer**, **Basic**, **Standard** (host scaling, custom ports, shareable links, native client) and **Premium** (adds session recording and private-only deployment).',
          ],
          simple: [
            'Bastion is a secure reception desk for your servers. You check in through the Azure portal, and reception connects you to the right server privately.',
            'The servers never need an outside door facing the internet.',
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      blocks: [
        {
          type: 'flow',
          title: 'Connecting through Bastion',
          alt: 'An administrator connects to the Azure portal over HTTPS; Azure Bastion in AzureBastionSubnet opens RDP to a VM with no public IP in a workload subnet.',
          spec: {
            root: {
              type: 'group',
              id: 'root',
              label: 'Path',
              kind: 'plain',
              children: [
                { type: 'node', id: 'admin', label: 'Administrator', sub: 'Browser', icon: 'laptop' },
                {
                  type: 'group',
                  id: 'vnet',
                  label: 'vnet-hub',
                  kind: 'vnet',
                  children: [
                    { type: 'group', id: 'bsn', label: 'AzureBastionSubnet', sub: '/26', kind: 'subnet', children: [{ type: 'node', id: 'bas', label: 'Azure Bastion', sub: 'Standard public IP', icon: 'bastion', concept: 'bastion' }] },
                    { type: 'group', id: 'wl', label: 'snet-servers', sub: 'NSG allows 3389/22 from Bastion subnet', kind: 'subnet', children: [{ type: 'node', id: 'vm', label: 'vm-sql01', sub: 'No public IP', icon: 'vm' }] },
                  ],
                },
              ],
            },
            edges: [
              { from: 'admin', to: 'bas', label: 'TLS 443', tone: 'allow' },
              { from: 'bas', to: 'vm', label: 'RDP 3389 (private)', tone: 'allow' },
            ],
            flows: [{ id: 'rdp', label: 'Open an RDP session', path: ['admin', 'bas', 'vm'], tone: 'allow', description: 'The only internet-facing endpoint is Bastion on 443. The VM is reached on its private IP.' }],
          },
        },
      ],
    },
    {
      id: 'compare',
      kind: 'compare',
      title: 'Bastion SKUs',
      blocks: [
        {
          type: 'table',
          columns: ['Capability', 'Developer', 'Basic', 'Standard', 'Premium'],
          rows: [
            ['Portal RDP/SSH to VMs', 'Yes', 'Yes', 'Yes', 'Yes'],
            ['Dedicated AzureBastionSubnet and public IP', 'Not required', 'Required', 'Required', 'Required (unless private-only)'],
            ['Host scaling', 'No', 'No', 'Yes', 'Yes'],
            ['Custom ports', 'No', 'No', 'Yes', 'Yes'],
            ['Native client support', 'No', 'No', 'Yes', 'Yes'],
            ['Shareable link', 'No', 'No', 'Yes', 'Yes'],
            ['Session recording', 'No', 'No', 'No', 'Yes'],
            ['Private-only deployment', 'No', 'No', 'No', 'Yes'],
          ],
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      blocks: [
        {
          type: 'code',
          title: 'Deploy Bastion',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az network vnet subnet create --resource-group rg-hub --vnet-name vnet-hub \\
  --name AzureBastionSubnet --address-prefixes 10.0.255.0/26

az network public-ip create --resource-group rg-hub --name pip-bastion --sku Standard --allocation-method Static

az network bastion create --resource-group rg-hub --name bas-hub --location westeurope \\
  --vnet-name vnet-hub --public-ip-address pip-bastion --sku Standard

# Standard or Premium: connect with the native Windows RDP client
az network bastion rdp --name bas-hub --resource-group rg-hub --target-resource-id <vm-resource-id>`,
              notes: [
                { token: 'AzureBastionSubnet', note: 'The name is mandatory and case-sensitive in practice; size /26 or larger.' },
                { token: '--sku Standard', note: 'Required for native client connections, host scaling and shareable links.' },
              ],
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
            { mistake: 'Creating a /27 subnet or naming it “BastionSubnet”.', fix: 'Use exactly AzureBastionSubnet, /26 or larger.' },
            { mistake: 'Denying inbound 3389/22 on the VM subnet from all sources, including the Bastion subnet.', fix: 'Allow RDP/SSH from the AzureBastionSubnet address range.' },
            { mistake: 'Choosing Basic when administrators want to use their local RDP client.', fix: 'Native client support requires Standard or higher.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Memorize the subnet requirements (name AzureBastionSubnet, /26 or larger) and which features need Standard or Premium.' },
        { type: 'quickcheck', questionIds: ['nw-bastion-subnet', 'nw-bastion-sku'] },
      ],
    },
  ],
  takeaways: [
    'Bastion provides RDP/SSH over TLS so VMs need no public IPs.',
    'Subnet must be named AzureBastionSubnet and be /26 or larger.',
    'Most SKUs need a Standard static public IP.',
    'Standard adds host scaling, custom ports, native client and shareable links; Premium adds session recording and private-only deployment.',
    'VM subnet NSGs must allow RDP/SSH from the Bastion subnet.',
  ],
};

export default lesson;
