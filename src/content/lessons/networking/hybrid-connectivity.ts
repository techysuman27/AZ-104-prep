import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'hybrid-connectivity',
  moduleId: 'networking',
  verified: '2026-09-14',
  sources: ['peering', 'routing', 'private-endpoint-dns'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Context: reaching Azure from on-premises',
      blocks: [
        {
          type: 'lead',
          text: 'Hybrid connectivity isn’t a separate skill in the current AZ-104 outline, but it shows up inside other topics — **gateway transit** in peering, **next hop Virtual network gateway** in routing, and **DNS forwarding** for private endpoints. This short lesson gives you the context.',
        },
        {
          type: 'callout',
          variant: 'note',
          text: 'Marked **Beyond the exam**: learn the concepts here, but don’t expect detailed VPN or ExpressRoute configuration questions from the AZ-104 outline.',
        },
        {
          type: 'compare',
          items: [
            { name: 'VPN Gateway', bestFor: 'Encrypted connectivity over the internet', points: ['Site-to-site connects networks; point-to-site connects individual clients', 'Deployed in a subnet named GatewaySubnet', 'Spokes can share it through gateway transit'] },
            { name: 'ExpressRoute', bestFor: 'Private, dedicated connectivity through a provider', points: ['Doesn’t traverse the public internet', 'Predictable performance for demanding workloads', 'Also shared with spokes through gateway transit'] },
          ],
        },
      ],
    },
    {
      id: 'connections',
      kind: 'connections',
      title: 'Where hybrid connectivity touches the exam',
      blocks: [
        {
          type: 'list',
          style: 'check',
          items: [
            '**Peering**: the hub allows gateway transit; spokes use remote gateways, so one [[vpn-gateway|gateway]] serves every spoke.',
            '**Routing**: a UDR with next hop **Virtual network gateway** sends traffic to on-premises through the VPN gateway.',
            '**Private endpoints**: on-premises clients need DNS forwarding to resolve `privatelink` zones.',
            '**Storage firewall and Azure Files**: on-premises access is typically routed privately to a [[private-endpoint|private endpoint]] instead of the public endpoint on port 445.',
          ],
        },
      ],
    },
  ],
  takeaways: [
    'VPN Gateway provides encrypted tunnels over the internet; ExpressRoute provides private connectivity through a provider.',
    'Gateways live in GatewaySubnet and can be shared with peered spokes through gateway transit.',
    'On-premises access to private endpoints depends on DNS forwarding.',
  ],
};

export default lesson;
