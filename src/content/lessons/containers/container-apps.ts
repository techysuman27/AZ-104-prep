import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'container-apps',
  moduleId: 'containers',
  verified: '2026-09-16',
  sources: ['aca-containers', 'aca-environment', 'aca-scale', 'acr-auth'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Environment, app, revision, replica',
      blocks: [
        {
          type: 'lead',
          text: '[[container-apps|Azure Container Apps]] runs containerized services on a managed platform: you get ingress, revisions and event-driven scaling — including **scale to zero** — without touching a Kubernetes cluster.',
        },
        {
          type: 'list',
          style: 'bullet',
          items: [
            '**Environment** — the secure boundary around a group of container apps. Apps in one environment share a virtual network and write logs to the same destination, and can call each other by name.',
            '**Container app** — one service, deployed from one or more container images.',
            '**Revision** — an immutable snapshot of a container app. Changing the image or scale rules creates a new revision; traffic can be split across revisions.',
            '**Replica** — one running instance of a revision. Scaling adds and removes replicas.',
          ],
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Scaling is a set of rules over replicas',
      blocks: [
        {
          type: 'explainer',
          technical: [
            'Scaling is implemented with **KEDA**. Three rule categories: **HTTP** (concurrent requests), **TCP** (concurrent connections) and **custom** (CPU, memory, or an event source such as Azure Service Bus, Event Hubs, Kafka or Redis).',
            'Limits are per revision: **minimum replicas default 0**, **maximum replicas default 10**, and up to 1,000 can be configured. With more than one rule, the app scales as soon as any rule’s condition is met.',
            'With no scale rule at all, the default is an HTTP trigger with min 0 and max 10. The documented default `concurrentRequests` threshold is 10.',
          ],
          simple: [
            'You tell the platform what "busy" means — so many requests, or so many messages waiting — and it adds copies of your app.',
            'When nothing is happening it can go down to zero copies, and you stop paying.',
            'Every change makes a new immutable version (a revision), so you can send some traffic to the new one and roll back by moving traffic back.',
          ],
        },
        {
          type: 'callout',
          variant: 'trap',
          title: 'The classic scale-to-zero trap',
          text: 'If ingress is disabled and you set neither `minReplicas` nor a custom scale rule, the app scales to zero and has **no way to start back up** — there is no HTTP request to wake it. Background workers need a custom (event-driven) rule or a minimum of at least one replica.',
        },
        {
          type: 'table',
          caption: 'Documented scale behaviour values.',
          columns: ['Behaviour', 'Value'],
          rows: [
            ['Polling interval (event sources)', '30 seconds'],
            ['Cool down period', '300 seconds — how long after the last event before scaling to the minimum'],
            ['Scale up stabilization window', '0 seconds'],
            ['Scale down stabilization window', '300 seconds'],
            ['Scale up step', '1, 4, 8, 16, 32, … up to the maximum replica count'],
            ['Scaling algorithm', '`desiredReplicas = ceil(currentMetricValue / targetMetricValue)`'],
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
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az containerapp env create --name cae-prod --resource-group rg-apps --location westeurope

# An HTTP-facing app that scales on concurrent requests and can go to zero
az containerapp create --name ca-api --resource-group rg-apps --environment cae-prod \\
  --image acrcontoso.azurecr.io/api:1.4 \\
  --ingress external --target-port 8080 \\
  --min-replicas 0 --max-replicas 20 \\
  --scale-rule-name http-rule --scale-rule-type http --scale-rule-http-concurrency 100 \\
  --user-assigned <identity-id> --registry-server acrcontoso.azurecr.io --registry-identity <identity-id>

# A queue worker: no ingress, so it needs an event rule to wake up
az containerapp create --name ca-worker --resource-group rg-apps --environment cae-prod \\
  --image acrcontoso.azurecr.io/worker:1.4 --min-replicas 0 --max-replicas 10 \\
  --scale-rule-name queue-rule --scale-rule-type azure-queue \\
  --scale-rule-metadata "accountName=stappdata001" "queueName=orders" "queueLength=5" \\
  --scale-rule-identity <identity-id>

# Split traffic between revisions
az containerapp ingress traffic set --name ca-api --resource-group rg-apps \\
  --revision-weight ca-api--rev1=80 ca-api--rev2=20`,
              notes: [
                { token: '--scale-rule-http-concurrency', note: 'Concurrent requests per replica before another replica is added. The documented default is 10.' },
                { token: '--scale-rule-type azure-queue', note: 'A custom KEDA rule. Use managed identity rather than a connection-string secret where the scaler supports it.' },
                { token: 'ingress traffic set', note: 'Weighted traffic across revisions gives you canary releases and instant rollback.' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'compare',
      kind: 'compare',
      title: 'Container Apps next to its neighbours',
      blocks: [
        {
          type: 'table',
          columns: ['', 'Container Instances', 'Container Apps', 'App Service'],
          rows: [
            ['Shape of work', 'One-off or scheduled single containers', 'Microservices and event-driven workers', 'Web apps and APIs'],
            ['Scaling', 'None — you run what you create', 'HTTP, TCP and event rules, including to zero', 'Manual or autoscale, no scale to zero on a dedicated plan'],
            ['Versioning', 'Redeploy the group', 'Revisions with weighted traffic', 'Deployment slots with swap'],
            ['Billing', 'Per second while running', 'Per resource consumed; nothing while scaled to zero', 'Per plan instance, continuously'],
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'The signals that name Container Apps: scale to zero, event-driven or queue-based scaling, revisions and weighted traffic, microservices that call each other inside one environment.' },
        { type: 'quickcheck', questionIds: ['app-aca-scale-rule', 'app-aca-revision'] },
      ],
    },
  ],
  interview: [
    {
      q: 'A background worker on Container Apps stops processing overnight and never recovers. What happened?',
      a: 'It almost certainly scaled to zero with no way to wake up: ingress disabled, no custom scale rule and minReplicas left at 0. I would add an event-driven scale rule on the queue it reads, or set minReplicas to 1 if the work must be picked up instantly.',
    },
  ],
  takeaways: [
    'Environment → container app → revision → replica.',
    'Scaling uses KEDA: HTTP, TCP and custom event rules, per revision.',
    'Defaults are min 0 and max 10 replicas; up to 1,000 can be configured.',
    'An app with no ingress and no scale rule can scale to zero and never restart.',
  ],
};

export default lesson;
