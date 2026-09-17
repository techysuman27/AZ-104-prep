import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'blob-lifecycle-replication',
  moduleId: 'storage',
  verified: '2026-09-14',
  sources: ['lifecycle', 'object-replication', 'blob-versioning', 'access-tiers'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Automating where blobs live',
      blocks: [
        {
          type: 'lead',
          text: '**Lifecycle management** moves and deletes blobs by age or last access. **Object replication** copies blobs asynchronously to a container in another account. Together they automate cost and distribution at scale.',
        },
        {
          type: 'explainer',
          technical: [
            'A [[lifecycle-management|lifecycle management]] policy is a JSON set of rules. Each rule has filters (blob types, prefixes, index tags) and actions on base blobs, snapshots or versions, such as `tierToCool`, `tierToCold`, `tierToArchive` and `delete`, triggered by days since creation, modification or last access.',
            '[[object-replication|Object replication]] copies block blobs from a source container to a destination container in another account — same or different region or subscription. It requires versioning on both accounts and change feed on the source, and the destination container becomes read-only.',
          ],
          simple: [
            'Lifecycle management is an automatic filing clerk: “move anything older than 30 days to the cheaper shelf, and shred it after seven years.”',
            'Object replication is a copier that keeps a second set of documents in another office, updated shortly after changes.',
          ],
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      title: 'Write a lifecycle policy',
      blocks: [
        {
          type: 'code',
          title: 'Tier and expire log blobs',
          tabs: [
            {
              lang: 'json',
              label: 'policy.json',
              code: `{
  "rules": [
    {
      "enabled": true,
      "name": "logs-retention",
      "type": "Lifecycle",
      "definition": {
        "filters": {
          "blobTypes": ["blockBlob"],
          "prefixMatch": ["logs/app"]
        },
        "actions": {
          "baseBlob": {
            "tierToCool": { "daysAfterModificationGreaterThan": 30 },
            "tierToArchive": { "daysAfterModificationGreaterThan": 180 },
            "delete": { "daysAfterModificationGreaterThan": 2555 }
          },
          "snapshot": {
            "delete": { "daysAfterCreationGreaterThan": 90 }
          }
        }
      }
    }
  ]
}`,
              notes: [
                { token: 'prefixMatch', note: 'Container name followed by an optional path prefix, for example `logs/app` targets blobs under app in container logs.' },
                { token: 'daysAfterModificationGreaterThan', note: 'Age since the blob was last modified.' },
                { token: 'snapshot', note: 'Actions can target base blobs, snapshots and versions separately.' },
              ],
            },
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az storage account management-policy create \\
  --account-name stcontosodocs01 --resource-group rg-docs --policy @policy.json`,
            },
          ],
        },
        {
          type: 'list',
          style: 'check',
          items: [
            'New or updated policies can take up to 24 hours to take effect.',
            'Lifecycle management can’t rehydrate archived blobs.',
            'Tiering actions apply to block blobs; premium block blob accounts don’t support tiering.',
            'If soft delete is enabled, lifecycle deletes become soft deletes.',
          ],
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'How object replication works',
      blocks: [
        {
          type: 'flow',
          title: 'Object replication',
          alt: 'Source account in East US with versioning and change feed replicates block blobs asynchronously to a read-only destination container in West Europe with versioning.',
          spec: {
            root: {
              type: 'group',
              id: 'root',
              label: 'Replication',
              kind: 'plain',
              children: [
                {
                  type: 'group',
                  id: 'src',
                  label: 'Source account',
                  sub: 'East US',
                  kind: 'boundary',
                  direction: 'col',
                  children: [
                    { type: 'node', id: 'srcc', label: 'Container: products', sub: 'Versioning + change feed', icon: 'blob', concept: 'blob-versioning' },
                  ],
                },
                {
                  type: 'group',
                  id: 'dst',
                  label: 'Destination account',
                  sub: 'West Europe',
                  kind: 'boundary',
                  direction: 'col',
                  children: [{ type: 'node', id: 'dstc', label: 'Container: products-eu', sub: 'Read-only while policy active', icon: 'blob', detail: 'Writes to the destination container fail with 409 Conflict while the replication policy exists. Reads and deletes are allowed.' }],
                },
              ],
            },
            edges: [{ from: 'srcc', to: 'dstc', label: 'asynchronous copy', tone: 'data', style: 'dashed' }],
            flows: [{ id: 'rep', label: 'Upload a new image', path: ['srcc', 'dstc'], tone: 'data', description: 'A new blob version in the source is detected through the change feed and copied to the destination asynchronously.' }],
          },
        },
        {
          type: 'table',
          caption: 'Object replication requirements and limits',
          columns: ['Item', 'Detail'],
          rows: [
            ['Prerequisites', 'Blob versioning on source and destination; change feed on source'],
            ['Account types', 'General-purpose v2 or premium block blob; not hierarchical namespace'],
            ['Blob types', 'Block blobs only; snapshots aren’t replicated; archived blobs fail'],
            ['Destinations', 'A source can replicate to at most two destination accounts'],
            ['Rules', 'Up to 1,000 rules per policy; each rule maps one source container to one destination container'],
            ['Existing blobs', 'By default only blobs created after the rule; options can include existing blobs'],
            ['Cross-tenant', 'Disallowed by default on accounts created since December 15, 2023'],
          ],
        },
      ],
    },
    {
      id: 'compare',
      kind: 'compare',
      title: 'Object replication vs geo-redundant storage',
      blocks: [
        {
          type: 'compare',
          items: [
            { name: 'GRS / GZRS', bestFor: 'Account-wide disaster recovery', points: ['Whole account replicated', 'Secondary is the fixed paired region', 'Secondary read-only (RA-) or after failover'] },
            { name: 'Object replication', bestFor: 'Distributing selected data', points: ['Chosen containers and prefixes', 'Any destination account and region', 'Destination container is read-only while replicating'] },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Object replication prerequisites are a favorite: versioning on **both** accounts and change feed on the **source**. For lifecycle, remember the 24-hour delay and that it can’t rehydrate.' },
        { type: 'quickcheck', questionIds: ['st-object-replication-prereq', 'st-lifecycle-json'] },
      ],
    },
  ],
  takeaways: [
    'Lifecycle policies tier or delete blobs, snapshots and versions by age or last access.',
    'Lifecycle changes can take up to 24 hours; they can’t rehydrate archived blobs.',
    'Object replication needs versioning on both accounts and change feed on the source.',
    'The destination container is read-only while replication is active.',
    'A source account can replicate to at most two destination accounts.',
  ],
};

export default lesson;
