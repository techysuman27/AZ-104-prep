import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'app-service-plans',
  moduleId: 'app-service',
  verified: '2026-09-16',
  sources: ['appservice-plans', 'appservice-limits', 'appservice-scale-up'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'The plan is the hardware; the app is the tenant',
      blocks: [
        {
          type: 'lead',
          text: 'An [[app-service-plan|App Service plan]] is a set of VM instances in one region running one operating system. Every [[app-service|app]] you put into the plan runs on **all** of those instances and shares them.',
        },
        {
          type: 'explainer',
          technical: [
            'A plan fixes four things: **operating system** (Windows or Linux), **region**, **number of VM instances** and **pricing tier**.',
            'Apps in the same plan share the same instances — and so do their deployment slots, WebJobs, diagnostic logging and backups. Scaling the plan scales every app in it.',
            'The tier decides both the compute you get and the **features** that are available: custom domains, TLS bindings, autoscale, deployment slots, backups.',
          ],
          simple: [
            'Think of the plan as the servers you rent, and each app as a website you put on those servers.',
            'Adding a second website to the same plan doesn’t cost more — but the two sites now share the same CPU and memory.',
            'Moving up a tier is how you get both bigger servers and more features.',
          ],
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'The tiers',
      blocks: [
        {
          type: 'table',
          caption: 'Pricing tier categories as documented by Microsoft.',
          columns: ['Category', 'Tiers', 'What it means'],
          rows: [
            ['Shared compute', 'Free, Shared', 'Your app runs on a VM shared with other App Service apps, including other customers’ apps. Each app gets a CPU quota and the app cannot scale out.'],
            ['Dedicated compute', 'Basic, Standard, Premium, PremiumV2, PremiumV3, PremiumV4', 'Apps run on VMs dedicated to your plan. Only apps in the same plan share those instances.'],
            ['Isolated', 'IsolatedV2', 'Dedicated VMs on a dedicated virtual network through an App Service Environment — network isolation on top of compute isolation.'],
          ],
        },
        {
          type: 'table',
          caption: 'Documented App Service limits per tier. “Scale out” is the maximum instance count.',
          columns: ['Tier', 'Scale out (max instances)', 'Deployment slots per app'],
          rows: [
            ['Free', '1 (shared)', 'Not available'],
            ['Shared', '1 (shared)', 'Not available'],
            ['Basic', '3 dedicated', 'Not available'],
            ['Standard', '10 dedicated', '5'],
            ['Premium', '20 (v1); 30 (v2, v3, v4)', '20'],
            ['Isolated', '100 dedicated (more on request)', '20'],
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'The tier ladder in one line',
          text: 'Free and Shared for experiments, Basic for a dev or test app with a custom domain, **Standard** as the first tier with deployment slots and autoscale, Premium for production scale and features, Isolated when you need network isolation.',
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      blocks: [
        {
          type: 'code',
          title: 'Create a plan and an app',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# The plan: OS, region, tier and instance count
az appservice plan create --name plan-web-prod --resource-group rg-web-prod \\
  --location westeurope --is-linux --sku S1 --number-of-workers 2

# The app runs on that plan
az webapp create --name app-contoso-portal --resource-group rg-web-prod \\
  --plan plan-web-prod --runtime "DOTNETCORE:8.0"

# Scale up (change tier) and scale out (change instance count)
az appservice plan update --name plan-web-prod --resource-group rg-web-prod --sku P1V3
az appservice plan update --name plan-web-prod --resource-group rg-web-prod --number-of-workers 4`,
              notes: [
                { token: '--is-linux', note: 'The operating system is a property of the plan and cannot be changed afterwards.' },
                { token: '--sku S1', note: 'Standard tier, first size. Standard is the first tier with deployment slots and autoscale.' },
                { token: '--number-of-workers', note: 'The instance count — scaling out. Every app in the plan runs on every instance.' },
              ],
            },
            {
              lang: 'powershell',
              label: 'PowerShell',
              code: `New-AzAppServicePlan -ResourceGroupName rg-web-prod -Name plan-web-prod \`
  -Location westeurope -Tier Standard -NumberofWorkers 2 -WorkerSize Small -Linux

New-AzWebApp -ResourceGroupName rg-web-prod -Name app-contoso-portal -AppServicePlan plan-web-prod`,
            },
          ],
        },
        {
          type: 'portal',
          title: 'Change the tier in the portal',
          path: ['App Service', 'Settings', 'Scale up (App Service plan)'],
          steps: [
            { label: 'Open the app, then Scale up', detail: 'The blade shows the tiers available for the plan’s OS and region.' },
            { label: 'Pick a tier', fields: [{ name: 'Tier', value: 'Standard S1 or Premium v3 P1V3', hint: 'Scaling up changes the plan, so it affects every app in it.' }] },
            { label: 'Select', detail: 'The change applies to the plan; apps restart on new instances.' },
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
            { mistake: 'Putting a busy production app in the same plan as several other apps.', fix: 'Apps in one plan share the same instances. Give a resource-intensive app its own plan.' },
            { mistake: 'Expecting to change a plan from Windows to Linux.', fix: 'The operating system is fixed for the life of the plan — create a new plan instead.' },
            { mistake: 'Scaling down to Standard while the app uses more than five slots.', fix: 'The target tier must support the slots you already have; Standard supports five.' },
            { mistake: 'Adding a custom domain on the Free (F1) tier.', fix: 'Custom domains need a paid tier; scale up first.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Tier-selection questions give you a feature requirement — slots, autoscale, custom domain, network isolation — and expect the cheapest tier that provides it.' },
        { type: 'quickcheck', questionIds: ['app-plan-shared-instances', 'app-plan-tier-choice'] },
      ],
    },
  ],
  interview: [
    {
      q: 'Two apps are in the same App Service plan and one of them is slow. What do you check?',
      a: 'Whether they are competing for the same instances. Apps, slots, WebJobs and backups in a plan all consume the same CPU and memory. I would look at per-instance CPU and memory, then either scale the plan or move the noisy app to its own plan.',
    },
  ],
  takeaways: [
    'A plan fixes OS, region, instance count and tier; apps are tenants on it.',
    'Every app and slot in a plan runs on all of the plan’s instances and shares them.',
    'The tier unlocks features: Standard is the first tier with deployment slots and autoscale.',
    'Scale up changes the tier; scale out changes the instance count.',
  ],
};

export default lesson;
