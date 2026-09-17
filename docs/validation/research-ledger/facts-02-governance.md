# Verified facts — Governance (verified 2026-09-14)

## Management groups (overview, updated 2025-07-21)
- 10,000 MGs per directory; tree up to 6 levels deep (NOT counting root level or subscription level)
- Each MG and subscription has only ONE parent; MGs can have many children; one hierarchy per directory
- All subscriptions in an MG must trust the same Entra tenant
- Root MG: display name "Tenant root group", ID = tenant ID; can't be moved or deleted; new subscriptions default to root MG
- No one has default access to root MG; Global Admins can elevate (User Access Administrator) then assign roles
- Renaming root requires Owner or Contributor on root
- Roles on MGs: Owner (create/rename/move/delete/assign access/assign policy/read); Contributor (create/rename/move/delete/read — no assign access, no assign policy); Management Group Contributor (create/rename/move/delete/read at MG scope); Reader & Management Group Reader (read); Resource Policy Contributor (assign policy); User Access Administrator (assign access + assign policy)
- Move subscription/MG: need MG write + role assignment write on the child (e.g., Owner), MG write on target parent and current parent (Owner, Contributor, MG Contributor). Root MG exempt from permission requirement.
- If Owner on sub is inherited from current MG, can only move to MG where you are Owner
- ARM caches hierarchy for up to 30 minutes
- MGs not supported in Cost Management for MCA subscriptions
- Custom role defined with MG assignable scope: moving a subscription out of that branch breaks the path → error
- Locks can't be added to management groups; tags can't be applied to management groups
- URL: https://learn.microsoft.com/en-us/azure/governance/management-groups/overview

## Azure Policy effects (effect-basics, updated 2025-12-01)
- Effects: addToNetworkGroup, append, audit, auditIfNotExists, deny, denyAction, deployIfNotExists, disabled, manual, modify, mutate
- Order: disabled → append & modify → deny → audit → manual → auditIfNotExists → denyAction (last). After RP success: auditIfNotExists & deployIfNotExists evaluate
- append/modify only in Resource Manager mode
- Often interchangeable: audit/deny/modify-or-append; auditIfNotExists/deployIfNotExists; disabled interchangeable with any; manual not
- Layering: each assignment evaluated independently → "cumulative most restrictive"
- URL: https://learn.microsoft.com/en-us/azure/governance/policy/concepts/effect-basics

## Azure Policy overview (updated 2026-07-08)
- Definition (JSON rule + effect) → Initiative (policySet; group of definitions) → Assignment (to MG, subscription, RG, or resource); child resources inherit; exclusions (notScopes)
- Evaluation triggers: resource created/updated in scope; new assignment to scope; assigned definition/initiative updated; standard compliance evaluation cycle once every 24 hours
- Policy vs RBAC: Policy = resource state regardless of who; RBAC = user actions at scopes. Even with RBAC permission, deny policy blocks non-compliant create/update. DenyAction blocks certain actions.
- Roles: Resource Policy Contributor (most policy ops); Owner full; Contributor & Reader read policy; Contributor can trigger remediation but can't create/update definitions or assignments; User Access Administrator needed to grant managed identity perms for deployIfNotExists/modify
- DINE/modify assignments use a managed identity needing permissions to targeted resources
- Although assignable at MG, only resources at subscription or RG level are evaluated
- Policy is explicit-deny: a more permissive child assignment can't override a parent deny → exclude child scope from parent assignment
- Recommendations: start with audit/auditIfNotExists; define at MG/sub, assign at child; use initiatives even for one policy
- Assignments always use the latest definition version
- Limits: 500 policy definitions per scope (MG/sub); 200 initiative definitions per scope; 2,500 initiatives per tenant; 200 assignments per scope; 1,000 exemptions per scope; 20 params per policy def; 1,000 policies per initiative; 400 exclusions (notScopes) per assignment; remediation task 50,000 resources
- Built-ins: Allowed locations (Deny); Allowed resource types (Deny); Not allowed resource types (Deny); Allowed storage account SKUs (Deny); Allowed virtual machine SKUs (Deny); Add a tag to resources (Modify)
- URL: https://learn.microsoft.com/en-us/azure/governance/policy/overview

## Tags (updated 2025-12-08)
- Apply to resources, resource groups, subscriptions — NOT management groups
- Plain text; don't store sensitive values
- Tag names case-insensitive for operations; tag VALUES case-sensitive
- Access: write on Microsoft.Resources/tags (Tag Contributor — can tag resources without access to them; via portal can tag subscriptions but not resources/RGs; all ops via PowerShell/REST) OR write access to the resource (e.g., Contributor, VM Contributor)
- Resources do NOT inherit tags from RG or subscription → use Azure Policy (tag policies, e.g., inherit a tag from the resource group)
- Max 50 tag name-value pairs per resource/RG/subscription (use JSON string value for more)
- Tag name 512 chars, value 256 chars; storage accounts: name 128, value 256
- Tag names can't contain: < > % & \ ? /
- Not all resource types support tags; classic resources don't; some only 15 tags (Automation, CDN, public/private DNS zones & A records, Log Analytics saved search)
- Tags appear in billing usage file "Tags" column; cm-resource-parent tag groups costs
- URL: https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/tag-resources

## Resource locks (updated 2026-04-10)
- Portal: "Delete" and "Read-only"; CLI/API: CanNotDelete and ReadOnly
- CanNotDelete: read + modify, can't delete. ReadOnly: read only, no update/delete (like restricting to Reader)
- Locks apply across ALL users and roles; override permissions
- Scopes: subscription, resource group, resource (NOT management groups)
- Inheritance: child resources (incl. added later) inherit; most restrictive lock in chain wins
- Delete lock on a resource → deleting its RG fails entirely (no partial deletion)
- Locks don't block subscription cancellation
- Locks apply to CONTROL PLANE only (management.azure.com), not data plane
- Gotchas: ReadOnly on storage account blocks List Keys (POST) and RBAC assignments scoped to it and control-plane container creation; locks don't protect blob/file/queue/table data; ReadOnly on RG with App Service plan blocks scale up/out; ReadOnly on RG with VM blocks start/restart (POST); ReadOnly on RG blocks moving resources in/out (but a ReadOnly-locked resource itself can be moved to another RG); CanNotDelete on resource/RG blocks deleting RBAC assignments; CanNotDelete on RG blocks deployment history cleanup (fail at 800 deployments); CanNotDelete on Azure Backup-created RG → backups fail (max 18 restore points); ReadOnly on subscription breaks Azure Advisor; ReadOnly on Application Gateway blocks backend health (POST); ReadOnly on NSG blocks creating NSG flow log
- Who: Microsoft.Authorization/* or Microsoft.Authorization/locks/* → Owner, User Access Administrator
- Portal blade names: subscription "Resource locks"; RG/resource "Locks"
- PowerShell: New-AzResourceLock -LockLevel CanNotDelete -LockName X -ResourceGroupName Y ; CLI: az lock create --name X --lock-type CanNotDelete --resource-group Y
- Bicep: resource lock 'Microsoft.Authorization/locks@2016-09-01' = { name, scope?, properties: { level: 'CanNotDelete', notes } }
- URL: https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/lock-resources

## Move resources to RG/subscription (updated 2026-03-16)
- Cross-subscription moves: both subscriptions in same Entra tenant; destination sub must have the resource provider registered; check quotas
- Source AND target RGs are locked during the move (no create/delete/update in them) — lock up to 4 hours; existing resources keep running (no downtime)
- Moving only changes RG/subscription (resource ID changes) — NOT the region. Region moves → Azure Resource Mover (portal Move → "Move to another region")
- Can't move if a read-only lock exists on source RG, destination RG, or subscription
- Permissions: source RG Microsoft.Resources/subscriptions/resourceGroups/moveResources/action ; destination RG Microsoft.Resources/subscriptions/resourceGroups/write
- Role assignments on moved resources do NOT move (orphaned) → recreate
- Cross-subscription: resource + dependent resources must be in same RG and move together (VM + disks + NIC + public IP + NSG + VNet...)
- Only top-level resources specified; child resources move with parent
- Validate: az resource invoke-action --action validateMoveResources ; Invoke-AzResourceAction -Action validateMoveResources
- Move: az resource move --destination-group <rg> --ids <ids> [--destination-subscription-id] ; Move-AzResource -DestinationResourceGroupName <rg> -ResourceId <ids> [-DestinationSubscriptionId]
- Max 800 resources per move operation
- You can't move a resource group itself to another subscription; tags/role assignments/policies of the RG don't transfer
- Errors: MissingMoveDependentResources; RequestDisallowedByPolicy; MoveCannotProceedWithResourcesNotInSucceededState
- URL: https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/move-resource-group-and-subscription

## Budgets (updated 2025-09-26)
- Budgets DON'T stop resources or consumption — notifications only (automation possible via action groups)
- Cost data available within 8–24h; budgets evaluated every 24h; emails normally within an hour of evaluation
- Reset periods: Monthly, Quarterly, Annually (+ Billing month/quarter/year for PAYG, MSDN, Visual Studio)
- Scopes: management group, subscription, resource group (RBAC); EA billing account/department/enrollment account; MCA billing account/billing profile/invoice section/customer
- Alert types: Actual and Forecasted; up to 5 thresholds and 5 emails per budget; threshold range 0.01%–1000%
- Action groups supported only for subscription and resource group scope budgets
- Owner create/modify/delete; Contributor & Cost Management Contributor create/modify/delete own budgets, change amount of others'; Reader & Cost Management Reader view
- New subscriptions: up to 48h before Cost Management features usable
- Budgets can use filters (e.g., resource group, service)
- CLI az consumption budget create-with-rg ; PowerShell New-AzConsumptionBudget
- URL: https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-acm-create-budgets

## Azure Advisor (updated 2026-05-18)
- Five categories: Reliability, Security, Performance, Cost, Operational excellence
- Access recommendations as Owner, Contributor, or Reader of sub/RG/resource
- Recommendation states: Postponed, Dismissed, Completed (can reactivate)
- Up to a day for Advisor to recognize an implemented recommendation
- Includes Microsoft Defender for Cloud recommendations
- URL: https://learn.microsoft.com/en-us/azure/advisor/advisor-overview

## Policy exemptions (updated 2026-08-04)
- Categories: Mitigated (policy intent met another way) ; Waiver (non-compliance temporarily accepted)
- Optional expiresOn — exemption object kept but no longer honored after expiry
- Exempt resources show compliance state "Exempt"; exclusions (notScopes) on assignment remove scope from evaluation entirely vs exemption tracked
- Created at resource hierarchy (MG/sub/RG) or individual resource; deleted if parent removed
- Needs Microsoft.Authorization/policyExemptions/write on scope + exempt/Action on the assignment; Resource Policy Contributor & Security Admin have read/write
- URL: https://learn.microsoft.com/en-us/azure/governance/policy/concepts/exemption-structure
