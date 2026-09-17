import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'storage-networking',
  moduleId: 'storage',
  verified: '2026-09-14',
  sources: ['storage-firewall', 'private-endpoint-dns', 'vnet-faq'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Who can even reach the endpoint?',
      blocks: [
        {
          type: 'lead',
          text: 'Authorization decides what an identity can do with data. **Network rules** decide whether a client can reach the storage endpoint in the first place. Both must allow a request.',
        },
        {
          type: 'explainer',
          technical: [
            'The [[storage-firewall|storage firewall]] supports **virtual network rules** (subnets with a `Microsoft.Storage` [[service-endpoint|service endpoint]]), **IP rules** (public IP ranges), **resource instance rules** and **trusted Microsoft service** exceptions.',
            'When rules are configured, requests from other networks are rejected with 403 even if they carry a valid key, SAS or Entra token.',
            'A [[private-endpoint|private endpoint]] gives the account a private IP in your VNet; with private DNS it lets you disable public network access entirely.',
          ],
          simple: [
            'The firewall is a guest list at the gate. If your network isn’t on it, you can’t get to the door — no matter which key you carry.',
            'A private endpoint builds a private entrance inside your own network so the public gate can be closed.',
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'Three ways in',
      blocks: [
        {
          type: 'flow',
          title: 'Reaching a storage account',
          alt: 'An office client reaches the public endpoint through an IP rule; a VM in a subnet with a service endpoint reaches it through a virtual network rule; a VM uses a private endpoint with a private IP; an unknown internet client is denied.',
          spec: {
            root: {
              type: 'group',
              id: 'root',
              label: 'Access paths',
              kind: 'plain',
              children: [
                {
                  type: 'group',
                  id: 'clients',
                  label: 'Clients',
                  kind: 'plain',
                  direction: 'col',
                  children: [
                    { type: 'node', id: 'office', label: 'Head office', sub: 'Public IP 203.0.113.10', icon: 'onprem' },
                    { type: 'node', id: 'unknown', label: 'Unknown client', sub: 'Internet', icon: 'internet', tone: 'bad' },
                  ],
                },
                {
                  type: 'group',
                  id: 'vnet',
                  label: 'vnet-app',
                  kind: 'vnet',
                  direction: 'col',
                  children: [
                    { type: 'group', id: 'snet1', label: 'snet-app', sub: 'Service endpoint', kind: 'subnet', children: [{ type: 'node', id: 'vm1', label: 'vm-app', icon: 'vm' }] },
                    { type: 'group', id: 'snet2', label: 'snet-pe', kind: 'subnet', children: [{ type: 'node', id: 'pe', label: 'Private endpoint', sub: '10.1.3.5', icon: 'private-endpoint', concept: 'private-endpoint' }] },
                  ],
                },
                {
                  type: 'group',
                  id: 'st',
                  label: 'Storage account',
                  kind: 'boundary',
                  direction: 'col',
                  children: [
                    { type: 'node', id: 'fw', label: 'Firewall', sub: 'IP + VNet rules', icon: 'firewall', concept: 'storage-firewall' },
                    { type: 'node', id: 'data', label: 'Blob service', icon: 'blob' },
                  ],
                },
              ],
            },
            edges: [
              { from: 'office', to: 'fw', label: 'IP rule', tone: 'allow' },
              { from: 'unknown', to: 'fw', label: '403', tone: 'deny' },
              { from: 'vm1', to: 'fw', label: 'VNet rule', tone: 'allow' },
              { from: 'pe', to: 'data', label: 'Private Link', tone: 'data' },
              { from: 'fw', to: 'data', tone: 'allow' },
            ],
            flows: [
              { id: 'deny', label: 'Unknown client', path: ['unknown', 'fw'], tone: 'deny', description: 'Not in an IP or virtual network rule, so the firewall rejects the request with 403 — even with a valid SAS.' },
              { id: 'se', label: 'VM via service endpoint', path: ['vm1', 'fw', 'data'], tone: 'allow', description: 'The subnet’s service endpoint lets the firewall identify traffic from snet-app, which a virtual network rule allows.' },
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
          title: 'Allow one subnet and one office IP range',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# Enable the service endpoint on the subnet
az network vnet subnet update --resource-group rg-net --vnet-name vnet-app --name snet-app \\
  --service-endpoints Microsoft.Storage

# Deny by default, then add rules
az storage account update --resource-group rg-docs --name stcontosodocs01 --default-action Deny

az storage account network-rule add --resource-group rg-docs --account-name stcontosodocs01 \\
  --vnet-name vnet-app --subnet snet-app

az storage account network-rule add --resource-group rg-docs --account-name stcontosodocs01 \\
  --ip-address 203.0.113.0/24`,
              notes: [
                { token: '--service-endpoints Microsoft.Storage', note: 'Same-region storage. `Microsoft.Storage.Global` covers cross-region.' },
                { token: '--default-action Deny', note: 'Only allowed networks can reach the public endpoint.' },
                { token: '--ip-address', note: 'Public IP addresses or ranges only — private ranges aren’t allowed in IP rules.' },
              ],
            },
          ],
        },
        {
          type: 'list',
          style: 'check',
          items: [
            'Limits: up to 400 IP rules and 400 virtual network rules per account.',
            'Virtual network rules can reference VNets in other subscriptions or regions (use `Microsoft.Storage.Global` for cross-region).',
            'Traffic from a subnet with a service endpoint uses private source addresses, so IP rules for that network’s public IP no longer match.',
            'Private endpoints need DNS: the `privatelink.blob.core.windows.net` zone linked to client VNets.',
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
            { mistake: 'Adding a VM’s private IP (10.x) as an IP rule.', fix: 'IP rules accept public addresses only. Use a virtual network rule or private endpoint.' },
            { mistake: 'Locking the firewall and then being unable to browse containers in the portal from home.', fix: 'Add your client IP temporarily, or manage data from an allowed network.' },
            { mistake: 'Creating a private endpoint but leaving public access enabled for all networks.', fix: 'Set public network access to disabled or selected networks once private access works.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Service endpoint + virtual network rule = subnet trust on the public endpoint. Private endpoint + private DNS = private IP, works from peered and on-premises networks, allows disabling public access.' },
        { type: 'quickcheck', questionIds: ['st-firewall-ip-rule', 'st-firewall-service-endpoint'] },
      ],
    },
  ],
  takeaways: [
    'Network rules are evaluated before authorization; blocked networks get 403 errors.',
    'Rule types: virtual network rules, IP rules (public only), resource instance rules, trusted services.',
    'Virtual network rules need a Microsoft.Storage service endpoint on the subnet.',
    'Private endpoints plus private DNS allow disabling public network access.',
    'A valid SAS doesn’t bypass the firewall.',
  ],
};

export default lesson;
