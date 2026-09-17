import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'connection-monitor',
  moduleId: 'monitoring',
  verified: '2026-09-16',
  sources: ['connection-monitor', 'network-watcher', 'alerts-overview'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Test the path before the users do',
      blocks: [
        {
          type: 'lead',
          text: '[[connection-monitor|Connection monitor]] runs continuous connectivity checks between sources and destinations, so you find a broken path from a change you made rather than from a support ticket.',
        },
        {
          type: 'list',
          style: 'bullet',
          items: [
            '**Connection monitor resource** — a region-specific Azure resource holding everything below it.',
            '**Endpoint** — a source or destination: an Azure VM or scale set, an Azure Arc-enabled on-premises host, a URL, FQDN or IP address.',
            '**Test configuration** — protocol (TCP, ICMP or HTTP) plus port, thresholds and test frequency.',
            '**Test group** — sources × destinations × test configurations.',
            '**Test** — one source, one destination, one configuration. This is the level at which data exists.',
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          text: 'Every source, destination and test configuration in a test group is expanded into individual tests. Three sources × two destinations × two configurations is twelve tests.',
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'What the checks measure',
      blocks: [
        {
          type: 'table',
          columns: ['Protocol', 'What a failed check means', 'How round-trip time is measured'],
          rows: [
            ['TCP or ICMP', 'Packet loss — the percentage of packets not acknowledged', 'Time to receive the acknowledgement for packets sent'],
            ['HTTP', 'A response code outside the valid set you configured', 'Time between the HTTP call and the response'],
          ],
        },
        {
          type: 'table',
          caption: 'Test states.',
          columns: ['State', 'Meaning'],
          rows: [
            ['Pass', 'Checks-failed percentage and round-trip time are both within the thresholds.'],
            ['Fail', 'A threshold was exceeded. With no threshold set, a test fails when the checks-failed percentage is 100.'],
            ['Warning', 'Above 80% of a set threshold — or, with no threshold, above the automatic defaults of **750 ms** round-trip time or **10%** checks failed.'],
            ['Indeterminate', 'No data in the Log Analytics workspace — check the metrics and the agent.'],
            ['Not Running', 'The test group is disabled.'],
          ],
        },
        {
          type: 'list',
          style: 'check',
          items: [
            'Azure VMs and scale sets need the **Network Watcher agent** extension to act as a **source**; destinations do not need it.',
            'On-premises sources need the machine onboarded with **Azure Arc**, then the Azure Monitor Agent.',
            'Results go to metrics — **ChecksFailedPercent**, **RoundTripTimeMs** and **TestResult** — and to a Log Analytics workspace; alert on the metrics.',
            'Scale limits: 100 connection monitors per subscription per region, 20 test groups and 20 test configurations per monitor, 100 sources and destinations per monitor.',
          ],
        },
      ],
    },
    {
      id: 'example',
      kind: 'example',
      title: 'Flow logs: the record of what actually happened',
      blocks: [
        {
          type: 'p',
          text: 'Connection monitor tells you whether a path works **now**. **Virtual network flow logs** record the traffic that was allowed or denied, so you can investigate afterwards: which source talked to which destination on which port, and which rule decided the outcome. Flow logs are stored in a storage account and are commonly analysed with Traffic Analytics.',
        },
        {
          type: 'compare',
          items: [
            { name: 'Connection monitor', bestFor: 'Continuous proactive testing of paths you care about', points: ['Synthetic checks on a schedule', 'Metrics you can alert on', 'Hop-by-hop topology when a test fails'] },
            { name: 'Flow logs', bestFor: 'Investigating traffic that actually occurred', points: ['Records allowed and denied flows', 'Answers “did anything reach this port?”', 'Stored in a storage account for later analysis'] },
            { name: '[[network-watcher|Network Watcher]] one-off tools', bestFor: 'Answering a question right now', points: ['IP flow verify: would this packet be allowed?', 'Next hop: where would this packet go?', 'Connection troubleshoot: a single end-to-end test'] },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Distinguish continuous from one-off: Connection monitor is continuous and alertable; IP flow verify, next hop and connection troubleshoot are single checks. Sources need the Network Watcher agent; destinations do not.' },
        { type: 'quickcheck', questionIds: ['mon-connection-monitor-agent', 'mon-flowlogs-vs-monitor'] },
      ],
    },
  ],
  takeaways: [
    'Connection monitor → test groups → tests; a test is one source, destination and configuration.',
    'TCP and ICMP measure packet loss; HTTP measures response codes.',
    'Sources need the Network Watcher agent (or Arc plus the Azure Monitor Agent on-premises).',
    'Alert on the ChecksFailedPercent and RoundTripTimeMs metrics.',
  ],
};

export default lesson;
