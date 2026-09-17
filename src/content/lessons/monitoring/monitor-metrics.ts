import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'monitor-metrics',
  moduleId: 'monitoring',
  verified: '2026-09-16',
  sources: ['metrics-overview', 'diagnostic-settings', 'alerts-overview'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Two stores, two jobs',
      blocks: [
        {
          type: 'lead',
          text: '[[azure-monitor|Azure Monitor]] keeps two kinds of data. **[[metrics|Metrics]]** are numbers on a timeline, collected automatically and answered fast. **Logs** are rich records you query with KQL, and they only arrive because you configured them to.',
        },
        {
          type: 'table',
          columns: ['', 'Metrics', 'Logs'],
          rows: [
            ['Shape', 'A number at a point in time, with dimensions', 'A row with many fields, in a table'],
            ['Collection', 'Platform metrics need no configuration and have no cost', 'Resource logs need a diagnostic setting; guest logs need an agent'],
            ['Speed', 'Near real time, pre-aggregated', 'Ingestion latency, then a full query language'],
            ['Retention', '**93 days** for platform and custom metrics', 'Whatever the Log Analytics workspace is configured to keep'],
            ['Good for', '“Is CPU high right now?” and fast alerts', '“Who changed this, and what did the error say?”'],
          ],
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Reading a metric correctly',
      blocks: [
        {
          type: 'explainer',
          technical: [
            'Azure collects platform metrics from Azure resources at a **one-minute frequency** unless the metric definition says otherwise, with no configuration and no charge.',
            'Every chart in Metrics explorer combines four choices: **resource**, **metric namespace**, **metric**, and **aggregation** (average, minimum, maximum, sum or count). The aggregation changes the answer, not just the picture.',
            '**Dimensions** are name/value pairs attached to a metric — for example a disk metric split by drive. Filter on a dimension to narrow the chart; split by it to see one line per value.',
          ],
          simple: [
            'A metric is one number, measured again and again — CPU every minute, requests every minute.',
            'How you summarise those numbers matters: the average hides a short spike that the maximum shows clearly.',
            'Dimensions let you break one line into several — per disk, per instance, per status code.',
          ],
        },
        {
          type: 'callout',
          variant: 'trap',
          title: 'Average hides spikes',
          text: 'A VM pegged at 100% for two minutes in every ten looks like 20% on an average chart. When the question is “did it ever…”, the aggregation is **maximum**; when it is “how much in total”, it is **sum**.',
        },
        {
          type: 'list',
          style: 'check',
          items: [
            'Platform and custom metrics are retained for **93 days**, but a single chart can only span **30 days** — pan the chart to see the rest of the window.',
            'Guest OS metrics (CPU inside the VM, memory, disk space) are **not** platform metrics: they need the [[azure-monitor-agent|Azure Monitor Agent]] and a data collection rule.',
            'Send platform metrics to a [[log-analytics-workspace|Log Analytics workspace]] with a diagnostic setting when you need them for longer than 93 days or alongside logs.',
            'Moving or renaming a resource can lose its metric history.',
          ],
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      blocks: [
        {
          type: 'portal',
          title: 'Chart a metric',
          path: ['Resource', 'Monitoring', 'Metrics'],
          steps: [
            { label: 'Choose the metric', fields: [{ name: 'Metric', value: 'Percentage CPU', hint: 'The list depends on the resource type.' }] },
            { label: 'Choose the aggregation', fields: [{ name: 'Aggregation', value: 'Max', hint: 'Avg smooths short spikes; Max reveals them.' }] },
            { label: 'Split or filter by a dimension', detail: 'For example, split a disk metric by drive, or filter a storage metric by API name.' },
            { label: 'Set an alert rule from the chart', detail: 'New alert rule carries the metric, aggregation and dimension filters across.' },
          ],
        },
        {
          type: 'code',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az monitor metrics list --resource <resource-id> \\
  --metric "Percentage CPU" --aggregation Maximum \\
  --interval PT5M --start-time 2026-09-15T00:00:00Z

az monitor metrics list-definitions --resource <resource-id> -o table`,
              notes: [
                { token: '--aggregation Maximum', note: 'Choose the aggregation deliberately — it changes the answer.' },
                { token: 'list-definitions', note: 'Shows which metrics a resource type emits, and which dimensions each has.' },
              ],
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
        { type: 'callout', variant: 'exam', text: 'Remember: platform metrics are automatic, free and kept 93 days; guest OS metrics need the Azure Monitor Agent; aggregation choice is the usual trap.' },
        { type: 'quickcheck', questionIds: ['mon-metrics-retention', 'mon-metrics-aggregation', 'mon-guest-metrics'] },
      ],
    },
  ],
  takeaways: [
    'Metrics are numeric time series; logs are queryable records.',
    'Platform metrics need no configuration, cost nothing and are retained 93 days.',
    'Aggregation and dimensions decide what a chart actually says.',
    'Guest OS metrics require the Azure Monitor Agent and a data collection rule.',
  ],
};

export default lesson;
