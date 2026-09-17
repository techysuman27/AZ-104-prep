import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'monitoring-troubleshooting',
  moduleId: 'monitoring',
  verified: '2026-09-16',
  sources: ['activity-log', 'metrics-overview', 'alerts-types', 'network-watcher'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Ask “is it me, or is it Azure?” first',
      blocks: [
        {
          type: 'lead',
          text: 'Most incidents resolve to one of four causes: **Azure has a problem**, **something changed**, **the resource is under pressure**, or **the application is broken**. Each has a first place to look, and checking them in order saves hours.',
        },
        {
          type: 'steps',
          title: 'The first four minutes',
          steps: [
            { title: 'Resource Health', detail: 'Is this specific resource healthy according to Azure? Resource Health reports current and past health and whether Microsoft is already acting.' },
            { title: 'Service Health', detail: 'Is there a regional outage, planned maintenance or advisory affecting the services you use? Service Health knows which services your subscription actually uses.' },
            { title: 'Activity log', detail: 'Did anything change? Filter to the Administrative category around the time the symptom started, and read the Caller column.' },
            { title: 'Metrics', detail: 'Is the resource under pressure? Chart the obvious metric with **max**, not average, over the incident window.' },
          ],
        },
      ],
    },
    {
      id: 'decide',
      kind: 'decide',
      title: 'Symptom to first action',
      blocks: [
        {
          type: 'decision',
          tree: {
            id: 'mon-triage',
            title: 'Where do I look first?',
            start: 'q1',
            nodes: {
              q1: {
                kind: 'question',
                text: 'What is the symptom?',
                options: [
                  { label: 'A resource stopped working with no deployment from us', next: 'q-health' },
                  { label: 'Something worked yesterday and not today', next: 'r-activity' },
                  { label: 'The application is slow but nothing is failing', next: 'r-metrics' },
                  { label: 'Two resources cannot reach each other', next: 'r-network' },
                ],
              },
              'q-health': {
                kind: 'question',
                text: 'Does Resource Health say the resource is unavailable or degraded?',
                options: [
                  { label: 'Yes', next: 'r-health' },
                  { label: 'No, it looks healthy', next: 'r-activity' },
                ],
              },
              'r-health': { kind: 'result', title: 'Check Service Health, then wait or fail over', text: 'If Azure is the cause, Service Health tells you the scope and expected resolution. Your job becomes communication and, if the impact is severe, failing over.', concepts: ['resource-health'] },
              'r-activity': { kind: 'result', title: 'Activity log and change history', text: 'Filter the activity log to Administrative around the start of the symptom. Open an event and use Change history to see the property values before and after.', tone: 'good', concepts: ['activity-log'] },
              'r-metrics': { kind: 'result', title: 'Metrics with the right aggregation, then logs', text: 'Chart CPU, memory, IOPS or queue length with max over the window. Once you know which resource is saturated, go to logs for the detail.', concepts: ['metrics', 'kql'] },
              'r-network': { kind: 'result', title: 'Network Watcher', text: 'IP flow verify says whether a rule allows the packet; next hop says where it would go; connection troubleshoot runs an end-to-end test. Effective security rules shows the rules actually applied.', concepts: ['network-watcher'] },
            },
          },
        },
      ],
    },
    {
      id: 'example',
      kind: 'example',
      title: 'Worked example: “the VM got slow last Tuesday”',
      blocks: [
        {
          type: 'scenario',
          company: 'Northwind Logistics',
          context: 'A line-of-business VM that has run unchanged for a year started responding slowly, with no deployment from the application team.',
          problem: 'Users report slowness that started on a specific day. Nobody admits to a change.',
          approach: [
            'Resource Health is green, and Service Health shows no incident in the region — so it is not Azure.',
            'The activity log for that week shows a `Microsoft.Compute/virtualMachines/write` on the Tuesday morning, initiated by an automation account. Change history shows the VM size was reduced.',
            'Metrics confirm it: CPU charted with **max** sits at 100% for most of the working day since that change, where it previously peaked at 60%.',
            'The automation was a cost-optimisation runbook that resized under-used VMs, using a 30-day window that included the holiday shutdown.',
          ],
          outcome: 'The VM was resized back and the runbook was changed to exclude tagged production workloads. An activity log alert now fires when a production VM is resized.',
        },
        {
          type: 'code',
          tabs: [
            {
              lang: 'kusto',
              label: 'The query that found it',
              code: `AzureActivity
| where TimeGenerated between (datetime(2026-09-08) .. datetime(2026-09-10))
| where CategoryValue == "Administrative"
| where _ResourceId =~ "/subscriptions/.../virtualMachines/vm-lob01"
| project TimeGenerated, Caller, OperationNameValue, ActivityStatusValue
| sort by TimeGenerated asc`,
              notes: [{ token: '=~', note: 'Case-insensitive comparison — values in AzureActivity can vary in case.' }],
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
            { mistake: 'Charting average CPU and concluding the VM is fine.', fix: 'Use max over the incident window; average hides sustained-but-intermittent saturation.' },
            { mistake: 'Looking for a guest memory metric that was never collected.', fix: 'Guest metrics need the Azure Monitor Agent and a data collection rule — check that first, rather than concluding memory is fine.' },
            { mistake: 'Searching the activity log more than 90 days back.', fix: 'It only retains 90 days. Export it to a workspace if you need history.' },
            { mistake: 'Debugging an application before checking Resource Health.', fix: 'Thirty seconds on Resource Health and Service Health rules out the causes you cannot fix.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: '“What should you check first?” questions have a consistent logic: who changed it → activity log; is Azure broken → Resource Health or Service Health; is it saturated → metrics; can the packet get there → Network Watcher.' },
        { type: 'quickcheck', questionIds: ['mon-who-changed', 'mon-first-check'] },
      ],
    },
  ],
  interview: [
    {
      q: 'Walk me through how you triage “the app is down” in Azure.',
      a: 'Resource Health and Service Health first, because they rule out causes I cannot fix. Then the activity log around the start of the symptom, because most incidents follow a change. Then metrics with the right aggregation to see whether anything is saturated, and only then application logs. For connectivity symptoms I go to Network Watcher — IP flow verify and effective security rules — before touching the application.',
    },
  ],
  takeaways: [
    'Rule out Azure first: Resource Health, then Service Health.',
    'Most incidents follow a change — the activity log names the caller.',
    'Choose the aggregation deliberately when reading metrics.',
    'Network symptoms belong to Network Watcher, not the application team.',
  ],
};

export default lesson;
