import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'effective-security-rules',
  moduleId: 'networking',
  verified: '2026-09-14',
  sources: ['nsg-overview', 'vnet-faq', 'network-watcher'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Two NSGs, one verdict',
      blocks: [
        {
          type: 'lead',
          text: 'A VM can be protected by an NSG on its **subnet** and another on its **NIC**. Traffic must be allowed by **both**, and the order they’re checked depends on direction.',
        },
        {
          type: 'explainer',
          technical: [
            '**Inbound**: the subnet NSG is evaluated first, then the NIC NSG. **Outbound**: the NIC NSG first, then the subnet NSG.',
            'If either NSG denies the traffic (explicitly or through its default DenyAll rule), it’s dropped. If a level has no NSG, that level allows everything.',
            '[[effective-security-rules|Effective security rules]] show the combined result for a NIC, and **IP flow verify** tells you which rule allows or denies a specific packet.',
          ],
          simple: [
            'Imagine a building with a front gate (subnet NSG) and an apartment door (NIC NSG).',
            'Coming in, you pass the gate and then the door. Going out, you leave the apartment first, then the gate.',
            'Either one can stop you.',
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'Watch the packet',
      blocks: [
        {
          type: 'flow',
          title: 'Inbound RDP to a VM protected by two NSGs',
          alt: 'An administrator sends RDP to a VM. The packet passes the subnet NSG, which allows 3389 from the office, then reaches the NIC NSG, which has no rule for 3389 and is denied by DenyAllInbound.',
          spec: {
            root: {
              type: 'group',
              id: 'root',
              label: 'Evaluation',
              kind: 'plain',
              children: [
                { type: 'node', id: 'admin', label: 'Office admin', sub: '203.0.113.20', icon: 'laptop' },
                {
                  type: 'group',
                  id: 'vnet',
                  label: 'vnet-app',
                  kind: 'vnet',
                  children: [
                    {
                      type: 'group',
                      id: 'subnet',
                      label: 'snet-app',
                      kind: 'subnet',
                      children: [
                        { type: 'node', id: 'snsg', label: 'Subnet NSG', sub: '100 Allow 3389 from office', icon: 'nsg', tone: 'good', concept: 'nsg', detail: 'Rule 100 allows TCP 3389 from 203.0.113.0/24, so the packet continues to the NIC.' },
                        { type: 'node', id: 'nnsg', label: 'NIC NSG', sub: 'Only allows 443', icon: 'nsg', tone: 'bad', detail: 'No rule matches TCP 3389, so DenyAllInbound (65500) drops the packet.' },
                        { type: 'node', id: 'vm', label: 'vm-app01', icon: 'vm' },
                      ],
                    },
                  ],
                },
              ],
            },
            edges: [
              { from: 'admin', to: 'snsg', label: 'TCP 3389', tone: 'data' },
              { from: 'snsg', to: 'nnsg', label: 'allowed', tone: 'allow' },
              { from: 'nnsg', to: 'vm', label: 'denied', tone: 'deny' },
            ],
            flows: [{ id: 'rdp', label: 'Inbound RDP', path: ['admin', 'snsg', 'nnsg'], tone: 'deny', description: 'Allowed by the subnet NSG, **denied by the NIC NSG**. Inbound traffic must pass both — fix it with an allow rule on the NIC NSG (or remove the NIC NSG).' }],
          },
        },
      ],
    },
    {
      id: 'challenge',
      kind: 'challenge',
      title: 'Evaluate rules yourself',
      blocks: [{ type: 'interactive', id: 'nsg-evaluator', intro: 'Edit the subnet and NIC NSG rules, send inbound or outbound packets, and follow the evaluation step by step.' }],
    },
    {
      id: 'configure',
      kind: 'configure',
      title: 'Check what really applies',
      blocks: [
        {
          type: 'code',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# Combined NSG rules applied to a NIC (subnet + NIC)
az network nic list-effective-nsg --resource-group rg-net --name nic-app01

# Is TCP 3389 from the office allowed into the VM? Which rule decides?
az network watcher test-ip-flow --resource-group rg-net --vm vm-app01 \\
  --direction Inbound --protocol TCP \\
  --local 10.1.2.4:3389 --remote 203.0.113.20:50000`,
              notes: [
                { token: 'list-effective-nsg', note: 'Requires the VM to be running.' },
                { token: '--local / --remote', note: 'IP:port on the VM side and on the remote side of the flow.' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'trap', text: 'Watch the direction. Outbound traffic is checked against the NIC NSG first, then the subnet NSG — the reverse of inbound.' },
        { type: 'quickcheck', questionIds: ['nw-effective-two-nsgs', 'nw-ip-flow-verify'] },
      ],
    },
  ],
  takeaways: [
    'Inbound: subnet NSG, then NIC NSG. Outbound: NIC NSG, then subnet NSG.',
    'Traffic must be allowed at every level that has an NSG.',
    'Effective security rules combine both NSGs for a NIC.',
    'IP flow verify names the rule that allows or denies a specific packet.',
  ],
};

export default lesson;
