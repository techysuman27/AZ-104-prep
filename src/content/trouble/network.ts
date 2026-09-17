import type { TroubleScenario } from '../schema';

/**
 * Networking troubleshooting simulations. Each one hands the learner a ticket
 * and a set of diagnostic tools; exactly one tool carries the decisive clue, so
 * the score reflects whether they reasoned or guessed.
 */
export const NETWORK_SCENARIOS: TroubleScenario[] = [
  // ---------------------------------------------------------------- scenario 1
  {
    id: 'ts-nsg-priority',
    title: 'The web server nobody can reach',
    summary: 'A new web tier returns nothing from the internet, although the application responds perfectly from inside the VM.',
    difficulty: 1,
    area: 'networking',
    ticket: {
      from: 'Priya, application developer',
      message:
        'We deployed the new marketing site to vm-web01 this morning. It works if I curl localhost from inside the VM, but nobody outside can reach it. The NSG definitely has an allow rule for port 80 — I added it myself.',
    },
    environment: {
      root: {
        type: 'group',
        id: 'sub',
        label: 'Subscription',
        kind: 'subscription',
        direction: 'col',
        children: [
          {
            type: 'group',
            id: 'vnet',
            label: 'vnet-prod',
            sub: '10.0.0.0/16',
            kind: 'vnet',
            concept: 'vnet',
            direction: 'col',
            children: [
              {
                type: 'group',
                id: 'snet-web',
                label: 'snet-web',
                sub: '10.0.1.0/24 · nsg-web attached',
                kind: 'subnet',
                concept: 'subnet',
                direction: 'row',
                children: [
                  { type: 'node', id: 'vm', label: 'vm-web01', sub: 'nginx on :80', icon: 'vm', concept: 'virtual-machine' },
                  { type: 'node', id: 'nsg', label: 'nsg-web', sub: 'subnet-level', icon: 'nsg', tone: 'warn', concept: 'nsg' },
                ],
              },
            ],
          },
          { type: 'node', id: 'pip', label: 'pip-web01', sub: 'Standard · static', icon: 'public-ip', concept: 'public-ip' },
          { type: 'node', id: 'net', label: 'Internet', icon: 'internet' },
        ],
      },
      edges: [
        { from: 'net', to: 'pip', label: 'TCP 80' },
        { from: 'pip', to: 'nsg', label: 'evaluated here', tone: 'deny' },
        { from: 'nsg', to: 'vm', style: 'dashed', tone: 'muted' },
      ],
      flows: [{ id: 'request', label: 'Inbound HTTP request', path: ['net', 'pip', 'nsg', 'vm'], tone: 'deny' }],
    },
    tools: [
      {
        id: 'nsg-rules',
        label: 'NSG rules (nsg-web)',
        group: 'Configuration',
        description: 'All inbound rules on the NSG attached to snet-web, in priority order.',
        clue: true,
        output: {
          kind: 'table',
          columns: ['Priority', 'Name', 'Port', 'Source', 'Action'],
          rows: [
            ['100', 'DenyAllCustom', 'Any', 'Any', 'Deny'],
            ['200', 'AllowHttp', '80', 'Internet', 'Allow'],
            ['65000', 'AllowVnetInBound', 'Any', 'VirtualNetwork', 'Allow'],
            ['65001', 'AllowAzureLoadBalancerInBound', 'Any', 'AzureLoadBalancer', 'Allow'],
            ['65500', 'DenyAllInBound', 'Any', 'Any', 'Deny'],
          ],
          highlight: [0],
          note: 'Rules are evaluated lowest priority number first, and the first match wins.',
        },
      },
      {
        id: 'ip-flow',
        label: 'IP flow verify',
        group: 'Network Watcher',
        description: 'Evaluate whether inbound TCP 80 from a public address would reach vm-web01.',
        output: {
          kind: 'kv',
          items: [
            { k: 'Direction', v: 'Inbound' },
            { k: 'Protocol / port', v: 'TCP 80' },
            { k: 'Result', v: 'Denied', tone: 'bad' },
            { k: 'Matched rule', v: 'DenyAllCustom (priority 100)', tone: 'bad' },
          ],
        },
      },
      {
        id: 'guest',
        label: 'Check the guest',
        group: 'Client',
        description: 'Run a command inside the VM to confirm the application is listening.',
        output: {
          kind: 'lines',
          lines: [
            '$ curl -s -o /dev/null -w "%{http_code}" http://localhost/',
            '200',
            '$ ss -tlnp | grep :80',
            'LISTEN 0 511 0.0.0.0:80 0.0.0.0:* users:(("nginx",pid=812,fd=6))',
          ],
          note: 'The application is healthy and listening on all interfaces.',
        },
      },
      {
        id: 'pip-config',
        label: 'Public IP configuration',
        group: 'Configuration',
        description: 'SKU, allocation and association of the public IP address.',
        output: {
          kind: 'kv',
          items: [
            { k: 'SKU', v: 'Standard' },
            { k: 'Allocation', v: 'Static' },
            { k: 'Associated with', v: 'nic-web01 (vm-web01)', tone: 'good' },
          ],
        },
      },
    ],
    causes: [
      {
        id: 'c1',
        text: 'A deny rule at priority 100 matches before the allow rule at priority 200',
        correct: true,
        feedback: 'Correct. NSG evaluation stops at the first match, and 100 is evaluated before 200 — so the allow rule is never reached.',
      },
      {
        id: 'c2',
        text: 'The application is not listening on the right interface',
        feedback: 'The guest check shows nginx listening on 0.0.0.0:80 and returning 200 locally, so the guest is fine.',
      },
      {
        id: 'c3',
        text: 'The public IP is not associated with the VM’s NIC',
        feedback: 'The public IP configuration shows it associated with nic-web01.',
      },
      {
        id: 'c4',
        text: 'Standard SKU public IPs cannot serve HTTP traffic',
        feedback: 'They can. Standard IPs are simply closed by default and need an NSG allow rule that actually takes effect.',
      },
    ],
    fixes: [
      {
        id: 'f1',
        text: 'Give AllowHttp a lower priority number than DenyAllCustom — for example 90',
        correct: true,
        feedback: 'Correct. Moving the allow rule ahead of the deny rule makes it the first match for port 80, while the deny rule still catches everything else.',
      },
      {
        id: 'f2',
        text: 'Delete the NSG from the subnet',
        feedback: 'It would work, and it would also remove every other protection on the subnet. Fix the rule order instead.',
      },
      {
        id: 'f3',
        text: 'Add the same allow rule to the NIC-level NSG',
        feedback: 'Inbound traffic is evaluated at the subnet first. The subnet deny still stops it before the NIC rules are consulted.',
      },
      {
        id: 'f4',
        text: 'Restart nginx inside the VM',
        feedback: 'The application is already healthy — this changes nothing.',
      },
    ],
    explanation:
      'NSG rules are processed in priority order, lowest number first, and evaluation stops at the first match. A broad deny at priority 100 shadows every allow rule numbered above it. IP flow verify names the deciding rule directly, which is why it is the fastest route to the answer.',
    prevention: [
      'Keep broad deny rules at high priority numbers (close to 4096) so specific allows sit in front of them.',
      'Use IP flow verify as the first step for any “cannot reach it” report, before touching the guest.',
      'Review effective security rules rather than one NSG — subnet and NIC rules both apply.',
    ],
    concepts: ['nsg', 'effective-security-rules', 'public-ip', 'network-watcher'],
    sources: ['nsg-overview', 'network-watcher', 'public-ip'],
  },

  // ---------------------------------------------------------------- scenario 2
  {
    id: 'ts-peering-transitive',
    title: 'The spoke that cannot reach the other spoke',
    summary: 'Two spoke networks are each peered to the hub, but traffic between them fails.',
    difficulty: 2,
    area: 'networking',
    ticket: {
      from: 'Marcus, platform engineer',
      message:
        'We built a hub-and-spoke. Spoke A and spoke B are both peered to the hub, and both can reach the shared services in the hub. But the app in spoke A cannot reach the API in spoke B at all. The peerings say Connected.',
    },
    environment: {
      root: {
        type: 'group',
        id: 'region',
        label: 'West Europe',
        kind: 'region',
        direction: 'row',
        children: [
          {
            type: 'group',
            id: 'spokeA',
            label: 'vnet-spoke-a',
            sub: '10.1.0.0/16',
            kind: 'vnet',
            concept: 'vnet',
            direction: 'col',
            children: [{ type: 'node', id: 'appA', label: 'vm-app-a', icon: 'vm', concept: 'virtual-machine' }],
          },
          {
            type: 'group',
            id: 'hub',
            label: 'vnet-hub',
            sub: '10.0.0.0/16',
            kind: 'vnet',
            concept: 'hub-spoke',
            direction: 'col',
            children: [{ type: 'node', id: 'shared', label: 'Shared services', icon: 'server' }],
          },
          {
            type: 'group',
            id: 'spokeB',
            label: 'vnet-spoke-b',
            sub: '10.2.0.0/16',
            kind: 'vnet',
            concept: 'vnet',
            direction: 'col',
            children: [{ type: 'node', id: 'apiB', label: 'vm-api-b', icon: 'vm', concept: 'virtual-machine' }],
          },
        ],
      },
      edges: [
        { from: 'spokeA', to: 'hub', label: 'peered', tone: 'allow', both: true },
        { from: 'hub', to: 'spokeB', label: 'peered', tone: 'allow', both: true },
        { from: 'spokeA', to: 'spokeB', label: 'no path', style: 'dashed', tone: 'deny' },
      ],
      flows: [{ id: 'a-to-b', label: 'vm-app-a → vm-api-b', path: ['appA', 'spokeA', 'hub', 'spokeB', 'apiB'], tone: 'deny' }],
    },
    tools: [
      {
        id: 'peerings',
        label: 'Peering configuration',
        group: 'Configuration',
        description: 'All peerings on the three virtual networks.',
        clue: true,
        output: {
          kind: 'table',
          columns: ['Virtual network', 'Peering', 'Remote network', 'State', 'Forwarded traffic'],
          rows: [
            ['vnet-hub', 'hub-to-a', 'vnet-spoke-a', 'Connected', 'Disabled'],
            ['vnet-hub', 'hub-to-b', 'vnet-spoke-b', 'Connected', 'Disabled'],
            ['vnet-spoke-a', 'a-to-hub', 'vnet-hub', 'Connected', 'Disabled'],
            ['vnet-spoke-b', 'b-to-hub', 'vnet-hub', 'Connected', 'Disabled'],
          ],
          note: 'There is no peering between vnet-spoke-a and vnet-spoke-b, and no appliance in the hub forwarding between them.',
        },
      },
      {
        id: 'next-hop',
        label: 'Next hop',
        group: 'Network Watcher',
        description: 'Where would a packet from vm-app-a to 10.2.1.4 actually go?',
        output: {
          kind: 'kv',
          items: [
            { k: 'Source', v: '10.1.1.4 (vm-app-a)' },
            { k: 'Destination', v: '10.2.1.4 (vm-api-b)' },
            { k: 'Next hop type', v: 'Internet', tone: 'bad' },
            { k: 'Route', v: '0.0.0.0/0 (system default)', tone: 'warn' },
          ],
          note: 'No route matches 10.2.0.0/16, so the default route sends it to the internet, where it is dropped.',
        },
      },
      {
        id: 'nsg-check',
        label: 'Effective security rules',
        group: 'Network Watcher',
        description: 'Merged NSG rules on nic-app-a.',
        output: {
          kind: 'lines',
          lines: [
            'Inbound:  AllowVnetInBound (65000) Allow',
            'Outbound: AllowVnetOutBound (65000) Allow',
            'Outbound: AllowInternetOutBound (65001) Allow',
            'No custom deny rules present.',
          ],
          note: 'The NSGs are not blocking this traffic.',
        },
      },
      {
        id: 'routes',
        label: 'Effective routes',
        group: 'Network Watcher',
        description: 'The route table actually applied to nic-app-a.',
        output: {
          kind: 'table',
          columns: ['Source', 'Prefix', 'Next hop type', 'Next hop'],
          rows: [
            ['Default', '10.1.0.0/16', 'VnetLocal', '—'],
            ['VNetPeering', '10.0.0.0/16', 'VNetPeering', '—'],
            ['Default', '0.0.0.0/0', 'Internet', '—'],
          ],
          highlight: [1],
          note: 'The hub prefix is learned from the peering. The spoke B prefix is not learned at all.',
        },
      },
    ],
    causes: [
      {
        id: 'c1',
        text: 'VNet peering is not transitive, so spoke A learns no route to spoke B',
        correct: true,
        feedback: 'Correct. Peering propagates only the directly peered network’s prefixes. A to hub and hub to B does not give A a path to B.',
      },
      {
        id: 'c2',
        text: 'The address spaces overlap',
        feedback: '10.1.0.0/16 and 10.2.0.0/16 do not overlap — and if they did, the peerings would not have been created at all.',
      },
      {
        id: 'c3',
        text: 'An NSG is blocking the traffic',
        feedback: 'Effective security rules show only the default allow rules; nothing is being denied.',
      },
      {
        id: 'c4',
        text: 'The peerings are in a Disconnected state',
        feedback: 'All four peerings report Connected.',
      },
    ],
    fixes: [
      {
        id: 'f1',
        text: 'Deploy a network virtual appliance or gateway in the hub, enable forwarded traffic on the peerings, and add user-defined routes on each spoke pointing at it',
        correct: true,
        feedback: 'Correct. Transitive routing through a hub requires something in the hub to forward the traffic, plus routes that send spoke traffic to it.',
      },
      {
        id: 'f2',
        text: 'Peer spoke A directly to spoke B',
        feedback: 'This works for two spokes and is sometimes the right answer — but it does not scale, and it bypasses the inspection the hub exists to provide.',
      },
      {
        id: 'f3',
        text: 'Enable "allow gateway transit" on the hub peerings',
        feedback: 'Gateway transit shares a VPN or ExpressRoute gateway with peered networks. It does not create spoke-to-spoke routing.',
      },
      {
        id: 'f4',
        text: 'Add an NSG rule allowing 10.2.0.0/16',
        feedback: 'Nothing is being denied. The packet has no route to follow, which no NSG rule can fix.',
      },
    ],
    explanation:
      'Peering propagates routes only between the two networks it joins. The effective routes on nic-app-a prove it: the hub prefix is learned via VNetPeering, and spoke B’s prefix is absent, so the default route sends the packet to the internet. Spoke-to-spoke communication needs an appliance or gateway in the hub with forwarded traffic enabled and user-defined routes on the spokes.',
    prevention: [
      'Draw the routing, not just the peering, when designing hub-and-spoke.',
      'Check effective routes — not the peering state — when a hub-and-spoke path fails.',
      'Decide early whether spokes should talk to each other at all; many designs deliberately forbid it.',
    ],
    concepts: ['vnet-peering', 'hub-spoke', 'route-table', 'network-watcher'],
    sources: ['peering', 'routing', 'network-watcher'],
  },

  // ---------------------------------------------------------------- scenario 3
  {
    id: 'ts-private-endpoint-dns',
    title: 'The private endpoint that still resolves publicly',
    summary: 'A private endpoint was created for a storage account, but the application still connects over the public endpoint — and now fails.',
    difficulty: 3,
    area: 'networking',
    ticket: {
      from: 'Ade, security engineer',
      message:
        'We created a private endpoint for stappdata001 and then set the storage firewall to deny public access, as the security baseline requires. The app in the VNet immediately started failing with authorization errors. The private endpoint shows as Approved.',
    },
    environment: {
      root: {
        type: 'group',
        id: 'region',
        label: 'West Europe',
        kind: 'region',
        direction: 'col',
        children: [
          {
            type: 'group',
            id: 'vnet',
            label: 'vnet-app',
            sub: '10.0.0.0/16',
            kind: 'vnet',
            concept: 'vnet',
            direction: 'row',
            children: [
              {
                type: 'group',
                id: 'snet-app',
                label: 'snet-app',
                kind: 'subnet',
                concept: 'subnet',
                direction: 'col',
                children: [{ type: 'node', id: 'vm', label: 'vm-app01', icon: 'vm', concept: 'virtual-machine' }],
              },
              {
                type: 'group',
                id: 'snet-pe',
                label: 'snet-endpoints',
                kind: 'subnet',
                concept: 'subnet',
                direction: 'col',
                children: [{ type: 'node', id: 'pe', label: 'pe-stappdata001', sub: '10.0.9.4', icon: 'private-endpoint', tone: 'good', concept: 'private-endpoint' }],
              },
            ],
          },
          {
            type: 'group',
            id: 'services',
            label: 'Platform services',
            kind: 'plain',
            direction: 'row',
            children: [
              { type: 'node', id: 'zone', label: 'Private DNS zone', sub: 'not linked to vnet-app', icon: 'dns', tone: 'bad', concept: 'private-dns-zone' },
              { type: 'node', id: 'sa', label: 'stappdata001', sub: 'public access: Denied', icon: 'storage', concept: 'storage-account' },
            ],
          },
        ],
      },
      edges: [
        { from: 'vm', to: 'zone', label: 'DNS lookup', style: 'dashed', tone: 'deny' },
        { from: 'pe', to: 'sa', tone: 'allow' },
        { from: 'zone', to: 'sa', label: 'public IP', style: 'dashed', tone: 'deny' },
      ],
      flows: [{ id: 'lookup', label: 'Name resolution then connection', path: ['vm', 'zone', 'sa'], tone: 'deny' }],
    },
    tools: [
      {
        id: 'dns',
        label: 'Name resolution from the VM',
        group: 'Client',
        description: 'What does stappdata001.blob.core.windows.net resolve to inside the virtual network?',
        clue: true,
        output: {
          kind: 'lines',
          lines: [
            '$ nslookup stappdata001.blob.core.windows.net',
            'Non-authoritative answer:',
            'stappdata001.blob.core.windows.net canonical name = stappdata001.privatelink.blob.core.windows.net',
            'Name:    stappdata001.privatelink.blob.core.windows.net',
            'Address: 20.60.53.4',
          ],
          note: 'The CNAME to privatelink is present, but it resolves to a PUBLIC address — so no private DNS zone is answering.',
        },
      },
      {
        id: 'pe-status',
        label: 'Private endpoint status',
        group: 'Configuration',
        description: 'Provisioning and connection state of the private endpoint.',
        output: {
          kind: 'kv',
          items: [
            { k: 'Provisioning state', v: 'Succeeded', tone: 'good' },
            { k: 'Connection state', v: 'Approved', tone: 'good' },
            { k: 'Private IP', v: '10.0.9.4', tone: 'good' },
            { k: 'Sub-resource', v: 'blob', tone: 'good' },
          ],
          note: 'The endpoint itself is healthy — this is not the problem.',
        },
      },
      {
        id: 'dns-zone',
        label: 'Private DNS zone links',
        group: 'Configuration',
        description: 'Virtual network links on privatelink.blob.core.windows.net.',
        output: {
          kind: 'table',
          columns: ['Zone', 'A record', 'Linked virtual networks'],
          rows: [['privatelink.blob.core.windows.net', 'stappdata001 → 10.0.9.4', '(none)']],
          highlight: [0],
          note: 'The zone exists and holds the right record, but no virtual network is linked to it.',
        },
      },
      {
        id: 'fw',
        label: 'Storage firewall',
        group: 'Configuration',
        description: 'Network rules on the storage account.',
        output: {
          kind: 'kv',
          items: [
            { k: 'Default action', v: 'Deny' },
            { k: 'Allowed IP ranges', v: 'none' },
            { k: 'Allowed subnets', v: 'none' },
            { k: 'Bypass', v: 'AzureServices' },
          ],
          note: 'Public access is denied, exactly as the baseline requires.',
        },
      },
    ],
    causes: [
      {
        id: 'c1',
        text: 'The private DNS zone is not linked to the virtual network, so the hostname still resolves to the public IP',
        correct: true,
        feedback: 'Correct. Without the link, the VM never sees the zone’s A record, resolves the public address, and is then refused by the firewall.',
      },
      {
        id: 'c2',
        text: 'The private endpoint connection has not been approved',
        feedback: 'The endpoint reports Approved and Succeeded with a private IP allocated.',
      },
      {
        id: 'c3',
        text: 'The storage firewall is blocking the private endpoint',
        feedback: 'Traffic arriving over a private endpoint bypasses the storage firewall by design.',
      },
      {
        id: 'c4',
        text: 'The wrong sub-resource was chosen when creating the endpoint',
        feedback: 'The sub-resource is `blob`, which is correct for blob access.',
      },
    ],
    fixes: [
      {
        id: 'f1',
        text: 'Link privatelink.blob.core.windows.net to vnet-app as a virtual network link',
        correct: true,
        feedback: 'Correct. Once the zone is linked, the VM resolves the hostname to 10.0.9.4 and connects over Private Link.',
      },
      {
        id: 'f2',
        text: 'Add the app subnet to the storage account firewall',
        feedback: 'That is the service endpoint pattern. It would restore connectivity over the public endpoint — the opposite of what the baseline asked for.',
      },
      {
        id: 'f3',
        text: 'Add a hosts file entry on the VM pointing at 10.0.9.4',
        feedback: 'It would work for that one machine and break the moment the VM is rebuilt or another is added. Fix DNS properly.',
      },
      {
        id: 'f4',
        text: 'Set the storage account default action back to Allow',
        feedback: 'That undoes the security requirement and leaves the private endpoint doing nothing.',
      },
    ],
    explanation:
      'A private endpoint is only half the change. Azure creates the privatelink CNAME, but the hostname resolves to the private IP only if a private DNS zone holding the A record is linked to the virtual network doing the lookup. Until then, clients resolve the public address and are refused by the firewall — which is exactly the symptom here.',
    prevention: [
      'Treat private endpoint and private DNS zone link as one change, never two.',
      'Verify with nslookup from inside the network before switching the firewall to Deny.',
      'For many endpoints, use the Azure Policy that creates and links the zone automatically.',
    ],
    concepts: ['private-endpoint', 'private-dns-zone', 'storage-firewall', 'azure-dns'],
    sources: ['private-endpoint-dns', 'storage-firewall', 'dns-autoregistration'],
  },

  // ---------------------------------------------------------------- scenario 4
  {
    id: 'ts-lb-probe',
    title: 'Half the load balancer pool is missing',
    summary: 'Users see intermittent errors, and the load balancer is sending traffic to only one of three healthy-looking instances.',
    difficulty: 2,
    area: 'networking',
    ticket: {
      from: 'Sam, on-call engineer',
      message:
        'Our public site is slow at peak and the CPU on web-vm-1 is pinned while the other two VMs are idle. All three VMs are running and I can SSH into each one. The load balancer says the backend pool has three members.',
    },
    environment: {
      root: {
        type: 'group',
        id: 'region',
        label: 'West Europe',
        kind: 'region',
        direction: 'col',
        children: [
          { type: 'node', id: 'lb', label: 'lb-web', sub: 'Standard · probe /health:80', icon: 'lb', concept: 'load-balancer' },
          {
            type: 'group',
            id: 'pool',
            label: 'Backend pool',
            kind: 'plain',
            direction: 'row',
            children: [
              { type: 'node', id: 'vm1', label: 'web-vm-1', sub: 'healthy', icon: 'vm', tone: 'good', concept: 'virtual-machine' },
              { type: 'node', id: 'vm2', label: 'web-vm-2', sub: 'probe failing', icon: 'vm', tone: 'bad', concept: 'virtual-machine' },
              { type: 'node', id: 'vm3', label: 'web-vm-3', sub: 'probe failing', icon: 'vm', tone: 'bad', concept: 'virtual-machine' },
            ],
          },
        ],
      },
      edges: [
        { from: 'lb', to: 'vm1', label: 'traffic', tone: 'allow' },
        { from: 'lb', to: 'vm2', label: 'no traffic', style: 'dashed', tone: 'deny' },
        { from: 'lb', to: 'vm3', label: 'no traffic', style: 'dashed', tone: 'deny' },
      ],
    },
    tools: [
      {
        id: 'probe-health',
        label: 'Health probe status',
        group: 'Monitoring',
        description: 'Per-instance probe results for the last five minutes.',
        clue: true,
        output: {
          kind: 'table',
          columns: ['Instance', 'Probe result', 'Last response', 'Detail'],
          rows: [
            ['web-vm-1', 'Healthy', 'HTTP 200', '/health returns 200'],
            ['web-vm-2', 'Unhealthy', 'HTTP 302', '/health redirects to /login'],
            ['web-vm-3', 'Unhealthy', 'HTTP 302', '/health redirects to /login'],
          ],
          highlight: [1, 2],
          note: 'An HTTP probe is healthy only on 200. A 302 counts as a failure.',
        },
      },
      {
        id: 'vm-state',
        label: 'VM power state',
        group: 'Configuration',
        description: 'Are all three instances actually running?',
        output: {
          kind: 'table',
          columns: ['Instance', 'Power state', 'Provisioning'],
          rows: [
            ['web-vm-1', 'VM running', 'Succeeded'],
            ['web-vm-2', 'VM running', 'Succeeded'],
            ['web-vm-3', 'VM running', 'Succeeded'],
          ],
          note: 'All three are running — the problem is not the platform.',
        },
      },
      {
        id: 'nsg-probe',
        label: 'Effective rules (probe path)',
        group: 'Network Watcher',
        description: 'Is 168.63.129.16 allowed to reach port 80 on the instances?',
        output: {
          kind: 'lines',
          lines: [
            'AllowAzureLoadBalancerInBound (65001): Allow — AzureLoadBalancer → Any:Any',
            'No custom deny rule with a lower priority number is present.',
            'Probe source 168.63.129.16 is permitted.',
          ],
          note: 'The probes are reaching the instances; they are getting an answer the load balancer rejects.',
        },
      },
      {
        id: 'app-config',
        label: 'Application configuration',
        group: 'Client',
        description: 'Recent changes to the web application.',
        output: {
          kind: 'lines',
          lines: [
            '$ git log --oneline -3 -- nginx.conf',
            'a91f3c2  Require authentication on all paths',
            '7d20b81  Add /health endpoint',
            '5c1aa04  Initial nginx config',
            '',
            '# a91f3c2 was deployed to web-vm-2 and web-vm-3 only.',
          ],
          note: 'The authentication change redirects every unauthenticated request — including the probe — to /login.',
        },
      },
    ],
    causes: [
      {
        id: 'c1',
        text: 'The health endpoint now returns 302 on two instances, and an HTTP probe is only healthy on 200',
        correct: true,
        feedback: 'Correct. The authentication change put /health behind the login redirect, so the probe fails and the load balancer removes those instances.',
      },
      {
        id: 'c2',
        text: 'The two instances are stopped',
        feedback: 'All three report "VM running".',
      },
      {
        id: 'c3',
        text: 'An NSG rule blocks the probe source 168.63.129.16',
        feedback: 'The effective rules show AllowAzureLoadBalancerInBound in force with no custom deny in front of it.',
      },
      {
        id: 'c4',
        text: 'The backend pool is missing the two instances',
        feedback: 'The pool has all three members — they are members but unhealthy.',
      },
    ],
    fixes: [
      {
        id: 'f1',
        text: 'Exclude /health from authentication so it returns 200 again',
        correct: true,
        feedback: 'Correct. Health endpoints must be reachable unauthenticated and return 200 — that is the contract the probe depends on.',
      },
      {
        id: 'f2',
        text: 'Change the probe protocol to TCP on port 80',
        feedback: 'It would mark the instances healthy again — including when the application is broken but the port is open. It hides the problem rather than fixing it.',
      },
      {
        id: 'f3',
        text: 'Increase the probe interval and threshold',
        feedback: 'The probe is not flapping; it is consistently receiving a 302. More patience does not turn a 302 into a 200.',
      },
      {
        id: 'f4',
        text: 'Restart the two instances',
        feedback: 'They would come back with the same configuration and fail the probe again.',
      },
    ],
    explanation:
      'A load balancer only sends **new** flows to instances whose probe succeeds; existing connections to healthy instances continue, which is why the symptom looks like uneven load rather than an outage. An HTTP probe treats only a 200 as healthy, so a redirect introduced by an authentication change silently removes instances from rotation.',
    prevention: [
      'Keep the health endpoint outside authentication and outside any redirect rules.',
      'Alert on backend pool health, not just on CPU — uneven load is the first visible symptom.',
      'Deploy configuration changes to all instances together, or through a scale set model, so drift like this does not occur.',
    ],
    concepts: ['load-balancer', 'health-probe', 'nsg', 'virtual-machine'],
    sources: ['lb-probes', 'lb-components', 'nsg-overview'],
  },
];
