import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'backup-policies',
  moduleId: 'backup-recovery',
  verified: '2026-09-16',
  sources: ['vm-backup-enhanced', 'rsv-overview', 'vm-restore'],
  changes: [
    {
      topic: 'Enhanced backup policy for Azure VMs',
      previously: 'Azure VM backup ran once a day on a Standard policy, and newer disk types could not be protected.',
      now: 'The Enhanced policy supports multiple backups per day (as often as every 4 hours), zone-redundant instant restore snapshots, and Trusted Launch VMs, Premium SSD v2 and Ultra Disks.',
      matters: 'An RPO better than 24 hours for Azure VM backup requires an Enhanced policy — and a VM using an Enhanced policy cannot be moved back to a Standard one.',
    },
  ],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'A policy is a schedule plus a retention plan',
      blocks: [
        {
          type: 'lead',
          text: 'A [[backup-policy|backup policy]] answers two questions: **how often** a recovery point is created, and **how long** each kind of recovery point is kept. Both are attached to the vault and shared by every VM assigned to the policy.',
        },
        {
          type: 'table',
          columns: ['', 'Standard policy', 'Enhanced policy'],
          rows: [
            ['Backup frequency', 'Daily or weekly', 'Hourly, daily or weekly — hourly runs every **4, 6, 8, 12 or 24 hours**'],
            ['Best RPO', '24 hours', '**4 hours** (maximum 24)'],
            ['Instant restore snapshots', 'Locally redundant', 'Zone-redundant'],
            ['Snapshot (operational tier) retention', 'Shorter', 'Up to **30 days**'],
            ['Newer offerings', 'Does not support Ultra Disk or Premium SSD v2', 'Supports Trusted Launch VMs, Premium SSD v2, Ultra Disks and multidisk crash-consistent snapshots'],
          ],
        },
        {
          type: 'callout',
          variant: 'trap',
          title: 'One-way door',
          text: 'Once a VM is backed up with an **Enhanced** policy, Azure Backup does not allow changing the policy type back to Standard. Migration in the other direction — Standard to Enhanced — is supported.',
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      title: 'The settings you actually choose',
      blocks: [
        {
          type: 'portal',
          title: 'Create an Enhanced policy',
          path: ['Recovery Services vault', 'Backup', 'Backup policies', '+ Add', 'Azure Virtual Machine'],
          steps: [
            { label: 'Policy sub type', fields: [{ name: 'Sub type', value: 'Enhanced', hint: 'Standard is the alternative; the choice is permanent for VMs assigned to it.' }] },
            {
              label: 'Backup schedule',
              fields: [
                { name: 'Frequency', value: 'Hourly', hint: 'Daily and weekly are also available.' },
                { name: 'Interval', value: 'Every 4 hours', hint: 'Allowed values are 4, 6, 8, 12 and 24 hours.' },
                { name: 'Duration', value: '24 hours', hint: 'The window during which the schedule runs each day. The default start time is 8 AM.' },
              ],
            },
            { label: 'Instant Restore', fields: [{ name: 'Snapshot retention', value: '7 days (default)', hint: 'Between 1 and 30 days, and never longer than the vault retention. More snapshots per day lowers the maximum retention you can set.' }] },
            {
              label: 'Retention range',
              fields: [
                { name: 'Daily', value: '180 days (default)' },
                { name: 'Weekly', value: '12 weeks (default)' },
                { name: 'Monthly', value: '60 months (default)' },
                { name: 'Yearly', value: '10 years (default)' },
              ],
            },
          ],
        },
        {
          type: 'explainer',
          technical: [
            '**Instant restore** keeps snapshots in the *operational tier* next to the VM’s disks, so recent restores are fast and do not read from the vault. More frequent snapshots reduce the maximum retention you can configure: at four-hourly snapshots the documented maximum is 17 days, and at six-hourly it is 22.',
            'For hourly backups, the **last backup of the day is transferred to the vault** (or the first backup of the next day if that one fails). The intermediate points live as snapshots.',
            '**Selective disk backup** excludes non-critical data disks from backup to save cost, and the Enhanced policy can exclude shared disks while still protecting the rest.',
          ],
          simple: [
            'Instant restore keeps recent copies close to the VM so getting back quickly is quick.',
            'The more often you take snapshots, the fewer days of them you can keep — it is the same storage budget.',
          ],
        },
        {
          type: 'code',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az backup policy list --resource-group rg-backup --vault-name rsv-prod-we \\
  --policy-sub-type Enhanced --workload-type VM -o table

az backup protection enable-for-vm --resource-group rg-backup --vault-name rsv-prod-we \\
  --vm $(az vm show -g rg-app-prod -n vm-app01 --query id -o tsv) \\
  --policy-name EnhancedPolicy4h`,
              notes: [
                { token: '--policy-sub-type Enhanced', note: 'Allowed values are Enhanced and Standard. Non-VM workloads only support Standard.' },
                { token: 'enable-for-vm', note: 'Assigns the policy and starts protection. Changing a VM’s policy later is allowed, except Enhanced back to Standard.' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: '“The business needs an RPO better than a day for an Azure VM” → Enhanced policy with hourly backups. “Trusted Launch VM, Ultra Disk or Premium SSD v2” → Enhanced policy. “Faster restores of recent points” → instant restore snapshot retention.' },
        { type: 'quickcheck', questionIds: ['bk-enhanced-policy', 'bk-instant-restore'] },
      ],
    },
  ],
  takeaways: [
    'A policy sets the schedule and the retention for every VM assigned to it.',
    'Enhanced policies allow backups every 4, 6, 8, 12 or 24 hours — Standard is daily at best.',
    'Instant restore snapshots are retained 1–30 days (default 7) and never longer than vault retention.',
    'Enhanced supports Trusted Launch, Premium SSD v2 and Ultra Disk; you cannot move back to Standard.',
  ],
};

export default lesson;
