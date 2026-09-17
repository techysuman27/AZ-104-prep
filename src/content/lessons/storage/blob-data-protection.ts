import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'blob-data-protection',
  moduleId: 'storage',
  verified: '2026-09-14',
  sources: ['blob-soft-delete', 'container-soft-delete', 'blob-versioning', 'locks'],
  changes: [
    {
      topic: 'Soft delete for blobs and containers',
      previously: 'Soft delete was often mentioned only in passing alongside versioning.',
      now: '“Configure soft delete for blobs and containers” is an explicit skill in the April 2026 AZ-104 outline.',
      matters: 'Know retention ranges, what each feature protects, and how restore works.',
    },
  ],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Protecting data from people and programs',
      blocks: [
        {
          type: 'lead',
          text: 'Most data loss isn’t a disk failure — it’s a script deleting the wrong container or an app overwriting good data. **Soft delete** and **versioning** make those mistakes recoverable.',
        },
        {
          type: 'explainer',
          technical: [
            '[[blob-soft-delete|Blob soft delete]] retains deleted blobs, snapshots and versions for 1–365 days, and protects against overwrites. **Container soft delete** retains deleted containers (with their contents) for 1–365 days, default 7.',
            '[[blob-versioning|Blob versioning]] keeps the previous state of a blob as an immutable version on every write or delete; restore by copying a previous version over the base blob.',
            'None of these protect against deleting the storage account itself — protect it with a [[resource-lock|CanNotDelete lock]].',
          ],
          simple: [
            '**Soft delete** is a recycle bin with an expiry date. **Container soft delete** is a recycle bin for whole folders.',
            '**Versioning** is a document history: every save keeps the older copy.',
            'A **lock** stops someone throwing away the whole filing cabinet.',
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'Delete, overwrite, recover',
      blocks: [{ type: 'interactive', id: 'blob-protection', intro: 'Turn protection features on or off, then delete or overwrite a blob — or delete the container — and see which recovery options you have.' }],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'What protects what',
      blocks: [
        {
          type: 'table',
          columns: ['Event', 'Blob soft delete', 'Container soft delete', 'Versioning', 'Resource lock'],
          rows: [
            ['A blob is deleted', 'Recover with Undelete', '—', 'Promote the previous version', '—'],
            ['A blob is overwritten', 'Recover the soft-deleted snapshot', '—', 'Promote the previous version', '—'],
            ['A container is deleted', '—', 'Restore Container (original name)', '—', '—'],
            ['Blob metadata is changed', 'No', '—', 'Yes (new version)', '—'],
            ['The storage account is deleted', 'No', 'No', 'No', 'CanNotDelete prevents it'],
          ],
        },
        {
          type: 'list',
          style: 'check',
          items: [
            'Changing the retention period applies only to data deleted after the change.',
            'Soft-deleted data and previous versions are billed at the same rate as active data.',
            'Container restore fails if a new container with the same name has been created.',
            'Versioning isn’t supported on accounts with a hierarchical namespace.',
            'Microsoft recommends enabling blob soft delete, container soft delete and versioning together.',
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
          title: 'Enable data protection',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az storage account blob-service-properties update \\
  --account-name stcontosodocs01 --resource-group rg-docs \\
  --enable-delete-retention true --delete-retention-days 14 \\
  --enable-container-delete-retention true --container-delete-retention-days 14 \\
  --enable-versioning true

# Restore a soft-deleted blob
az storage blob undelete --account-name stcontosodocs01 --container-name contracts \\
  --name msa-2024.pdf --auth-mode login`,
              notes: [
                { token: '--delete-retention-days', note: 'Blob soft delete retention: 1–365 days.' },
                { token: '--container-delete-retention-days', note: 'Container soft delete retention: 1–365 days.' },
              ],
            },
            {
              lang: 'powershell',
              label: 'PowerShell',
              code: `Enable-AzStorageBlobDeleteRetentionPolicy -ResourceGroupName rg-docs -StorageAccountName stcontosodocs01 -RetentionDays 14
Enable-AzStorageContainerDeleteRetentionPolicy -ResourceGroupName rg-docs -StorageAccountName stcontosodocs01 -RetentionDays 14
Update-AzStorageBlobServiceProperty -ResourceGroupName rg-docs -StorageAccountName stcontosodocs01 -IsVersioningEnabled $true`,
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
            { mistake: 'Enabling only blob soft delete and expecting to recover a deleted container.', fix: 'Enable container soft delete as well.' },
            { mistake: 'Relying on GRS to recover from an accidental delete.', fix: 'Redundancy replicates the delete. Use soft delete and versioning.' },
            { mistake: 'Recreating a container with the same name right after deleting it.', fix: 'That prevents restoring the soft-deleted container. Restore first.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'trap', text: '“Recover a deleted storage account” is never solved by soft delete for blobs or containers. The preventive answer is a CanNotDelete lock.' },
        { type: 'quickcheck', questionIds: ['st-soft-delete-container', 'st-versioning-restore'] },
      ],
    },
  ],
  takeaways: [
    'Blob soft delete: 1–365 days; protects blobs from delete and overwrite; restore with Undelete.',
    'Container soft delete: 1–365 days (default 7); restores to the original name only.',
    'Versioning keeps previous versions; restore by promoting a previous version.',
    'None of them protect against storage account deletion — use a lock.',
    'Enable all three together for comprehensive protection.',
  ],
};

export default lesson;
