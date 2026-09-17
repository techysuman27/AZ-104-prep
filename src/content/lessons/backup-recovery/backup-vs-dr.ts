import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'backup-vs-dr',
  moduleId: 'backup-recovery',
  verified: '2026-09-16',
  sources: ['rsv-overview', 'asr-architecture', 'regions-paired'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Two different questions',
      blocks: [
        {
          type: 'lead',
          text: '**[[azure-backup|Backup]]** answers “the data is wrong — give me yesterday’s version”. **[[site-recovery|Disaster recovery]]** answers “this region is gone — run the workload somewhere else”. Neither substitutes for the other.',
        },
        {
          type: 'explainer',
          technical: [
            '**RPO (recovery point objective)** is how much data you can afford to lose, measured in time. A daily backup means an RPO of up to 24 hours; continuous replication means minutes.',
            '**RTO (recovery time objective)** is how long you can afford to be down. Restoring a large VM from a vault takes hours; failing over a replicated VM takes minutes.',
            'Backup protects against **deletion, corruption and ransomware** — it keeps history. Replication protects against **losing the location** — it keeps a current copy, and faithfully replicates corruption too.',
          ],
          simple: [
            'Backups are like old photographs: you can go back to how things looked last Tuesday.',
            'Disaster recovery is like a second, identical office that is always up to date — but if you spill coffee on a document, the copy in the second office is stained too.',
            'That is why serious workloads have both.',
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'Replay the incidents',
      blocks: [
        {
          type: 'interactive',
          id: 'backup-dr-timeline',
          intro: 'Pick an incident and see what each protection can and cannot recover — and how much data is lost in each case.',
        },
      ],
    },
    {
      id: 'compare',
      kind: 'compare',
      title: 'Which one saves you',
      blocks: [
        {
          type: 'table',
          columns: ['Incident', 'Backup', 'Site Recovery replication'],
          rows: [
            ['Someone deletes a file or a VM', 'Restores it from a recovery point', 'Replicates the deletion — no help'],
            ['Ransomware encrypts the data', 'Restores from a point before the encryption', 'Replicates the encrypted data — no help'],
            ['A database is corrupted by a bad release', 'Restores from before the release', 'Replicates the corruption — no help'],
            ['An entire region becomes unavailable', 'Cross Region Restore can restore in the paired region, but it takes time', 'Fail over in minutes — this is what it is for'],
            ['A VM is destroyed by a failed change', 'Restores it, in hours', 'Fails it over, in minutes'],
          ],
        },
        {
          type: 'callout',
          variant: 'trap',
          title: 'The exam’s favourite framing',
          text: 'If the scenario says “accidental deletion”, “corruption”, “ransomware” or “restore last month’s version”, the answer is **backup**. If it says “regional outage”, “minimal downtime”, “RTO of minutes” or “fail over”, the answer is **Site Recovery**.',
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Writing it down as numbers',
      blocks: [
        {
          type: 'table',
          caption: 'A worked example for one workload. The numbers come from the business, not from the technology.',
          columns: ['Workload', 'RPO', 'RTO', 'What that buys'],
          rows: [
            ['Internal wiki', '24 hours', '8 hours', 'Daily backup only'],
            ['Line-of-business app', '4 hours', '2 hours', 'Enhanced backup policy every 4 hours, plus a documented rebuild'],
            ['Order processing', '15 minutes', '1 hour', 'Site Recovery replication with a recovery plan, plus daily backups for corruption'],
          ],
        },
        {
          type: 'p',
          text: 'The pattern is always the same: the business states how much data it can lose and how long it can be down; those two numbers pick the technology and the cost. Starting from the technology and hoping it is enough is how organisations discover their RPO during an incident.',
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Read the failure described in the scenario, not the words “backup” or “recovery”. The failure mode decides the technology.' },
        { type: 'quickcheck', questionIds: ['bk-backup-vs-dr', 'bk-rpo-rto'] },
      ],
    },
  ],
  interview: [
    {
      q: 'We replicate everything with Site Recovery. Do we still need backups?',
      a: 'Yes. Replication keeps a current copy, which means it faithfully copies a deletion, a corruption or a ransomware encryption within minutes. Only backups give you history to go back to. Replication protects against losing the location; backup protects against losing the correctness of the data.',
    },
  ],
  takeaways: [
    'RPO is data loss tolerance; RTO is downtime tolerance.',
    'Backup keeps history and handles deletion, corruption and ransomware.',
    'Replication keeps a current copy and handles losing a region or a VM.',
    'Production workloads usually need both.',
  ],
};

export default lesson;
