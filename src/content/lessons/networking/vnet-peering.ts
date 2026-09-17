import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'vnet-peering',
  moduleId: 'networking',
  verified: '2026-09-14',
  sources: ['peering', 'vnet-faq', 'routing'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Connecting virtual networks privately',
      blocks: [
        {
          type: 'lead',
          text: '**Virtual network peering** connects two VNets over the Microsoft backbone so their resources communicate with private IPs — with no gateway, no public internet and near-local latency. The one rule everyone forgets: **peering isn’t transitive**.',
        },
        {
          type: 'explainer',
          technical: [
            '[[vnet-peering|Peering]] works in the same region or across regions (global peering), across subscriptions and even tenants. Address spaces must not overlap.',
            'Each peering has a link in each VNet. With only one side created, the status is **Initiated**; with both, **Connected**.',
            'If A is peered with B and B with C, **A can’t reach C** through B. Use a direct peering, or a [[hub-spoke|hub]] firewall/NVA with user-defined routes and “allow forwarded traffic”.',
          ],
          simple: [
            'Peering is a private hallway between two buildings. People walk between them as if they were one building.',
            'But a hallway from A to B and another from B to C doesn’t let someone walk from A to C — unless there’s a guard in B who escorts them (a firewall with routes).',
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'Peering isn’t transitive',
      blocks: [
        {
          type: 'flow',
          title: 'Hub-and-spoke peering',
          alt: 'Spoke A and Spoke B are each peered with the hub. Traffic from Spoke A to the hub works; traffic from Spoke A to Spoke B fails without a route through a hub appliance.',
          spec: {
            root: {
              type: 'group',
              id: 'root',
              label: 'Topology',
              kind: 'plain',
              children: [
                { type: 'group', id: 'a', label: 'vnet-spoke-a', sub: '10.1.0.0/16', kind: 'vnet', children: [{ type: 'node', id: 'vma', label: 'vm-a', sub: '10.1.1.4', icon: 'vm' }] },
                {
                  type: 'group',
                  id: 'hub',
                  label: 'vnet-hub',
                  sub: '10.0.0.0/16',
                  kind: 'vnet',
                  direction: 'col',
                  children: [
                    { type: 'node', id: 'fw', label: 'Hub firewall', sub: '10.0.100.4', icon: 'firewall', concept: 'network-virtual-appliance' },
                    { type: 'node', id: 'shared', label: 'Shared services', sub: '10.0.1.10', icon: 'server' },
                  ],
                },
                { type: 'group', id: 'b', label: 'vnet-spoke-b', sub: '10.2.0.0/16', kind: 'vnet', children: [{ type: 'node', id: 'vmb', label: 'vm-b', sub: '10.2.1.4', icon: 'vm' }] },
              ],
            },
            edges: [
              { from: 'a', to: 'hub', label: 'peering', both: true, tone: 'allow' },
              { from: 'hub', to: 'b', label: 'peering', both: true, tone: 'allow' },
            ],
            flows: [
              { id: 'ok', label: 'Spoke A → hub', path: ['vma', 'shared'], tone: 'allow', description: 'Directly peered networks communicate with private IPs.' },
              { id: 'fail', label: 'Spoke A → Spoke B (no routes)', path: ['vma', 'vmb'], tone: 'deny', description: 'Fails: Spoke A has no route to 10.2.0.0/16. Peering doesn’t pass traffic through the hub.' },
              { id: 'fixed', label: 'Spoke A → Spoke B via firewall', path: ['vma', 'fw', 'vmb'], tone: 'data', description: 'Works with UDRs in both spokes pointing the other spoke’s range to the hub firewall, **allow forwarded traffic** on the peerings, and IP forwarding on the firewall.' },
            ],
          },
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Peering settings',
      blocks: [
        {
          type: 'table',
          columns: ['Setting (API name)', 'Effect', 'Where'],
          rows: [
            ['Allow access to remote VNet (`allowVirtualNetworkAccess`)', 'Enables communication between the VNets', 'Both sides (default on)'],
            ['Allow forwarded traffic (`allowForwardedTraffic`)', 'Accepts traffic that didn’t originate in the peered VNet, e.g. forwarded by an NVA', 'The VNet receiving forwarded traffic'],
            ['Allow gateway transit (`allowGatewayTransit`)', 'Lets the peer use this VNet’s VPN/ExpressRoute gateway', 'Hub (has the gateway)'],
            ['Use remote gateways (`useRemoteGateways`)', 'Uses the peer’s gateway instead of its own', 'Spoke (must not have its own gateway)'],
          ],
        },
        {
          type: 'list',
          style: 'check',
          items: [
            'Up to 500 peerings per VNet by default.',
            'NSGs still apply to peered traffic.',
            'After changing a peered VNet’s address space, **sync** the peering on the other side.',
            'You can’t move a peered VNet to another resource group or subscription without deleting the peering first.',
            'Peering is free to create; data transferred across peerings is charged.',
          ],
        },
      ],
    },
    {
      id: 'challenge',
      kind: 'challenge',
      title: 'Test connectivity',
      blocks: [{ type: 'interactive', id: 'peering-simulator', intro: 'Create or remove peerings between three VNets, add a hub router, and test which VMs can reach each other.' }],
    },
    {
      id: 'configure',
      kind: 'configure',
      blocks: [
        {
          type: 'code',
          title: 'Peer a hub and a spoke with gateway transit',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `hubId=$(az network vnet show -g rg-hub -n vnet-hub --query id -o tsv)
spokeId=$(az network vnet show -g rg-spoke -n vnet-spoke-a --query id -o tsv)

# Hub side: allow the spoke to use the hub's VPN gateway
az network vnet peering create --resource-group rg-hub --vnet-name vnet-hub \\
  --name hub-to-spoke-a --remote-vnet $spokeId \\
  --allow-vnet-access --allow-forwarded-traffic --allow-gateway-transit

# Spoke side: use the hub's gateway
az network vnet peering create --resource-group rg-spoke --vnet-name vnet-spoke-a \\
  --name spoke-a-to-hub --remote-vnet $hubId \\
  --allow-vnet-access --allow-forwarded-traffic --use-remote-gateways

az network vnet peering show --resource-group rg-hub --vnet-name vnet-hub \\
  --name hub-to-spoke-a --query peeringState`,
              notes: [
                { token: '--remote-vnet', note: 'Use the resource ID when the remote VNet is in another resource group or subscription.' },
                { token: '--use-remote-gateways', note: 'Requires the remote side to allow gateway transit and to have a gateway.' },
                { token: 'peeringState', note: '`Initiated` until both sides exist, then `Connected`.' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'troubleshoot',
      kind: 'troubleshoot',
      title: 'Peered VMs can’t talk',
      blocks: [
        {
          type: 'steps',
          steps: [
            { title: 'Check the peering state', detail: 'Both peerings must be **Connected**. Initiated means the other side is missing; Disconnected means one side was deleted — delete and recreate both.' },
            { title: 'Check effective routes', detail: 'The source NIC should show the remote address space with next hop type **Virtual network peering** (or a UDR to your appliance).' },
            { title: 'Check NSGs', detail: 'Use IP flow verify on both VMs; NSGs filter peered traffic like any other.' },
            { title: 'Check for transitive assumptions', detail: 'Traffic between spokes needs a direct peering or a routed path through a hub appliance.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'trap', text: 'The classic question: A↔B and B↔C are peered. Can A reach C? **No.** Also: peering fails when address spaces overlap.' },
        { type: 'quickcheck', questionIds: ['nw-peering-transitive', 'nw-peering-gateway-transit'] },
      ],
    },
  ],
  takeaways: [
    'Peering connects VNets privately across regions, subscriptions and tenants — without overlapping address spaces.',
    'Peering isn’t transitive; use direct peerings or a hub appliance with UDRs.',
    'Hub: allow gateway transit. Spoke: use remote gateways.',
    'Both sides must be created for the Connected state.',
    'Sync peerings after changing address spaces.',
  ],
};

export default lesson;
