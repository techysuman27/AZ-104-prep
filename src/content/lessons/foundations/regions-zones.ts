import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'regions-zones',
  moduleId: 'foundations',
  verified: '2026-09-14',
  sources: ['regions-paired', 'availability-zones', 'vm-availability', 'storage-redundancy'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Where your resources physically live',
      blocks: [
        {
          type: 'lead',
          text: 'Every resource you create runs in real datacenters. **Regions**, **availability zones** and **region pairs** describe where those datacenters are — and they decide which failures your design can survive.',
        },
        {
          type: 'explainer',
          technical: [
            'A [[region]] is a set of datacenters in a geographic area, such as East US or West Europe. Most resources are regional: you choose the region when you create them.',
            'Many regions contain [[availability-zone|availability zones]] — groups of datacenters with independent power, cooling and networking, usually within 100 km of each other and connected by a low-latency network.',
            'Some regions are associated with another region in the same geography as a [[paired-region|region pair]]. A small number of services, notably geo-redundant storage, use the pair for replication.',
          ],
          simple: [
            'Think of a **region** as a city where Microsoft has built data centers — for example Amsterdam for West Europe.',
            '**Availability zones** are separate buildings on different sides of that city, each with its own power supply. If one building loses power, the others keep running.',
            'A **region pair** is a partner city, usually in the same country, where some services can keep a spare copy of your data in case something happens to the whole first city.',
          ],
        },
      ],
    },
    {
      id: 'why',
      kind: 'why',
      blocks: [
        {
          type: 'p',
          text: 'Failures happen at every size: a disk, a server rack, a datacenter, occasionally a whole region. The location decisions you make at deployment time determine which of those failures your application rides through — and which ones take it offline.',
        },
        {
          type: 'table',
          caption: 'Which location choice survives which failure?',
          columns: ['Design', 'Rack or server fails', 'Datacenter or zone fails', 'Whole region fails'],
          rows: [
            ['Single VM', 'Service interruption', 'Outage', 'Outage'],
            ['VMs in an availability set', 'Survives', 'Outage', 'Outage'],
            ['VMs across availability zones', 'Survives', 'Survives', 'Outage'],
            ['Replicated to a second region', 'Survives', 'Survives', 'Recover in the second region'],
          ],
        },
        {
          type: 'callout',
          variant: 'real-world',
          text: 'Location also affects **latency** (distance to users), **data residency** (legal requirements to keep data in a country), **price** (it differs by region) and **feature availability** (not every service or VM size is in every region).',
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'Regions, zones and pairs at a glance',
      blocks: [
        {
          type: 'flow',
          title: 'A zone-resilient app with a DR copy',
          alt: 'Region West Europe with three availability zones, each running a web VM behind a zone-redundant load balancer, with storage replicated asynchronously to the paired region North Europe.',
          caption: 'Zones protect against a datacenter failure inside West Europe. The copy in North Europe protects against losing the whole region.',
          spec: {
            root: {
              type: 'group',
              id: 'geo',
              label: 'Europe geography',
              kind: 'plain',
              children: [
                {
                  type: 'group',
                  id: 'weu',
                  label: 'West Europe',
                  sub: 'primary region',
                  kind: 'region',
                  concept: 'region',
                  direction: 'col',
                  children: [
                    { type: 'node', id: 'lb', label: 'Load balancer', sub: 'Zone-redundant', icon: 'lb', concept: 'load-balancer' },
                    {
                      type: 'group',
                      id: 'zones',
                      label: 'Zones',
                      kind: 'plain',
                      children: [
                        { type: 'group', id: 'z1', label: 'Zone 1', kind: 'zone', concept: 'availability-zone', children: [{ type: 'node', id: 'vm1', label: 'web-vm-1', icon: 'vm' }] },
                        { type: 'group', id: 'z2', label: 'Zone 2', kind: 'zone', children: [{ type: 'node', id: 'vm2', label: 'web-vm-2', icon: 'vm' }] },
                        { type: 'group', id: 'z3', label: 'Zone 3', kind: 'zone', children: [{ type: 'node', id: 'vm3', label: 'web-vm-3', icon: 'vm' }] },
                      ],
                    },
                    { type: 'node', id: 'st1', label: 'Storage (GZRS)', sub: 'Copies across 3 zones', icon: 'storage', concept: 'storage-redundancy' },
                  ],
                },
                {
                  type: 'group',
                  id: 'neu',
                  label: 'North Europe',
                  sub: 'paired region',
                  kind: 'region',
                  concept: 'paired-region',
                  direction: 'col',
                  children: [{ type: 'node', id: 'st2', label: 'Secondary copy', sub: 'Asynchronous (LRS)', icon: 'storage', detail: 'Geo-replication is asynchronous, so the most recent writes may not have arrived when a disaster strikes.' }],
                },
              ],
            },
            edges: [
              { from: 'lb', to: 'vm1', tone: 'data' },
              { from: 'lb', to: 'vm2', tone: 'data' },
              { from: 'lb', to: 'vm3', tone: 'data' },
              { from: 'st1', to: 'st2', label: 'async geo-replication', style: 'dashed', tone: 'data' },
            ],
            flows: [
              { id: 'zone-outage', label: 'Zone 1 goes dark', path: ['lb', 'vm2'], tone: 'allow', description: 'The load balancer’s health probes stop reaching **web-vm-1**, so new connections go to the VMs in zones 2 and 3.' },
              { id: 'geo', label: 'Region-wide disaster', path: ['st1', 'st2'], tone: 'data', description: 'The copy in the paired region is what remains. Recovering there requires a failover — and possibly accepting the loss of the latest writes.' },
            ],
          },
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'How zones and pairs really work',
      blocks: [
        {
          type: 'steps',
          steps: [
            {
              title: 'Zonal vs zone-redundant resources',
              detail: 'A **zonal** resource is pinned to one zone you choose, like a VM in zone 2 — you get resilience only by deploying several of them in different zones. A **zone-redundant** resource is spread across zones by Azure, like ZRS storage or a zone-redundant Standard public IP, and Azure handles failover.',
            },
            {
              title: 'Non-zonal (regional) resources',
              detail: 'If you don’t choose zones, Azure can place the resource in any zone in the region. A zone outage might affect it, and you have no control over which zone.',
            },
            {
              title: 'Zone numbers are logical',
              detail: 'Physical zones are mapped to logical zone numbers **per subscription**. Zone 1 in one subscription may be a different datacenter from zone 1 in another subscription.',
            },
            {
              title: 'Region pairs',
              detail: 'Planned Azure updates are staggered across a pair, and one region in each pair is prioritized for recovery in a geography-wide outage. Pairs don’t give you automatic failover — you still design and test DR.',
            },
            {
              title: 'Not every region is paired',
              detail: 'Many newer regions (for example Italy North and Poland Central) have no pair and rely on availability zones for resilience. A few pairs are asymmetric, such as Brazil South pairing with South Central US.',
            },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Azure doesn’t charge for data transfer between availability zones in the same region, and inter-zone latency is designed to stay around two milliseconds round trip — so spreading a production workload across zones is usually low-cost insurance.',
        },
      ],
    },
    {
      id: 'decide',
      kind: 'decide',
      title: 'Choose a resilience level',
      blocks: [
        {
          type: 'decision',
          tree: {
            id: 'resilience',
            title: 'How resilient does this workload need to be?',
            start: 'q1',
            nodes: {
              q1: {
                kind: 'question',
                text: 'Is this a production workload that must stay up when a datacenter fails?',
                options: [
                  { label: 'Yes', next: 'q2' },
                  { label: 'No — dev/test or tolerant of downtime', next: 'r-single' },
                ],
              },
              q2: {
                kind: 'question',
                text: 'Must it also keep running (or recover quickly) if the entire region is lost?',
                options: [
                  { label: 'Yes', next: 'r-multi' },
                  { label: 'No, one region is acceptable', next: 'q3' },
                ],
              },
              q3: {
                kind: 'question',
                text: 'Does the region support availability zones?',
                help: 'Check the list of Azure regions — not all regions have zones.',
                options: [
                  { label: 'Yes', next: 'r-zones' },
                  { label: 'No', next: 'r-set' },
                ],
              },
              'r-single': { kind: 'result', title: 'Single region, no zone requirements', text: 'Keep costs low. Use backups so data can be restored, and accept that a zone or datacenter failure causes downtime.', tone: 'caution', concepts: ['azure-backup'] },
              'r-zones': { kind: 'result', title: 'Spread across availability zones', text: 'Deploy VMs or scale set instances in two or more zones behind a zone-redundant load balancer, and use ZRS for storage. VMs across zones qualify for a 99.99% SLA.', concepts: ['availability-zone', 'vmss', 'storage-redundancy'] },
              'r-set': { kind: 'result', title: 'Use an availability set (or a Flexible scale set)', text: 'Without zones, spread VMs across fault and update domains. Two or more VMs in an availability set qualify for a 99.95% SLA, but a datacenter-level failure can still cause an outage.', tone: 'caution', concepts: ['availability-set', 'vmss'] },
              'r-multi': { kind: 'result', title: 'Zones plus a second region', text: 'Use zones in the primary region and replicate to a secondary region: Site Recovery for VMs, GRS/GZRS for storage, and a tested failover plan.', concepts: ['site-recovery', 'storage-redundancy', 'paired-region'] },
            },
          },
        },
      ],
    },
    {
      id: 'example',
      kind: 'example',
      title: 'Check regions and zone mappings',
      blocks: [
        {
          type: 'code',
          title: 'Explore locations',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# All regions available to your subscription
az account list-locations --output table

# Regions and their logical-to-physical availability zone mappings
az account list-locations \\
  --query "[?availabilityZoneMappings].{name:name, displayName:displayName, zones:availabilityZoneMappings}"`,
              notes: [
                { token: 'az account list-locations', note: 'Lists the regions your subscription can deploy to.' },
                { token: 'availabilityZoneMappings', note: 'Shows how this subscription’s logical zone numbers map to physical zones.' },
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
            { mistake: 'Deploying one VM “in zone 1” and calling it highly available.', fix: 'A zonal resource is only resilient when you deploy several instances in different zones.' },
            { mistake: 'Assuming a paired region gives automatic disaster recovery.', fix: 'Pairs help some services replicate; you still configure replication (for example Site Recovery or GRS) and practise failover.' },
            { mistake: 'Coordinating zone placement across subscriptions by zone number.', fix: 'Logical zone numbers can map to different physical zones in each subscription. Check the mappings.' },
            { mistake: 'Choosing a region only by price.', fix: 'Also check data residency rules, latency to users, zone support and whether required services and VM sizes are available.' },
          ],
        },
      ],
    },
    {
      id: 'scenario',
      kind: 'scenario',
      blocks: [
        {
          type: 'scenario',
          company: 'Northwind Health',
          context: 'Northwind runs a patient appointment system for clinics in Germany. Regulations require patient data to stay in the country.',
          problem: 'Leadership wants the system to survive a datacenter failure with no downtime and to recover from a regional disaster within hours — without data leaving Germany.',
          approach: [
            'Choose **Germany West Central**, which supports availability zones.',
            'Run the web tier as a Flexible scale set across three zones behind a zone-redundant Standard Load Balancer.',
            'Use zone-redundant storage and databases in the primary region.',
            'For regional DR, replicate to **Germany North**, the region paired with Germany West Central, which keeps data in the same geography.',
            'Schedule regular test failovers and document the recovery runbook.',
          ],
          outcome: 'A zone failure is absorbed automatically, and a regional disaster has a rehearsed recovery path inside Germany.',
        },
        {
          type: 'callout',
          variant: 'note',
          text: 'Germany North is a restricted-access region intended for scenarios such as in-country disaster recovery; access must be requested.',
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        {
          type: 'callout',
          variant: 'exam',
          text: 'Know the SLA ladder for VMs: two or more VMs in an **availability set → 99.95%**; VMs across **two or more availability zones → 99.99%**.',
        },
        {
          type: 'callout',
          variant: 'trap',
          text: 'Moving a resource to another resource group or subscription never changes its region. “Move the VM to another region” is a Resource Mover or redeploy task, not a resource move.',
        },
        { type: 'quickcheck', questionIds: ['cmp-zones-sla', 'cmp-zonal-vs-redundant'] },
      ],
    },
  ],
  takeaways: [
    'A region is a geographic area of datacenters; availability zones are independent datacenter groups inside a region.',
    'Zonal resources need multiple instances in different zones to be resilient; zone-redundant resources are spread by Azure.',
    'Region pairs support geo-replication for some services, staggered updates and recovery prioritization — not automatic failover.',
    'Many newer regions are unpaired and rely on zones.',
    'Availability set: 99.95% for two or more VMs. Availability zones: 99.99% for VMs in two or more zones.',
  ],
  interview: [
    {
      q: 'A customer asks whether deploying to a paired region makes their application highly available. How do you respond?',
      a: 'Not by itself. Region pairs mean some services can replicate to the pair and Azure staggers updates and prioritizes recovery, but the application still needs a design: instances across zones for datacenter failures, replication such as Site Recovery or GRS for regional failures, and a tested failover process.',
    },
  ],
};

export default lesson;
