import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'vm-availability',
  moduleId: 'virtual-machines',
  verified: '2026-09-14',
  sources: ['availability-sets', 'vm-availability', 'availability-zones', 'vmss-modes'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'One VM is never highly available',
      blocks: [
        {
          type: 'lead',
          text: 'Hardware fails and hosts are patched. **Availability sets** spread VMs across fault and update domains inside a datacenter; **availability zones** spread them across datacenters. The design you choose sets the SLA you can claim.',
        },
        {
          type: 'explainer',
          technical: [
            'An [[availability-set|availability set]] distributes VMs across up to **3 fault domains** (separate power and network) and **20 update domains** (rebooted separately during planned maintenance). Two or more VMs in a set qualify for a **99.95%** SLA.',
            '[[availability-zone|Availability zones]] are physically separate datacenter groups in a region. VMs in two or more zones qualify for a **99.99%** SLA.',
            'A VM joins an availability set only at creation, and a VM can’t use both an availability set and a zone.',
            'Microsoft recommends [[vmss|Virtual Machine Scale Sets]] with Flexible orchestration for high availability with the broadest feature set.',
          ],
          simple: [
            'Putting all your servers on one rack means one power failure takes everything down.',
            'An **availability set** spreads them across racks in the same building. **Zones** spread them across separate buildings.',
            'Maintenance also matters: with a set, Azure reboots one group at a time instead of everything at once.',
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'Simulate failures',
      blocks: [{ type: 'interactive', id: 'availability-simulator', intro: 'Place VMs in a single datacenter, an availability set or across zones, then trigger a rack failure, planned maintenance or a zone outage.' }],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Fault domains, update domains and zones',
      blocks: [
        {
          type: 'table',
          columns: ['Design', 'Protects against', 'Doesn’t protect against', 'SLA'],
          rows: [
            ['Single VM', 'Nothing structural', 'Host failure, maintenance, datacenter loss', 'Single-instance SLA depends on the disk type used'],
            ['Availability set (2+ VMs)', 'Rack (fault domain) failures, staged maintenance', 'Datacenter or zone loss', '99.95%'],
            ['Availability zones (2+ zones)', 'Datacenter/zone failure', 'Region loss', '99.99%'],
            ['Multi-region (Site Recovery, replication)', 'Region loss', 'Application-level failures', 'Depends on the design'],
          ],
        },
        {
          type: 'list',
          style: 'check',
          items: [
            'Fault domains share a power source and network switch; update domains are rebooted one at a time during planned maintenance.',
            'Availability sets cost nothing extra — you pay only for the VMs.',
            'An existing VM can’t be added to an availability set; recreate the VM (keeping its disks) if needed.',
            'Availability sets and zones are mutually exclusive for a given VM.',
            'Zones give higher resilience; availability sets give lower VM-to-VM latency.',
          ],
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
              code: `# Availability set with 3 fault domains and 5 update domains
az vm availability-set create --resource-group rg-app-prod --name avset-web \\
  --platform-fault-domain-count 3 --platform-update-domain-count 5

az vm create --resource-group rg-app-prod --name vm-web01 --image Ubuntu2204 \\
  --availability-set avset-web --admin-username azureuser --generate-ssh-keys

# Or zonal VMs: one per zone
az vm create --resource-group rg-app-prod --name vm-web-z1 --image Ubuntu2204 --zone 1 \\
  --admin-username azureuser --generate-ssh-keys
az vm create --resource-group rg-app-prod --name vm-web-z2 --image Ubuntu2204 --zone 2 \\
  --admin-username azureuser --generate-ssh-keys`,
              notes: [
                { token: '--platform-fault-domain-count', note: 'Up to 3, depending on the region.' },
                { token: '--zone', note: 'Creates a zonal VM. Deploy several VMs in different zones for resilience.' },
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
            { mistake: 'Deploying two VMs in the same zone and calling it zone-redundant.', fix: 'Resilience requires instances in **different** zones.' },
            { mistake: 'Planning to add a running VM to an availability set later.', fix: 'Membership is set at creation; recreate the VM instead.' },
            { mistake: 'Using an availability set where the requirement is to survive a datacenter outage.', fix: 'Use availability zones (or zones plus a second region).' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Remember the two SLA numbers: availability set with two or more VMs → **99.95%**; VMs across two or more availability zones → **99.99%**.' },
        { type: 'quickcheck', questionIds: ['cmp-zones-sla', 'cmp-zonal-vs-redundant', 'cmp-avset-add'] },
      ],
    },
  ],
  takeaways: [
    'Availability sets: up to 3 fault domains and 20 update domains; 99.95% SLA with two or more VMs.',
    'Availability zones: separate datacenters; 99.99% SLA across two or more zones.',
    'Set membership is chosen at VM creation and is mutually exclusive with zones.',
    'Scale sets with Flexible orchestration are Microsoft’s recommended approach for VM high availability.',
  ],
};

export default lesson;
