import type { Architecture } from '../schema';

/**
 * The Real-World Architecture Library: seven reference designs an Azure
 * administrator actually meets, each examined through the same six lenses so
 * the comparison across them is meaningful.
 */
export const ARCHITECTURE_LIST: Architecture[] = [
  // -------------------------------------------------------------------- 1
  {
    id: 'arch-secure-web-app',
    title: 'Private web application',
    subtitle: 'App Service reachable only from the corporate network, talking to a private database',
    scenario:
      'An internal line-of-business web application replaces a server under someone’s desk. It must be reachable only from the corporate network, must reach a database that accepts no public traffic, and must be releasable during the working day.',
    requirements: [
      'No public endpoint on the application',
      'Private connectivity to an Azure SQL database',
      'No credentials stored in application configuration',
      'Zero-downtime releases with an instant rollback',
      'Cost proportionate to an internal tool',
    ],
    diagram: {
      root: {
        type: 'group',
        id: 'region',
        label: 'West Europe',
        kind: 'region',
        concept: 'region',
        direction: 'col',
        children: [
          {
            type: 'group',
            id: 'vnet',
            label: 'vnet-corp',
            sub: '10.0.0.0/16',
            kind: 'vnet',
            concept: 'vnet',
            direction: 'row',
            children: [
              {
                type: 'group',
                id: 'snet-pe',
                label: 'snet-endpoints',
                kind: 'subnet',
                concept: 'subnet',
                direction: 'col',
                children: [
                  { type: 'node', id: 'pe-app', label: 'pe-app', sub: 'inbound', icon: 'private-endpoint', tone: 'good', concept: 'private-endpoint' },
                  { type: 'node', id: 'pe-sql', label: 'pe-sql', sub: 'database', icon: 'private-endpoint', tone: 'good', concept: 'private-endpoint' },
                ],
              },
              {
                type: 'group',
                id: 'snet-int',
                label: 'snet-integration',
                sub: 'delegated to Microsoft.Web',
                kind: 'subnet',
                concept: 'vnet-integration',
                direction: 'col',
                children: [{ type: 'node', id: 'int', label: 'VNet integration', sub: 'outbound', icon: 'nic', concept: 'vnet-integration' }],
              },
            ],
          },
          {
            type: 'group',
            id: 'plan',
            label: 'App Service plan (Standard)',
            kind: 'boundary',
            concept: 'app-service-plan',
            direction: 'row',
            children: [
              { type: 'node', id: 'app', label: 'Web app', sub: 'production', icon: 'app-service', tone: 'accent', concept: 'app-service' },
              { type: 'node', id: 'slot', label: 'staging', icon: 'app-service', tone: 'muted', concept: 'deployment-slot' },
            ],
          },
          { type: 'node', id: 'sql', label: 'Azure SQL Database', icon: 'database', concept: 'private-endpoint' },
          { type: 'node', id: 'mi', label: 'Managed identity', icon: 'identity', tone: 'good', concept: 'managed-identity' },
          { type: 'node', id: 'dns', label: 'Private DNS zones', icon: 'dns', concept: 'private-dns-zone' },
          { type: 'node', id: 'user', label: 'Corporate user', icon: 'laptop' },
        ],
      },
      edges: [
        { from: 'user', to: 'pe-app', label: 'over ExpressRoute', tone: 'data' },
        { from: 'pe-app', to: 'app', tone: 'allow' },
        { from: 'app', to: 'int', label: 'outbound', tone: 'data' },
        { from: 'int', to: 'pe-sql', tone: 'data' },
        { from: 'pe-sql', to: 'sql', tone: 'allow' },
        { from: 'app', to: 'mi', label: 'token', style: 'dashed', tone: 'muted' },
        { from: 'dns', to: 'pe-app', label: 'resolves', style: 'dashed', tone: 'muted' },
        { from: 'slot', to: 'app', label: 'swap', style: 'dashed', tone: 'muted' },
      ],
      flows: [{ id: 'request', label: 'A page request end to end', path: ['user', 'pe-app', 'app', 'int', 'pe-sql', 'sql'], tone: 'data' }],
    },
    services: [
      { concept: 'app-service', role: 'Hosts the application', why: 'No operating system to patch, and the team has no server administrators.' },
      { concept: 'app-service-plan', role: 'The compute the app runs on', why: 'Standard is the cheapest tier with deployment slots and autoscale.' },
      { concept: 'private-endpoint', role: 'Inbound private access to the app and the database', why: 'Removes the public endpoint entirely rather than filtering it.' },
      { concept: 'vnet-integration', role: 'Outbound path from the app into the network', why: 'Inbound features cannot solve outbound problems; this is the other half.' },
      { concept: 'managed-identity', role: 'Authenticates the app to the database', why: 'No secret exists to store, rotate or leak.' },
      { concept: 'private-dns-zone', role: 'Resolves the private endpoint names', why: 'Without the zone link, clients resolve the public address and fail.' },
      { concept: 'deployment-slot', role: 'Staging environment and rollback mechanism', why: 'A swap warms instances before routing changes, and swapping again is an instant rollback.' },
    ],
    aspects: {
      security: [
        'No public endpoint on the application or the database.',
        'Managed identity removes stored credentials entirely.',
        'HTTPS Only is enabled — note that it is a slot setting and does not swap.',
      ],
      networking: [
        'Private endpoint for inbound; virtual network integration for outbound. They are not interchangeable.',
        'The integration subnet must be delegated to Microsoft.Web/serverFarms and in the same region as the app.',
        'The private DNS zone must be linked to every network that resolves the name.',
      ],
      monitoring: [
        'App Service platform metrics need no configuration; resource logs need a diagnostic setting.',
        'Alert on HTTP 5xx and response time with max aggregation, not average.',
        'Export the activity log so a configuration change can be traced later.',
      ],
      governance: [
        'Tag the plan and app with costCentre and owner.',
        'A CanNotDelete lock on the production resource group.',
        'Policy enforcing HTTPS-only and diagnostic settings at the management group.',
      ],
      availability: [
        'Scale out across instances within the plan; the platform handles instance health.',
        'Slots eliminate release downtime.',
        'For regional resilience, a second plan in another region fronted by Front Door.',
      ],
      cost: [
        'The plan is billed per instance whether or not the app is busy.',
        'Autoscale with a low minimum matches cost to traffic.',
        'Private endpoints are billed per endpoint per hour plus data processed.',
      ],
    },
    alternatives: [
      { option: 'Access restrictions instead of a private endpoint', tradeoff: 'Simpler and cheaper, but the app keeps a public endpoint that merely filters by source address.' },
      { option: 'Container Apps', tradeoff: 'Better if the application is already containerised and would use revisions and scale to zero; loses App Service’s slot model.' },
      { option: 'An App Service Environment', tradeoff: 'Single-tenant hosting inside your own network, at a much higher fixed cost — justified only across several workloads.' },
    ],
    concepts: ['app-service', 'app-service-plan', 'deployment-slot', 'private-endpoint', 'private-dns-zone', 'vnet-integration', 'managed-identity'],
    sources: ['appservice-plans', 'appservice-networking', 'appservice-slots', 'private-endpoint-dns', 'managed-identities'],
  },

  // -------------------------------------------------------------------- 2
  {
    id: 'arch-hub-spoke',
    title: 'Hub and spoke network',
    subtitle: 'One gateway, one inspection point, isolated application networks',
    scenario:
      'An organisation with several application teams needs private connectivity to on-premises, centrally inspected internet egress, and shared services — without giving every team its own gateway or letting them reach each other freely.',
    requirements: [
      'One connection to on-premises, shared by all workloads',
      'All outbound internet traffic inspected',
      'Each application team owns its own virtual network',
      'Shared DNS and file services reachable from every spoke',
      'Application networks isolated from each other by default',
    ],
    diagram: {
      root: {
        type: 'group',
        id: 'topology',
        label: 'Regional topology',
        kind: 'plain',
        direction: 'col',
        children: [
          { type: 'node', id: 'onprem', label: 'On-premises datacentre', icon: 'onprem', concept: 'expressroute' },
          {
            type: 'group',
            id: 'hub',
            label: 'vnet-hub · 10.0.0.0/16',
            kind: 'vnet',
            concept: 'hub-spoke',
            direction: 'col',
            children: [
              {
                type: 'group',
                id: 'hub-edge',
                label: 'Connectivity',
                kind: 'plain',
                direction: 'row',
                children: [
                  { type: 'node', id: 'gw', label: 'GatewaySubnet', sub: 'ExpressRoute / VPN', icon: 'gateway', concept: 'vpn-gateway' },
                  { type: 'node', id: 'fw', label: 'AzureFirewallSubnet', sub: 'egress inspection', icon: 'firewall', tone: 'accent', concept: 'network-virtual-appliance' },
                ],
              },
              {
                type: 'group',
                id: 'hub-shared',
                label: 'Shared services',
                kind: 'plain',
                direction: 'row',
                children: [
                  { type: 'node', id: 'bas', label: 'AzureBastionSubnet', sub: '/26 minimum', icon: 'bastion', concept: 'bastion' },
                  { type: 'node', id: 'dns', label: 'Private DNS zones', icon: 'dns', concept: 'private-dns-zone' },
                ],
              },
            ],
          },
          {
            type: 'group',
            id: 'spokes',
            label: 'Spokes',
            kind: 'plain',
            direction: 'row',
            children: [
              {
                type: 'group',
                id: 'sp1',
                label: 'vnet-app-a · 10.1.0.0/16',
                kind: 'vnet',
                concept: 'vnet',
                direction: 'col',
                children: [{ type: 'node', id: 'a-workload', label: 'Workload', sub: 'UDR → firewall', icon: 'server', concept: 'route-table' }],
              },
              {
                type: 'group',
                id: 'sp2',
                label: 'vnet-app-b · 10.2.0.0/16',
                kind: 'vnet',
                concept: 'vnet',
                direction: 'col',
                children: [{ type: 'node', id: 'b-workload', label: 'Workload', sub: 'UDR → firewall', icon: 'server', concept: 'route-table' }],
              },
            ],
          },
          { type: 'node', id: 'net', label: 'Internet', icon: 'internet' },
        ],
      },
      edges: [
        { from: 'onprem', to: 'gw', label: 'private circuit', tone: 'allow' },
        { from: 'sp1', to: 'hub', label: 'gateway transit', tone: 'allow', both: true },
        { from: 'sp2', to: 'hub', label: 'peering', tone: 'allow', both: true },
        { from: 'fw', to: 'net', label: 'inspected egress', tone: 'data' },
        { from: 'sp1', to: 'sp2', label: 'no path', style: 'dashed', tone: 'deny' },
      ],
      flows: [
        { id: 'egress', label: 'Spoke egress through inspection', path: ['a-workload', 'sp1', 'hub', 'fw', 'net'], tone: 'data' },
        { id: 'onprem-in', label: 'On-premises to a spoke workload', path: ['onprem', 'gw', 'hub', 'sp1', 'a-workload'], tone: 'allow' },
      ],
    },
    services: [
      { concept: 'hub-spoke', role: 'The topology itself', why: 'Centralises the expensive, shared components and keeps team boundaries.' },
      { concept: 'vnet-peering', role: 'Connects each spoke to the hub', why: 'Low latency over the Azure backbone, with no gateway needed per spoke.' },
      { concept: 'vpn-gateway', role: 'Terminates the on-premises connection', why: 'One gateway shared by every spoke through gateway transit.' },
      { concept: 'network-virtual-appliance', role: 'Inspects outbound traffic', why: 'A user-defined route sends 0.0.0.0/0 to it, overriding the system default route.' },
      { concept: 'route-table', role: 'Forces spoke egress to the firewall', why: 'Without the UDR, the system route sends traffic straight to the internet.' },
      { concept: 'bastion', role: 'Administrative access to VMs', why: 'RDP and SSH over TLS with no public IPs on the workloads.' },
      { concept: 'private-dns-zone', role: 'Name resolution for private endpoints', why: 'Linked to every spoke that needs to resolve them.' },
    ],
    aspects: {
      security: [
        'All egress passes the inspection point; nothing reaches the internet directly.',
        'Spoke-to-spoke traffic has no route by default — isolation is the default state.',
        'Bastion removes public IPs from the workloads entirely.',
      ],
      networking: [
        'Peering is not transitive: spoke-to-spoke needs the hub appliance plus UDRs.',
        'Gateway transit is a paired setting — allow on the hub, use remote gateways on the spoke.',
        'Address spaces must not overlap anywhere in the topology.',
        'GatewaySubnet, AzureFirewallSubnet and AzureBastionSubnet have required names and minimum sizes.',
      ],
      monitoring: [
        'Virtual network flow logs record what actually traversed the network.',
        'Connection monitor tests the paths you care about continuously and alerts on ChecksFailedPercent.',
        'Network Watcher next hop and IP flow verify explain individual decisions.',
      ],
      governance: [
        'The hub is owned by the platform team; spokes are delegated to application teams with RBAC at the resource group.',
        'Policy enforcing that every subnet has an NSG and that UDRs are not removed.',
        'Address space allocation is managed centrally, not by teams.',
      ],
      availability: [
        'Gateways are zone-redundant in regions that support zones.',
        'The firewall is a single point of failure for egress — size and scale it accordingly.',
        'Peering itself has no SLA-affecting components to fail.',
      ],
      cost: [
        'The gateway and firewall are the fixed costs; they are shared, which is the point.',
        'Peering is billed on data transferred in both directions.',
        'Bastion is billed hourly plus outbound data.',
      ],
    },
    alternatives: [
      { option: 'Azure Virtual WAN', tradeoff: 'Microsoft manages the hubs and routing — far less to build at many-site scale, less control over the details.' },
      { option: 'Flat single virtual network', tradeoff: 'Simplest possible, with no team boundary and no natural place for delegated administration.' },
      { option: 'Direct spoke-to-spoke peering', tradeoff: 'Lowest latency between two spokes, but it bypasses inspection and grows quadratically.' },
    ],
    concepts: ['hub-spoke', 'vnet-peering', 'vpn-gateway', 'expressroute', 'route-table', 'network-virtual-appliance', 'bastion', 'private-dns-zone', 'network-watcher'],
    sources: ['peering', 'routing', 'bastion-config', 'network-watcher', 'vnet-faq'],
  },

  // -------------------------------------------------------------------- 3
  {
    id: 'arch-zonal-vmss',
    title: 'Zone-resilient web tier',
    subtitle: 'A scale set across zones behind a zone-redundant load balancer',
    scenario:
      'A public web tier must survive the loss of a datacentre without manual intervention and absorb unpredictable traffic spikes, while keeping OS-level control for a licensed component.',
    requirements: [
      'Survive the loss of one availability zone automatically',
      'Scale capacity with demand and back down afterwards',
      'Remove unhealthy instances from rotation without human action',
      'Retain OS-level control',
    ],
    diagram: {
      root: {
        type: 'group',
        id: 'region',
        label: 'Region with availability zones',
        kind: 'region',
        concept: 'region',
        direction: 'col',
        children: [
          { type: 'node', id: 'pip', label: 'Public IP', sub: 'Standard · zone-redundant', icon: 'public-ip', concept: 'public-ip' },
          { type: 'node', id: 'lb', label: 'Load balancer', sub: 'Standard · HTTP probe', icon: 'lb', tone: 'accent', concept: 'load-balancer' },
          {
            type: 'group',
            id: 'zones',
            label: 'vmss-web (Flexible orchestration)',
            kind: 'boundary',
            concept: 'vmss',
            direction: 'row',
            children: [
              {
                type: 'group',
                id: 'z1',
                label: 'Zone 1',
                kind: 'zone',
                concept: 'availability-zone',
                direction: 'col',
                children: [{ type: 'node', id: 'i1', label: 'Instances', icon: 'vm', concept: 'virtual-machine' }],
              },
              {
                type: 'group',
                id: 'z2',
                label: 'Zone 2',
                kind: 'zone',
                concept: 'availability-zone',
                direction: 'col',
                children: [{ type: 'node', id: 'i2', label: 'Instances', icon: 'vm', concept: 'virtual-machine' }],
              },
              {
                type: 'group',
                id: 'z3',
                label: 'Zone 3',
                kind: 'zone',
                concept: 'availability-zone',
                direction: 'col',
                children: [{ type: 'node', id: 'i3', label: 'Instances', icon: 'vm', concept: 'virtual-machine' }],
              },
            ],
          },
          { type: 'node', id: 'as', label: 'Autoscale rules', sub: 'schedule + CPU', icon: 'vmss', concept: 'autoscale' },
        ],
      },
      edges: [
        { from: 'pip', to: 'lb', tone: 'data' },
        { from: 'lb', to: 'z1', label: 'probe + traffic', tone: 'allow' },
        { from: 'lb', to: 'z2', label: 'probe + traffic', tone: 'allow' },
        { from: 'lb', to: 'z3', label: 'probe + traffic', tone: 'allow' },
        { from: 'as', to: 'zones', label: 'adjusts capacity', style: 'dashed', tone: 'muted' },
      ],
      flows: [{ id: 'req', label: 'Request to a healthy instance', path: ['pip', 'lb', 'z2', 'i2'], tone: 'data' }],
    },
    services: [
      { concept: 'vmss', role: 'Manages the instances as one resource', why: 'Flexible orchestration keeps instances as ordinary VMs while adding autoscale and zone spreading.' },
      { concept: 'availability-zone', role: 'Physical separation within the region', why: 'Survives the loss of a whole datacentre, which an availability set does not.' },
      { concept: 'load-balancer', role: 'Distributes traffic and detects failure', why: 'Standard SKU is zone-redundant and has an SLA.' },
      { concept: 'health-probe', role: 'Decides which instances receive new flows', why: 'An application-aware probe is what makes failure detection automatic.' },
      { concept: 'autoscale', role: 'Adds and removes instances', why: 'Matches capacity to demand and cost to capacity.' },
      { concept: 'public-ip', role: 'The front door', why: 'Standard SKU is static and zone-redundant — and closed by default.' },
    ],
    aspects: {
      security: [
        'A Standard public IP is closed by default; an explicit NSG rule is required.',
        'Administrative access through Bastion, never a public IP per instance.',
        'The health endpoint must be unauthenticated — and must therefore expose nothing sensitive.',
      ],
      networking: [
        'The load balancer frontend should be zone-redundant, not zonal.',
        'Health probes originate from 168.63.129.16 and must not be blocked.',
        'Flexible mode instances have no default outbound access; plan a NAT gateway if they need egress.',
      ],
      monitoring: [
        'Alert on backend pool health, not only on CPU — uneven load is the first visible symptom of a probe failure.',
        'Watch the instance count metric for autoscale flapping.',
        'Guest metrics need the Azure Monitor Agent and a data collection rule.',
      ],
      governance: [
        'Orchestration mode is fixed at creation — get it right the first time.',
        'Instance configuration comes from the scale set model, which prevents drift between instances.',
        'Policy enforcing allowed VM sizes keeps autoscale from scaling into expensive SKUs.',
      ],
      availability: [
        'Zonal spreading carries the highest single-region VM SLA.',
        'A failing probe stops new flows to an instance; existing connections continue until they end.',
        'Zones protect against a datacentre; a second region is still needed for regional loss.',
      ],
      cost: [
        'Autoscale minimum is what you pay for around the clock — set it to the real baseline.',
        'A scheduled minimum before a known peak avoids degraded service during scale-out.',
        'Spot instances can serve a portion of stateless capacity at a large discount.',
      ],
    },
    alternatives: [
      { option: 'Availability set instead of zones', tradeoff: 'The only choice in a region without zones; protects against rack and maintenance failures but not against losing the datacentre.' },
      { option: 'App Service with autoscale', tradeoff: 'Removes OS management entirely — not available when a licensed component needs OS-level installation.' },
      { option: 'Application Gateway instead of a load balancer', tradeoff: 'Adds layer 7 routing, TLS offload and WAF, at higher cost and complexity.' },
    ],
    concepts: ['vmss', 'availability-zone', 'load-balancer', 'health-probe', 'autoscale', 'public-ip', 'nat-gateway'],
    sources: ['vmss-modes', 'availability-zones', 'lb-skus', 'lb-probes', 'default-outbound'],
  },

  // -------------------------------------------------------------------- 4
  {
    id: 'arch-storage-archive',
    title: 'Long-term document archive',
    subtitle: 'Lifecycle-tiered blob storage with layered deletion protection',
    scenario:
      'A regulated organisation must retain scanned documents for years, at the lowest defensible cost, with recoverable deletion and an audit trail of who read what.',
    requirements: [
      'Retain documents for the full regulatory period',
      'Minimise cost as documents age',
      'Recover from accidental or malicious deletion',
      'Allow a third party to upload without read or delete rights',
      'Prove who accessed which document',
    ],
    diagram: {
      root: {
        type: 'group',
        id: 'sub',
        label: 'Subscription',
        kind: 'subscription',
        direction: 'col',
        children: [
          {
            type: 'group',
            id: 'sa',
            label: 'Storage account (GRS)',
            kind: 'boundary',
            concept: 'storage-account',
            direction: 'row',
            children: [
              { type: 'node', id: 'hot', label: 'Hot', sub: 'recent', icon: 'blob', tone: 'accent', concept: 'access-tier' },
              { type: 'node', id: 'cool', label: 'Cool', sub: '30+ days', icon: 'blob', concept: 'access-tier' },
              { type: 'node', id: 'arch', label: 'Archive', sub: '180+ days · offline', icon: 'blob', tone: 'muted', concept: 'access-tier' },
            ],
          },
          { type: 'node', id: 'lc', label: 'Lifecycle policy', icon: 'policy', concept: 'lifecycle-management' },
          { type: 'node', id: 'prot', label: 'Soft delete + versioning', icon: 'shield', tone: 'good', concept: 'blob-versioning' },
          { type: 'node', id: 'sas', label: 'SAS + stored access policy', sub: 'create, write only', icon: 'key-vault', concept: 'stored-access-policy' },
          { type: 'node', id: 'third', label: 'Third-party uploader', icon: 'laptop', concept: 'sas' },
          { type: 'node', id: 'law', label: 'Log Analytics', sub: 'StorageRead logs', icon: 'log-analytics', concept: 'log-analytics-workspace' },
          { type: 'node', id: 'secondary', label: 'Paired region replica', icon: 'globe', tone: 'muted', concept: 'paired-region' },
        ],
      },
      edges: [
        { from: 'third', to: 'sas', style: 'dashed', tone: 'muted' },
        { from: 'sas', to: 'hot', label: 'upload', tone: 'data' },
        { from: 'lc', to: 'cool', label: 'tier down', style: 'dashed', tone: 'muted' },
        { from: 'lc', to: 'arch', label: 'tier down', style: 'dashed', tone: 'muted' },
        { from: 'prot', to: 'sa', label: 'recoverable', style: 'dashed', tone: 'allow' },
        { from: 'sa', to: 'law', label: 'resource logs', tone: 'data' },
        { from: 'sa', to: 'secondary', label: 'geo-replication', style: 'dashed', tone: 'muted' },
      ],
      flows: [{ id: 'ingest', label: 'Document ingest and ageing', path: ['third', 'sas', 'hot', 'cool', 'arch'], tone: 'data' }],
    },
    services: [
      { concept: 'storage-account', role: 'Holds the documents', why: 'Blob storage with tiering is the cheapest durable home for immutable documents.' },
      { concept: 'access-tier', role: 'Cost per byte over time', why: 'Hot, Cool, Cold and Archive trade retrieval cost and latency against storage cost.' },
      { concept: 'lifecycle-management', role: 'Moves and deletes blobs automatically', why: 'Removes the operational job and respects each tier’s minimum retention.' },
      { concept: 'blob-soft-delete', role: 'Recovers deleted blobs and containers', why: 'The only protection against a deletion, accidental or malicious.' },
      { concept: 'blob-versioning', role: 'Recovers overwritten content', why: 'Soft delete and versioning cover different failure modes.' },
      { concept: 'stored-access-policy', role: 'Makes a SAS revocable', why: 'Revocation without rotating the account key, which would break every other SAS.' },
      { concept: 'diagnostic-settings', role: 'Routes read logs for audit', why: 'Reads are data-plane operations that only resource logs record.' },
    ],
    aspects: {
      security: [
        'Public blob access disabled; TLS 1.2 minimum.',
        'A create-and-write SAS bound to a stored access policy, never the account key.',
        'Encryption at rest is always on; customer-managed keys if the regulator requires key control.',
      ],
      networking: [
        'Storage firewall set to deny by default, with the uploader’s ranges allowed.',
        'A private endpoint for internal readers, with the privatelink DNS zone linked.',
        'Service endpoints as the lighter alternative when the public endpoint is acceptable.',
      ],
      monitoring: [
        'Resource logs must be enabled before the access you want to audit — they cannot be backfilled.',
        'Alert on AuthenticationError in storage metrics; it goes vertical when a key is rotated.',
        'Track capacity metrics to forecast cost as the archive grows.',
      ],
      governance: [
        'A CanNotDelete lock on the storage account.',
        'Policy enforcing secure transfer and diagnostic settings.',
        'An immutability policy where the regulator requires write-once-read-many.',
      ],
      availability: [
        'GRS replicates to the paired region; the secondary is not readable without RA-GRS.',
        'Archive is offline — rehydration takes hours, which the retrieval SLA must accommodate.',
        'Soft delete retention is the real recovery window for deletion.',
      ],
      cost: [
        'Tiering is the main lever; early deletion from Cool or Archive incurs a charge.',
        'Rehydration is billed per operation and per gigabyte — rare reads are cheap, frequent ones are not.',
        'Versioning multiplies stored bytes; add a version lifecycle rule.',
      ],
    },
    alternatives: [
      { option: 'Cool as the coldest tier', tradeoff: 'No rehydration delay at a higher storage cost — right when retrieval must be immediate.' },
      { option: 'Azure Files instead of blobs', tradeoff: 'Necessary when applications need SMB access; no Archive tier and a different cost profile.' },
      { option: 'Immutable (WORM) storage', tradeoff: 'Prevents any deletion or modification before retention expires, including by administrators — and removes your ability to correct mistakes.' },
    ],
    concepts: ['storage-account', 'access-tier', 'lifecycle-management', 'blob-soft-delete', 'blob-versioning', 'sas', 'stored-access-policy', 'storage-redundancy', 'storage-firewall', 'diagnostic-settings'],
    sources: ['storage-account-overview', 'access-tiers', 'lifecycle', 'blob-soft-delete', 'blob-versioning', 'sas-overview', 'stored-access-policy', 'storage-redundancy'],
  },

  // -------------------------------------------------------------------- 5
  {
    id: 'arch-governed-estate',
    title: 'Governed multi-subscription estate',
    subtitle: 'Management groups, an inherited policy baseline, and attributable cost',
    scenario:
      'An organisation with several business units and many subscriptions needs one set of rules, reliable cost attribution and protection against accidental destruction — applied once and inherited everywhere.',
    requirements: [
      'Apply company rules once, covering subscriptions that do not exist yet',
      'Constrain regions and require tags',
      'Attribute spend by business unit with early warning',
      'Protect production from accidental deletion',
      'Delegate day-to-day access without handing out Owner',
    ],
    diagram: {
      root: {
        type: 'group',
        id: 'tenant',
        label: 'Microsoft Entra tenant',
        kind: 'hierarchy',
        concept: 'entra-tenant',
        direction: 'col',
        children: [
          {
            type: 'group',
            id: 'root-mg',
            label: 'Root management group',
            kind: 'hierarchy',
            concept: 'management-group',
            direction: 'col',
            children: [
              {
                type: 'group',
                id: 'corp-mg',
                label: 'mg-corp',
                sub: 'baseline initiative assigned here',
                kind: 'hierarchy',
                concept: 'management-group',
                direction: 'row',
                children: [
                  {
                    type: 'group',
                    id: 'prod-mg',
                    label: 'mg-production',
                    kind: 'hierarchy',
                    concept: 'management-group',
                    direction: 'col',
                    children: [{ type: 'node', id: 'sub-prod', label: 'Production subscriptions', icon: 'subscription', concept: 'subscription' }],
                  },
                  {
                    type: 'group',
                    id: 'nonprod-mg',
                    label: 'mg-nonproduction',
                    kind: 'hierarchy',
                    concept: 'management-group',
                    direction: 'col',
                    children: [{ type: 'node', id: 'sub-dev', label: 'Dev and test subscriptions', icon: 'subscription', concept: 'subscription' }],
                  },
                ],
              },
            ],
          },
          { type: 'node', id: 'init', label: 'Corp baseline initiative', sub: 'locations, tags, diagnostics', icon: 'policy', tone: 'accent', concept: 'policy-initiative' },
          { type: 'node', id: 'rbac', label: 'Groups → roles at RG scope', icon: 'group', concept: 'azure-rbac' },
          { type: 'node', id: 'budget', label: 'Budgets by costCentre tag', icon: 'cost', concept: 'budget' },
          { type: 'node', id: 'locks', label: 'CanNotDelete on production', icon: 'lock', tone: 'good', concept: 'resource-lock' },
        ],
      },
      edges: [
        { from: 'init', to: 'corp-mg', label: 'assigned at', tone: 'allow' },
        { from: 'corp-mg', to: 'prod-mg', label: 'inherited', style: 'dashed', tone: 'muted' },
        { from: 'corp-mg', to: 'nonprod-mg', label: 'inherited', style: 'dashed', tone: 'muted' },
        { from: 'rbac', to: 'sub-prod', label: 'least privilege', style: 'dashed', tone: 'allow' },
        { from: 'budget', to: 'corp-mg', label: 'reports on tags', style: 'dashed', tone: 'data' },
        { from: 'locks', to: 'sub-prod', label: 'protects', style: 'dashed', tone: 'allow' },
      ],
    },
    services: [
      { concept: 'management-group', role: 'The scope rules are assigned at', why: 'The only level where one assignment covers future subscriptions.' },
      { concept: 'policy-initiative', role: 'The baseline as a single unit', why: 'Assigned once and reported on as one compliance state.' },
      { concept: 'policy-effect', role: 'Decides audit versus enforce', why: 'Audit measures impact; Deny enforces; Modify remediates existing resources.' },
      { concept: 'tags', role: 'Cost and ownership attribution', why: 'Cost analysis is only as good as the tagging behind it.' },
      { concept: 'budget', role: 'Early warning on spend', why: 'Budgets alert at thresholds; they never stop spending.' },
      { concept: 'resource-lock', role: 'Protects production from deletion', why: 'CanNotDelete allows deployment while blocking destruction.' },
      { concept: 'azure-rbac', role: 'Delegates access', why: 'Groups assigned built-in roles at the narrowest scope that works.' },
    ],
    aspects: {
      security: [
        'RBAC assigned to groups, never to individuals.',
        'Owner reserved; day-to-day work uses Contributor plus User Access Administrator where granting is needed.',
        'Custom roles only when no built-in role fits, with AssignableScopes kept narrow.',
      ],
      networking: [
        'Policy can require an NSG on every subnet and forbid public IPs in production.',
        'Address space allocation is a central function, not a team decision.',
      ],
      monitoring: [
        'Policy with DeployIfNotExists ensures diagnostic settings exist on new resources.',
        'The activity log is exported centrally for the change audit trail.',
        'Compliance state is reviewed on a schedule, not only after an incident.',
      ],
      governance: [
        'Roll out in Audit or DoNotEnforce, publish the impact, then switch to Deny on an agreed date.',
        'Modify with a remediation task fixes existing resources; Deny alone does not.',
        'Exemptions carry an owner and an expiry, or they become permanent.',
      ],
      availability: [
        'A ReadOnly lock blocks deployments and some read-like operations — use CanNotDelete.',
        'Locks are inherited and the most restrictive wins.',
      ],
      cost: [
        'Budgets at subscription and management group scope with alerts at 50, 80 and 100 per cent.',
        'Azure Advisor recommendations reviewed monthly for underused resources.',
        'Reserved capacity for steady-state workloads once usage is understood.',
      ],
    },
    alternatives: [
      { option: 'One subscription per business unit', tradeoff: 'A clean billing and quota boundary — usually combined with the hierarchy rather than replacing it.' },
      { option: 'Landing zone accelerators', tradeoff: 'Much faster to a standard shape, at the cost of adopting someone else’s opinions wholesale.' },
      { option: 'Policy at subscription scope only', tradeoff: 'Workable for a single subscription; it drifts the moment a second one appears.' },
    ],
    concepts: ['management-group', 'subscription', 'azure-policy', 'policy-initiative', 'policy-effect', 'tags', 'budget', 'resource-lock', 'azure-rbac', 'entra-tenant'],
    sources: ['management-groups', 'policy-overview', 'policy-effects', 'tags', 'budgets', 'locks', 'rbac-overview'],
  },

  // -------------------------------------------------------------------- 6
  {
    id: 'arch-containerised-microservices',
    title: 'Containerised microservices',
    subtitle: 'Container Apps with a private registry, event-driven scaling and revisions',
    scenario:
      'A set of containerised services — an HTTP API and a queue worker — needs managed hosting with event-driven scaling, controlled rollouts and no cluster to operate.',
    requirements: [
      'Run containers without managing a Kubernetes cluster',
      'Scale the API on request volume and the worker on queue depth',
      'Scale to zero when idle, without the worker becoming unwakeable',
      'Roll out new versions to a slice of traffic first',
      'Pull images without storing registry credentials',
    ],
    diagram: {
      root: {
        type: 'group',
        id: 'region',
        label: 'West Europe',
        kind: 'region',
        concept: 'region',
        direction: 'col',
        children: [
          {
            type: 'group',
            id: 'env',
            label: 'Container Apps environment',
            sub: 'shared network and logging',
            kind: 'boundary',
            concept: 'container-apps',
            direction: 'row',
            children: [
              { type: 'node', id: 'api', label: 'ca-api', sub: 'HTTP scale rule · revisions', icon: 'container-apps', tone: 'accent', concept: 'container-apps' },
              { type: 'node', id: 'worker', label: 'ca-worker', sub: 'queue scale rule · min 0', icon: 'container-apps', concept: 'container-apps' },
            ],
          },
          { type: 'node', id: 'acr', label: 'Container registry', sub: 'Premium', icon: 'registry', concept: 'container-registry' },
          { type: 'node', id: 'mi', label: 'Managed identity', sub: 'AcrPull', icon: 'identity', tone: 'good', concept: 'managed-identity' },
          { type: 'node', id: 'queue', label: 'Storage queue', icon: 'queue', concept: 'queue-storage' },
          { type: 'node', id: 'law', label: 'Log Analytics', icon: 'log-analytics', concept: 'log-analytics-workspace' },
          { type: 'node', id: 'client', label: 'Clients', icon: 'laptop' },
        ],
      },
      edges: [
        { from: 'client', to: 'api', label: 'HTTPS ingress', tone: 'data' },
        { from: 'api', to: 'queue', label: 'enqueue work', tone: 'data' },
        { from: 'queue', to: 'worker', label: 'scale trigger', style: 'dashed', tone: 'allow' },
        { from: 'mi', to: 'acr', label: 'AcrPull', style: 'dashed', tone: 'allow' },
        { from: 'acr', to: 'env', label: 'image pull', tone: 'data' },
        { from: 'env', to: 'law', label: 'logs', tone: 'data' },
      ],
      flows: [{ id: 'work', label: 'Request to background work', path: ['client', 'api', 'queue', 'worker'], tone: 'data' }],
    },
    services: [
      { concept: 'container-apps', role: 'Runs the services', why: 'Managed platform with ingress, revisions and KEDA-based scaling — no cluster to operate.' },
      { concept: 'container-registry', role: 'Stores the images', why: 'Premium adds geo-replication and private endpoints where they are needed.' },
      { concept: 'managed-identity', role: 'Authenticates the image pull', why: 'AcrPull on a managed identity removes registry credentials entirely.' },
      { concept: 'queue-storage', role: 'Decouples the API from the worker', why: 'Queue depth is the scale signal that lets the worker sleep at zero.' },
      { concept: 'log-analytics-workspace', role: 'Collects container logs', why: 'Apps in one environment share a logging destination.' },
    ],
    aspects: {
      security: [
        'Managed identity for the registry pull and for any Azure service the containers call.',
        'Secrets held as Container Apps secrets or in Key Vault, never in the image.',
        'Internal-only ingress for services that should not be public.',
      ],
      networking: [
        'Apps in one environment share a virtual network and can call each other by name.',
        'Ingress can be external or internal; internal keeps a service inside the environment.',
        'A custom virtual network is required when the environment must reach private resources.',
      ],
      monitoring: [
        'Console and system logs flow to the workspace automatically.',
        'Watch replica count alongside request metrics to see scaling behaviour.',
        'Adding or editing a scale rule creates a new revision — expect that in the change history.',
      ],
      governance: [
        'Revisions give an auditable history of what ran and when.',
        'Traffic weights are the controlled-rollout mechanism; keep the previous revision until the new one has soaked.',
        'Policy restricting allowed registries stops unvetted images being deployed.',
      ],
      availability: [
        'Replicas are spread by the platform; a minimum above zero removes cold starts.',
        'The queue decouples the tiers, so a worker restart does not lose work.',
        'A worker with no ingress, no scale rule and min 0 will scale to zero and never restart.',
      ],
      cost: [
        'Nothing is billed while an app is scaled to zero.',
        'Idle replicas held in memory may be billed at a lower rate.',
        'Registry cost is driven by the plan and stored gigabytes, not by pulls.',
      ],
    },
    alternatives: [
      { option: 'Azure Container Instances', tradeoff: 'Simplest for a single short-lived container; no scaling, ingress, revisions or service discovery.' },
      { option: 'Azure Kubernetes Service', tradeoff: 'Full Kubernetes control and node-level access, with a cluster to operate, upgrade and secure.' },
      { option: 'App Service for containers', tradeoff: 'Keeps slots, custom domains and managed certificates for a single web container; no event-driven scaling or scale to zero on a dedicated plan.' },
    ],
    concepts: ['container-apps', 'container-registry', 'container-instances', 'managed-identity', 'queue-storage', 'log-analytics-workspace'],
    sources: ['aca-containers', 'aca-environment', 'aca-scale', 'acr-skus', 'acr-auth', 'managed-identities'],
  },

  // -------------------------------------------------------------------- 7
  {
    id: 'arch-backup-dr',
    title: 'Backup and disaster recovery',
    subtitle: 'Point-in-time recovery for corruption, replication for regional loss',
    scenario:
      'A production workload needs to survive both classes of failure: someone deleting or corrupting data, and an entire region becoming unavailable. The two need different technologies.',
    requirements: [
      'Recover from deletion, corruption and ransomware',
      'Recover the workload in another region within an agreed RTO',
      'Meet a stated RPO for regional failure',
      'Prove the recovery works without touching production',
      'Protect the backups themselves from a compromised administrator',
    ],
    diagram: {
      root: {
        type: 'group',
        id: 'all',
        label: 'Protection design',
        kind: 'plain',
        direction: 'col',
        children: [
          {
            type: 'group',
            id: 'primary',
            label: 'Primary region',
            kind: 'region',
            concept: 'region',
            direction: 'row',
            children: [
              { type: 'node', id: 'vm', label: 'Production VMs', icon: 'vm', tone: 'accent', concept: 'virtual-machine' },
              { type: 'node', id: 'rsv', label: 'Recovery Services vault', sub: 'GRS · soft delete', icon: 'backup', tone: 'good', concept: 'recovery-services-vault' },
              { type: 'node', id: 'policy', label: 'Enhanced policy', sub: 'every 4 hours', icon: 'policy', concept: 'backup-policy' },
            ],
          },
          {
            type: 'group',
            id: 'secondary',
            label: 'Paired region',
            kind: 'region',
            concept: 'paired-region',
            direction: 'row',
            children: [
              { type: 'node', id: 'asr', label: 'Replicated VMs', sub: 'idle until failover', icon: 'recovery', tone: 'muted', concept: 'site-recovery' },
              { type: 'node', id: 'crr', label: 'Cross Region Restore', sub: 'vault tier', icon: 'backup', tone: 'muted', concept: 'recovery-services-vault' },
            ],
          },
        ],
      },
      edges: [
        { from: 'vm', to: 'rsv', label: 'backup', tone: 'data' },
        { from: 'policy', to: 'rsv', style: 'dashed', tone: 'muted' },
        { from: 'vm', to: 'asr', label: 'continuous replication', tone: 'data' },
        { from: 'rsv', to: 'crr', label: 'geo-replicated vault data', style: 'dashed', tone: 'muted' },
      ],
      flows: [
        { id: 'corrupt', label: 'Recovering from corruption', path: ['rsv', 'vm'], tone: 'allow' },
        { id: 'region', label: 'Recovering from regional loss', path: ['vm', 'asr'], tone: 'allow' },
      ],
    },
    services: [
      { concept: 'recovery-services-vault', role: 'Holds backups and Site Recovery configuration', why: 'Azure VM backup and Site Recovery both live here.' },
      { concept: 'backup-policy', role: 'Schedule and retention', why: 'An Enhanced policy reaches a 4-hour RPO; Standard is daily at best.' },
      { concept: 'azure-backup', role: 'Point-in-time recovery', why: 'The only protection against deletion, corruption and ransomware.' },
      { concept: 'site-recovery', role: 'Regional recovery', why: 'Continuous replication with recovery points ready in the second region.' },
      { concept: 'paired-region', role: 'Where geo-redundant data lands', why: 'Cross Region Restore reads from it on demand.' },
    ],
    aspects: {
      security: [
        'Soft delete retains deleted backup data for 14 extra days at no cost; enhanced soft delete makes it always-on.',
        'An immutable vault stops recovery points being deleted before retention expires.',
        'Backup data lives in a Microsoft-managed subscription, isolated from the production environment.',
      ],
      networking: [
        'Site Recovery writes through a cache storage account in the source region.',
        'Plan the target region’s networking before failover — addresses, DNS and load balancing must exist.',
        'Custom backups over a virtual network require the app or vault to reach a firewalled storage account.',
      ],
      monitoring: [
        'Backup Reports needs a diagnostic setting sending vault data to a Log Analytics workspace, and only covers the period since.',
        'Alert on job failures and on items with no recent successful backup — a job that never ran raises nothing.',
        'Test failovers produce the actual RTO number; record it each time.',
      ],
      governance: [
        'Storage redundancy and customer-managed keys must be set before the first item is protected.',
        'Policy enforcing that every production VM is protected by a vault.',
        'RBAC separates who may restore from who may configure backup.',
      ],
      availability: [
        'Test failover runs in an isolated network with no effect on production or replication.',
        'Commit deletes the remaining recovery points — verify first.',
        'Reprotect reverses replication; until it runs, the workload has no disaster recovery.',
      ],
      cost: [
        'Backup is billed on protected instances and storage consumed; retention is the main lever.',
        'Site Recovery is billed per protected instance plus replication storage — the target VMs are not running.',
        'GRS and Cross Region Restore cost more than LRS; match them to the obligation.',
      ],
    },
    alternatives: [
      { option: 'Backup only', tradeoff: 'Much cheaper and meets corruption recovery, with an RTO measured in hours rather than minutes for a regional event.' },
      { option: 'Site Recovery only', tradeoff: 'Fast regional recovery, and no protection at all against deletion, corruption or ransomware.' },
      { option: 'Active-active across regions', tradeoff: 'Near-zero RTO at roughly double the running cost, and a data tier that must support it.' },
    ],
    concepts: ['recovery-services-vault', 'backup-policy', 'azure-backup', 'site-recovery', 'paired-region', 'storage-redundancy'],
    sources: ['rsv-overview', 'vm-backup-enhanced', 'vm-restore', 'asr-architecture', 'asr-failover', 'regions-paired'],
  },
];
