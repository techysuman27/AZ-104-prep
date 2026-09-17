import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'routing-udr',
  moduleId: 'networking',
  verified: '2026-09-14',
  sources: ['routing', 'network-watcher', 'peering', 'default-outbound'],
  changes: [
    {
      topic: 'User-defined routes in the outline',
      previously: 'Older outlines described “Configure user-defined network routes”.',
      now: 'The April 2026 outline says “Configure user-defined routes”.',
      matters: 'Same skill: route tables, next hop types and troubleshooting effective routes.',
    },
  ],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Deciding where traffic goes next',
      blocks: [
        {
          type: 'lead',
          text: 'NSGs decide **whether** traffic is allowed. Routes decide **where** it goes. Azure creates system routes automatically; **user-defined routes (UDRs)** in a route table override them — most often to send traffic through a firewall.',
        },
        {
          type: 'explainer',
          technical: [
            'Every subnet has **system routes**: the VNet address space → Virtual network; `0.0.0.0/0` → Internet; some private ranges → None. Peering, gateways and service endpoints add optional system routes.',
            'A [[route-table|route table]] holds UDRs and is associated with subnets (each subnet has zero or one route table). UDR next hop types: **Virtual appliance**, **Virtual network gateway**, **None**, **Virtual network**, **Internet**.',
            'Azure picks the route with the **longest prefix match**. For identical prefixes, a UDR wins over BGP, which wins over system routes.',
          ],
          simple: [
            'Routes are road signs at each junction. Azure puts up default signs: “local traffic this way, internet that way”.',
            'A route table replaces signs you choose — for example “all internet traffic must go through the security checkpoint first”.',
            'When two signs could apply, the more specific one wins: “10.1.5.0/24 → checkpoint” beats “10.1.0.0/16 → local”.',
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'Forced tunneling through a firewall',
      blocks: [
        {
          type: 'flow',
          title: 'Spoke traffic inspected in the hub',
          alt: 'A spoke subnet route table sends 0.0.0.0/0 to a firewall appliance in the hub. Internet-bound traffic from the spoke VM goes to the firewall, which forwards it to the internet.',
          spec: {
            root: {
              type: 'group',
              id: 'root',
              label: 'Routing',
              kind: 'plain',
              children: [
                {
                  type: 'group',
                  id: 'spoke',
                  label: 'vnet-spoke · 10.2.0.0/16',
                  kind: 'vnet',
                  children: [
                    {
                      type: 'group',
                      id: 'snet',
                      label: 'snet-app',
                      sub: 'rt-app: 0.0.0.0/0 → 10.0.100.4',
                      kind: 'subnet',
                      children: [{ type: 'node', id: 'vm', label: 'vm-app', sub: '10.2.1.4', icon: 'vm' }],
                    },
                  ],
                },
                {
                  type: 'group',
                  id: 'hub',
                  label: 'vnet-hub · 10.0.0.0/16',
                  kind: 'vnet',
                  children: [
                    {
                      type: 'group',
                      id: 'fwsnet',
                      label: 'snet-firewall',
                      kind: 'subnet',
                      children: [{ type: 'node', id: 'fw', label: 'Firewall appliance', sub: '10.0.100.4 · IP forwarding on', icon: 'firewall', concept: 'network-virtual-appliance', detail: 'A VM-based appliance needs IP forwarding enabled on its NIC and in the OS to pass traffic not addressed to itself.' }],
                    },
                  ],
                },
                { type: 'node', id: 'inet', label: 'Internet', icon: 'internet' },
              ],
            },
            edges: [
              { from: 'vm', to: 'fw', label: 'UDR: VirtualAppliance', tone: 'data' },
              { from: 'fw', to: 'inet', label: 'inspected', tone: 'allow' },
            ],
            flows: [{ id: 'force', label: 'VM browses the internet', path: ['vm', 'fw', 'inet'], tone: 'data', description: 'The UDR 0.0.0.0/0 → 10.0.100.4 overrides the system Internet route, so traffic is inspected by the firewall first (forced tunneling).' }],
          },
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Next hop types',
      blocks: [
        {
          type: 'table',
          columns: ['Next hop type (CLI value)', 'What it does', 'Typical use'],
          rows: [
            ['Virtual appliance (`VirtualAppliance`)', 'Sends traffic to a private IP: an NVA NIC or internal load balancer', 'Firewall inspection, hub-and-spoke transit'],
            ['Virtual network gateway (`VirtualNetworkGateway`)', 'Sends traffic to the VPN gateway', 'Force traffic to on-premises'],
            ['None (`None`)', 'Drops the traffic', 'Block a destination'],
            ['Virtual network (`VNetLocal`)', 'Keeps traffic within the VNet', 'Override a broader route for a subnet range'],
            ['Internet (`Internet`)', 'Sends traffic to the internet', 'Exceptions to forced tunneling'],
          ],
        },
        {
          type: 'list',
          style: 'check',
          items: [
            'Up to 400 routes per route table by default.',
            'Virtual network peering and service endpoints can’t be chosen as UDR next hops.',
            'Put the appliance in a different subnet from the resources whose traffic it inspects to avoid routing loops.',
            'Don’t add a 0.0.0.0/0 UDR to GatewaySubnet.',
          ],
        },
      ],
    },
    {
      id: 'challenge',
      kind: 'challenge',
      title: 'Find the next hop',
      blocks: [{ type: 'interactive', id: 'route-simulator', intro: 'Combine system routes and UDRs, enter a destination address, and see which route wins by longest prefix match.' }],
    },
    {
      id: 'configure',
      kind: 'configure',
      blocks: [
        {
          type: 'code',
          title: 'Route a subnet through a firewall',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az network route-table create --resource-group rg-net --name rt-app

az network route-table route create --resource-group rg-net --route-table-name rt-app \\
  --name default-via-firewall --address-prefix 0.0.0.0/0 \\
  --next-hop-type VirtualAppliance --next-hop-ip-address 10.0.100.4

az network vnet subnet update --resource-group rg-net --vnet-name vnet-spoke \\
  --name snet-app --route-table rt-app

# The appliance NIC must forward traffic
az network nic update --resource-group rg-net --name nic-fw01 --ip-forwarding true

# Verify from the VM's perspective
az network nic show-effective-route-table --resource-group rg-net --name nic-app01 --output table
az network watcher show-next-hop --resource-group rg-net --vm vm-app \\
  --source-ip 10.2.1.4 --dest-ip 8.8.8.8`,
              notes: [
                { token: '--next-hop-type VirtualAppliance', note: 'Requires --next-hop-ip-address.' },
                { token: '--ip-forwarding true', note: 'Allows the NIC to forward packets not addressed to it.' },
                { token: 'show-next-hop', note: 'Network Watcher Next hop: returns the next hop type, IP and route table used.' },
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
            { mistake: 'Routing to an NVA without enabling IP forwarding on its NIC.', fix: 'Enable IP forwarding in Azure and in the appliance’s OS.' },
            { mistake: 'Adding a UDR with next hop None for 0.0.0.0/0 to “block the internet” and breaking platform connectivity you still need.', fix: 'Route through a firewall with allow rules, or use NSG outbound rules for targeted blocking.' },
            { mistake: 'Associating the route table with the wrong subnet.', fix: 'Route tables affect traffic leaving the associated subnet. Check Effective routes on the source NIC.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Route questions usually test longest prefix match, the effect of next hop None, and the tool for diagnosis: **Next hop** (Network Watcher) or **Effective routes** on the NIC.' },
        { type: 'quickcheck', questionIds: ['nw-route-longest-prefix', 'nw-udr-nva'] },
      ],
    },
  ],
  takeaways: [
    'System routes exist automatically; UDRs in a route table override them per subnet.',
    'Next hops: Virtual appliance, Virtual network gateway, None, Virtual network, Internet.',
    'Longest prefix match wins; for equal prefixes UDR > BGP > system route.',
    'NVAs need IP forwarding enabled.',
    'Diagnose with Next hop and Effective routes.',
  ],
};

export default lesson;
