import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'storage-redundancy',
  moduleId: 'storage',
  verified: '2026-09-14',
  sources: ['storage-redundancy', 'regions-paired', 'access-tiers'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'How many copies, and where?',
      blocks: [
        {
          type: 'lead',
          text: 'Azure Storage always keeps multiple copies of your data. The **redundancy** option decides whether those copies survive a failed drive, a lost datacenter or a regional disaster — and whether you can read from the second region during an outage.',
        },
        {
          type: 'explainer',
          technical: [
            '**LRS** replicates three times within a single datacenter. **ZRS** replicates synchronously across availability zones in the primary region.',
            '**GRS** and **GZRS** add an asynchronous copy (stored as LRS) in the [[paired-region|paired secondary region]]. The secondary becomes writable only after a failover.',
            '**RA-GRS** and **RA-GZRS** keep the secondary readable at all times through the `<account>-secondary` endpoint.',
          ],
          simple: [
            '**LRS**: three copies in one building. **ZRS**: copies in three buildings across the city.',
            '**GRS / GZRS**: the same, plus another copy in a city hundreds of kilometers away, updated a little behind the original.',
            '**RA-** versions let you read that far-away copy any time, not only after declaring a disaster.',
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'Break something and see what survives',
      blocks: [{ type: 'interactive', id: 'redundancy-explorer', intro: 'Choose a redundancy option, then trigger a server failure, a zone outage or a regional disaster.' }],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'The options compared',
      blocks: [
        {
          type: 'table',
          columns: ['Option', 'Copies', 'Survives zone outage', 'Survives region outage', 'Read secondary without failover', 'Durability (at least)'],
          rows: [
            ['LRS', '3 in one datacenter', 'No', 'No', '—', '11 nines'],
            ['ZRS', 'Across 3 zones', 'Yes', 'No', '—', '12 nines'],
            ['GRS', 'LRS + async LRS in secondary', 'No (primary)', 'Yes, after failover', 'No', '16 nines'],
            ['RA-GRS', 'As GRS', 'No (primary)', 'Yes', 'Yes', '16 nines'],
            ['GZRS', 'ZRS + async LRS in secondary', 'Yes', 'Yes, after failover', 'No', '16 nines'],
            ['RA-GZRS', 'As GZRS', 'Yes', 'Yes', 'Yes', '16 nines'],
          ],
        },
        {
          type: 'list',
          style: 'check',
          items: [
            'The secondary region is determined by the primary region’s pair and can’t be changed.',
            'Geo-replication is asynchronous, so a failover can lose the most recently written data.',
            'Archive tier is supported only with LRS, GRS and RA-GRS.',
            'Azure Files doesn’t support RA-GRS or RA-GZRS; premium accounts support only LRS and ZRS; managed disks support LRS and ZRS.',
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Redundancy isn’t backup',
          text: 'Every copy receives deletes and overwrites. Protect against mistakes with [[blob-soft-delete|soft delete]], [[blob-versioning|versioning]] and backups.',
        },
      ],
    },
    {
      id: 'decide',
      kind: 'decide',
      blocks: [
        {
          type: 'decision',
          tree: {
            id: 'redundancy',
            title: 'Choose a redundancy option',
            start: 'q1',
            nodes: {
              q1: { kind: 'question', text: 'Must the data survive the loss of an entire region?', options: [{ label: 'Yes', next: 'q2' }, { label: 'No', next: 'q3' }] },
              q2: { kind: 'question', text: 'Must applications read the data in the secondary region without waiting for a failover?', options: [{ label: 'Yes', next: 'q4' }, { label: 'No', next: 'q5' }] },
              q3: { kind: 'question', text: 'Must it stay available during a zone outage?', options: [{ label: 'Yes', next: 'r-zrs' }, { label: 'No', next: 'r-lrs' }] },
              q4: { kind: 'question', text: 'Must the primary region also survive a zone outage?', options: [{ label: 'Yes', next: 'r-ragzrs' }, { label: 'No', next: 'r-ragrs' }] },
              q5: { kind: 'question', text: 'Must the primary region also survive a zone outage?', options: [{ label: 'Yes', next: 'r-gzrs' }, { label: 'No', next: 'r-grs' }] },
              'r-lrs': { kind: 'result', title: 'LRS', text: 'Lowest cost. Fine for data you can recreate or that’s protected elsewhere.', tone: 'caution' },
              'r-zrs': { kind: 'result', title: 'ZRS', text: 'Synchronous copies across zones keep reads and writes going during a zone outage.' },
              'r-grs': { kind: 'result', title: 'GRS', text: 'A regional copy for disaster recovery; the secondary is readable after failover.' },
              'r-gzrs': { kind: 'result', title: 'GZRS', text: 'Zone resilience in the primary plus a regional copy.' },
              'r-ragrs': { kind: 'result', title: 'RA-GRS', text: 'Read from the secondary endpoint at any time.' },
              'r-ragzrs': { kind: 'result', title: 'RA-GZRS', text: 'The highest availability and durability combination.' },
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
        { type: 'callout', variant: 'trap', text: 'Watch for requirements combining redundancy with other features: archive tier rules out ZRS/GZRS; Azure Files rules out read-access geo options; premium performance rules out geo-redundancy.' },
        { type: 'quickcheck', questionIds: ['st-redundancy-choice', 'st-redundancy-archive'] },
      ],
    },
  ],
  takeaways: [
    'LRS: one datacenter. ZRS: across zones. GRS/GZRS: plus an asynchronous copy in the paired region.',
    'RA-GRS/RA-GZRS allow reading the secondary endpoint without a failover.',
    'Geo-replication is asynchronous; failover can lose recent writes.',
    'Archive tier works only with LRS, GRS and RA-GRS.',
    'Redundancy doesn’t protect against deletion or overwrite.',
  ],
};

export default lesson;
