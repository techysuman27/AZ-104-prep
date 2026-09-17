import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'backup-restore',
  moduleId: 'backup-recovery',
  verified: '2026-09-16',
  sources: ['vm-restore', 'rsv-overview', 'files-snapshots', 'regions-paired'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'A backup you have never restored is a hypothesis',
      blocks: [
        {
          type: 'lead',
          text: 'Azure VM restore offers three shapes of recovery, and the right one depends on whether the original VM still exists and how much of it you need back.',
        },
        {
          type: 'table',
          columns: ['Option', 'What it does', 'Use it when'],
          rows: [
            ['**Create new**', 'Creates a new VM from the recovery point — either quickly with basic settings, or by restoring a disk and building a customised VM', 'The original is gone, or you want to inspect a copy without touching production'],
            ['**Restore disks**', 'Creates managed disks plus an ARM template in a staging storage account, so you can deploy a VM with exactly the configuration you need', 'The VM has a special network configuration — load balancers, multiple NICs, multiple reserved IPs'],
            ['**Replace existing**', 'Replaces the disks on the existing VM with the chosen restore point; Azure Backup snapshots the current VM first', 'The VM still exists and you want it repaired in place'],
          ],
        },
        {
          type: 'callout',
          variant: 'trap',
          title: 'Replace existing has real limits',
          text: 'The VM **must still exist** — if it was deleted, this option is unavailable. It is supported for unencrypted managed VMs and unsupported for classic VMs, unmanaged VMs and generalized VMs. The original disks stay in the resource group afterwards, so delete them yourself once you are satisfied.',
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Restore across regions, subscriptions and zones',
      blocks: [
        {
          type: 'list',
          style: 'check',
          items: [
            '**Cross Region Restore** restores VMs in the paired secondary region. Snapshots are not replicated there — only vault data is — so secondary-region restores are always **vault tier** restores, and they support **Create new** and **Restore disks** but **not Replace existing**. The staging storage account must be in the secondary region.',
            '**Cross Subscription Restore** restores to a different subscription in the same tenant. Snapshot-tier recovery points can only be restored in the protected VM’s subscription; vault-tier points can go to another subscription when the property is enabled on the vault.',
            '**Cross Zonal Restore** restores a VM into a different availability zone, from vault-tier recovery points, when the vault uses ZRS or has Cross Region Restore enabled.',
            'Restoring a VM also restores NSG information at virtual network, subnet and NIC level.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Use **Replace existing** only once the job details show the **Transfer Data to Vault** subtask completed successfully. Otherwise restore the latest recovery point with **Create new**.',
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      title: 'Running backups and restores',
      blocks: [
        {
          type: 'code',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# On-demand backup outside the schedule, retained for 30 days
az backup protection backup-now --resource-group rg-backup --vault-name rsv-prod-we \\
  --container-name vm-app01 --item-name vm-app01 \\
  --retain-until 16-10-2026

# List recovery points, then restore disks from one
az backup recoverypoint list --resource-group rg-backup --vault-name rsv-prod-we \\
  --container-name vm-app01 --item-name vm-app01 -o table

az backup restore restore-disks --resource-group rg-backup --vault-name rsv-prod-we \\
  --container-name vm-app01 --item-name vm-app01 \\
  --rp-name <recovery-point-name> \\
  --storage-account stbackupstaging001 --target-resource-group rg-restore

# Check what the restore job is doing
az backup job list --resource-group rg-backup --vault-name rsv-prod-we -o table`,
              notes: [
                { token: 'backup-now', note: 'An ad-hoc recovery point — take one before a risky change.' },
                { token: '--storage-account', note: 'The staging location holds the ARM template and, in some cases, VHD files. For a cross-region restore it must be in the secondary region.' },
                { token: '--target-resource-group', note: 'Restore into a separate resource group so the restored disks never collide with production.' },
              ],
            },
          ],
        },
        {
          type: 'p',
          text: 'For a handful of lost files you do not need a whole VM: **file recovery** mounts the recovery point as a drive on a machine you choose using a downloaded script, so you can copy individual files out and then unmount it. For [[azure-files|Azure Files]], share snapshots and the vault both support item-level restore of a file or a whole share.',
        },
      ],
    },
    {
      id: 'decide',
      kind: 'decide',
      title: 'Choosing the restore',
      blocks: [
        {
          type: 'decision',
          tree: {
            id: 'restore-choice',
            title: 'Which restore option?',
            start: 'q1',
            nodes: {
              q1: {
                kind: 'question',
                text: 'How much do you need back?',
                options: [
                  { label: 'A few files from inside the VM', next: 'r-file' },
                  { label: 'The whole machine', next: 'q2' },
                ],
              },
              q2: {
                kind: 'question',
                text: 'Does the original VM still exist?',
                options: [
                  { label: 'No — it was deleted', next: 'r-new' },
                  { label: 'Yes, and it must keep its identity, name and IP', next: 'r-replace' },
                  { label: 'Yes, but it has a special network configuration to rebuild', next: 'r-disks' },
                ],
              },
              'r-file': { kind: 'result', title: 'File recovery', text: 'Mount the recovery point as a drive with the downloaded script, copy the files, then unmount. No VM is created and nothing in production changes.', tone: 'good', concepts: ['azure-backup'] },
              'r-new': { kind: 'result', title: 'Create new', text: 'Creates a new VM from the recovery point. Note that the restored VM keeps the SKU the original had when the recovery point was taken.', concepts: ['azure-backup'] },
              'r-replace': { kind: 'result', title: 'Replace existing', text: 'Replaces the existing VM’s disks in place. Azure Backup snapshots the current state first, and the old disks remain in the resource group for you to delete.', tone: 'caution', concepts: ['azure-backup'] },
              'r-disks': { kind: 'result', title: 'Restore disks', text: 'Restores managed disks plus an ARM template so you can rebuild the VM with load balancers, multiple NICs or reserved IP addresses exactly as they were.', concepts: ['managed-disk', 'azure-backup'] },
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
        { type: 'callout', variant: 'exam', text: 'Learn the three option names and their constraints: Replace existing needs the VM to exist and is unsupported for encrypted, classic, unmanaged and generalized VMs; Cross Region Restore supports Create new and Restore disks only.' },
        { type: 'quickcheck', questionIds: ['bk-restore-option', 'bk-crr-restore', 'bk-file-recovery'] },
      ],
    },
  ],
  interview: [
    {
      q: 'A developer deleted a configuration file on a production VM this morning. What do you do?',
      a: 'File recovery, not a VM restore. I pick a recovery point from before the deletion, run the downloaded script to mount it as a drive on a machine I control, copy the file back, then unmount. Nothing about the running VM changes, so there is no downtime and no risk of losing work done since the recovery point.',
    },
  ],
  takeaways: [
    'Create new, Restore disks and Replace existing are the three VM restore shapes.',
    'Replace existing needs the VM to still exist and excludes encrypted, classic, unmanaged and generalized VMs.',
    'Cross Region Restore is vault-tier only and supports Create new and Restore disks.',
    'File recovery mounts a recovery point as a drive to copy individual files.',
  ],
};

export default lesson;
