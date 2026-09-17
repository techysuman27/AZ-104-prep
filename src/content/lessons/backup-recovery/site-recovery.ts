import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'site-recovery',
  moduleId: 'backup-recovery',
  verified: '2026-09-16',
  sources: ['asr-architecture', 'asr-failover', 'rsv-overview', 'regions-paired'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Continuous replication, then a deliberate switch',
      blocks: [
        {
          type: 'lead',
          text: '[[site-recovery|Azure Site Recovery]] continuously replicates a VM’s disks to a second region and keeps recovery points ready there. Nothing runs in the target region until you fail over — you pay for storage and replication, not for idle VMs.',
        },
        {
          type: 'explainer',
          technical: [
            'The **Site Recovery mobility extension** is installed on the VM. Writes are sent to a **cache storage account** in the source region, and from there replicated to the target region and turned into recovery points.',
            'Replication is configured from a Recovery Services vault. The target region’s resources — resource group, virtual network, storage and availability options — are chosen up front, and Site Recovery creates what it needs at failover time.',
            'Because replication is continuous, a corruption or deletion is replicated too. Site Recovery protects against losing the **region**, not against losing the **correctness** of the data.',
          ],
          simple: [
            'A small agent inside the VM sends every disk write to a holding area, and Azure copies it to the other region.',
            'The second region stays empty until the day you press the button — that is what keeps it affordable.',
          ],
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'The lifecycle: test, fail over, commit, reprotect',
      blocks: [
        {
          type: 'steps',
          title: 'The four operations, in order',
          steps: [
            { title: 'Test failover (the drill)', detail: 'Creates VMs in an isolated network in the target region without touching replication or production. This is the only one of the four you should be running regularly — Microsoft recommends a drill before any real failover.' },
            { title: 'Failover', detail: 'Creates the VMs in the target region from a chosen recovery point. Optionally shuts down the source VMs first to avoid data loss; the failover continues even if the shutdown fails.' },
            { title: 'Commit', detail: 'Finishes the failover. It **deletes all remaining recovery points** for the VM in Site Recovery, so you can no longer change the recovery point — check the failed-over VM first.' },
            { title: 'Reprotect', detail: 'Starts replication in the opposite direction, from the secondary region back to the primary. The VM status must be **Failover committed** first. Failing back is then another failover, in the new direction.' },
          ],
        },
        {
          type: 'table',
          caption: 'Recovery point choices at failover.',
          columns: ['Recovery point', 'What it does', 'Trade-off'],
          rows: [
            ['**Latest processed**', 'Uses the most recent point Site Recovery has already processed', 'Lowest **RTO** — no processing time — but slightly more data loss'],
            ['**Latest**', 'Processes all data already sent to Site Recovery, creating a fresh point per VM before failing over', 'Lowest **RPO**, at the cost of processing time'],
            ['**Latest app-consistent**', 'Fails over to the most recent application-consistent point', 'Safest for databases; typically older than the latest crash-consistent point'],
            ['**Custom**', 'A specific point you choose', 'Only available for a single VM, not when using a recovery plan'],
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Recovery plans',
          text: 'A **recovery plan** groups VMs and orders their failover, so the database tier comes up before the application tier, with optional scripts and manual steps between groups. It also turns a multi-VM failover into a single, rehearsed operation.',
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
            { mistake: 'Committing before verifying the failed-over VM.', fix: 'Commit deletes the remaining recovery points — check the VM is running and correctly sized first.' },
            { mistake: 'Never running a test failover.', fix: 'A drill runs in an isolated network with no impact on production or replication. An untested DR plan is an assumption.' },
            { mistake: 'Treating replication as a backup.', fix: 'Deletion, corruption and ransomware replicate faithfully. Keep Azure Backup as well.' },
            { mistake: 'Forgetting to reprotect after a failover.', fix: 'Until you reprotect, the workload is running in the secondary region with no disaster recovery at all.' },
          ],
        },
      ],
    },
    {
      id: 'scenario',
      kind: 'scenario',
      title: 'A real failover',
      blocks: [
        {
          type: 'scenario',
          company: 'Meridian Freight',
          context: 'A three-tier logistics application in West Europe, replicated to North Europe with Site Recovery. RTO 1 hour, RPO 15 minutes.',
          problem: 'A regional networking incident makes the application unreachable. Service Health confirms a regional issue with no estimated resolution.',
          approach: [
            'Declare the incident and start the recovery plan, which fails the database tier over first, then the application tier, then the web tier.',
            'Choose **Latest processed** for the web and application tiers to minimise RTO, and **Latest app-consistent** for the database tier so it comes up in a consistent state.',
            'Verify the application in the target region, update DNS to the new front-end address, then **Commit** the failover.',
            'Run **Reprotect** so replication now flows North Europe → West Europe, leaving the workload protected while it runs in the secondary region.',
          ],
          outcome: 'The application was serving traffic 38 minutes after the decision. When West Europe recovered, failback was another planned failover in the reverse direction, run out of hours.',
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Know the four verbs and their order — test failover, failover, commit, reprotect — what commit destroys, and the difference between Latest (lowest RPO) and Latest processed (lowest RTO).' },
        { type: 'quickcheck', questionIds: ['bk-asr-commit', 'bk-asr-recovery-point', 'bk-asr-reprotect'] },
      ],
    },
  ],
  interview: [
    {
      q: 'How do you prove your disaster recovery plan works without risking production?',
      a: 'A test failover. Site Recovery creates the VMs in an isolated network in the target region, so production keeps running and replication is unaffected. We validate the application there, record the actual RTO, then clean up the test. Doing it on a schedule is what keeps the plan honest — the numbers drift as the estate changes.',
    },
  ],
  takeaways: [
    'Replication is continuous; the target region stays empty until failover.',
    'Test failover is a safe drill in an isolated network.',
    'Commit deletes the remaining recovery points — verify first.',
    'Reprotect reverses the replication direction and is required before failback.',
  ],
};

export default lesson;
