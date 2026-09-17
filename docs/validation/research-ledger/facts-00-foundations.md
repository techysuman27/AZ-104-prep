# Foundations — verified facts (2026-09-14)

## Regions & region pairs — https://learn.microsoft.com/en-us/azure/reliability/regions-paired (ms.date 2025-03-19)
- Regions are independent; Microsoft associates SOME regions with another (usually same geography) = region pair
- A small number of services use pairs for geo-replication (e.g., GRS storage replicates to paired region)
- Many regions aren't paired (newer regions) and use availability zones as primary redundancy
- Benefits of using the pair: region recovery sequence (one region per pair prioritized), sequential updating (planned updates staggered), data residency (almost all pairs in same geography)
- Deploying to a paired region doesn't automatically give HA/DR/failover
- Microsoft-managed GRS failover only in catastrophic situations — don't rely on it as primary DR
- Asymmetric pairs exist: Brazil South → South Central US (outside geography); West US 3 → East US (one direction)
- Examples: East US ↔ West US, North Europe ↔ West Europe, UK South ↔ UK West, Central US ↔ East US 2
- Nonpaired examples: Italy North, Poland Central, Spain Central, Mexico Central, Israel Central, Qatar Central

## Availability zones — https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview (ms.date 2026-02-11)
- AZ = separated groups of datacenters within a region, independent power, cooling, networking
- Zone = logical grouping of one or more physically separate datacenters
- Typically several km apart, usually within 100 km
- Zone-redundant resources: replicated/distributed across zones by the service; Microsoft manages failover
- Zonal resources: pinned to one zone you select; you're responsible for multi-zone design/failover
- Nonzonal/regional deployment: Azure may place across any zone; could be affected by a zone outage
- Physical zones mapped to logical zones per subscription; mapping differs between subscriptions
- Inter-zone round-trip latency target < ~2 ms; no charge for data transfer between zones in same region
- Updates deployed to one zone at a time
- AZs don't protect against a full-region outage
- Production workloads should use multiple zones where supported

## Azure Resource Manager — https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/overview (ms.date 2026-08-04)
- ARM = deployment & management service; receives requests from all APIs/tools/SDKs; authenticates & authorizes before forwarding to the service
- Terms: resource, resource group, resource provider (e.g., Microsoft.Compute, Microsoft.Storage), declarative syntax, ARM template, Bicep, extension resource (role assignment is an extension resource)
- Four management scopes: management groups, subscriptions, resource groups, resources; lower levels inherit settings
- Templates can deploy to tenant, management group, subscription or resource group
- Resource group: same lifecycle; each resource in only one RG; resources can be in different regions than the RG (same location recommended); tags on RG not inherited by resources; deleting RG deletes all resources; up to 800 instances of a resource type per RG (some exempt)
- RG location = where metadata stored; control plane operations routed through RG location; auto reroute to backup region
- ARM is distributed across regions and zones; global endpoint management.azure.com; not taken down for maintenance
- Concurrent updates to same resource → one succeeds, other gets 409

## Control plane vs data plane — https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/control-plane-and-data-plane (ms.date 2026-02-27)
- Control plane requests → https://management.azure.com (Azure global); ARM applies RBAC, Policy, Locks, Activity Logs
- Data plane requests → instance endpoint (e.g., https://myaccount.blob.core.windows.net); may use other credentials (RDP, DB login)
- Data plane still available when control plane unavailable
- Governance features might not apply to data plane: a lock preventing DB deletion doesn't prevent deleting data via queries

## Resource providers — https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/resource-providers-and-types (ms.date 2026-02-27)
- Resource type format {resource-provider}/{resource-type} e.g. Microsoft.KeyVault/vaults
- Subscription must be registered for a provider; some registered by default; portal & template deployments usually auto-register
- Need permission for /register/action — included in Contributor and Owner
- Can't unregister while resource types from provider exist
- CLI: az provider list --query "[].{Provider:namespace, Status:registrationState}" --out table ; az provider register --namespace Microsoft.Batch ; az provider show --namespace Microsoft.Batch
- PowerShell: Get-AzResourceProvider -ListAvailable ; Register-AzResourceProvider -ProviderNamespace Microsoft.Batch

## Cloud Shell — https://learn.microsoft.com/en-us/azure/cloud-shell/overview (ms.date 2026-08-07)
- Browser-accessible authenticated terminal; Bash or PowerShell
- Temporary per-session per-user host; times out after 20 minutes without interactive activity
- Persists $HOME files using a 5-GB file share; requires a storage account for the mounted Azure Files share; regular storage costs apply; host machine free
- Access points: portal.azure.com, shell.azure.com, docs, Azure mobile app, VS Code
- Preinstalled tools incl. Azure CLI & Azure PowerShell; user has regular Linux user permissions

## Subscriptions & tenants — https://learn.microsoft.com/en-us/entra/fundamentals/how-subscriptions-associated-directory (ms.date 2026-06-19)
- All subscriptions trust one Microsoft Entra tenant; a subscription trusts only a single directory; a tenant can be trusted by multiple subscriptions
- Subscription = scope where Azure resources and Azure role assignments are managed; tenant = directory containing identities
- Azure roles control access to Azure resources; Microsoft Entra roles control access to directory resources (users, groups, domains)
- Changing subscription directory: RBAC role assignments lost (not transferred); key vaults need tenant ID change; system-assigned MIs re-enabled, user-assigned MIs recreated
- Requires Owner on subscription and account in both directories
- Changing directory doesn't change billing ownership
