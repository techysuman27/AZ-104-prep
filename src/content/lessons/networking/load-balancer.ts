import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'load-balancer',
  moduleId: 'networking',
  verified: '2026-09-14',
  sources: ['lb-skus', 'lb-components', 'lb-probes', 'nsg-overview'],
  changes: [
    {
      topic: 'Basic Load Balancer',
      previously: 'Basic Load Balancer was a free option open to inbound traffic by default.',
      now: 'Basic Load Balancer was retired on September 30, 2025. Standard Load Balancer is secure by default and requires NSG rules to allow inbound traffic.',
      matters: 'Design and troubleshoot with Standard behaviour: Standard public IPs, NSGs required, health probes from AzureLoadBalancer.',
    },
  ],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Spreading traffic across healthy instances',
      blocks: [
        {
          type: 'lead',
          text: '**Azure Load Balancer** distributes TCP and UDP flows from a frontend IP to instances in a backend pool, and stops sending new connections to instances that fail their **health probe**.',
        },
        {
          type: 'explainer',
          technical: [
            'A [[load-balancer|Standard Load Balancer]] operates at layer 4. A **public** load balancer has a public IP frontend; an **internal** load balancer has a private IP frontend.',
            'Components: **frontend IP configuration**, **backend pool** (VMs or scale set instances in one VNet), **[[health-probe|health probes]]** (TCP, HTTP, HTTPS), **load-balancing rules**, **inbound NAT rules** (port forwarding to one instance) and **outbound rules** (SNAT).',
            'Standard is **secure by default**: inbound connections are allowed only when an NSG permits them. Probes come from 168.63.129.16, allowed by the AzureLoadBalancer service tag.',
          ],
          simple: [
            'A load balancer is a host at a restaurant spreading guests across several waiters. The host checks regularly that each waiter is on duty (the health probe) and stops seating guests with anyone who isn’t.',
            'Layer 4 means it looks at addresses and ports, not at web pages or URLs.',
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
          title: 'Public Standard Load Balancer',
          alt: 'Internet clients reach a public frontend; a load-balancing rule for TCP 443 sends flows to three web VMs across zones; an HTTP health probe checks /health; web-vm-3 fails its probe and receives no new connections.',
          spec: {
            root: {
              type: 'group',
              id: 'root',
              label: 'Load balancing',
              kind: 'plain',
              children: [
                { type: 'node', id: 'client', label: 'Clients', icon: 'internet' },
                { type: 'node', id: 'fe', label: 'Frontend', sub: 'Standard public IP · rule TCP 443', icon: 'lb', concept: 'load-balancer', detail: 'The load-balancing rule maps frontend TCP 443 to backend port 443 for all pool members, using the HTTP probe to decide health.' },
                {
                  type: 'group',
                  id: 'pool',
                  label: 'Backend pool',
                  sub: 'Probe: HTTP /health',
                  kind: 'boundary',
                  direction: 'col',
                  concept: 'health-probe',
                  children: [
                    { type: 'node', id: 'vm1', label: 'web-vm-1', sub: 'Zone 1 · 200 OK', icon: 'vm', tone: 'good' },
                    { type: 'node', id: 'vm2', label: 'web-vm-2', sub: 'Zone 2 · 200 OK', icon: 'vm', tone: 'good' },
                    { type: 'node', id: 'vm3', label: 'web-vm-3', sub: 'Zone 3 · 500 error', icon: 'vm', tone: 'bad', detail: 'An HTTP probe counts anything other than 200 as unhealthy. No new connections are sent here; existing TCP connections continue.' },
                  ],
                },
              ],
            },
            edges: [
              { from: 'client', to: 'fe', tone: 'data' },
              { from: 'fe', to: 'vm1', tone: 'allow' },
              { from: 'fe', to: 'vm2', tone: 'allow' },
              { from: 'fe', to: 'vm3', tone: 'deny', label: 'probe down' },
            ],
            flows: [{ id: 'req', label: 'New connection', path: ['client', 'fe', 'vm2'], tone: 'allow', description: 'The five-tuple hash picks a healthy instance. web-vm-3 is skipped while its probe fails.' }],
          },
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Rules, probes and persistence',
      blocks: [
        {
          type: 'table',
          columns: ['Component', 'Purpose', 'Remember'],
          rows: [
            ['Load-balancing rule', 'Frontend IP:port → backend pool port for all instances', 'Needs a health probe'],
            ['HA ports rule', 'All ports and protocols (port 0, protocol All)', 'Internal Standard Load Balancer only; used for NVAs'],
            ['Inbound NAT rule', 'Frontend port → one specific instance', 'For example RDP to one VM on port 50001'],
            ['Outbound rule', 'Explicit SNAT for backend instances', 'Standard SKU only'],
            ['Health probe', 'TCP handshake, or HTTP/HTTPS GET expecting 200', 'Portal default interval 5 seconds'],
            ['Session persistence', 'None (5-tuple), Client IP, or Client IP and protocol', 'Keeps a client on the same instance'],
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          text: 'Azure Load Balancer doesn’t inspect HTTP. Path-based routing, TLS termination and web application firewall features belong to Application Gateway (or Front Door).',
        },
      ],
    },
    {
      id: 'challenge',
      kind: 'challenge',
      title: 'Why are backends unhealthy?',
      blocks: [{ type: 'interactive', id: 'lb-probe-simulator', intro: 'Change the probe and each VM’s state — app listening, OS firewall, NSG, HTTP status — and watch health and traffic distribution update.' }],
    },
    {
      id: 'configure',
      kind: 'configure',
      blocks: [
        {
          type: 'code',
          title: 'Build a public Standard Load Balancer',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az network public-ip create -g rg-web -n pip-lb-web --sku Standard --allocation-method Static --zone 1 2 3

az network lb create -g rg-web -n lb-web --sku Standard --public-ip-address pip-lb-web \\
  --frontend-ip-name fe-web --backend-pool-name be-web

az network lb probe create -g rg-web --lb-name lb-web -n hp-health \\
  --protocol Http --port 80 --path /health

az network lb rule create -g rg-web --lb-name lb-web -n rule-http \\
  --protocol Tcp --frontend-port 80 --backend-port 80 \\
  --frontend-ip-name fe-web --backend-pool-name be-web --probe-name hp-health

# Add a VM NIC to the backend pool
az network nic ip-config address-pool add -g rg-web --nic-name nic-web01 \\
  --ip-config-name ipconfig1 --lb-name lb-web --address-pool be-web

# Remember: allow the traffic in the VMs' NSG
az network nsg rule create -g rg-web --nsg-name nsg-web -n Allow-HTTP --priority 100 \\
  --direction Inbound --access Allow --protocol Tcp --destination-port-ranges 80 \\
  --source-address-prefixes Internet`,
              notes: [
                { token: '--protocol Http --path /health', note: 'Healthy only when the path returns HTTP 200.' },
                { token: '--probe-name', note: 'The rule sends traffic only to instances passing this probe.' },
                { token: 'Allow-HTTP', note: 'Standard Load Balancer is closed by default — the NSG rule is required.' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'troubleshoot',
      kind: 'troubleshoot',
      title: 'Backend instances show as unhealthy',
      blocks: [
        {
          type: 'steps',
          steps: [
            { title: 'Is the application listening on the probe port?', detail: 'A TCP probe to a port with nothing listening fails. Check from inside the VM.' },
            { title: 'Does an HTTP probe path return 200?', detail: 'Redirects (301/302), authentication (401) and errors (500) all count as down.' },
            { title: 'Does the NSG allow the AzureLoadBalancer service tag?', detail: 'A custom deny rule above AllowAzureLoadBalancerInBound blocks probes from 168.63.129.16.' },
            { title: 'Does the guest OS firewall allow the probe?', detail: 'The VM’s own firewall must allow traffic on the probe port.' },
            { title: 'Is the VM running and in the correct pool?', detail: 'Stopped instances aren’t probed. Check the backend pool membership.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'trap', text: 'If a scenario says the load balancer and VMs are configured but nothing connects from the internet, check the **NSG** — Standard Load Balancer is closed by default.' },
        { type: 'quickcheck', questionIds: ['nw-lb-inbound-nat', 'nw-lb-probe-unhealthy'] },
      ],
    },
  ],
  takeaways: [
    'Azure Load Balancer is layer 4 (TCP/UDP); Basic is retired — use Standard.',
    'Components: frontend, backend pool, health probe, load-balancing rules, inbound NAT rules, outbound rules.',
    'Standard is secure by default: NSGs must allow inbound traffic.',
    'Probes come from 168.63.129.16 (AzureLoadBalancer tag); HTTP probes need 200.',
    'Inbound NAT rules forward to one instance; HA ports rules are internal-only.',
  ],
};

export default lesson;
