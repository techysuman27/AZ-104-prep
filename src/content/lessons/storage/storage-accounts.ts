import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'storage-accounts',
  moduleId: 'storage',
  verified: '2026-09-14',
  sources: ['storage-account-overview', 'storage-redundancy', 'access-tiers'],
  changes: [
    {
      topic: 'Legacy account types',
      previously: 'General-purpose v1 and legacy Blob Storage accounts were common choices in older labs.',
      now: 'Both are retired or scheduled for retirement. Standard general-purpose v2 is recommended for most scenarios.',
      matters: 'Choose Standard GPv2 unless the scenario needs a premium account type.',
    },
  ],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'One namespace, four data services',
      blocks: [
        {
          type: 'lead',
          text: 'A **storage account** is where Azure Storage data lives. Its name becomes part of every URL, and a handful of decisions made at creation — type, performance and redundancy — shape cost, durability and features for everything inside.',
        },
        {
          type: 'explainer',
          technical: [
            'A [[storage-account|storage account]] provides a globally unique namespace with endpoints for [[blob-storage|Blob Storage]] (`blob.core.windows.net`, plus Data Lake `dfs`), [[azure-files|Azure Files]] (`file`), [[queue-storage|Queue Storage]] (`queue`) and [[table-storage|Table Storage]] (`table`).',
            'Settings such as [[storage-redundancy|redundancy]], network rules, [[storage-encryption|encryption]] keys and the default access tier apply account-wide.',
            'The account type — Standard GPv2, premium block blobs, premium file shares, premium page blobs — can’t be changed after creation.',
          ],
          simple: [
            'A storage account is a warehouse with four departments: one for files of any kind (blobs), one for shared folders (files), one for message queues and one for simple tables.',
            'Some rules apply to the whole warehouse — like how many backup copies exist and who is allowed through the gate.',
          ],
        },
      ],
    },
    {
      id: 'compare',
      kind: 'compare',
      title: 'Choose the account type',
      blocks: [
        {
          type: 'table',
          caption: 'Recommended storage account types',
          columns: ['Type', 'Services', 'Redundancy', 'Use it for'],
          rows: [
            ['Standard general-purpose v2', 'Blob (incl. Data Lake), Files, Queue, Table', 'LRS, ZRS, GRS, RA-GRS, GZRS, RA-GZRS', 'Most workloads'],
            ['Premium block blobs', 'Block and append blobs', 'LRS, ZRS', 'High transaction rates, small objects, low latency'],
            ['Premium file shares', 'Azure Files (SMB and NFS)', 'LRS, ZRS', 'High-performance file shares; NFS shares'],
            ['Premium page blobs', 'Page blobs only', 'LRS', 'Page blob workloads'],
          ],
        },
        {
          type: 'decision',
          tree: {
            id: 'account-type',
            title: 'Which account type fits?',
            start: 'q1',
            nodes: {
              q1: { kind: 'question', text: 'Do you need NFS file shares or consistently low-latency file access?', options: [{ label: 'Yes', next: 'r-files' }, { label: 'No', next: 'q2' }] },
              q2: { kind: 'question', text: 'Is it a high-transaction blob workload (for example IoT telemetry or small objects at huge rates) that doesn’t need geo-redundancy or access tiers?', options: [{ label: 'Yes', next: 'r-blockblob' }, { label: 'No', next: 'r-gpv2' }] },
              'r-files': { kind: 'result', title: 'Premium file shares', text: 'SSD-backed shares with SMB and NFS 4.1 support; LRS or ZRS only.', concepts: ['azure-files'] },
              'r-blockblob': { kind: 'result', title: 'Premium block blobs', text: 'SSD performance for block and append blobs; LRS or ZRS; no hot/cool/cold/archive tiers.', concepts: ['blob-storage'] },
              'r-gpv2': { kind: 'result', title: 'Standard general-purpose v2', text: 'All services, every redundancy option and access tiers. The default choice.', concepts: ['storage-account', 'storage-redundancy'] },
            },
          },
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      title: 'Create a storage account',
      blocks: [
        {
          type: 'portal',
          title: 'Create storage account',
          path: ['Storage accounts', 'Create'],
          steps: [
            {
              label: 'Basics',
              fields: [
                { name: 'Storage account name', value: 'stcontosodocs01', hint: '3–24 characters, lowercase letters and numbers, globally unique.' },
                { name: 'Region', value: 'West Europe', hint: 'Also determines the paired secondary region for GRS/GZRS.' },
                { name: 'Primary service', value: 'Azure Blob Storage or Azure Data Lake Storage Gen 2', hint: 'Guides recommendations; the account can still host other services.' },
                { name: 'Performance', value: 'Standard', hint: 'Premium requires choosing a premium account type.' },
                { name: 'Redundancy', value: 'Zone-redundant storage (ZRS)' },
              ],
            },
            {
              label: 'Advanced',
              fields: [
                { name: 'Require secure transfer', value: 'Enabled' },
                { name: 'Allow enabling anonymous access on individual containers', value: 'Disabled', hint: 'Prevents anyone from making a container public.' },
                { name: 'Minimum TLS version', value: 'Version 1.2' },
                { name: 'Hierarchical namespace', value: 'Disabled', hint: 'Enable only for Data Lake Storage; some blob features (such as versioning) aren’t supported with it.' },
                { name: 'Access tier', value: 'Hot', hint: 'Default tier for new blobs: Hot, Cool or Cold.' },
              ],
            },
            {
              label: 'Networking',
              fields: [{ name: 'Network access', value: 'Selected virtual networks and IP addresses', hint: 'Or disable public access and use private endpoints.' }],
            },
            {
              label: 'Data protection',
              fields: [
                { name: 'Enable soft delete for blobs', value: '14 days' },
                { name: 'Enable soft delete for containers', value: '14 days' },
                { name: 'Enable versioning for blobs', value: 'Enabled' },
              ],
            },
            { label: 'Encryption', fields: [{ name: 'Encryption type', value: 'Microsoft-managed keys (MMK)', hint: 'Choose customer-managed keys if you must control the key.' }, { name: 'Enable infrastructure encryption', value: 'Only if required', hint: 'Can only be enabled at creation.' }] },
          ],
        },
        {
          type: 'code',
          title: 'Create the same account from the command line',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az storage account create \\
  --name stcontosodocs01 \\
  --resource-group rg-docs \\
  --location westeurope \\
  --kind StorageV2 \\
  --sku Standard_ZRS \\
  --access-tier Hot \\
  --min-tls-version TLS1_2 \\
  --allow-blob-public-access false \\
  --https-only true

az storage account blob-service-properties update \\
  --account-name stcontosodocs01 --resource-group rg-docs \\
  --enable-delete-retention true --delete-retention-days 14 \\
  --enable-container-delete-retention true --container-delete-retention-days 14 \\
  --enable-versioning true`,
              notes: [
                { token: '--sku Standard_ZRS', note: 'Performance and redundancy together: Standard_LRS, Standard_ZRS, Standard_GRS, Standard_RAGRS, Standard_GZRS, Standard_RAGZRS, Premium_LRS, Premium_ZRS.' },
                { token: '--kind StorageV2', note: 'General-purpose v2. Premium types use BlockBlobStorage or FileStorage.' },
                { token: '--enable-delete-retention', note: 'Blob soft delete; retention can be 1–365 days.' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'challenge',
      kind: 'challenge',
      title: 'Build an account for a real requirement',
      blocks: [{ type: 'interactive', id: 'storage-account-builder', intro: 'Pick a scenario, configure the account, and get feedback on every setting.' }],
    },
    {
      id: 'mistakes',
      kind: 'mistakes',
      blocks: [
        {
          type: 'mistakes',
          items: [
            { mistake: 'Choosing premium block blobs and later needing the archive tier or GRS.', fix: 'Premium block blob accounts support LRS/ZRS only and don’t use access tiers. Use Standard GPv2 for those needs.' },
            { mistake: 'Planning to “upgrade” account type later.', fix: 'The type can’t be changed; migrating means a new account and a data copy.' },
            { mistake: 'Leaving anonymous container access possible.', fix: 'Disable “Allow enabling anonymous access” at the account level.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Know the name rules (3–24, lowercase and numbers, globally unique) and which features each account type supports. Many wrong answers pick premium accounts for requirements only GPv2 meets.' },
        { type: 'quickcheck', questionIds: ['st-account-type', 'st-cli-storage-sku'] },
      ],
    },
  ],
  takeaways: [
    'Standard general-purpose v2 supports all services, all redundancy options and access tiers.',
    'Premium account types trade features (LRS/ZRS only, no tiers) for performance.',
    'Account names are 3–24 lowercase letters and numbers and globally unique.',
    'The account type can’t be changed after creation.',
    'Redundancy, networking, encryption and default access tier are account-wide settings.',
  ],
};

export default lesson;
