import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'service-private-endpoints',
  moduleId: 'networking',
  verified: '2026-09-14',
  sources: ['private-endpoint-dns', 'storage-firewall', 'vnet-faq', 'dns-autoregistration'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Two ways to reach PaaS from a VNet',
      blocks: [
        {
          type: 'lead',
          text: 'Storage accounts, databases and Key Vaults are reachable on public endpoints by default. **Service endpoints** let those services trust traffic from your subnets. **Private endpoints** bring a specific service instance into your VNet with a private IP address.',
        },
        {
          type: 'explainer',
          technical: [
            'A [[service-endpoint|service endpoint]] is enabled on a subnet for a service (for example `Microsoft.Storage`). Traffic still goes to the service’s **public** endpoint, but over the Azure backbone with the subnet’s identity, so the service firewall can allow that subnet.',
            'A [[private-endpoint|private endpoint]] is a network interface in your subnet with a **private IP**, mapped through Azure Private Link to one resource (and sub-resource such as `blob`). It works from peered VNets and on-premises, and lets you disable public network access.',
            'Private endpoints depend on DNS: the service name must resolve to the private IP, normally through a [[private-dns-zone|private DNS zone]] such as `privatelink.blob.core.windows.net` linked to the VNet.',
          ],
          simple: [
            'A **service endpoint** is like getting on the guest list of a public building: you still use the public front door, but security recognizes you as coming from your office.',
            'A **private endpoint** is like building a private door from your office straight into that one building — nobody outside can use it, and the public door can be locked.',
            'For the private door to work, your office directory must point people to the private door. That’s the DNS part.',
          ],
        },
      ],
    },
    {
      id: 'compare',
      kind: 'compare',
      title: 'Side by side',
      blocks: [
        {
          type: 'table',
          columns: ['', 'Service endpoint', 'Private endpoint'],
          rows: [
            ['Destination address', 'Service’s public IP', 'Private IP in your subnet'],
            ['Scope', 'Whole service type for the subnet (e.g. all storage)', 'One specific resource (and sub-resource)'],
            ['Reachable from peered VNets / on-premises', 'No (subnet-based)', 'Yes, with routing and DNS'],
            ['Public network access', 'Stays enabled, restricted by rules', 'Can be disabled'],
            ['DNS changes', 'None', 'Required (privatelink zone)'],
            ['Cost', 'Free', 'Charged per hour and per GB processed'],
            ['Data exfiltration protection', 'Limited — subnet can reach any account of that service', 'Strong — maps to one resource'],
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'How private endpoint DNS resolves',
      blocks: [
        {
          type: 'flow',
          title: 'Name resolution for stfinance.blob.core.windows.net',
          alt: 'A VM queries stfinance.blob.core.windows.net. Public DNS returns a CNAME to stfinance.privatelink.blob.core.windows.net. The private DNS zone linked to the VNet returns the private endpoint IP 10.1.3.5, and the VM connects privately.',
          spec: {
            root: {
              type: 'group',
              id: 'root',
              label: 'Resolution',
              kind: 'plain',
              children: [
                {
                  type: 'group',
                  id: 'vnet',
                  label: 'vnet-app',
                  kind: 'vnet',
                  direction: 'col',
                  children: [
                    { type: 'node', id: 'vm', label: 'vm-app', sub: 'Uses Azure DNS', icon: 'vm' },
                    { type: 'node', id: 'pe', label: 'Private endpoint', sub: '10.1.3.5', icon: 'private-endpoint', concept: 'private-endpoint' },
                  ],
                },
                {
                  type: 'group',
                  id: 'dns',
                  label: 'DNS',
                  kind: 'boundary',
                  direction: 'col',
                  children: [
                    { type: 'node', id: 'pub', label: 'Public DNS', sub: 'CNAME → stfinance.privatelink.blob…', icon: 'dns', detail: 'Azure publishes a CNAME from the account name to the privatelink name. Clients keep using the normal hostname.' },
                    { type: 'node', id: 'zone', label: 'privatelink.blob.core.windows.net', sub: 'A stfinance → 10.1.3.5', icon: 'dns', concept: 'private-dns-zone', detail: 'The private DNS zone must be linked to the client’s VNet. A DNS zone group can manage the A record automatically.' },
                  ],
                },
                { type: 'node', id: 'st', label: 'stfinance', sub: 'Public access disabled', icon: 'storage' },
              ],
            },
            edges: [
              { from: 'vm', to: 'pub', label: '1. query', tone: 'data', style: 'dashed' },
              { from: 'pub', to: 'zone', label: '2. CNAME', tone: 'data', style: 'dashed' },
              { from: 'vm', to: 'pe', label: '4. connect', tone: 'allow' },
              { from: 'pe', to: 'st', label: 'Private Link', tone: 'allow' },
            ],
            flows: [{ id: 'resolve', label: 'Resolve and connect', path: ['vm', 'pub', 'zone', 'pe', 'st'], tone: 'data', description: 'The name resolves to **10.1.3.5** inside the linked VNet, so traffic goes through the private endpoint. From a network without the zone, the same name resolves to the public IP — which is blocked because public access is disabled.' }],
          },
        },
      ],
    },
    {
      id: 'challenge',
      kind: 'challenge',
      title: 'Fix the DNS',
      blocks: [{ type: 'interactive', id: 'private-endpoint-dns', intro: 'Toggle the private endpoint, private DNS zone, VNet link and public access, then resolve the storage name from a VM and from on-premises.' }],
    },
    {
      id: 'configure',
      kind: 'configure',
      blocks: [
        {
          type: 'code',
          title: 'Create a private endpoint with DNS integration',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `stId=$(az storage account show -g rg-data -n stfinance --query id -o tsv)

az network private-endpoint create --resource-group rg-net --name pe-stfinance-blob \\
  --vnet-name vnet-app --subnet snet-data \\
  --private-connection-resource-id $stId --group-id blob --connection-name pe-stfinance-blob

az network private-dns zone create --resource-group rg-net --name privatelink.blob.core.windows.net

az network private-dns link vnet create --resource-group rg-net \\
  --zone-name privatelink.blob.core.windows.net --name link-vnet-app \\
  --virtual-network vnet-app --registration-enabled false

az network private-endpoint dns-zone-group create --resource-group rg-net \\
  --endpoint-name pe-stfinance-blob --name default \\
  --private-dns-zone privatelink.blob.core.windows.net --zone-name blob

az storage account update -g rg-data -n stfinance --public-network-access Disabled`,
              notes: [
                { token: '--group-id blob', note: 'The sub-resource: blob, file, queue, table, dfs or web for storage.' },
                { token: 'dns-zone-group', note: 'Keeps the A record in the private DNS zone in sync with the endpoint’s IP.' },
                { token: '--registration-enabled false', note: 'Autoregistration is for VM records, not needed for privatelink zones.' },
              ],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Use the recommended zone names (such as `privatelink.blob.core.windows.net`, `privatelink.file.core.windows.net`, `privatelink.vaultcore.azure.net`, `privatelink.azurewebsites.net`) — automatic DNS configuration only works with them. Use one zone per service type.',
        },
      ],
    },
    {
      id: 'decide',
      kind: 'decide',
      blocks: [
        {
          type: 'decision',
          tree: {
            id: 'se-pe',
            title: 'Service endpoint or private endpoint?',
            start: 'q1',
            nodes: {
              q1: { kind: 'question', text: 'Must on-premises or peered-VNet clients reach the service privately?', options: [{ label: 'Yes', next: 'r-pe' }, { label: 'No', next: 'q2' }] },
              q2: { kind: 'question', text: 'Must public network access to the service be disabled completely, or access limited to one specific resource instance?', options: [{ label: 'Yes', next: 'r-pe' }, { label: 'No', next: 'r-se' }] },
              'r-pe': { kind: 'result', title: 'Private endpoint', text: 'Private IP in your VNet, reachable over peering and hybrid links, with private DNS. Disable public access afterwards.', concepts: ['private-endpoint', 'private-dns-zone'] },
              'r-se': { kind: 'result', title: 'Service endpoint', text: 'Enable it on the subnet and add a virtual network rule on the service. Free and simple, but the public endpoint remains.', concepts: ['service-endpoint', 'storage-firewall'] },
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
        { type: 'callout', variant: 'trap', text: 'If a private endpoint exists but clients still connect to the public IP, the answer is almost always DNS: the privatelink zone is missing, lacks the A record, or isn’t linked to the client’s VNet.' },
        { type: 'quickcheck', questionIds: ['nw-pe-dns', 'nw-se-vs-pe'] },
      ],
    },
  ],
  takeaways: [
    'Service endpoints: subnet trust on the public endpoint, free, no DNS change.',
    'Private endpoints: private IP for one resource, reachable from peered and on-premises networks, public access can be disabled.',
    'Private endpoints require DNS — typically a privatelink private DNS zone linked to the VNet.',
    'The service hostname doesn’t change; a CNAME points it to the privatelink name.',
    'DNS resolution isn’t access control — disable public access explicitly.',
  ],
};

export default lesson;
