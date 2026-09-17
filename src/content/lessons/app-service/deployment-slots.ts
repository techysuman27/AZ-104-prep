import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'deployment-slots',
  moduleId: 'app-service',
  verified: '2026-09-16',
  sources: ['appservice-slots', 'appservice-limits'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Warm it up before you send traffic to it',
      blocks: [
        {
          type: 'lead',
          text: 'A [[deployment-slot|deployment slot]] is a live app with its own hostname, running on the same plan. Deploy to the slot, verify it, then **swap** — App Service redirects traffic only once every instance is warmed up, so no requests are dropped.',
        },
        {
          type: 'explainer',
          technical: [
            'Slots require **Standard, Premium or Isolated**. Standard allows 5 slots per app; Premium and Isolated allow 20. There is no extra charge, but every slot runs on the plan’s instances and competes for its resources.',
            'A swap applies the **target** slot’s slot-specific settings to the source slot, restarts and warms up every source instance, then switches the routing rules. All the preparation happens on the source slot, so the target stays online throughout.',
            'To roll back, swap the same two slots again — the old production app is now in the staging slot.',
          ],
          simple: [
            'A slot is a second copy of your website with its own address. You deploy there first, click around, then swap it into production.',
            'The swap only happens after the new version is already running and warm, so visitors don’t see a slow first page or an error.',
            'If it turns out wrong, swap again and you’re back where you started.',
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'What travels with the swap',
      blocks: [
        {
          type: 'interactive',
          id: 'slot-swap',
          intro: 'Mark settings as slot settings and run the swap to see which configuration follows the code into production and which stays behind.',
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Swapped or sticky',
      blocks: [
        {
          type: 'table',
          caption: 'Microsoft’s documented lists. A setting marked “Deployment slot setting” stays with the slot instead of travelling.',
          columns: ['Swapped (follows the content)', 'Not swapped (stays with the slot)'],
          rows: [
            ['Language framework versions (.NET, Java, PHP, Python, Node.js)', 'Protocol settings: HTTPS Only, TLS version, client certificates'],
            ['32-bit vs 64-bit platform setting', 'Publishing endpoints'],
            ['WebSockets enabled or disabled', 'Custom domain names'],
            ['App settings — unless marked as a deployment slot setting', 'Nonpublic certificates and TLS/SSL settings'],
            ['Connection strings — unless marked as a deployment slot setting', 'Scale settings'],
            ['Mounted storage accounts — unless marked as a deployment slot setting', 'IP restrictions'],
            ['Handler mappings, path mappings, public certificates', 'Always On, diagnostic log settings, CORS'],
            ['WebJobs content, hybrid connections, service endpoints, Azure CDN', 'Managed identities, virtual network integration, WebJobs schedulers'],
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'The point of a slot setting',
          text: 'Mark the connection string that points at the staging database as a **deployment slot setting**. Staging then keeps the staging database and production keeps the production database, no matter how many times you swap.',
        },
        {
          type: 'steps',
          title: 'What happens during a swap',
          steps: [
            { title: 'Target settings are applied to the source slot', detail: 'Slot-specific app settings and connection strings, continuous deployment settings and App Service authentication settings. This restarts every instance in the source slot.' },
            { title: 'Wait for the restarts', detail: 'If any instance fails to restart, the swap reverts its changes to the source slot and stops.' },
            { title: 'Warm up', detail: 'Each instance is pinged at the application root (or the path in WEBSITE_SWAP_WARMUP_PING_PATH); any HTTP response counts as warm unless WEBSITE_SWAP_WARMUP_PING_STATUSES narrows it.' },
            { title: 'Switch the routing rules', detail: 'The warmed source slot becomes the target — this is the only moment traffic moves.' },
            { title: 'Apply settings to the new source slot', detail: 'The instances now holding the previous production app are restarted, which abandons any long-running work on them.' },
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
          title: 'Slots from the CLI',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az webapp deployment slot create --name app-contoso-portal \\
  --resource-group rg-web-prod --slot staging

# Pin a connection string to the slot it lives in
az webapp config connection-string set --name app-contoso-portal --resource-group rg-web-prod \\
  --slot staging --connection-string-type SQLAzure \\
  --settings Db="Server=sql-staging;..." --slot-settings Db

# Validate first, then complete
az webapp deployment slot swap -g rg-web-prod -n app-contoso-portal --slot staging --target-slot production --action preview
az webapp deployment slot swap -g rg-web-prod -n app-contoso-portal --slot staging --target-slot production --action swap

# Send 15% of production traffic to staging instead of swapping
az webapp traffic-routing set --resource-group rg-web-prod --name app-contoso-portal --distribution staging=15`,
              notes: [
                { token: '--slot-settings', note: 'Marks the named setting as a deployment slot setting, so it stays with the slot during a swap.' },
                { token: '--action preview', note: 'Swap with preview: applies the target’s settings to the source and pauses so you can validate. --action reset cancels it.' },
                { token: 'traffic-routing set', note: 'Routes a percentage of production traffic to a slot. A client is pinned to its slot for an hour by the x-ms-routing-name cookie.' },
              ],
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
            { mistake: 'Leaving the staging connection string unmarked, so it swaps into production.', fix: 'Mark environment-specific app settings and connection strings as deployment slot settings.' },
            { mistake: 'Swapping with staging as the target slot.', fix: 'Production must be the **target** so all preparation happens on the source and production stays online.' },
            { mistake: 'Expecting a swap to move the custom domain or the TLS binding.', fix: 'Those are slot-specific and stay where they are.' },
            { mistake: 'Assuming long-running work survives the swap.', fix: 'The instances holding the old production app are recycled at the end of the swap — write fault-tolerant code.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Expect a list of settings and the question "which are still in effect after the swap?" Learn the sticky list: protocol settings, custom domains, certificates and TLS, scale settings, IP restrictions, Always On, diagnostics, CORS, managed identities, VNet integration.' },
        { type: 'quickcheck', questionIds: ['app-slot-settings', 'app-slot-tier', 'app-slot-rollback'] },
      ],
    },
  ],
  interview: [
    {
      q: 'How do you release a new version of a web app with no downtime?',
      a: 'Deploy to a staging slot on a Standard tier plan or higher, run smoke tests against the slot’s own hostname, then swap with production as the target. The swap warms every instance before routing changes, and if something is wrong I swap back immediately to restore the previous version.',
    },
  ],
  takeaways: [
    'Slots need Standard or higher: 5 on Standard, 20 on Premium and Isolated.',
    'A swap warms the source slot first and switches routing only once; production is always the target.',
    'App settings and connection strings swap unless marked as deployment slot settings.',
    'Custom domains, certificates, scale settings, IP restrictions and managed identities stay with the slot.',
  ],
};

export default lesson;
