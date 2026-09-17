import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'app-service-networking',
  moduleId: 'app-service',
  verified: '2026-09-16',
  sources: ['appservice-networking', 'private-endpoint-dns', 'appservice-plans'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Inbound features and outbound features never swap jobs',
      blocks: [
        {
          type: 'lead',
          text: 'App Service runs on a shared, multitenant network, so you don’t connect it to your network — you add features. The one rule that unlocks every question: **features that control traffic *to* your app cannot solve problems with calls *from* your app**, and vice versa.',
        },
        {
          type: 'table',
          caption: 'Microsoft’s own split for the multitenant service.',
          columns: ['Inbound features', 'Outbound features'],
          rows: [
            ['App-assigned address', 'Hybrid Connections'],
            ['Access restrictions', 'Gateway-required virtual network integration'],
            ['Service endpoints', 'Virtual network integration'],
            ['Private endpoints', '—'],
          ],
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'What each feature actually does',
      blocks: [
        {
          type: 'compare',
          title: 'Inbound',
          items: [
            {
              name: 'Access restrictions',
              bestFor: 'Allowing only a set of well-defined addresses or a service tag to reach the app',
              points: ['Allow and deny rules evaluated in priority order, like an NSG', 'Applied on the front-end roles, upstream of the workers', 'Up to 512 rules per app'],
            },
            {
              name: 'Private endpoint',
              bestFor: 'Giving the app a private IP inside your virtual network and removing public access',
              points: ['A NIC in your subnet, reached over Azure Private Link', 'Inbound only — it changes nothing about the app’s outbound calls', 'Needs private DNS so the app’s hostname resolves to the private IP'],
            },
            {
              name: 'App-assigned address',
              bestFor: 'A dedicated inbound IP address, usually for IP-based TLS',
              points: ['An offshoot of the IP-based SSL feature', 'Traffic still passes through the shared front-end roles', 'Remap DNS afterwards — the app’s inbound address changes'],
            },
          ],
        },
        {
          type: 'compare',
          title: 'Outbound',
          items: [
            {
              name: 'Virtual network integration',
              bestFor: 'Letting the app reach resources inside an Azure virtual network',
              points: ['The app’s back end is placed in a delegated subnet in a virtual network in the same region', 'Reaches peered networks, service-endpoint-secured resources, and resources across ExpressRoute or VPN', 'Outbound only — it does not restrict who can reach the app'],
            },
            {
              name: 'Hybrid Connections',
              bestFor: 'Reaching one specific host and port in a private network that isn’t connected to Azure',
              points: ['Needs Hybrid Connection Manager installed on a Windows Server host that can reach Azure Relay on port 443', 'Tunnels TCP to a single host and port per connection', 'No VPN or ExpressRoute required'],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Outbound addresses are shared and can change',
          text: 'By default an app’s outbound calls come from a set of addresses shared with every app on the same worker VM family in that scale unit. Scaling between VM families — Standard to PremiumV2, or PremiumV2 to PremiumV3 — changes those addresses, so firewall allow-lists built on them break. VNet integration with a NAT gateway or a private endpoint on the target resource is the durable answer.',
        },
      ],
    },
    {
      id: 'decide',
      kind: 'decide',
      title: 'Pick the feature from the requirement',
      blocks: [
        {
          type: 'decision',
          tree: {
            id: 'appservice-net',
            title: 'Which App Service networking feature?',
            start: 'q-dir',
            nodes: {
              'q-dir': {
                kind: 'question',
                text: 'Is the requirement about traffic reaching the app, or calls the app makes?',
                help: 'This is the first question every time — inbound features cannot solve outbound problems.',
                options: [
                  { label: 'Traffic reaching the app (inbound)', next: 'q-in' },
                  { label: 'Calls the app makes (outbound)', next: 'q-out' },
                ],
              },
              'q-in': {
                kind: 'question',
                text: 'How private must the app be?',
                options: [
                  { label: 'Filter by IP address ranges or a service tag', next: 'r-ar' },
                  { label: 'Reachable only on a private IP inside the virtual network', next: 'r-pe' },
                  { label: 'Needs its own dedicated inbound IP address', next: 'r-app-ip' },
                ],
              },
              'q-out': {
                kind: 'question',
                text: 'Where is the resource the app needs to reach?',
                options: [
                  { label: 'In an Azure virtual network (or reachable through it)', next: 'r-vnet' },
                  { label: 'On-premises, with no VPN or ExpressRoute to Azure', next: 'r-hybrid' },
                ],
              },
              'r-ar': { kind: 'result', title: 'Access restrictions', text: 'Build ordered allow and deny rules on the app. Add a rule for the SCM (Kudu) site too, which has its own rule set.', concepts: ['app-service'] },
              'r-pe': { kind: 'result', title: 'Private endpoint', text: 'The app gets a NIC in your subnet, public access is disabled, and DNS must resolve the app hostname to the private IP.', concepts: ['private-endpoint'] },
              'r-app-ip': { kind: 'result', title: 'App-assigned address (IP-based TLS)', text: 'Bind a certificate with IP-based SSL to get a dedicated inbound address, then remap the A record.', concepts: ['app-service-certificate'] },
              'r-vnet': { kind: 'result', title: 'Virtual network integration', text: 'Place the app’s back end in a delegated subnet in the same region. Peering, service endpoints, ExpressRoute and VPN targets all become reachable.', tone: 'good', concepts: ['vnet-integration'] },
              'r-hybrid': { kind: 'result', title: 'Hybrid Connections', text: 'Install Hybrid Connection Manager on a Windows Server host that can reach Azure Relay on 443; each connection tunnels to one host and port.', concepts: ['app-service'] },
            },
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
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# Inbound: only this corporate range may reach the app
az webapp config access-restriction add --resource-group rg-web-prod --name app-contoso-portal \\
  --rule-name corp-hq --action Allow --ip-address 203.0.113.0/24 --priority 100

# Outbound: reach resources in the virtual network
az webapp vnet-integration add --resource-group rg-web-prod --name app-contoso-portal \\
  --vnet vnet-app --subnet snet-appsvc-integration

# Inbound: private IP only
az network private-endpoint create --resource-group rg-web-prod --name pe-portal \\
  --vnet-name vnet-app --subnet snet-endpoints \\
  --private-connection-resource-id <app-resource-id> --group-id sites \\
  --connection-name portal-link`,
              notes: [
                { token: 'access-restriction add', note: 'Rules are evaluated by priority; adding any allow rule means everything else is implicitly denied.' },
                { token: 'vnet-integration add', note: 'The subnet must be delegated to Microsoft.Web/serverFarms and be in the same region as the app.' },
                { token: '--group-id sites', note: 'The sub-resource for an App Service app. Use "sites-<slot>" for a slot.' },
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
            { mistake: 'Adding VNet integration to stop the internet reaching the app.', fix: 'VNet integration is outbound only. Use access restrictions or a private endpoint for inbound control.' },
            { mistake: 'Adding a private endpoint so the app can reach a private database.', fix: 'A private endpoint on the app is inbound. The app needs VNet integration to make private outbound calls.' },
            { mistake: 'Allow-listing the app’s outbound IPs on a database firewall and then scaling up.', fix: 'Changing VM family changes the outbound addresses; use VNet integration with service endpoints or a private endpoint on the database instead.' },
            { mistake: 'Locking down the app but leaving the SCM site open.', fix: 'The advanced tool (Kudu) site has its own access restriction rules — restrict it too.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'trap', text: 'The most reliable discriminator in the whole module: private endpoint = inbound, VNet integration = outbound. Read the direction in the scenario before reading the options.' },
        { type: 'quickcheck', questionIds: ['app-net-direction', 'app-net-hybrid'] },
      ],
    },
  ],
  takeaways: [
    'Inbound: app-assigned address, access restrictions, service endpoints, private endpoints.',
    'Outbound: Hybrid Connections and virtual network integration.',
    'Private endpoint gives the app a private inbound IP; VNet integration lets the app call into a network.',
    'Default outbound addresses are shared and change when the VM family changes.',
  ],
};

export default lesson;
