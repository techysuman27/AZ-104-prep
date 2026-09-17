# Verified facts — Compute (verified 2026-09-14)

## Managed disk encryption options (updated 2026-07-16)
- Azure Disk Storage server-side encryption (SSE): always on; encrypts OS & data disks at rest in storage clusters; platform-managed keys by default or customer-managed keys via a Disk Encryption Set (DES); does NOT encrypt temp disks or disk caches
- Encryption at host: VM option that extends SSE → temp disks and disk caches encrypted at rest, data flows encrypted from compute to storage; doesn't use VM CPU; works with custom images; temp disk encryption with platform-managed keys only; CMK via DES
- Confidential disk encryption: binds keys to VM TPM (confidential VM sizes); OS disk
- Azure Disk Encryption (ADE): in-guest BitLocker (Windows) / DM-Crypt (Linux), Key Vault (+ KEK); uses VM CPU; doesn't work for custom Linux images. **ADE retires September 15, 2028** — after that ADE disks fail to unlock after reboot. Microsoft: use encryption at host for new VMs; migrate ADE VMs (incl. backups) to encryption at host
- Defender for Cloud recommendation "Virtual machines and virtual machine scale sets should have encryption at host enabled"
- (Well-established requirements for encryption at host: register feature Microsoft.Compute/EncryptionAtHost on subscription (az feature register --namespace Microsoft.Compute --name EncryptionAtHost); VM size must support it; VM must be deallocated to enable on existing VM; securityProfile.encryptionAtHost = true; can't combine with ADE on same VM)
- URL: https://learn.microsoft.com/en-us/azure/virtual-machines/disk-encryption-overview

## Managed disk types (updated 2026-09-11)
- Five types: Ultra Disk, Premium SSD v2, Premium SSD, Standard SSD, Standard HDD
- Max size: Ultra & Premium SSD v2 65,536 GiB; Premium SSD / Standard SSD / Standard HDD 32,767 GiB
- Max IOPS: Ultra 400,000; Premium SSD v2 80,000; Premium SSD 20,000; Standard SSD 6,000; Standard HDD 2,000 (3,000 w/ performance plus)
- Max throughput: Ultra 10,000 MB/s; Premium SSD v2 2,000; Premium SSD 900; Standard SSD 750; Standard HDD 500
- OS disk: Ultra NO; Premium SSD v2 NO; Premium SSD yes; Standard SSD yes; Standard HDD yes but OS-disk use RETIRES Sept 8, 2028
- Scenarios: Ultra = SAP HANA, top-tier DBs; Premium SSD v2 = production perf-sensitive (best price-performance for most general purpose); Premium SSD = production high performance; Standard SSD = web servers, lightly used apps, dev/test; Standard HDD = backup, noncritical infrequent access
- Ultra & Premium SSD v2: set capacity, IOPS, throughput independently; change performance up to 4 times per 24 h without detaching; no host caching; can't use Azure Compute Gallery; Ultra no availability sets, LRS only (no ZRS); Premium SSD v2 mostly zonal VMs
- Premium SSD sizes P1–P80 fixed tiers; bursting (on-demand bursting for P30+); Standard SSD E-series; Standard HDD S-series
- Billing: provisioned size mapped up to nearest tier (e.g., 200 GiB Standard SSD → E15 256 GiB); snapshots billed on used size; standard disks billed transactions
- URL: https://learn.microsoft.com/en-us/azure/virtual-machines/disks-types

## VM availability options (updated 2026-06-24)
- Availability zones: physically separate zones within a region (three per supported region), independent power/network/cooling — protects against datacenter failure
- VM Scale Sets: group of load-balanced VMs, autoscale on demand or schedule; can span multiple zones, single zone, or regional; no cost for scale set itself
- Availability sets: logical grouping for redundancy; two or more VMs in an availability set → 99.95% SLA; no cost for the set
- Combine Load Balancer with zones and scale sets for resiliency; Azure Site Recovery for regional DR
- URL: https://learn.microsoft.com/en-us/azure/virtual-machines/availability

## Availability sets (updated 2026-04-07)
- Microsoft recommends VM Scale Sets with Flexible orchestration for HA with widest features; availability sets less resilient than availability zones
- Two or more VMs in an availability set → 99.95% SLA; no cost for set
- Up to 3 fault domains (shared power source & network switch) and 20 update domains (restarted together during planned maintenance; one UD at a time; 30 min recovery) — can't change after creating the set
- Default distribution example with 5 UDs: 6th VM goes to UD of 1st
- Managed availability set: VMs with managed disks aligned to disk fault domains (2 or 3 per region)
- Doesn't protect against OS/app failures; susceptible to datacenter-level outages
- Lower VM-to-VM latency than zones
- (Well-known: a VM can only be added to an availability set at creation time; to change, delete & recreate VM keeping disks; availability sets and zones are mutually exclusive for a VM)
- URL: https://learn.microsoft.com/en-us/azure/virtual-machines/availability-set-overview

## VMSS orchestration modes (updated 2026-09-04)
- Orchestration mode set at creation; can't be changed later
- Flexible (RECOMMENDED): standard Azure VMs (Microsoft.Compute/virtualMachines); up to 1,000 VMs (200 for some fixed-spreading SKUs); mix VM sizes/OS, Spot + on-demand; add/remove existing VMs; assign specific zone/fault domain; Azure Backup & ASR supported; no default outbound access (explicit outbound required); user-assigned managed identity only; upgrade policy/automatic OS image upgrades not supported (use Auto VM Guest Patching); application health via Application Health extension; no overprovisioning; no Basic LB
- Uniform: identical instances from VM profile (scale set VM API); max 100 with FD guarantees (up to 3,000 overall GA); automatic OS upgrades; upgrade policy Automatic/Rolling/Manual; overprovisioning; AKS & Service Fabric use Uniform; no Azure Backup/ASR per instance; 5 update domains
- Both: autoscale (manual, metrics-based, schedule-based), instance protection, scale-in policy, instance repair, availability zones (1–3), terminate notifications
- SLA: 99.95% across fault domains; 99.99% across multiple zones
- Availability sets: up to 200 instances with FD guarantees, up to 20 UDs, no zones, no autoscale
- URL: https://learn.microsoft.com/en-us/azure/virtual-machine-scale-sets/virtual-machine-scale-sets-orchestration-modes

## App Service plans (updated 2026-08-31)
- Plan defines OS (Windows/Linux), region, number of VM instances, instance size, pricing tier
- Tiers: Free, Shared (shared compute; CPU quotas; can't scale out); Basic, Standard, Premium, PremiumV2, PremiumV3, PremiumV4 (dedicated compute — VMs dedicated to plan, shared by apps in the plan); IsolatedV2 (App Service Environment; dedicated VMs in dedicated VNets)
- All apps (and deployment slots, backups, WebJobs, diagnostic logs) in a plan run on the same instances and scale together; per-app scaling can limit an app to subset of instances
- Billing: dedicated tiers charged per VM instance; shared per app CPU quota; Isolated per worker; features (custom domains, TLS certs, slots, backups) no extra charge except App Service domains/certificates purchases and IP-based TLS (SNI free)
- Scale up/down = change pricing tier; scale out = more instances; move app to another plan for isolation
- Guidance max apps: B1/S1/P1v2 8; B2/S2/P2v2 16; B3/S3/P3v2 32; P0v3 8; P1v3 16; P2v3 32; P3v3 64
- Managed Instance on App Service (new; Windows, Pv4/Pmv4 only) — beyond AZ-104 scope
- URL: https://learn.microsoft.com/en-us/azure/app-service/overview-hosting-plans

## Deployment slots (updated 2025-11-28)
- Require Standard, Premium, or Isolated tier; Standard supports 5 slots (can't scale down to Standard with >5 slots); see App Service limits for others (Premium 20 — well-known)
- Slots are live apps with own host names (<site>-<slot>.azurewebsites.net), run on the same App Service plan instances; no extra charge
- Swap: apply target slot's slot-specific settings to source → restart source instances → warm up (application root or applicationInitialization / WEBSITE_SWAP_WARMUP_PING_PATH) → switch routing → target never goes down; roll back = swap again
- Settings SWAPPED: language framework versions, 32/64-bit, WebSockets, app settings & connection strings (unless marked "Deployment slot setting"), mounted storage, handler mappings, public certificates, WebJobs content, Hybrid connections, service endpoints, CDN, path mappings
- Settings NOT swapped (slot-specific): protocol settings (HTTPS Only, TLS version, client certs), publishing endpoints, custom domain names, nonpublic certificates & TLS/SSL settings, scale settings, WebJobs schedulers, IP restrictions (access restrictions), Always On, diagnostic log settings, CORS, managed identities, _EXTENSION_VERSION settings, Service Connector settings, virtual network integration
- Sticky: check "Deployment slot setting" (az webapp config appsettings set --slot-settings)
- Swap with preview (multi-phase): pause after applying target settings; complete or cancel (not with site authentication enabled)
- Auto swap: push to slot → auto swap into target after warm-up; NOT supported for Linux web apps / Web App for Containers
- Traffic routing %: route portion of production traffic to a slot; client pinned via x-ms-routing-name cookie (self = production); manual opt-in with ?x-ms-routing-name=staging
- New slot has no content; can clone configuration; private endpoint not cloned
- CLI: az webapp deployment slot create/swap (--action preview|swap|reset)/auto-swap ; az webapp traffic-routing set --distribution staging=15 ; PowerShell New-AzWebAppSlot, Switch-AzWebAppSlot
- URL: https://learn.microsoft.com/en-us/azure/app-service/deploy-staging-slots

## App Service backup (updated 2026-06-02)
- Backup & restore supported in Basic, Standard, Premium, Isolated (Basic: production slot only); not Free/Shared
- Automatic backups: no configuration; hourly; 30-day retention (hours kept thin out); 30 GB limit; no linked DB; not downloadable; stored in same datacenter (not a DR plan); can't be stopped
- Custom backups: need storage account (same subscription; SAS-based auth, not managed identity) + container; on-demand (retained indefinitely) or scheduled (min every 2 h, up to 12/day); retention 0–30 days or indefinite; 10 GB max (4 GB linked DB); downloadable ZIP + XML manifest; partial backups via _backup.filter; backup over VNet integration to firewall-protected storage
- Linked database backups deprecated: from 3/31/2028 no longer supported (option removed for MySQL/PostgreSQL Nov 2025, Azure SQL Apr 2026)
- Restore stops the target app/slot → restore to a slot then swap; restore to new app, existing app, or slot; same OS platform
- Not restored: networking features (private endpoints, hybrid connections, VNet integration), authentication, managed identities, custom domains (automatic), TLS/SSL, scale out, alerts, backup config, slots
- CLI: az webapp config snapshot list/restore (automatic backups)
- URL: https://learn.microsoft.com/en-us/azure/app-service/manage-backup

## App Service networking (updated 2026-08-31)
- Inbound features: App-assigned address (IP-based SSL; dedicated inbound IP), Access restrictions (priority allow/deny rules at front ends — IP ranges, service tags, VNet service endpoints; up to 512 rules per app), Service endpoints, Private endpoints (private IP from VNet; inbound only; prevents data exfiltration)
- Outbound features: Virtual network integration (regional; VNet must be in same region; reach peered VNets, service-endpoint-secured resources, ExpressRoute/VPN; route all outbound; NSGs & route tables apply), Gateway-required VNet integration (legacy P2S; Windows only), Hybrid Connections (Azure Relay; Hybrid Connection Manager on Windows Server; outbound TCP to a single host:port; port 443)
- App Service Environment (Isolated v2): single-tenant in your VNet; ILB ASE for private apps
- Port 445 (SMB) blocked by default in App Service sandbox
- Changing VM family (Standard → PremiumV2 → V3) changes outbound IPs; possibleOutboundAddresses property; AppService service tag = inbound addresses; no tag for outbound
- Use cases: restrict to set of IPs → access restrictions; expose on private IP → private endpoint/ILB ASE; WAF → Application Gateway / Front Door; access on-prem without VPN → Hybrid Connections; secure/route outbound → VNet integration + NSG/UDR
- (VNet integration & private endpoints require Basic tier or higher — well-established; Free/Shared don't support)
- URL: https://learn.microsoft.com/en-us/azure/app-service/networking-features

## App Service TLS certificates (updated 2026-06-18)
- Certificate options: free App Service managed certificate (ASMC); import App Service certificate (purchased, Azure-managed, exportable); import from Key Vault (PKCS12; App Service RP needs Key Vault Certificate User role or Get secret/cert access policy; auto-sync within 24 h); upload private certificate (.pfx); upload public certificate (.cer, for app code — not for securing domains)
- Adding certificates requires Basic, Standard, Premium, or Isolated tier
- Private cert requirements: password-protected PFX; full chain (intermediates + root); for TLS binding: server authentication EKU (1.3.6.1.5.5.7.3.1) and trusted CA
- Private certs stored per "webspace" (RG + region + OS) and shared with apps in it; up to 1,000 private certs per webspace
- ASMC (issued by DigiCert, auto-renewed): no wildcard; not exportable; no private DNS; not in App Service Environment; domain ≤64 chars; apex domain needs A record to app IP and app reachable from internet (no IP restrictions); subdomain needs CNAME directly to <app>.azurewebsites.net; may need CAA "0 issue digicert.com"; one managed cert per custom domain
- Renew uploaded cert: upload new → Update binding → delete old (avoid IP change)
- URL: https://learn.microsoft.com/en-us/azure/app-service/configure-ssl-certificate

## Custom domains (updated 2026-04-14)
- Requires paid tier (not Free F1); custom domain in public DNS zone (private DNS zones not supported)
- Root domain (contoso.com): A record @ → app IP + TXT record "asuid" = domain verification ID (don't use CNAME at apex)
- Subdomain (www.contoso.com): CNAME www → <app>.azurewebsites.net (recommended) or A record + TXT "asuid.www" = verification ID
- Wildcard (*.contoso.com): CNAME * + TXT asuid
- TXT verification ID highly recommended (prevents subdomain takeover)
- Portal: Custom domains → Add custom domain → provider → TLS/SSL certificate (App Service Managed Certificate if Basic+, or "Add certificate later" e.g. Shared tier) → TLS/SSL type: SNI SSL (multiple, free) or IP SSL (one; Standard tier or above) → Validate → Add
- Without binding, HTTPS to custom domain shows certificate error
- CLI: az webapp config hostname add --webapp-name <app> --resource-group <rg> --hostname <fqdn>
- URL: https://learn.microsoft.com/en-us/azure/app-service/app-service-web-tutorial-custom-domain

## App Service scale up / out (updated 2025-09-09)
- Scale up = change App Service plan pricing tier (more CPU/memory/disk + features: dedicated VMs, custom domains & certs, staging slots, autoscaling); applies in seconds to all apps in plan; no code change/redeploy
- Scale out = more instances: Basic up to 3, Standard up to 10, Premium up to 30 instances; Isolated (ASE) up to 100
- Autoscale (rules/schedules via Azure Monitor autoscale) — Standard tier and above (well-established); Automatic scaling (HTTP-based platform scale-out) option available (Premium v2/v3/v4 — well-established)
- Must remove subscription spending limits before leaving Free tier
- URL: https://learn.microsoft.com/en-us/azure/app-service/manage-scale-up

## Azure Container Registry SKUs (updated 2026-09-03)
- SKUs: Basic (dev/learning; 10 GiB included), Standard (production; 100 GiB), Premium (high volume; 500 GiB; storage limit 100 TiB vs 40 TiB)
- All SKUs: same data-plane APIs, Entra auth, webhooks (2/10/500), zone redundancy by default in supported regions, repository-scoped permissions (Entra ABAC and non-Entra tokens/scope maps)
- Premium-only: geo-replication, private link/private endpoints (200), public IP network rules (200), service endpoint VNet access (preview), dedicated data endpoints, content trust, customer-managed keys, connected registries, artifact streaming, retention policy for untagged manifests, artifact transfer, export policy, dedicated agent pools for Tasks
- Standard+: anonymous pull access, artifact cache rules
- Change SKU any time with no downtime (az acr update --name <r> --sku Premium); remove geo-replications before downgrading from Premium
- Registry login server <name>.azurecr.io (name rules well-known: 5–50 alphanumeric, globally unique)
- API throttling → HTTP 429
- URL: https://learn.microsoft.com/en-us/azure/container-registry/container-registry-skus

## ACR authentication (updated 2026-06-12)
- Individual Entra identity: az acr login --name <acr> (Docker required; token valid 3 hours) / Connect-AzContainerRegistry; --expose-token without Docker daemon
- Service principal: headless CI/CD push/pull; RBAC; SP password default expiry 1 year
- Managed identity: unattended push/pull from Azure services (e.g., ACI/App Service/Container Apps image pull)
- Admin user: DISABLED by default; single account with full push/pull; two passwords; not recommended for multiple users; needed for some portal deployments to ACI/Container Apps; enable az acr update -n <acr> --admin-enabled true (portal: Settings > Access keys)
- Non-Entra token-based repository permissions (tokens + scope maps)
- Built-in roles (well-established): AcrPull, AcrPush, AcrDelete, AcrImageSigner; Owner/Contributor for management; newer ABAC repository permission roles exist ("Container Registry Repository Reader/Writer/Contributor" — describe generally)
- URL: https://learn.microsoft.com/en-us/azure/container-registry/container-registry-authentication

## Azure Container Instances (updated 2026-07-26)
- Fastest/simplest way to run Linux or Windows containers without managing VMs or orchestrator; starts in seconds; billed per second for CPU cores & memory requested
- Container group: containers sharing host, local network, storage, lifecycle (like a pod); multiple containers per group = Linux only; volume mounts (Azure Files, emptyDir, GitRepo, secret) Linux only
- Public IP + DNS name label → <label>.<region>.azurecontainer.io; IP may change on restart (use Application Gateway for static IP)
- VNet deployment: container groups in a subnet; NAT gateway required for outbound connectivity from VNet-deployed groups
- Persistent storage: mount Azure Files shares
- Managed identity (auth to Entra services; pull from ACR with managed identity)
- Confidential containers (TEE), Spot containers (up to 70% discount, preemptible), standby pools, NGroups (multiple related groups, rolling upgrades), virtual nodes for AKS; zonal deployments
- x64 images only; images ≤15 GB; TLS 1.2 required; no privileged containers; GPU retired
- Restart policies (well-established): Always (default), Never, OnFailure
- Sizing: specify CPU cores and memory (GB) per container (requests; limits optional)
- CLI (well-established): az container create --resource-group <rg> --name <n> --image <img> --cpu 1 --memory 1.5 --ports 80 --dns-name-label <label> --restart-policy OnFailure --os-type Linux
- URL: https://learn.microsoft.com/en-us/azure/container-instances/container-instances-overview

## Azure Container Apps scaling (updated 2026-05-20)
- Horizontal autoscaling via KEDA; scaling changes create a new revision (immutable snapshot)
- Limits per revision: min replicas default 0 (min 0), max replicas default 10 (min 1); up to 1,000 configurable
- Rule types: HTTP (concurrent requests; default concurrentRequests 10), TCP (concurrent connections; default 10), Custom (CPU, memory, KEDA scalers: Azure Service Bus, Event Hubs, Azure Queue, Kafka, Redis...) — first rule condition met triggers scale
- Default when no rule: HTTP rule, min 0, max 10; if ingress disabled and no minReplicas/custom rule → scales to zero and can't start back up
- Behavior: polling interval 30 s (not HTTP/TCP), cool down 300 s (only last replica → 0), scale-down stabilization 300 s, scale-up step 1,4,8,16...
- No usage charges when scaled to zero; idle replicas billed lower
- Custom rule auth: secrets or managed identity
- Vertical scaling not supported; Dapr actors can't scale to zero
- CLI: az containerapp create --name <n> --resource-group <rg> --environment <env> --image <img> --min-replicas 0 --max-replicas 5 --scale-rule-name http-rule --scale-rule-type http --scale-rule-http-concurrency 100
- URL: https://learn.microsoft.com/en-us/azure/container-apps/scale-app

## Container Apps environments (updated 2026-02-27)
- Environment = secure boundary around container apps & jobs; apps in same environment share VNet and log destination (Log Analytics workspace)
- Types: Workload profiles environment (DEFAULT; Consumption and Dedicated plans) vs Consumption only (legacy; Consumption plan)
- VNet created automatically with limited capabilities or bring your own VNet
- Use separate environments to isolate compute/teams (test vs prod)
- Environments auto-deleted if idle/failed for >90 days
- URL: https://learn.microsoft.com/en-us/azure/container-apps/environment

## Containers in Container Apps (updated 2026-03-25)
- Linux x86-64 (linux/amd64) images only; any public/private registry; sidecar & init containers; auto restart on crash; no privileged containers
- Consumption plan CPU/memory combinations (total for all containers): 0.25/0.5Gi, 0.5/1Gi, 0.75/1.5Gi ... 2.0/4Gi ... 4.0/8Gi (vCPU : memory = 1:2, 0.25 steps); Consumption-only environments max 2 cores/4Gi
- Changing template section creates a new revision
- Pull from ACR with managed identity (identity needs AcrPull on registry) or username/passwordSecretRef
- Consumption workload profile image up to 8 GB per replica
- (Revisions: single revision mode default vs multiple revision mode with traffic splitting & labels; ingress external/internal, HTTP/TCP — well-established)
- URL: https://learn.microsoft.com/en-us/azure/container-apps/containers

## ARM deployment modes (updated 2026-06-26)
- Default = Incremental: leaves resources in RG that aren't in template unchanged; adds/updates template resources. BUT redeployed resources get ALL properties reapplied — unspecified properties reset to defaults (template = final state)
- Complete mode: DELETES resources in the RG not in the template; not recommended (being gradually deprecated) → use deployment stacks for deletions; always run what-if first
- Complete mode: resources with false condition deleted (API ≥2019-05-10); copy-loop leftovers deleted; only the target RG affected; locked RG → not deleted; root-level templates only (nested/linked = incremental); NOT supported for subscription-level deployments; portal doesn't support complete mode
- Can't change location or type of existing resource via deployment (fails)
- Subnets: define in VNet's subnets property (not child resource) to avoid losing them on redeploy
- CLI: az deployment group create --mode Complete --name X --resource-group RG --template-file storage.json ; PowerShell New-AzResourceGroupDeployment -Mode Complete -TemplateFile ...
- What-if (well-established): az deployment group what-if ... ; New-AzResourceGroupDeployment -WhatIf
- URL: https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/deployment-modes

## Export template (portal) (updated 2026-06-26)
- Export as Bicep or ARM JSON from resource group (select resources → Export template) or single resource (Export template blade) — autogenerated snapshot of current state incl. manual changes; many hard-coded values; "Include parameters" option
- Save from deployment history (RG → Deployments → deployment → Template): exact template used (ARM JSON only), has parameters, excludes post-deployment manual changes; decompile to Bicep afterwards
- Limitations: export not guaranteed; max 200 resources in RG; some password parameters missing; some resource types not exported (e.g., Data Factory); classic resources not supported
- CLI/PowerShell: az group export --name <rg> > main.json ; Export-AzResourceGroup -ResourceGroupName <rg> -Path ./main.json
- URL: https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/export-template-portal

## Bicep decompile (updated 2026-07-14)
- az bicep decompile --file main.json → main.bicep (--force to overwrite); bicep decompile main.json without az
- Best effort: no guaranteed mapping; fix warnings/errors; periods in parameter names become underscores
- az bicep build compiles Bicep → ARM JSON (functionally equivalent)
- VS Code: "Decompile into Bicep", "Paste JSON as Bicep", insert resource from existing
- Portal can export Bicep files directly
- Example Bicep syntax verified: @allowed([...]) @description('...') param storageAccountType string = 'Standard_LRS' ; param location string = resourceGroup().location ; var name = 'store${uniqueString(resourceGroup().id)}' ; resource exampleStorage 'Microsoft.Storage/storageAccounts@2025-06-01' = { name: ..., location: location, sku: { name: storageAccountType }, kind: 'StorageV2', properties: {} } ; output storageAccountName string = uniqueStorageName
- ARM JSON structure verified: $schema, contentVersion, parameters (type, defaultValue, allowedValues, metadata.description), variables (concat, uniquestring), resources (type, apiVersion, name, location, sku, kind, properties), outputs
- Deploy Bicep directly (well-established): az deployment group create --resource-group <rg> --template-file main.bicep --parameters storageAccountType=Standard_GRS ; New-AzResourceGroupDeployment -ResourceGroupName <rg> -TemplateFile main.bicep
- URL: https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/decompile
