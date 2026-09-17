import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'monitor-logs',
  moduleId: 'monitoring',
  verified: '2026-09-16',
  sources: ['activity-log', 'diagnostic-settings', 'ama-overview', 'control-data-plane'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Three log sources, one destination pattern',
      blocks: [
        {
          type: 'lead',
          text: 'The [[activity-log|activity log]] records what was **done to** a resource. Resource logs record what happened **inside** it. Guest logs record what happened inside the **operating system**. Only the first is collected for you.',
        },
        {
          type: 'table',
          columns: ['Log', 'Records', 'Collected by default?', 'Default retention'],
          rows: [
            ['Activity log', 'Control-plane operations: create, update, delete, and actions initiated on resources', 'Yes — no configuration, no charge', '**90 days**, then deleted'],
            ['Resource logs', 'Data-plane operations inside a resource, such as reading a secret or a storage request', 'No — needs a [[diagnostic-settings|diagnostic setting]]', 'Set by the destination'],
            ['Guest OS logs and metrics', 'Windows event logs, syslog, performance counters inside a VM', 'No — needs the [[azure-monitor-agent|Azure Monitor Agent]] and a data collection rule', 'Set by the workspace'],
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          text: 'The activity log does not typically capture read operations, and entries are usually available for analysis and alerting within 3 to 20 minutes.',
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Diagnostic settings: source → destination',
      blocks: [
        {
          type: 'explainer',
          technical: [
            'A diagnostic setting selects **log categories and metrics** from a resource and routes them to one or more destinations: a **Log Analytics workspace**, a **storage account**, an **event hub**, or a partner solution.',
            'Choose the destination from the purpose: workspace for querying, correlation and log alerts; storage for cheap long-term archive; event hub for streaming to a SIEM or other external system.',
            'The activity log is exported the same way. There are no ingestion charges for activity logs, and retention charges apply only beyond the default 90 days — a workspace can retain up to 12 years.',
          ],
          simple: [
            'A diagnostic setting is a pipe: pick what comes out of a resource and where it should go.',
            'Log Analytics if you want to ask questions, a storage account if you just need to keep it, an event hub if another system needs it.',
          ],
        },
        {
          type: 'list',
          style: 'check',
          items: [
            'Activity log data lands in the **AzureActivity** table in a Log Analytics workspace.',
            'Field values in AzureActivity can vary in case — compare with `=~` or `tolower()`.',
            'A diagnostic setting on a management group also captures the management groups beneath it; settings at several levels produce duplicate events.',
            'The activity log is the **only** place that records who created a resource — export it if you need that beyond 90 days.',
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
          title: 'Route logs',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# Resource logs and metrics from a storage account to a workspace
az monitor diagnostic-settings create --name to-law \\
  --resource <storage-account-resource-id> \\
  --workspace <log-analytics-workspace-resource-id> \\
  --logs '[{"category":"StorageWrite","enabled":true}]' \\
  --metrics '[{"category":"Transaction","enabled":true}]'

# Export the subscription activity log to the same workspace
az monitor diagnostic-settings subscription create --name activity-to-law \\
  --location westeurope \\
  --workspace <log-analytics-workspace-resource-id> \\
  --logs '[{"category":"Administrative","enabled":true},{"category":"Policy","enabled":true}]'`,
              notes: [
                { token: '--workspace', note: 'Use a storage account (--storage-account) for archive, or an event hub (--event-hub) to stream out of Azure.' },
                { token: 'subscription create', note: 'Activity log export is a subscription-level diagnostic setting, not a per-resource one.' },
              ],
            },
            {
              lang: 'kusto',
              label: 'Query the result',
              code: `AzureActivity
| where TimeGenerated > ago(24h)
| where CategoryValue == "Administrative"
| where OperationNameValue has "delete"
| project TimeGenerated, Caller, OperationNameValue, ResourceGroup, ActivityStatusValue`,
              notes: [{ token: 'Caller', note: 'The identity that performed the operation — the answer to “who changed this?”' }],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'The Azure Monitor Agent needs a rule',
          text: 'Installing the agent collects nothing on its own. A **data collection rule** says which counters and logs to collect and which workspace to send them to, and the rule is associated with the machines it applies to.',
        },
      ],
    },
    {
      id: 'decide',
      kind: 'decide',
      title: 'Which destination?',
      blocks: [
        {
          type: 'decision',
          tree: {
            id: 'log-destination',
            title: 'Where should these logs go?',
            start: 'q1',
            nodes: {
              q1: {
                kind: 'question',
                text: 'What do you need to do with the data?',
                options: [
                  { label: 'Query it, correlate it and alert on it', next: 'r-law' },
                  { label: 'Keep it cheaply for years to satisfy an audit requirement', next: 'r-storage' },
                  { label: 'Send it to a SIEM or a system outside Azure', next: 'r-eh' },
                ],
              },
              'r-law': { kind: 'result', title: 'Log Analytics workspace', text: 'Full KQL queries, log alert rules, workbooks and correlation across resources. Retention is configurable up to 12 years.', tone: 'good', concepts: ['log-analytics-workspace', 'kql'] },
              'r-storage': { kind: 'result', title: 'Storage account', text: 'The cheapest destination for archive. Blobs are written hourly per resource; add a lifecycle policy to move them to cool or archive.', concepts: ['diagnostic-settings'] },
              'r-eh': { kind: 'result', title: 'Event hub', text: 'Streams records as JSON so an external SIEM or analytics platform can consume them in near real time.', concepts: ['diagnostic-settings'] },
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
        { type: 'callout', variant: 'exam', text: 'The reliable facts: activity log = control plane, automatic, 90 days. Resource logs = data plane, off by default, need a diagnostic setting. Guest logs need the agent plus a data collection rule. Destination follows purpose.' },
        { type: 'quickcheck', questionIds: ['mon-activity-retention', 'mon-diag-destination', 'mon-resource-logs-default'] },
      ],
    },
  ],
  interview: [
    {
      q: 'Someone deleted a production storage account last week. How do you find out who?',
      a: 'The activity log, filtered to the Administrative category and the delete operation — the Caller field names the identity. It only keeps 90 days, so in a well-run subscription there is already a diagnostic setting exporting it to a Log Analytics workspace, and I would query the AzureActivity table instead.',
    },
  ],
  takeaways: [
    'Activity log: control-plane operations, automatic, 90 days.',
    'Resource logs: data-plane detail, off until a diagnostic setting turns them on.',
    'Guest OS data needs the Azure Monitor Agent plus a data collection rule.',
    'Destinations: workspace to query, storage to archive, event hub to stream out.',
  ],
};

export default lesson;
