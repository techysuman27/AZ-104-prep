import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'kql',
  moduleId: 'monitoring',
  verified: '2026-09-16',
  sources: ['kql-getting-started', 'activity-log', 'diagnostic-settings'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'A table, then a pipeline',
      blocks: [
        {
          type: 'lead',
          text: 'Every [[kql|KQL]] query starts with a table and pipes rows through operators. Each `|` takes the rows the previous step produced and transforms them. Six operators answer most administrator questions.',
        },
        {
          type: 'code',
          title: 'The shape of a query',
          tabs: [
            {
              lang: 'kusto',
              label: 'Anatomy',
              code: `Perf                                          // 1. the table — always start here
| where TimeGenerated > ago(1h)               // 2. filter early, time first
| where CounterName == "Available MBytes"     // 3. filter again
| summarize avg(CounterValue) by bin(TimeGenerated, 5m), Computer   // 4. aggregate
| render timechart                            // 5. visualise`,
              notes: [
                { token: 'where', note: 'Filters rows. Put the time filter immediately after the table name — it is the cheapest filter you can apply.' },
                { token: 'ago(1h)', note: 'A relative time. Units include d (days), h (hours), m (minutes), s (seconds).' },
                { token: 'summarize', note: 'Groups rows and applies an aggregate such as count(), avg(), max(), sum().' },
                { token: 'bin', note: 'Rounds a continuous value into buckets. Without it, grouping by TimeGenerated creates a group per millisecond.' },
              ],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'trap',
          text: 'KQL is **case sensitive**. Table and column names must match the schema pane exactly, and language keywords are lowercase. Use `=~` (or `tolower()`) when the data itself may vary in case — AzureActivity is a well-documented example.',
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'Build a query step by step',
      blocks: [
        {
          type: 'interactive',
          id: 'kql-builder',
          intro: 'Add operators one at a time against sample rows and watch each one change the result set.',
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'The operators worth memorising',
      blocks: [
        {
          type: 'table',
          columns: ['Operator', 'What it does', 'Example'],
          rows: [
            ['`where`', 'Keeps rows matching a condition', '`| where Level == 8`'],
            ['`take` / `limit`', 'Returns a sample of rows, in no particular order', '`| take 10`'],
            ['`sort by` / `order by`', 'Orders the whole result set (desc is the default)', '`| sort by TimeGenerated desc`'],
            ['`top`', 'Sorts server-side and returns only the first rows', '`| top 10 by TimeGenerated`'],
            ['`project`', 'Chooses, renames and computes columns — drops the rest', '`| project TimeGenerated, Computer, Activity`'],
            ['`extend`', 'Adds a computed column, keeping the original ones', '`| extend EventCode = substring(Activity, 0, 4)`'],
            ['`summarize`', 'Groups rows and aggregates them', '`| summarize count() by ObjectName, CounterName`'],
            ['`render`', 'Draws the result as a chart', '`| render timechart`'],
            ['`search`', 'Looks for a value across columns — slower than filtering', '`search in (SecurityEvent) "Cryptographic"`'],
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Filter before you aggregate',
          text: '`search` scans everything and is documented as substantially less performant than filtering. Start from a table, apply the time filter, then narrow with `where` before summarizing.',
        },
      ],
    },
    {
      id: 'example',
      kind: 'example',
      title: 'Queries an administrator actually runs',
      blocks: [
        {
          type: 'code',
          tabs: [
            {
              lang: 'kusto',
              label: 'Who changed it?',
              code: `AzureActivity
| where TimeGenerated > ago(7d)
| where CategoryValue == "Administrative"
| where OperationNameValue has "write" or OperationNameValue has "delete"
| project TimeGenerated, Caller, OperationNameValue, _ResourceId, ActivityStatusValue
| sort by TimeGenerated desc`,
              notes: [{ token: 'has', note: 'A term-based, case-insensitive match. Faster than contains for whole words.' }],
            },
            {
              lang: 'kusto',
              label: 'Which machines are short of memory?',
              code: `Perf
| where TimeGenerated > ago(24h)
| where CounterName == "Available MBytes"
| summarize avgMB = avg(CounterValue), minMB = min(CounterValue) by Computer
| where minMB < 500
| sort by minMB asc`,
            },
            {
              lang: 'kusto',
              label: 'Error trend over time',
              code: `AzureDiagnostics
| where TimeGenerated > ago(12h)
| where Level == "Error"
| summarize errors = count() by bin(TimeGenerated, 15m), Resource
| render timechart`,
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
        { type: 'callout', variant: 'exam', text: 'You will be given a query and asked what it returns, or asked to complete one. Know what `summarize … by bin(TimeGenerated, 1h)` does, the difference between `project` and `extend`, and that `where` filters rows.' },
        { type: 'quickcheck', questionIds: ['mon-kql-summarize', 'mon-kql-project-extend'] },
      ],
    },
  ],
  takeaways: [
    'Start with a table, filter on time first, then narrow with `where`.',
    '`summarize … by bin(TimeGenerated, …)` is how you build a time series.',
    '`project` replaces the column set; `extend` adds to it.',
    'KQL is case sensitive, and `search` is slower than filtering a known column.',
  ],
};

export default lesson;
