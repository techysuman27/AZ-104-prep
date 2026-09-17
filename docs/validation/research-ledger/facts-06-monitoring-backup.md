# Verified facts — Monitoring & Backup (verified 2026-09-14)

## Diagnostic settings (updated 2026-06-29)
- Sources: platform metrics (collected automatically), activity log (collected automatically), resource logs (NOT collected by default — need a diagnostic setting)
- Destinations: Log Analytics workspace, Azure Storage account (Standard only; same region for regional resources), Azure Event Hubs (same region; stream to SIEM), Azure Monitor partner solutions
- Destination must exist first; one of each destination type per setting; up to FIVE diagnostic settings per resource; destination can be in another subscription with RBAC
- Firewall-enabled storage/Event Hubs: allow trusted Microsoft services
- Category groups: allLogs, audit; metrics: AllMetrics
- Resource-specific tables vs AzureDiagnostics (collection mode; --export-to-resource-specific true)
- Data flows within ~90 minutes; tables auto-created on first data
- Multidimensional metrics exported flattened
- Delete diagnostic settings when deleting/renaming/moving resource
- Activity log export: subscription-scope diagnostic setting (portal Monitor > Activity log > Export Activity Logs; CLI az monitor diagnostic-settings subscription create)
- CLI az monitor diagnostic-settings create --name X --resource <id> --logs '[{"category":"AuditEvent","enabled":true}]' --metrics '[{"category":"AllMetrics","enabled":true}]' --workspace <id> ; PowerShell New-AzDiagnosticSetting
- URL: https://learn.microsoft.com/en-us/azure/azure-monitor/platform/diagnostic-settings

## Activity log (updated 2026-07-14)
- Records control plane (management) operations: create/update/delete, actions (e.g., VM create, key vault policy change, deployment errors); typically not reads; data plane ops are in resource logs
- Collected by default, no config; can't change/delete entries; available within 3–20 min
- Retained 90 days (no charge); export via diagnostic setting to Log Analytics (AzureActivity table; retention up to 12 years), Storage (insights-activity-logs container, PT1H.json), Event Hubs
- Categories (schema): Administrative, Service Health, Resource Health, Alert, Autoscale, Recommendation, Security, Policy (well-established)
- Only place that stores resource creator → export for >90 days
- View at subscription, RG, resource, management group (Management groups > Activity log), tenant (Directory Activity)
- Change history tab: changes 30 min before/after operation
- CLI az monitor activity-log list --resource-group <rg> --offset 14d ; PowerShell Get-AzActivityLog -ResourceGroupName <rg> -StartTime ...
- KQL: AzureActivity | where CategoryValue == "Administrative" ; AzureActivity | summarize count() by CategoryValue
- URL: https://learn.microsoft.com/en-us/azure/azure-monitor/platform/activity-log

## Alerts overview (updated 2026-07-08)
- Alert rule = resources (scope) + signal/data + conditions → fires alert → action groups; per-resource evaluation for multi-resource rules
- Alerts stored 30 days
- Action groups: email, SMS, push, (voice), Automation runbooks, Azure Functions, ITSM, Logic Apps, secure webhooks, webhooks, Event Hubs
- Alert condition (system): Fired → Resolved; User response: New, Acknowledged, Closed
- Alert processing rules: modify fired alerts — add or suppress action groups, filters, schedules (e.g., maintenance windows)
- Types: Metric alerts (platform/custom metrics; multiple conditions; dynamic thresholds), Log search alerts (KQL query on schedule), Simple log search alerts (row-by-row near real-time), Activity log alerts (incl. Service Health & Resource Health alerts), Smart detection (App Insights), Prometheus alerts
- Stateless: fire every time condition met — ALL activity log alerts are stateless; Stateful: fire once until resolved (metric alerts resolve after 3 consecutive checks not met; log alerts per frequency)
- Recommended alert rules available for VMs, AKS, Log Analytics workspaces
- One metric alert rule can monitor multiple resources of same type in same region
- RBAC: read on target resource + write on RG for rule + read on action group; roles Monitoring Contributor (create alerts), Monitoring Reader (view)
- Severity levels (well-established): Sev 0 Critical, Sev 1 Error, Sev 2 Warning, Sev 3 Informational, Sev 4 Verbose
- URL: https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-overview

## Alert processing rules (updated 2026-04-30)
- Previously "action rules" (resource type Microsoft.AlertsManagement/actionRules)
- Modify FIRED alerts: Suppression (remove all action groups — higher priority) or Apply action groups (add)
- Scope: specific resources, resource group(s), or entire subscription (same subscription as rule)
- Filters (AND between filters, up to 5 values OR'd): alert context, alert rule ID/name, description, monitor condition (Fired/Resolved), monitor service, resource, resource group, resource type, severity
- Schedule: always (default), one-time window ("On a specific time"), recurring (daily/weekly)
- Use cases: suppress during planned maintenance / outside business hours; add action group at scale; add action groups to alert types without them (Azure Backup alerts, VM insights guest health)
- Don't affect Azure Service Health alerts; take up to 30 minutes to take effect
- Suppressed alerts still visible in portal
- CLI: az monitor alert-processing-rule create --rule-type AddActionGroups|RemoveAllActionGroups ... (alertsmanagement extension); PowerShell Set-AzAlertProcessingRule
- URL: https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-processing-rules

## Azure Monitor Agent (updated 2026-07-28)
- Collects guest OS data from Azure VMs, VMSS, and hybrid machines (Azure Arc, other clouds, on-prem, Windows client OS)
- Configured by data collection rules (DCRs) associated with agents (DCR = what to collect, transformations, destinations); centralized config
- Data: Windows event logs, performance counters, file-based/text logs, IIS logs; Linux syslog, performance, file-based logs → Azure Monitor Logs (Log Analytics workspace) and Azure Monitor Metrics (guest metrics)
- Replaces legacy Log Analytics agent (MMA/OMS — retired August 2024), Windows diagnostics extension, Telegraf for Linux
- No cost for agent (pay ingestion/retention); install via VM extension, Azure Policy, or enabling VM insights
- Supports VM insights, Sentinel, change tracking
- URL: https://learn.microsoft.com/en-us/azure/azure-monitor/agents/azure-monitor-agent-overview

## Azure Monitor metrics (updated 2026-08-09)
- Metrics = numeric time series; Logs = the other half of data platform (Log Analytics, KQL)
- Platform metrics: collected automatically from Azure resources every 1 minute (unless specified), no configuration, no cost
- Custom metrics (Azure Monitor Agent, Application Insights, REST API); Prometheus metrics (AKS; Azure Monitor workspace; 18 months)
- Retention: platform & custom metrics 93 days; metrics explorer charts max 30 days per chart (pan to see more); send to Log Analytics via diagnostic settings for long-term
- Dimensions (name/value pairs, e.g., Drive=C:) → filter & split; custom metrics up to 10 dimensions
- Aggregations (well-established): Sum, Count, Average, Min, Max
- Moving/renaming a resource may lose metric history
- Log Analytics agent retired Aug 2024
- URL: https://learn.microsoft.com/en-us/azure/azure-monitor/metrics/data-platform-metrics

## Backup vault (updated 2026-02-12)
- Storage entity for newer workloads: Azure Blobs, Azure Database for PostgreSQL servers, (Azure Disks, AKS — well-established) and newer workloads
- Storage redundancy chosen at creation (LRS/ZRS/GRS); Microsoft-managed or customer-managed keys (Backup Management Service app accesses Key Vault)
- RBAC via vault managed identities (system-assigned or user-assigned) — vault identity needs roles on datasources (e.g., disks, storage account) and Key Vault
- Data isolation: vaulted data in Microsoft-managed subscription/tenant
- Cross Region Restore for PostgreSQL (GRS; charged at RA-GRS)
- Monitoring/reporting via "Resiliency" experience (Azure Business Continuity Center successor naming — describe generically as centralized backup management)
- URL: https://learn.microsoft.com/en-us/azure/backup/backup-vault-overview

## Recovery Services vault (updated 2026-02-12)
- Holds backups for Azure IaaS VMs (Windows/Linux), SQL Server in Azure VMs, (SAP HANA in VMs, Azure Files — well-established), on-prem via MARS agent / System Center DPM / Azure Backup Server (MABS); also used by Azure Site Recovery
- Soft delete: deleted backup data retained 14 additional days at no cost; Enhanced soft delete: customizable retention + "always-on" (can't be disabled)
- Cross Region Restore (CRR): enable at vault level (requires GRS vault) → restore Azure VMs in paired secondary region any time (not waiting for Microsoft-declared disaster)
- Storage redundancy settings can be changed (only before items are protected — well-established)
- Encryption: platform-managed keys default; customer-managed keys (RSA keys in Key Vault) must be configured BEFORE protecting any items
- Azure Advisor recommends backing up unprotected VMs
- 3 built-in Backup roles (well-established): Backup Contributor, Backup Operator, Backup Reader
- URL: https://learn.microsoft.com/en-us/azure/backup/backup-azure-recovery-services-vault-overview

## VM backup Enhanced vs Standard policy (updated 2026-06-16)
- Enhanced: multiple backups/day — Hourly schedule every 4, 6, 8, 12 or 24 hours (min RPO 4 h); Instant Restore snapshot retention 1–30 days (default 7; max depends on frequency — e.g., 4-hourly max 17 days); zone-redundant storage for Instant Restore snapshots; supports Trusted Launch VMs, Premium SSD v2, Ultra Disks, multi-disk crash-consistent snapshots; exclude shared disks; more snapshot cost
- Standard: once a day (daily/weekly schedule), instant restore 1–5 days (well-established); doesn't support Ultra Disk / Premium SSD v2; Trusted Launch with Standard only via newer CLI/PowerShell/REST
- Can't change a VM from Enhanced back to Standard; migration Standard → Enhanced supported (preview)
- For hourly backups, last backup of the day transferred to vault
- Default retention: daily 180 days, weekly 12 weeks, monthly 60 months, yearly 10 years (enhanced policy defaults in portal)
- Portal: Recovery Services vault > Backup policies > + Add > Azure Virtual Machine > Policy subtype Enhanced/Standard
- CLI: az backup protection enable-for-vm --resource-group <rg> --vault-name <vault> --vm <vm-id> --policy-name DefaultPolicy ; PowerShell Enable-AzRecoveryServicesBackupProtection -Policy $pol -Name <vm> -ResourceGroupName <rg> -VaultId $vault.ID
- URL: https://learn.microsoft.com/en-us/azure/backup/backup-azure-vms-enhanced-policy

## Restore Azure VMs (updated 2026-05-27)
- Create a new VM: quick basic VM from restore point; choose name, RG, VNet; must be SAME REGION as source (unless Cross Region Restore)
- Restore disk: restores disks (+ ARM template) to a resource group; use to customize VM, attach disks to existing VM, or create via template/PowerShell; needs staging location storage account (VHDs copied for vault-standard recovery points)
- Replace existing: replaces disks of an EXISTING VM (VM must exist); Azure Backup snapshots existing VM first; original disks retained in RG; supported for unencrypted managed VMs; not classic/unmanaged/generalized VMs; only in protected VM subscription
- Cross Region Restore (secondary/paired region): vault tier only (snapshots not replicated); Create VM & Restore disks only (no Replace existing); not for Ultra Disks; requires GRS vault with CRR enabled; jobs can't be canceled
- Cross Subscription Restore: same tenant; snapshot-tier points only in protected VM subscription; vault-tier points in VM or vault subscription, other subscriptions need CSR enabled on vault (enabled by default, can be permanently disabled); not for ADE/CMK encrypted VMs
- Cross Zonal Restore: restore zone-pinned VM to another zone; vault-tier only; requires ZRS vault or CRR; not encrypted VMs
- Instant restore (snapshot tier) is faster than vault tier
- File-level recovery (well-established): "File Recovery" downloads a script that mounts recovery point disks as local volumes (iSCSI) to copy files
- URL: https://learn.microsoft.com/en-us/azure/backup/backup-azure-arm-restore-vms

## Azure Site Recovery — Azure-to-Azure architecture (updated 2025-10-07)
- Components: source VMs, cache storage account in SOURCE region (changes cached before sending to target), target resources (subscription default same; target RG "-asr" suffix; target VNet "-asr" + network mapping; replica managed disks "-ASRReplica"; target availability set "-asr"; same zone number if target supports zones)
- Can modify target settings (incl. VM SKU) during/after enabling replication; availability type (single/set/zone) change requires disable→re-enable replication
- Replication policy defaults: recovery point retention ONE DAY; app-consistent snapshot frequency 0 hours (disabled)
- Crash-consistent recovery points every 5 minutes (not changeable); app-consistent via VSS at configured frequency (less than retention)
- Multi-VM consistency via replication group (port 20004; performance impact)
- Replication process: Mobility service extension auto-installed → registers VM → continuous replication writes to cache storage → processed to replica managed disks → recovery points
- Outbound connectivity only (no inbound): *.blob.core.windows.net, login.microsoftonline.com, *.hypervrecoverymanager.windowsazure.com, *.servicebus.windows.net; or service tags Storage.<region>, AzureActiveDirectory, EventHub.<region>, AzureSiteRecovery
- Failover: VMs created in target RG/VNet/subnet/availability set from chosen recovery point
- URL: https://learn.microsoft.com/en-us/azure/site-recovery/azure-to-azure-architecture

## ASR failover & reprotect (updated 2025-10-07)
- Recommended: run a DR drill (test failover) first — isolated, no production impact (then cleanup test failover)
- Failover: Replicated items → VM → Failover → choose recovery point: Latest processed (low RTO), Latest (lowest RPO — processes all data first), Latest app-consistent, Custom (single VM, not recovery plan)
- Option "Shut down machine before beginning failover" (try to avoid data loss; continues if shutdown fails)
- After failover: verify VM → optionally Change recovery point → Commit (deletes available recovery points; can't change after)
- Re-protect (status must be Failover committed): replicate from secondary back to primary; then fail back later (failover again to primary + reprotect)
- Recovery plans group VMs for orchestrated failover (custom recovery point not available with plans)
- URL: https://learn.microsoft.com/en-us/azure/site-recovery/azure-to-azure-tutorial-failover-failback

## Backup monitoring (updated 2026-03-13)
- Centralized experience now called "Resiliency" in current docs (earlier: Backup center → Azure Business Continuity Center) — protected items, protectable resources (not protected), jobs, alerts
- Recovery Services vault: Backup Items / Backup Instances with last backup status & latest restore point; Backup jobs in vault and Resiliency
- (Well-established) Azure Monitor–based built-in alerts for Azure Backup (security alerts e.g. backup data deletion, job failure alerts) route notifications via alert processing rules + action groups; classic backup alerts deprecated
- URL: https://learn.microsoft.com/en-us/azure/backup/backup-azure-monitoring-built-in-monitor

## Backup reports (updated 2025-11-27)
- Reports use Azure Monitor Logs (Log Analytics) + Azure workbooks
- Steps: create/choose Log Analytics workspace (any region/subscription; default retention 30 days — extend for history) → configure vault Diagnostic settings (Recovery Services vault or Backup vault) to send to workspace (built-in Azure Policy can configure at scale) → view Backup Reports
- Initial data push up to 24 hours; reports exclude current partial day (view ~2 days after setup)
- Report types: Backup Reports (jobs, instances, usage, policies, policy adherence, optimize), Backup Configuration Status, Backup Job History, Backup Schedule and Retention, User Triggered Operations, ASR Job History, ASR Replication History
- Power BI template app & V1 schema deprecated
- URL: https://learn.microsoft.com/en-us/azure/backup/configure-reports

## Log Analytics
- Default workspace data retention 30 days (per backup reports doc); can extend (tables up to 12 years total per activity log doc)
