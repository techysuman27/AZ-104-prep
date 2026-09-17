import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'insights',
  moduleId: 'monitoring',
  verified: '2026-09-16',
  sources: ['ama-overview', 'metrics-overview', 'diagnostic-settings', 'network-watcher'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Curated views on top of the same data',
      blocks: [
        {
          type: 'lead',
          text: 'Insights are pre-built monitoring experiences — workbooks, charts and dependency maps — assembled from the metrics and logs you are already collecting. They add no new data store; they add a starting point.',
        },
        {
          type: 'table',
          columns: ['Insight', 'Shows', 'What it needs first'],
          rows: [
            ['[[vm-insights|VM insights]]', 'Guest CPU, memory, disk and network performance, plus a dependency map of processes and connections', 'The [[azure-monitor-agent|Azure Monitor Agent]] on the machine and a data collection rule sending data to a [[log-analytics-workspace|Log Analytics workspace]]'],
            ['Storage insights', 'Availability, transactions, latency and capacity across storage accounts', 'Platform metrics (automatic); resource logs need a [[diagnostic-settings|diagnostic setting]] for per-operation detail'],
            ['Network insights', 'Topology, health and metrics for networking resources in one view', 'Platform metrics; [[network-watcher|Network Watcher]] features such as connection monitor and flow logs add depth'],
          ],
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Why an insight is sometimes empty',
      blocks: [
        {
          type: 'explainer',
          technical: [
            'Platform metrics are always there, so the metric parts of an insight light up with no configuration.',
            'Anything measured **inside** a virtual machine — memory, free disk space, processes, connections — needs the Azure Monitor Agent **and** a data collection rule associated with the machine. Installing the agent alone collects nothing.',
            'Anything that needs per-operation detail (which blob, which caller, which error) needs resource logs, and therefore a diagnostic setting pointing at a workspace.',
          ],
          simple: [
            'If a chart shows platform numbers but the guest details are blank, the agent or its data collection rule is missing.',
            'If a view has no log-based detail, no diagnostic setting is sending resource logs anywhere.',
          ],
        },
        {
          type: 'code',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# Install the Azure Monitor Agent on a VM
az vm extension set --resource-group rg-app-prod --vm-name vm-app01 \\
  --publisher Microsoft.Azure.Monitor --name AzureMonitorLinuxAgent

# Associate an existing data collection rule with the machine
az monitor data-collection rule association create --name dcra-vm-app01 \\
  --rule-id <data-collection-rule-id> --resource <vm-resource-id>`,
              notes: [
                { token: 'AzureMonitorLinuxAgent', note: 'Use AzureMonitorWindowsAgent on Windows. The agent replaces the retired Log Analytics agent.' },
                { token: 'data-collection rule association', note: 'Without an association the agent is installed but idle — this is the most common reason VM insights is empty.' },
              ],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Running both the retired Log Analytics agent and the Azure Monitor Agent on one machine produces duplicate records. If the legacy agent must stay, stop the workspace collecting what the data collection rule already collects.',
        },
      ],
    },
    {
      id: 'example',
      kind: 'example',
      title: 'Workbooks: an insight you write yourself',
      blocks: [
        {
          type: 'p',
          text: 'Every insight is a **workbook** — a document combining text, metric charts, KQL query results and parameters. Save a copy of a built-in workbook, edit its queries, and you have a dashboard tailored to your environment that other administrators can open from the resource itself.',
        },
        {
          type: 'list',
          style: 'check',
          items: [
            'Pin individual charts to an Azure dashboard for an at-a-glance view.',
            'Workbook parameters (subscription, resource group, time range) make one workbook serve every environment.',
            'Share a workbook by saving it to a resource group with the right RBAC, not by sending screenshots.',
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'The exam mostly checks prerequisites: guest-level data needs the Azure Monitor Agent plus a data collection rule; per-operation detail needs a diagnostic setting; platform metrics need nothing.' },
        { type: 'quickcheck', questionIds: ['mon-vm-insights-prereq'] },
      ],
    },
  ],
  takeaways: [
    'Insights are curated workbooks over metrics and logs you already collect.',
    'VM insights needs the Azure Monitor Agent and a data collection rule association.',
    'Platform metrics light up automatically; log-based detail needs diagnostic settings.',
    'Workbooks are editable and shareable — copy a built-in one and adapt it.',
  ],
};

export default lesson;
