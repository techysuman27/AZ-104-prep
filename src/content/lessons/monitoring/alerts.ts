import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'alerts',
  moduleId: 'monitoring',
  verified: '2026-09-16',
  sources: ['alerts-overview', 'alerts-types', 'alert-processing-rules', 'activity-log'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Rule → alert → action group',
      blocks: [
        {
          type: 'lead',
          text: 'An **[[alert-rule|alert rule]]** combines a resource, a signal and a condition. When the condition is met an **alert** fires and triggers its **[[action-group|action group]]**, which is where notifications and automation live. An **[[alert-processing-rule|alert processing rule]]** can modify what happens to alerts as they fire.',
        },
        {
          type: 'list',
          style: 'bullet',
          items: [
            'Separating the rule from the action group means one action group serves dozens of rules — change the on-call email once, not thirty times.',
            'Alert instances are stored for **30 days** and then deleted.',
            'The condition is evaluated separately for each monitored resource, so one rule across many VMs fires one alert per VM.',
          ],
        },
      ],
    },
    {
      id: 'compare',
      kind: 'compare',
      title: 'Which alert type for which signal',
      blocks: [
        {
          type: 'table',
          columns: ['Alert type', 'Evaluates', 'Use it when'],
          rows: [
            ['Metric alert', 'Resource metrics at regular intervals; supports multiple conditions, dimensions and dynamic thresholds', 'The signal is already a metric — CPU, transactions, queue length. Fast and cheap.'],
            ['Log search alert', 'A Log Analytics (KQL) query at a set frequency', 'The signal needs logic, joins or fields that only exist in logs.'],
            ['Activity log alert', 'New activity log events matching a condition', '“Tell me when a VM in production is deleted” or when a role assignment changes.'],
            ['Service Health alert', 'Service Health events (a kind of activity log alert)', 'Azure outages, planned maintenance and advisories affecting your subscription.'],
            ['Resource Health alert', 'Resource Health events (a kind of activity log alert)', 'A specific resource has become unhealthy.'],
          ],
        },
        {
          type: 'callout',
          variant: 'trap',
          title: 'Stateful versus stateless',
          text: 'Metric and log search alerts can be configured stateful or stateless, and **metric alerts are stateful by default**: they do not fire again until the condition resolves. **All activity log alerts are stateless** — they fire on each matching event and their condition stays Fired, because there is no ongoing condition to resolve. Use the **User response** field (New, Acknowledged, Closed) to manage them.',
        },
        {
          type: 'list',
          style: 'check',
          items: [
            'A metric alert resolves when the condition is not met for **three consecutive checks**.',
            'Microsoft notes that log search alerts work best for detecting specific data, not the **absence** of data — for a missing heartbeat, prefer a metric alert.',
            'Severity runs from **Sev 0** (most severe) to **Sev 4** (least severe); pick it so paging rules can act on it.',
          ],
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Action groups and alert processing rules',
      blocks: [
        {
          type: 'explainer',
          technical: [
            'An **action group** is a reusable list of notifications and actions: email, SMS and push notifications; automation runbooks; Azure Functions; ITSM incidents; Logic Apps; webhooks and secure webhooks; event hubs.',
            '**Alert processing rules** act on alerts as they fire: add or suppress action groups, filter by scope or alert properties, and run on a schedule — which is how you mute a maintenance window without disabling any rules.',
            'Creating an alert rule needs **read** on the target resource, **write** on the resource group holding the rule, and **read** on any action group used. The Monitoring Contributor and Monitoring Reader built-in roles cover these.',
          ],
          simple: [
            'The rule notices the problem. The action group decides who gets told and what runs automatically.',
            'A processing rule is the mute switch: during Saturday night patching, suppress notifications instead of deleting alert rules and forgetting to put them back.',
          ],
        },
        {
          type: 'code',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az monitor action-group create --name ag-platform-oncall --resource-group rg-monitoring \\
  --short-name plat-oc \\
  --action email ops ops@contoso.com

az monitor metrics alert create --name "vm-cpu-high" --resource-group rg-app-prod \\
  --scopes <vm-resource-id> \\
  --condition "max Percentage CPU > 90" \\
  --window-size 5m --evaluation-frequency 1m --severity 2 \\
  --action <action-group-resource-id>

# Suppress notifications during a maintenance window
az monitor alert-processing-rule create --name suppress-patching \\
  --resource-group rg-monitoring --rule-type RemoveAllActionGroups \\
  --scopes <subscription-or-rg-resource-id> \\
  --schedule-recurrence Weekly --schedule-recurrence-days Saturday \\
  --schedule-start-time 22:00 --schedule-end-time 23:59`,
              notes: [
                { token: '--condition "max Percentage CPU > 90"', note: 'Choose the aggregation deliberately: max catches spikes, avg smooths them away.' },
                { token: '--severity 2', note: 'Sev 0 is the most severe, Sev 4 the least.' },
                { token: 'RemoveAllActionGroups', note: 'The alerts still fire and are recorded; only the notifications are suppressed.' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'decide',
      kind: 'decide',
      title: 'Pick the alert type',
      blocks: [
        {
          type: 'decision',
          tree: {
            id: 'alert-type',
            title: 'Which alert rule?',
            start: 'q1',
            nodes: {
              q1: {
                kind: 'question',
                text: 'What kind of signal are you reacting to?',
                options: [
                  { label: 'A number that already exists as a metric', next: 'r-metric' },
                  { label: 'Something only visible in log records', next: 'r-log' },
                  { label: 'Someone created, changed or deleted a resource', next: 'r-activity' },
                  { label: 'Azure itself is having a problem', next: 'r-health' },
                ],
              },
              'r-metric': { kind: 'result', title: 'Metric alert', text: 'Fastest and cheapest. Supports dimensions, multiple conditions and dynamic thresholds, and is stateful by default.', tone: 'good', concepts: ['alert-rule', 'metrics'] },
              'r-log': { kind: 'result', title: 'Log search alert', text: 'A KQL query on a schedule. Powerful, but higher latency and billed by evaluation frequency.', concepts: ['alert-rule', 'kql'] },
              'r-activity': { kind: 'result', title: 'Activity log alert', text: 'Matches activity log events. Stateless — it fires once per event and stays in the Fired condition.', concepts: ['alert-rule', 'activity-log'] },
              'r-health': { kind: 'result', title: 'Service Health or Resource Health alert', text: 'Both are activity log alerts: Service Health for Azure outages and maintenance, Resource Health for one unhealthy resource.', concepts: ['resource-health', 'alert-rule'] },
            },
          },
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
            { mistake: 'Disabling alert rules during a maintenance window.', fix: 'Use an alert processing rule with a schedule — the rules stay on and the notifications stop.' },
            { mistake: 'Using average CPU over a long window for a spike alert.', fix: 'Use max over a short window; average hides short spikes.' },
            { mistake: 'Building a log search alert to detect a missing heartbeat.', fix: 'Logs are latent and semi-structured; prefer a metric alert for absence-of-signal detection.' },
            { mistake: 'Putting the on-call email directly in every alert rule.', fix: 'Notifications belong in an action group that every rule references.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'The reliable discriminators: metric alerts for metrics (stateful by default), log search alerts for KQL logic, activity log alerts for control-plane events (always stateless), action groups for notifications, alert processing rules for suppression.' },
        { type: 'quickcheck', questionIds: ['mon-alert-type', 'mon-alert-suppress', 'mon-action-group'] },
      ],
    },
  ],
  interview: [
    {
      q: 'How do you stop the on-call phone ringing during planned patching without losing coverage?',
      a: 'An alert processing rule scoped to the affected resources with a recurring schedule that removes all action groups for the window. The alert rules keep evaluating and the alerts are still recorded, so nothing is lost — only the notifications are suppressed, and they come back automatically when the window ends.',
    },
  ],
  takeaways: [
    'Alert rule detects; action group notifies and automates; processing rule modifies.',
    'Metric alerts are stateful by default and resolve after three consecutive passing checks.',
    'All activity log alerts — including Service Health and Resource Health — are stateless.',
    'Alert instances are kept for 30 days.',
  ],
};

export default lesson;
