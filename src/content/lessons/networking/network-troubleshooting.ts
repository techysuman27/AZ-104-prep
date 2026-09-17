import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'network-troubleshooting',
  moduleId: 'networking',
  verified: '2026-09-14',
  sources: ['network-watcher', 'nsg-overview', 'routing', 'private-endpoint-dns', 'default-outbound'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'A method, not guesswork',
      blocks: [
        {
          type: 'lead',
          text: 'Connectivity problems feel mysterious because networks are invisible. They become routine when you check the same stages in the same order — and use the right **Network Watcher** tool for each.',
        },
        {
          type: 'explainer',
          technical: [
            '[[network-watcher|Network Watcher]] is enabled per region when you create a VNet. Its diagnostic tools map to the stages of a connection: name resolution, routing, filtering, and the destination itself.',
            '**IP flow verify** and **NSG diagnostics** explain filtering; **Next hop** and **effective routes** explain routing; **Connection troubleshoot** tests the whole path; **Packet capture** records traffic on a VM.',
          ],
          simple: [
            'Think of sending a parcel: is the address right (DNS)? Which roads does it take (routing)? Does a checkpoint stop it (NSG or firewall)? Is someone at the destination to receive it (the service)?',
            'Network Watcher gives you a tool for each question.',
          ],
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'The five-stage method',
      blocks: [
        {
          type: 'steps',
          steps: [
            { title: '1 · Is the source healthy?', detail: 'VM running, NIC has the expected IP, and (for outbound internet) the subnet has explicit outbound access.' },
            { title: '2 · Does the name resolve correctly?', detail: 'Run nslookup. Private endpoints should resolve to private IPs; check private DNS zone links and custom DNS servers.' },
            { title: '3 · Where does the packet go?', detail: 'Run **Next hop** or view the NIC’s **Effective routes**. Look for UDRs to None or to an appliance, and missing peering routes.' },
            { title: '4 · Is it allowed?', detail: 'Run **IP flow verify** on the source (outbound) and destination (inbound). Check subnet and NIC NSGs, firewalls and PaaS network rules.' },
            { title: '5 · Is the destination listening?', detail: 'Use **Connection troubleshoot** for an end-to-end test; check the service, its port, OS firewall and load balancer probes.' },
          ],
        },
        {
          type: 'table',
          caption: 'Pick the right Network Watcher tool',
          columns: ['Question', 'Tool'],
          rows: [
            ['Is this packet allowed or denied, and by which NSG rule?', 'IP flow verify'],
            ['What’s the next hop for traffic to this IP?', 'Next hop'],
            ['Which NSG rules apply to this NIC in total?', 'Effective security rules'],
            ['Can this VM reach that endpoint right now?', 'Connection troubleshoot'],
            ['What exactly is on the wire?', 'Packet capture'],
            ['Keep testing latency and failures over time', 'Connection monitor'],
            ['Log traffic flows for analysis', 'Virtual network flow logs (+ traffic analytics)'],
            ['Is the VPN gateway or connection healthy?', 'VPN troubleshoot'],
            ['What does the network look like?', 'Topology'],
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'NSG flow logs can no longer be created and retire on September 30, 2027. Use virtual network flow logs for new traffic logging.',
        },
      ],
    },
    {
      id: 'example',
      kind: 'example',
      title: 'Tools in action',
      blocks: [
        {
          type: 'code',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# Filtering: is inbound TCP 1433 from the app VM allowed on the database VM?
az network watcher test-ip-flow --resource-group rg-app --vm vm-db01 \\
  --direction Inbound --protocol TCP --local 10.1.3.4:1433 --remote 10.1.2.4:50123

# Routing: where does traffic from the app VM to 10.2.1.4 go?
az network watcher show-next-hop --resource-group rg-app --vm vm-app01 \\
  --source-ip 10.1.2.4 --dest-ip 10.2.1.4

# End to end: can the app VM connect to the database port?
az network watcher test-connectivity --resource-group rg-app \\
  --source-resource vm-app01 --dest-address 10.1.3.4 --dest-port 1433`,
              notes: [
                { token: 'test-ip-flow', note: 'Returns Allow or Deny and the name of the matching NSG rule.' },
                { token: 'show-next-hop', note: 'Returns the next hop type (for example VirtualAppliance, Internet, None) and route table ID.' },
                { token: 'test-connectivity', note: 'Connection troubleshoot: reports reachability, latency and hops.' },
              ],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Practise the method in the **Troubleshooting simulations** in Labs: each gives you a broken environment and the same tools.',
        },
      ],
    },
    {
      id: 'scenario',
      kind: 'scenario',
      blocks: [
        {
          type: 'scenario',
          company: 'Woodgrove Bank',
          context: 'After a change window, the loan application in spoke A can’t reach its API in spoke B. Both spokes are peered with a hub containing a firewall.',
          problem: 'The application team says “the network is broken”; the network team says “nothing changed on the firewall”.',
          approach: [
            'Run **Next hop** from the app VM to the API IP: next hop type **None** from route table rt-spoke-a.',
            'Inspect the route table: during the change, the route for 10.2.0.0/16 was edited from Virtual appliance to None by mistake.',
            'Correct the route to next hop Virtual appliance 10.0.100.4 and rerun Next hop.',
            'Run **Connection troubleshoot** to confirm the end-to-end path succeeds.',
          ],
          outcome: 'Root cause found in minutes with evidence, instead of hours of finger-pointing.',
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Tool-selection questions are common: “which NSG rule is blocking” → IP flow verify; “routing problem” → Next hop; “ongoing monitoring” → Connection monitor; “capture packets” → Packet capture.' },
        { type: 'quickcheck', questionIds: ['nw-watcher-tools', 'nw-troubleshoot-order'] },
      ],
    },
  ],
  takeaways: [
    'Troubleshoot in stages: source, DNS, routing, filtering, destination.',
    'IP flow verify → NSG decision; Next hop → routing; Connection troubleshoot → end-to-end test.',
    'Connection monitor provides continuous monitoring; VNet flow logs record traffic.',
    'NSG flow logs are retiring — use virtual network flow logs.',
  ],
};

export default lesson;
