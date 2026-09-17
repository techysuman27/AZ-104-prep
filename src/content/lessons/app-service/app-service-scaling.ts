import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'app-service-scaling',
  moduleId: 'app-service',
  verified: '2026-09-16',
  sources: ['appservice-scale-up', 'appservice-plans', 'appservice-limits', 'metrics-overview'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Scale up for power, scale out for capacity',
      blocks: [
        {
          type: 'lead',
          text: 'Two different dials. **Scale up** changes the pricing tier — bigger instances and more features. **Scale out** changes how many instances the plan runs.',
        },
        {
          type: 'explainer',
          technical: [
            '**Scale up** (vertical): change the plan’s pricing tier. This is how you get more CPU and memory per instance, and how you unlock features such as deployment slots, autoscale, custom domains and backups.',
            '**Scale out** (horizontal): change the instance count, manually or with [[autoscale|autoscale]] rules. The maximum depends on the tier: 3 on Basic, 10 on Standard, up to 30 on Premium v2–v4, 100 on Isolated.',
            'Autoscale rules need Standard or higher. Rules are evaluated against a metric with a threshold, an instance change and a cool-down, exactly as for [[vmss|scale sets]].',
          ],
          simple: [
            'Scaling up is moving to a bigger machine. Scaling out is adding more machines.',
            'Most web traffic problems are solved by adding machines; a single slow request is usually solved by a bigger one.',
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'Tune the rules against a day of load',
      blocks: [
        {
          type: 'interactive',
          id: 'autoscale-simulator',
          intro: 'The same rule engine drives App Service plans, scale sets and Container Apps. Watch what happens when the scale-in threshold sits too close to the scale-out threshold.',
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      blocks: [
        {
          type: 'code',
          title: 'Scaling an App Service plan',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# Scale up: change the pricing tier
az appservice plan update --name plan-web-prod --resource-group rg-web-prod --sku P1V3

# Scale out manually
az appservice plan update --name plan-web-prod --resource-group rg-web-prod --number-of-workers 5

# Autoscale (Standard tier or higher)
az monitor autoscale create --resource-group rg-web-prod \\
  --resource plan-web-prod --resource-type Microsoft.Web/serverfarms \\
  --name autoscale-web --min-count 2 --max-count 10 --count 2

az monitor autoscale rule create --resource-group rg-web-prod --autoscale-name autoscale-web \\
  --condition "CpuPercentage > 70 avg 10m" --scale out 1

az monitor autoscale rule create --resource-group rg-web-prod --autoscale-name autoscale-web \\
  --condition "CpuPercentage < 40 avg 10m" --scale in 1`,
              notes: [
                { token: '--sku P1V3', note: 'Scaling up applies to the plan, so every app in it moves tier together.' },
                { token: 'Microsoft.Web/serverfarms', note: 'The resource type of an App Service plan — autoscale targets the plan, not the app.' },
                { token: '--scale in 1', note: 'Leave a clear gap between the scale-out and scale-in thresholds so the rules do not oscillate.' },
              ],
            },
          ],
        },
        {
          type: 'list',
          style: 'check',
          items: [
            'Autoscale acts on the **plan**, so it scales every app in the plan at once.',
            'Set a minimum that covers your baseline and a maximum that caps spend — the maximum cannot exceed the tier’s limit.',
            'Per-app scaling can restrict an individual app or slot to a subset of the plan’s instances; capacity and billing stay at plan level.',
          ],
        },
      ],
    },
    {
      id: 'decide',
      kind: 'decide',
      title: 'Which dial?',
      blocks: [
        {
          type: 'decision',
          tree: {
            id: 'appservice-scale',
            title: 'Scale up or scale out?',
            start: 'q1',
            nodes: {
              q1: {
                kind: 'question',
                text: 'What is the symptom or requirement?',
                options: [
                  { label: 'The app needs a feature it doesn’t have (slots, autoscale, custom domain, backups)', next: 'r-up-feature' },
                  { label: 'Requests queue at busy times but each request is fast', next: 'r-out' },
                  { label: 'Individual requests are slow or the app runs out of memory', next: 'r-up-power' },
                  { label: 'Traffic is predictable and low most of the day, with a daily peak', next: 'r-autoscale' },
                ],
              },
              'r-up-feature': { kind: 'result', title: 'Scale up', text: 'Features are tied to the pricing tier. Move to the cheapest tier that includes what you need — Standard for slots and autoscale.', concepts: ['app-service-plan'] },
              'r-out': { kind: 'result', title: 'Scale out', text: 'More instances means more concurrent requests served. Check the tier’s instance ceiling first.', concepts: ['app-service-plan'] },
              'r-up-power': { kind: 'result', title: 'Scale up', text: 'More instances do not make a single request faster. A bigger instance size gives each request more CPU and memory.', concepts: ['app-service-plan'] },
              'r-autoscale': { kind: 'result', title: 'Scale out with autoscale rules', text: 'Set a minimum for the quiet period, a maximum for the peak, and leave a clear gap between the scale-out and scale-in thresholds.', tone: 'good', concepts: ['autoscale'] },
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
        { type: 'callout', variant: 'trap', text: 'Read whether the requirement is capacity (scale out) or capability (scale up). "Add more memory to each instance" is a scale-up answer even when the scenario mentions traffic.' },
        { type: 'quickcheck', questionIds: ['app-scale-up-vs-out', 'app-autoscale-tier'] },
      ],
    },
  ],
  takeaways: [
    'Scale up = change the pricing tier; scale out = change the instance count.',
    'Instance ceilings are tier limits: 3 Basic, 10 Standard, up to 30 Premium v2–v4, 100 Isolated.',
    'Autoscale needs Standard or higher and targets the plan, not the app.',
    'Leave headroom between scale-out and scale-in thresholds to avoid flapping.',
  ],
};

export default lesson;
