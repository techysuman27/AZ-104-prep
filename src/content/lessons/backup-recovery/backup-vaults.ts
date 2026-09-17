import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'backup-vaults',
  moduleId: 'backup-recovery',
  verified: '2026-09-16',
  sources: ['rsv-overview', 'backup-vault', 'storage-redundancy', 'regions-paired'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Two vault types, split by workload',
      blocks: [
        {
          type: 'lead',
          text: 'Azure Backup has two vault resources. A **[[recovery-services-vault|Recovery Services vault]]** protects the classic workloads; a **[[backup-vault|Backup vault]]** protects the newer ones. The workload decides which you create — it is not a preference.',
        },
        {
          type: 'table',
          columns: ['', 'Recovery Services vault', 'Backup vault'],
          rows: [
            ['Protects', 'Azure IaaS VMs (Windows and Linux), SQL Server in Azure VMs, Azure Files, and on-premises workloads through System Center DPM, Windows Server and Azure Backup Server', 'Newer workloads such as Azure Blobs, Azure Disks and Azure Database for PostgreSQL'],
            ['Also hosts', 'Azure Site Recovery replication', '—'],
            ['Monitoring', 'Backup and Site Recovery jobs, alerts, metrics and reports in one place', 'Jobs and alerts for the newer workloads, with reporting in Resiliency'],
          ],
        },
        {
          type: 'callout',
          variant: 'exam',
          text: 'The single most useful fact: **Azure VM backup and Site Recovery both live in a Recovery Services vault.** Blob, Disk and PostgreSQL backup live in a Backup vault.',
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Storage redundancy — decide before you protect anything',
      blocks: [
        {
          type: 'explainer',
          technical: [
            'Azure Backup manages the vault’s storage for you; you choose the redundancy: **LRS** (one datacentre), **ZRS** (across zones in the region) or **GRS** (replicated to the [[paired-region|paired region]]).',
            '**Cross Region Restore** builds on GRS and is enabled at the vault level. It lets you restore from the secondary region’s replicated data **whenever you choose** — for a compliance drill or during an outage — without waiting for Microsoft to declare a disaster.',
            'Backup data is stored in a Microsoft-managed subscription and tenant, so external users have no direct access to the backup storage — backups stay isolated from the production environment they protect.',
          ],
          simple: [
            'LRS is one building, ZRS is several buildings in one city, GRS is a second city.',
            'GRS on its own means you can only reach the far copy if Microsoft declares an outage. Cross Region Restore means you can reach it whenever you want — which is what makes a DR drill possible.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Storage redundancy is a create-time decision in practice',
          text: 'Change the redundancy setting **before** you protect the first item in the vault. Once backup items exist, the setting can no longer be changed.',
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      title: 'Vault security features',
      blocks: [
        {
          type: 'list',
          style: 'check',
          items: [
            '**Soft delete** — if a backup item is deleted, whether accidentally or maliciously, the data is retained for **14 additional days** at no cost and can be recovered with no data loss. **Enhanced soft delete** lets you customise the retention period and make soft delete **always-on**, so an attacker cannot disable it.',
            '**Immutable vault** — locks recovery points so they cannot be deleted or shortened before their retention expires.',
            '**Encryption** — platform-managed keys by default; customer-managed keys from Key Vault must be configured **before** you protect any item in the vault.',
            '**RBAC** — Azure Backup provides built-in roles for managing recovery points, so restore rights can be separated from backup configuration rights.',
          ],
        },
        {
          type: 'code',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az backup vault create --name rsv-prod-we --resource-group rg-backup --location westeurope

# Set redundancy BEFORE protecting anything
az backup vault backup-properties set --name rsv-prod-we --resource-group rg-backup \\
  --backup-storage-redundancy GeoRedundant

# Cross Region Restore (requires GRS)
az backup vault backup-properties set --name rsv-prod-we --resource-group rg-backup \\
  --cross-region-restore-flag true

az backup vault backup-properties show --name rsv-prod-we --resource-group rg-backup`,
              notes: [
                { token: '--backup-storage-redundancy', note: 'LocallyRedundant, ZoneRedundant or GeoRedundant. Cannot be changed once items are protected.' },
                { token: '--cross-region-restore-flag', note: 'Requires geo-redundant storage; lets you restore from the paired region on demand.' },
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
            { mistake: 'Creating a Backup vault for Azure VM backup.', fix: 'Azure VM backup uses a Recovery Services vault. Backup vaults protect blobs, disks and PostgreSQL.' },
            { mistake: 'Leaving the default redundancy and discovering it after protecting 200 VMs.', fix: 'Set redundancy on the empty vault; it cannot be changed afterwards.' },
            { mistake: 'Assuming GRS alone lets you restore into the secondary region whenever you like.', fix: 'Enable Cross Region Restore — otherwise the secondary copy is only reachable once Microsoft declares an outage.' },
            { mistake: 'Planning to add customer-managed keys later.', fix: 'Configure encryption with your keys before protecting any item in the vault.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'trap', text: 'Soft delete keeps deleted backup data for **14 extra days** at no cost. Enhanced soft delete makes that period configurable and can be locked always-on.' },
        { type: 'quickcheck', questionIds: ['bk-vault-type', 'bk-vault-redundancy', 'bk-soft-delete'] },
      ],
    },
  ],
  takeaways: [
    'Recovery Services vault: Azure VMs, SQL in VMs, Azure Files, on-premises — and Site Recovery.',
    'Backup vault: blobs, disks and PostgreSQL.',
    'Choose LRS, ZRS or GRS before protecting the first item; it cannot be changed afterwards.',
    'Soft delete retains deleted backups 14 extra days free; Cross Region Restore needs GRS.',
  ],
};

export default lesson;
