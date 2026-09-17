# Verified facts — Identity (verified 2026-09-14 against Microsoft Learn)

## Exam outline (study guide, skills measured as of April 17, 2026; page updated 2026-03-19)
- Domains: Identities & governance 20–25; Storage 15–20; Compute 20–25; Networking 15–20; Monitor & maintain 10–15
- Passing score 700. Changes vs prior: storage "Configure Azure Files and Azure Blob Storage" minor (soft delete for blobs & containers bullet now present); VMs minor (now "Configure encryption at host for Azure virtual machines"); containers minor; VNets minor ("Configure user-defined routes"); monitor minor.
- URL: https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104

## SSPR licensing (concept-sspr-licensing, updated 2026-02-13)
- Cloud-only user password CHANGE: Entra ID Free, M365 Business Standard, Business Premium, P1/P2
- Cloud-only user password RESET: M365 Business Standard, Business Premium, Entra ID P1/P2 (NOT Free)
- Hybrid change/reset with on-prem writeback: M365 Business Premium, Entra ID P1/P2
- URL: https://learn.microsoft.com/en-us/entra/identity/authentication/concept-sspr-licensing

## SSPR how it works (concept-sspr-howitworks, updated 2026-03-27)
- Methods available: Microsoft Authenticator push notifications, Hardware OATH tokens (preview), Software OATH tokens, SMS, Voice call, Email OTP
- Number of methods required: one or two
- "Require users to register when signing in"; reconfirm 0–730 days (0 = never)
- Admin roles → strong two-gate policy enforced (admins use methods defined in admin reset policy)
- Authenticator can't be the only method when one method required
- Notifications: "Notify users on password resets"; "Notify all admins when other admins reset their passwords" (Global Admins get email)
- Writeback via Microsoft Entra Connect / cloud sync; if writeback not deployed and password managed on-prem → user told to contact admin
- Personal Microsoft account guests can't use Entra SSPR
- URL: https://learn.microsoft.com/en-us/entra/identity/authentication/concept-sspr-howitworks

## Group-based licensing (M365 admin center doc, updated 2026-05-18)
- Supports security groups, mail-enabled groups, Microsoft 365 groups
- Nested groups NOT supported (only first-level members get licenses)
- Users without usage location inherit tenant location for group-based licensing (usage location needed before license assignment generally)
- Roles: at least Groups Administrator, License Administrator, or User Administrator
- Moving users between licensed groups: add to new group first, confirm, then remove
- Error types: insufficient licenses, conflicting service plans, missing dependencies, proxy address issues, usage location problems
- URL: https://learn.microsoft.com/en-us/microsoft-365/admin/manage/manage-group-licenses
- TODO verify Entra license prerequisite for group-based licensing (P1 etc.)

## Dynamic membership groups (updated 2026-08-13)
- Requires Entra ID P1 (or Intune for Education) for each unique user member (not assigned per user, but enough licenses)
- Max 15,000 dynamic membership groups per tenant
- Can't manually add/remove members
- A rule can't contain both users and devices; security groups can have users OR devices; Microsoft 365 groups users only
- Single expression: `user.department -eq "Sales"`; body max 3,072 chars; rule builder up to five expressions (user-based only; device rules via text box)
- All users: `user.objectId -ne null`; members only: `(user.objectId -ne null) -and (user.userType -eq "Member")`
- Role-assignable groups require assigned (not dynamic) membership
- No license required for devices in device-based dynamic groups
- URL: https://learn.microsoft.com/en-us/entra/identity/users/groups-dynamic-membership

## External collaboration settings (updated 2026-04-25)
- Portal: Entra admin center > Entra ID > External Identities > External collaboration settings
- Guest user access (3): "Guest users have the same access as members (most inclusive)"; "Guest users have limited access to properties and memberships of directory objects" (DEFAULT); "Guest user access is restricted to properties and memberships of their own directory objects (most restrictive)"
- Guest invite settings (4): "Anyone in the organization can invite guest users including guests and non-admins (most inclusive)"; "Member users and users assigned to specific admin roles can invite guest users including guests with member permissions"; "Only users assigned to specific admin roles can invite guest users" (User Administrator or Guest Inviter); "No one in the organization can invite guest users including admins (most restrictive)"
- By default, all users incl. B2B guests can invite external users
- Guest Inviter role can invite even under "Only users assigned to specific admin roles"
- Collaboration restrictions: allow list OR deny list of domains
- Enable guest self-service sign up via user flows; External user leave settings (needs privacy info)
- Cross-tenant access settings: inbound/outbound B2B collaboration with other Entra orgs
- B2B sign-in logs in both home & resource tenant
- URL: https://learn.microsoft.com/en-us/entra/external-id/external-collaboration-settings-configure

## Azure roles vs Entra roles (updated 2026-05-07)
- Five fundamental Azure roles: Owner (full + assign roles), Contributor (full, can't assign roles, can't manage Blueprints assignments or share image galleries), Reader, Role Based Access Control Administrator (manage access, assign roles, can't manage access other ways e.g. Azure Policy), User Access Administrator (manage access, assign roles)
- Entra roles manage directory: Global Administrator, User Administrator (users & groups, reset passwords for users/helpdesk admins/other user admins), Billing Administrator
- Azure role scopes: management group, subscription, resource group, resource. Entra role scopes: tenant, administrative unit, individual object (e.g., app)
- Global Admin has NO Azure resource access by default; elevate via "Access management for Azure resources" → User Access Administrator (all subscriptions/management groups; root scope "/")
- Classic administrator roles retired Aug 31, 2024; Dec 2025 auto-converted to Owner; fully retired May 2026
- Access control (IAM) page in portal at every scope
- URL: https://learn.microsoft.com/en-us/azure/role-based-access-control/rbac-and-directory-admin-roles

## Azure RBAC overview (updated 2025-10-15)
- Role assignment = security principal (user, group, service principal, managed identity) + role definition + scope
- Scope 4 levels: management group, subscription, resource group, resource; parent-child inheritance
- Role assignments transitive for groups (nested group membership counts)
- Additive model: Contributor at sub + Reader at RG => effectively Contributor
- Evaluation: token w/ group memberships -> ARM gets role + deny assignments -> if deny applies => blocked -> determine roles -> Actions - NotActions (and DataActions - NotDataActions) -> conditions evaluated (ABAC) -> allow
- RBAC data stored globally; free
- URL: https://learn.microsoft.com/en-us/azure/role-based-access-control/overview

## Custom roles (updated 2026-04-30)
- Up to 5,000 custom roles per tenant (2,000 in 21Vianet)
- Properties: Name, Id, IsCustom, Description, Actions, NotActions, DataActions, NotDataActions, AssignableScopes (max 2,000 entries)
- Can't use root "/" or wildcards in AssignableScopes; only ONE management group in AssignableScopes
- Custom roles with DataActions can't be assigned at management group scope (but can be assigned to subscriptions inside that MG)
- Create/update/delete needs Microsoft.Authorization/roleDefinitions/write on all AssignableScopes (e.g., Owner, User Access Administrator)
- Must remove role assignments before deleting custom role (RoleDefinitionHasAssignments error)
- Tools: portal, PowerShell (New-AzRoleDefinition), CLI (az role definition create), REST
- Only one wildcard per action string; recommend explicit actions over wildcards
- URL: https://learn.microsoft.com/en-us/azure/role-based-access-control/custom-roles

## Managed identities (updated 2026-06-15)
- System-assigned: created as part of resource, shared lifecycle (deleted with resource), can't be shared, SP name = resource name
- User-assigned: standalone Azure resource, independent lifecycle, can be shared by multiple resources; "recommended managed identity type for Microsoft services"
- Both: special service principal in Entra ID; use RBAC to grant access; no credentials to manage; no extra cost; CRUD in Activity log, sign-ins in Entra sign-in logs
- URL: https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview

## Group-based licensing — Entra page now redirects to M365 admin doc; do NOT state a specific P1 prerequisite (unverified)
