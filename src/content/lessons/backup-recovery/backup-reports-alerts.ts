import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'backup-reports-alerts',
  moduleId: 'backup-recovery',
  verified: '2026-09-16',
  sources: ['backup-reports', 'backup-monitoring', 'diagnostic-settings', 'alerts-overview'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'A backup nobody watches is a backup that quietly stopped',
      blocks: [
        {
          type: 'lead',
          text: 'Azure Backup reports the state of every job and every protected item, but the historical reporting is built on **[[diagnostic-settings|diagnostic settings]]** you have to turn on. Configure them on the day you create the vault, not on the day of the audit.',
        },
        {
          type: 'explainer',
          technical: [
            'The vault’s built-in **Backup jobs**, **Backup items** and **Backup Alerts** views show current state without any configuration.',
            '**Backup Reports** is a workbook built on data in a [[log-analytics-workspace|Log Analytics workspace]]. It needs a diagnostic setting on the vault sending backup data to that workspace, and it only covers the period since the setting was created.',
            'Built-in Azure Backup alerts cover events such as backup and restore failures; **Azure Monitor alerts for Azure Backup** let you route them through [[action-group|action groups]], so failures reach the same on-call path as everything else.',
          ],
          simple: [
            'The portal always shows you what happened today.',
            'Trends, capacity planning and “prove we backed this up every night for a year” need the vault’s data pushed into a workspace first — and it only starts collecting from the moment you set it up.',
          ],
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      blocks: [
        {
          type: 'steps',
          title: 'Turn on reporting and alerting',
          steps: [
            { title: 'Create or pick a Log Analytics workspace', detail: 'One workspace can receive data from many vaults across subscriptions, which is what makes a single cross-estate report possible.' },
            { title: 'Add a diagnostic setting on the vault', detail: 'Send the Azure Backup Reports category to the workspace. Give it a few hours before the workbook has data.' },
            { title: 'Open Backup Reports', detail: 'From the vault or from Backup Center, filter by subscription, vault, workload and time range.' },
            { title: 'Route alerts to an action group', detail: 'Configure Azure Monitor alerts for Azure Backup so job failures notify the on-call rotation instead of sitting in the portal.' },
            { title: 'Alert on what silence means', detail: 'A failed job raises an alert. A job that never ran raises nothing — so also alert on protected items whose last successful backup is older than the policy allows.' },
          ],
        },
        {
          type: 'code',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az monitor diagnostic-settings create --name backup-to-law \\
  --resource $(az backup vault show -g rg-backup -n rsv-prod-we --query id -o tsv) \\
  --workspace <log-analytics-workspace-resource-id> \\
  --logs '[{"category":"AddonAzureBackupJobs","enabled":true},
            {"category":"AddonAzureBackupPolicy","enabled":true},
            {"category":"AddonAzureBackupProtectedInstance","enabled":true},
            {"category":"CoreAzureBackup","enabled":true}]'`,
              notes: [
                { token: 'AddonAzureBackupJobs', note: 'Job-level records — the basis of the success and failure trend in Backup Reports.' },
                { token: 'CoreAzureBackup', note: 'Protected-instance and policy records used by the reports and by custom KQL queries.' },
              ],
            },
            {
              lang: 'kusto',
              label: 'Find items that stopped being backed up',
              code: `AddonAzureBackupJobs
| where TimeGenerated > ago(7d)
| where JobOperation == "Backup"
| summarize lastSuccess = maxif(TimeGenerated, JobStatus == "Completed"), failures = countif(JobStatus == "Failed")
    by BackupItemUniqueId
| where failures > 0 or lastSuccess < ago(2d)
| sort by lastSuccess asc`,
              notes: [{ token: 'maxif', note: 'The most recent successful backup per item — the number that actually matters.' }],
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
            { mistake: 'Expecting Backup Reports to show last year’s data on a vault you just configured.', fix: 'Reports start from when the diagnostic setting was created — enable it at vault creation.' },
            { mistake: 'Alerting only on job failures.', fix: 'Also alert on protected items with no recent successful backup; a job that never ran fails silently.' },
            { mistake: 'Leaving backup alerts in the portal for someone to notice.', fix: 'Route them through an action group so they follow the same escalation path as every other alert.' },
            { mistake: 'One workspace per vault.', fix: 'Send many vaults to one workspace so a single report covers the estate.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'The testable fact: Backup Reports requires a diagnostic setting sending vault data to a Log Analytics workspace, and it only covers the period since that setting was created.' },
        { type: 'quickcheck', questionIds: ['bk-reports-prereq'] },
      ],
    },
  ],
  takeaways: [
    'Current job and item state needs no configuration; historical reporting does.',
    'Backup Reports is a workbook over vault diagnostic data in a Log Analytics workspace.',
    'Send many vaults to one workspace for a single estate-wide report.',
    'Alert on failures and on items with no recent successful backup.',
  ],
};

export default lesson;
