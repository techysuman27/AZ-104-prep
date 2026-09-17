import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'app-service-backup',
  moduleId: 'app-service',
  verified: '2026-09-16',
  sources: ['appservice-backup', 'appservice-slots'],
  changes: [
    {
      topic: 'Linked database backups',
      previously: 'Custom backups could include a linked SQL Database, Azure Database for MySQL or PostgreSQL alongside the app content.',
      now: 'Microsoft is removing the option to include linked databases in new custom backup configurations (MySQL and PostgreSQL from November 2025, Azure SQL and SQL Server from April 2026) and stops backing them up entirely on 31 March 2028.',
      matters: 'Database protection belongs to the database service’s own backup tooling. Expect exam questions to focus on app content and configuration.',
    },
  ],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Two kinds of backup, one restore',
      blocks: [
        {
          type: 'lead',
          text: 'App Service takes **automatic backups** for you on supported tiers, and lets you configure **custom backups** to your own storage account. Each backup is a complete offline copy, never an incremental one.',
        },
        {
          type: 'explainer',
          technical: [
            'Backup and restore are supported in the **Basic, Standard, Premium and Isolated** tiers. On Basic you can back up and restore the production slot only.',
            'Automatic backups need no configuration and no storage account; custom backups need both, plus a storage account that supports SAS-based authorization (managed identity is not supported for this operation).',
            'A restore stops the target app or slot, so restore into a deployment slot and swap to avoid production downtime.',
          ],
          simple: [
            'Azure quietly keeps hourly copies of your app on the tiers that support it.',
            'If you want copies you control — kept longer, downloadable, on a schedule you choose — you configure custom backups into your own storage account.',
            'Restoring overwrites the target, so restore into a spare slot first and then swap it in.',
          ],
        },
      ],
    },
    {
      id: 'compare',
      kind: 'compare',
      title: 'Automatic vs custom',
      blocks: [
        {
          type: 'table',
          caption: 'Documented differences between the two backup types.',
          columns: ['Feature', 'Automatic backups', 'Custom backups'],
          rows: [
            ['Pricing tiers', 'Basic, Standard, Premium, Isolated', 'Basic, Standard, Premium, Isolated'],
            ['Configuration required', 'No', 'Yes'],
            ['Backup size', '30 GB', '10 GB, of which up to 4 GB can be the linked database'],
            ['Storage account required', 'No', 'Yes'],
            ['Frequency', 'Hourly, not configurable', 'Configurable — minimum every 2 hours, up to 12 backups per day'],
            ['Retention', '30 days, not configurable', '0–30 days, or indefinite'],
            ['Downloadable', 'No', 'Yes, as Azure Storage blobs'],
            ['Partial backups', 'Not supported', 'Supported via a `_backup.filter` file'],
            ['Over a virtual network', 'Not supported', 'Supported'],
          ],
        },
        {
          type: 'callout',
          variant: 'trap',
          text: 'Automatic backups cannot be stopped, and Microsoft explicitly says not to rely on them as a disaster recovery plan — they are stored in the same datacentre as the App Service.',
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'What is and isn’t restored',
      blocks: [
        {
          type: 'list',
          style: 'check',
          items: [
            'Backed up: all app content under `%HOME%` (Windows) or `/home` (Linux), and persistent storage for custom containers.',
            'Not backed up: run-from-ZIP package content, and content from custom-mounted Azure storage such as an Azure Files share.',
            'Restored with configuration: native log settings, Application Insights configuration, health check.',
            'Not restored: networking features (private endpoints, hybrid connections, VNet integration), authentication, managed identities, custom domains, TLS/SSL, scale out settings, diagnostics, alerts, the backup configuration itself and associated deployment slots.',
          ],
        },
        {
          type: 'code',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# List the automatic backups (snapshots) and restore one
az webapp config snapshot list --name app-contoso-portal --resource-group rg-web-prod

az webapp config snapshot restore --name app-contoso-portal --resource-group rg-web-prod \\
  --time <snapshot-timestamp>

# Restore content only, leaving app configuration as it is
az webapp config snapshot restore --name app-contoso-portal --resource-group rg-web-prod \\
  --time <snapshot-timestamp> --restore-content-only`,
              notes: [
                { token: 'snapshot list', note: 'Automatic backups appear as snapshots; copy the time property of the one you want.' },
                { token: '--restore-content-only', note: 'Restores files without overwriting the app’s configuration.' },
              ],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'The safe restore pattern',
          text: 'Restore into a new deployment slot, check the app there, then swap it into production. A direct restore stops the production app and erases the target’s file system.',
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Remember the three discriminators: custom backups need a storage account, automatic backups are hourly with 30 days of retention and cannot be turned off, and restoring to a slot avoids downtime.' },
        { type: 'quickcheck', questionIds: ['app-backup-custom', 'app-backup-restore-slot'] },
      ],
    },
  ],
  takeaways: [
    'Backup and restore need Basic or higher; Basic covers the production slot only.',
    'Automatic: hourly, 30 GB, 30-day retention, no storage account, not downloadable.',
    'Custom: configurable schedule and retention, 10 GB, your storage account, downloadable, supports partial backups.',
    'Restore into a slot and swap to avoid production downtime.',
  ],
};

export default lesson;
