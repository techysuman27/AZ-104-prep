import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'vm-disks',
  moduleId: 'virtual-machines',
  verified: '2026-09-14',
  sources: ['disk-types', 'disk-encryption', 'storage-redundancy'],
  changes: [
    {
      topic: 'Standard HDD as an OS disk',
      previously: 'Standard HDD was a common low-cost choice for OS disks in dev/test.',
      now: 'Using Standard HDD as an OS disk retires on September 8, 2028. Use Standard SSD or Premium SSD instead.',
      matters: 'Choose SSD-based OS disks in new designs and migrations.',
    },
  ],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Choosing the right disk for the job',
      blocks: [
        {
          type: 'lead',
          text: 'Azure offers five [[managed-disk|managed disk]] types. The choice affects performance, cost and even which VM features you can use — and some types can’t be OS disks.',
        },
        {
          type: 'explainer',
          technical: [
            '**Ultra Disk** and **Premium SSD v2** let you set capacity, IOPS and throughput independently, support up to 65,536 GiB, can’t be OS disks and don’t use host caching.',
            '**Premium SSD** (fixed size tiers), **Standard SSD** and **Standard HDD** support up to 32,767 GiB and can be OS disks (Standard HDD for OS is retiring).',
            'Managed disks support LRS and ZRS redundancy. Snapshots are billed on used size; disks are billed on the provisioned tier.',
          ],
          simple: [
            'Disks are the storage attached to your VM. Faster disks cost more but handle busier applications.',
            'For a database, buy fast disks. For a file archive on a rarely used server, cheap disks are fine.',
            'The operating system needs a disk that supports booting — that rules out the two most advanced types.',
          ],
        },
      ],
    },
    {
      id: 'compare',
      kind: 'compare',
      title: 'Disk types compared',
      blocks: [
        {
          type: 'table',
          columns: ['Type', 'Max size', 'Max IOPS', 'Max throughput', 'OS disk?', 'Typical use'],
          rows: [
            ['Ultra Disk', '65,536 GiB', '400,000', '10,000 MB/s', 'No', 'SAP HANA, top-tier databases'],
            ['Premium SSD v2', '65,536 GiB', '80,000', '2,000 MB/s', 'No', 'Performance-sensitive production with flexible tuning'],
            ['Premium SSD', '32,767 GiB', '20,000', '900 MB/s', 'Yes', 'Production workloads needing consistent performance'],
            ['Standard SSD', '32,767 GiB', '6,000', '750 MB/s', 'Yes', 'Web servers, light applications, dev/test'],
            ['Standard HDD', '32,767 GiB', '2,000', '500 MB/s', 'Retiring for OS use', 'Backup and infrequently accessed data'],
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          text: 'Premium SSD v2 and Ultra Disk let you change performance settings up to four times per 24 hours without detaching the disk — useful for month-end peaks.',
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      title: 'Attach and expand disks',
      blocks: [
        {
          type: 'code',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# Create and attach a new 256 GiB Premium SSD data disk
az vm disk attach --resource-group rg-app-prod --vm-name vm-sql01 \\
  --name disk-sql-data01 --new --size-gb 256 --sku Premium_LRS

# Expand an existing disk (the VM must be deallocated for many scenarios)
az disk update --resource-group rg-app-prod --name disk-sql-data01 --size-gb 512

# Point-in-time snapshot of a disk
az snapshot create --resource-group rg-app-prod --name snap-sql-data-2026-09-14 \\
  --source disk-sql-data01`,
              notes: [
                { token: '--new', note: 'Creates the disk and attaches it in one step.' },
                { token: '--sku Premium_LRS', note: 'Disk type and redundancy: Standard_LRS, StandardSSD_LRS, Premium_LRS, Premium_ZRS, PremiumV2_LRS, UltraSSD_LRS.' },
                { token: 'az disk update --size-gb', note: 'Disks can be expanded but never shrunk. Extend the volume inside the OS afterwards.' },
              ],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'After expanding a disk in Azure, you must extend the partition and file system inside the guest operating system — Azure doesn’t do it for you.',
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'trap', text: 'Ultra Disk and Premium SSD v2 **cannot be OS disks**. If a question needs the fastest OS disk, the answer is Premium SSD.' },
        { type: 'quickcheck', questionIds: ['cmp-disk-os', 'cmp-disk-choice'] },
      ],
    },
  ],
  takeaways: [
    'Five disk types: Ultra, Premium SSD v2, Premium SSD, Standard SSD, Standard HDD.',
    'Ultra and Premium SSD v2 can’t be OS disks and don’t use host caching.',
    'Disks can be expanded, never shrunk, and the OS volume must be extended afterwards.',
    'Managed disks support LRS and ZRS.',
    'Standard HDD OS disks retire on September 8, 2028.',
  ],
};

export default lesson;
