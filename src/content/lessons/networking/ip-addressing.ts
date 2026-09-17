import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'ip-addressing',
  moduleId: 'networking',
  verified: '2026-09-14',
  sources: ['public-ip', 'default-outbound', 'vnet-faq', 'lb-skus'],
  changes: [
    {
      topic: 'Basic SKU public IP addresses',
      previously: 'Basic public IPs could be dynamic and were open to inbound traffic by default.',
      now: 'Basic public IPs were retired on September 30, 2025. Standard public IPs are static, zone-aware and secure by default.',
      matters: 'Assume Standard behaviour: static allocation and inbound traffic blocked until an NSG allows it.',
    },
    {
      topic: 'Default outbound access',
      previously: 'VMs without an explicit outbound method reached the internet through an implicit Microsoft-owned IP.',
      now: 'New virtual networks created with API versions after March 31, 2026 have private subnets by default. VMs need a NAT gateway, load balancer outbound rule, public IP or firewall route to reach the internet.',
      matters: 'A VM that can’t reach Windows Update or activate Windows in a new VNet usually needs explicit outbound connectivity — not an NSG change.',
    },
  ],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Private addresses, public addresses and the way out',
      blocks: [
        {
          type: 'lead',
          text: 'Every VM gets a **private IP** from its subnet through its network interface. A **public IP** makes it reachable from the internet (or gives it a known outbound address). How VMs reach the internet **outbound** is now an explicit design decision.',
        },
        {
          type: 'explainer',
          technical: [
            'A [[network-interface|NIC]] holds one or more IP configurations. Private IPs are dynamic or static; in Resource Manager they don’t change until the NIC is deleted or the address is changed.',
            'A [[public-ip|Standard public IP]] is static, secure by default (inbound blocked unless an NSG allows it) and can be zonal or zone-redundant.',
            'Explicit outbound methods: a [[nat-gateway|NAT gateway]] on the subnet (recommended for most scenarios), a Standard Load Balancer outbound rule, a public IP on the NIC, or routing through Azure Firewall or another appliance.',
          ],
          simple: [
            'A private IP is an internal phone extension — only reachable inside your network.',
            'A public IP is a direct outside phone number. With the Standard SKU, calls are blocked until you explicitly allow them.',
            'A NAT gateway is a switchboard: many internal phones can call out through one shared outside number, but outsiders can’t call in through it.',
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'Inbound and outbound paths',
      blocks: [
        {
          type: 'flow',
          title: 'Explicit outbound with a NAT gateway',
          alt: 'Internet users reach a web VM through a Standard public IP only when the NSG allows port 443. App VMs in a private subnet reach the internet outbound through a NAT gateway.',
          spec: {
            root: {
              type: 'group',
              id: 'root',
              label: 'Paths',
              kind: 'plain',
              children: [
                { type: 'node', id: 'inet', label: 'Internet', icon: 'internet' },
                {
                  type: 'group',
                  id: 'vnet',
                  label: 'vnet-app',
                  kind: 'vnet',
                  direction: 'col',
                  children: [
                    {
                      type: 'group',
                      id: 'web',
                      label: 'snet-web',
                      kind: 'subnet',
                      children: [
                        { type: 'node', id: 'pip', label: 'Standard public IP', sub: 'Static, closed by default', icon: 'public-ip', concept: 'public-ip' },
                        { type: 'node', id: 'vmweb', label: 'vm-web', sub: '10.1.1.4', icon: 'vm' },
                      ],
                    },
                    {
                      type: 'group',
                      id: 'app',
                      label: 'snet-app (private subnet)',
                      kind: 'subnet',
                      children: [
                        { type: 'node', id: 'vmapp', label: 'vm-app', sub: '10.1.2.4, no public IP', icon: 'vm' },
                        { type: 'node', id: 'nat', label: 'NAT gateway', sub: 'Outbound only', icon: 'nat', concept: 'nat-gateway' },
                      ],
                    },
                  ],
                },
              ],
            },
            edges: [
              { from: 'inet', to: 'pip', label: 'TCP 443 (NSG allows)', tone: 'allow' },
              { from: 'pip', to: 'vmweb' },
              { from: 'vmapp', to: 'nat', tone: 'data' },
              { from: 'nat', to: 'inet', label: 'outbound SNAT', tone: 'data', style: 'dashed' },
            ],
            flows: [
              { id: 'in', label: 'User request', path: ['inet', 'pip', 'vmweb'], tone: 'allow', description: 'Inbound works only because the NSG allows TCP 443. Standard public IPs are closed by default.' },
              { id: 'out', label: 'VM downloads updates', path: ['vmapp', 'nat', 'inet'], tone: 'data', description: 'The private-subnet VM reaches the internet through the NAT gateway’s public IP. Nobody can open connections back in through it.' },
            ],
          },
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      blocks: [
        {
          type: 'code',
          title: 'Public IPs, static private IPs and a NAT gateway',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# Zone-redundant Standard public IP with a DNS label
az network public-ip create --resource-group rg-net --name pip-web \\
  --sku Standard --allocation-method Static --zone 1 2 3 --dns-name contoso-web

# Give a NIC a static private IP
az network nic ip-config update --resource-group rg-net --nic-name nic-web01 \\
  --name ipconfig1 --private-ip-address 10.1.1.10

# NAT gateway for explicit outbound access from snet-app
az network public-ip create --resource-group rg-net --name pip-nat --sku Standard --allocation-method Static
az network nat gateway create --resource-group rg-net --name nat-app --public-ip-addresses pip-nat
az network vnet subnet update --resource-group rg-net --vnet-name vnet-app --name snet-app --nat-gateway nat-app`,
              notes: [
                { token: '--zone 1 2 3', note: 'Zone-redundant. A single zone number makes it zonal. The zone can’t be changed later.' },
                { token: '--dns-name', note: 'Creates <label>.<region>.cloudapp.azure.com.' },
                { token: '--nat-gateway', note: 'All outbound internet traffic from the subnet uses the NAT gateway’s public IPs.' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'troubleshoot',
      kind: 'troubleshoot',
      title: 'VM can’t reach the internet',
      blocks: [
        {
          type: 'decision',
          tree: {
            id: 'outbound',
            title: 'Why is outbound internet access failing?',
            start: 'q1',
            nodes: {
              q1: { kind: 'question', text: 'Does the VM (or its subnet) have an explicit outbound method — NAT gateway, public IP, load balancer outbound rule or a route to a firewall?', options: [{ label: 'No', next: 'q2' }, { label: 'Yes', next: 'q3' }] },
              q2: { kind: 'question', text: 'Is the subnet private (default outbound access disabled)?', options: [{ label: 'Yes or unsure', next: 'r-explicit' }, { label: 'No', next: 'q3' }] },
              q3: { kind: 'question', text: 'Does an outbound NSG rule or a user-defined route block or redirect the traffic?', options: [{ label: 'Possibly', next: 'r-nw' }, { label: 'No', next: 'r-dns' }] },
              'r-explicit': { kind: 'result', title: 'Add explicit outbound connectivity', text: 'Attach a NAT gateway to the subnet (recommended), or use a public IP or load balancer outbound rule. Changes may require stopping and deallocating VMs to take effect.', concepts: ['nat-gateway'] },
              'r-nw': { kind: 'result', title: 'Check effective rules and routes', text: 'Use Network Watcher IP flow verify for NSG decisions and Next hop for routing (for example 0.0.0.0/0 to an appliance or to None).', concepts: ['network-watcher', 'route-table'] },
              'r-dns': { kind: 'result', title: 'Check name resolution and the destination', text: 'Confirm DNS resolves the destination and test the connection with Connection troubleshoot.', concepts: ['azure-dns'] },
            },
          },
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'trap', text: 'A Standard public IP on a VM doesn’t make it reachable by itself — an NSG must allow the inbound port. And Standard Load Balancers need Standard public IPs.' },
        { type: 'quickcheck', questionIds: ['nw-public-ip-standard', 'nw-default-outbound'] },
      ],
    },
  ],
  takeaways: [
    'Standard public IPs are static, secure by default and can be zonal or zone-redundant; Basic is retired.',
    'Private IPs come from the subnet through the NIC and can be static.',
    'New VNets have private subnets by default for newer API versions — add explicit outbound access.',
    'A NAT gateway provides scalable outbound-only internet access for a subnet.',
    'Load balancer and public IP SKUs must match.',
  ],
};

export default lesson;
