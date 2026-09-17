# Verified facts — Storage (verified 2026-09-14)

## Storage account overview (updated 2026-07-17)
- Recommended types: Standard general-purpose v2 (Blob incl. Data Lake Storage, Queue, Table, Azure Files; LRS/GRS/RA-GRS/ZRS/GZRS/RA-GZRS) — recommended for most scenarios
- Premium block blobs (block & append blobs; LRS/ZRS) — high transaction rates, small objects, low latency (SSD)
- Premium file shares (Azure Files only; LRS/ZRS; supports SMB AND NFS shares) — Microsoft also calls these "SSD file shares" (FileStorage kind)
- Premium page blobs (page blobs only) — conflicting redundancy statements (overview LRS/ZRS; redundancy page LRS only) → don't assert ZRS
- Can't change account type after creation (create new + copy data)
- Name: 3–24 chars, numbers + lowercase letters only, globally unique in Azure
- Standard endpoints: https://<acct>.blob.core.windows.net ; web.core.windows.net (static website) ; dfs.core.windows.net (Data Lake) ; file.core.windows.net ; queue.core.windows.net ; table.core.windows.net
- 250 storage accounts per region per subscription by default (standard endpoints), 500 by request
- Billing factors: region, account type, access tier, capacity, redundancy, transactions, data egress
- Legacy/retired: Standard general-purpose v1, legacy Blob Storage (retired or scheduled — upgrade to GPv2; upgrade is one-way, no downtime); classic (ASM) storage accounts retired Aug 31, 2024
- Per account: max 400 IP rules, 400 VNet rules, 200 resource instance rules, 200 private endpoints
- Default max capacity 5 PiB
- Move account to another region: create new account in target region and copy (AzCopy)
- URL: https://learn.microsoft.com/en-us/azure/storage/common/storage-account-overview

## Redundancy (updated 2026-08-15)
- Redundancy setting is per storage account (applies to all services in it)
- LRS: 3 copies... (doc: replicates within single datacenter) ≥11 nines durability; protects drive/server/rack failures, not datacenter disaster
- ZRS: synchronous across 3+ availability zones in primary region; ≥12 nines; read+write continue if a zone fails; recommended for Azure Files & high availability
- GRS: LRS in primary + asynchronous copy to paired secondary region (LRS there); ≥16 nines; secondary NOT readable unless failover
- GZRS: ZRS in primary + async to secondary (LRS); ≥16 nines; region must support AZs and have a pair
- RA-GRS / RA-GZRS: read access to secondary always; secondary endpoint = <account>-secondary.blob.core.windows.net ; same keys
- Secondary region determined by primary region (paired), can't be changed
- Failover (customer-managed) needed for write availability in secondary; async replication ⇒ possible data loss (RPO); Geo priority replication gives RPO ≤ 15 min for block blobs
- Redundancy does NOT protect against deletes/overwrites (all replicas updated)
- Archive tier NOT supported on ZRS, GZRS, RA-GZRS (only LRS, GRS, RA-GRS)
- Azure Files does NOT support RA-GRS or RA-GZRS; SSD (premium) file shares LRS/ZRS only; Azure Files supports LRS, ZRS, GRS, GZRS (standard)
- Managed disks: LRS and ZRS
- Account types: GRS/RA-GRS & GZRS/RA-GZRS only Standard GPv2 (among recommended types); premium block blobs & file shares LRS/ZRS
- Availability read (hot): 99.9% (LRS/ZRS/GRS/GZRS), 99.99% RA-GRS/RA-GZRS; cool/cold lower (99% / 99.9% RA)
- Unmanaged disks don't support ZRS/GZRS
- URL: https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy

## Access tiers (updated 2026-06-15)
- Hot (online; highest storage cost, lowest access cost); Cool (online; min 30 days); Cold (online; min 90 days); Archive (offline; min 180 days; hours latency)
- NEW: "Smart tier" automatically moves data between hot, cool and cold based on usage (mention as newer capability; not in outline)
- Tiers only for BLOCK blobs (not append/page)
- Early deletion penalty prorated (e.g., cool deleted after 21 days → 9 days charge); applies to delete, overwrite, or tier move before minimum; soft-deleted blobs not penalized until permanently deleted
- Default account access tier: hot, cool, or cold (NOT archive); new GPv2 default = hot; portal shows "Hot (inferred)"
- Archive: can't read/modify; rehydrate to hot/cool/cold by Set Blob Tier or Copy Blob (copy recommended); up to 15 hours; rehydration priority Standard or High; metadata readable; snapshots not supported for archived blobs
- Lifecycle management can't rehydrate from archive
- Premium block blob accounts can't use hot/cool/cold/archive tiers
- Changing redundancy of account with archived blobs requires rehydrating first; LRS→GRS allowed if no blobs archived while LRS
- Blob using encryption scope can't be archived via Set Blob Tier
- Warmer→cooler and cool/cold→hot tier changes are instantaneous
- Billing: cooler tier = cheaper storage, higher read/access + transaction costs; moving to cooler billed as write; to warmer billed as read + retrieval
- URL: https://learn.microsoft.com/en-us/azure/storage/blobs/access-tiers-overview

## Blob soft delete (updated 2026-08-25)
- Retention 1–365 days; protects blob, snapshot, version (and HNS directory) from delete AND overwrite (overwrite creates soft-deleted snapshot when versioning off)
- Does NOT protect metadata/property writes, container deletion (needs container soft delete), or storage account deletion (use resource lock)
- Restore with Undelete Blob (restores blob + soft-deleted snapshots)
- With versioning also on: overwrite creates previous version; delete makes current version a previous version; Undelete restores soft-deleted versions but not the current version → copy a previous version over to promote it
- Changing retention applies only to data deleted after the change; disabling keeps existing soft-deleted data until expiry
- Soft-deleted data billed at same rate as active data; min recommended retention 7 days
- Versioning NOT supported for hierarchical namespace accounts
- Microsoft recommends blob soft delete + container soft delete + versioning together
- URL: https://learn.microsoft.com/en-us/azure/storage/blobs/soft-delete-blob-overview

## Container soft delete (updated 2026-06-13)
- Retention 1–365 days; default 7 days
- Restore Container restores container + blobs + versions + snapshots as at deletion
- Must restore to ORIGINAL name; if a new container reuses that name, can't restore
- Doesn't restore individual blobs deleted from a non-deleted container (use blob soft delete/versioning)
- Doesn't protect against storage account deletion (use lock)
- Supported: GPv2, GPv1, block blob, Blob storage accounts, HNS accounts; no extra charge to enable; data billed as active
- URL: https://learn.microsoft.com/en-us/azure/storage/blobs/soft-delete-container-overview

## Lifecycle management (updated 2026-08-25)
- Policy = JSON collection of rules; rule = filters (prefixMatch, blobIndexMatch, blobTypes; AND logic; no exclude) + conditions (creation time, last modified time, last access time if access tracking enabled) + actions (on baseBlob, snapshot, version)
- Supported for block & append blobs in GPv2, premium block blob, Blob Storage accounts; tiering NOT supported in premium block blob accounts; tiering only for block blobs
- Changes take up to 24 hours to take effect / first run
- Free (you pay Set Blob Tier ops; deletes free); last access time updates billed as other ops max once per 24h per object
- Can't rehydrate from archive; policy read/written in full; up to 10 prefixes + 10 blob index tag conditions per rule; can't archive encryption-scope blobs; delete doesn't work on immutable containers; with soft delete enabled, lifecycle deletes become soft deletes; $logs and $web not affected
- JSON (well-known format): {"rules":[{"enabled":true,"name":"x","type":"Lifecycle","definition":{"actions":{"baseBlob":{"tierToCool":{"daysAfterModificationGreaterThan":30},"tierToArchive":{"daysAfterModificationGreaterThan":90},"delete":{"daysAfterModificationGreaterThan":2555}},"snapshot":{"delete":{"daysAfterCreationGreaterThan":90}}},"filters":{"blobTypes":["blockBlob"],"prefixMatch":["container1/logs"]}}}]}
- URL: https://learn.microsoft.com/en-us/azure/storage/blobs/lifecycle-management-overview

## Object replication (updated 2026-09-11)
- Asynchronously copies BLOCK blobs between source & destination accounts (same/different region, subscription, even tenant)
- Requires: change feed on SOURCE; blob versioning on BOTH source and destination
- Supported: GPv2 and premium block blob accounts (both must be one of these); NOT hierarchical namespace; not append/page blobs
- Snapshots not replicated; archived blobs (source or dest) fail replication
- Priority replication option: 99% of objects within 15 min (same continent) backed by SLA
- Policy created on destination (policyId "default") → apply to source with same policy ID; one policy per source/destination pair; source → max 2 destination accounts; account can be destination for max 2 policies
- Up to 1,000 rules per policy; each rule = 1 source container + 1 destination container; filters by prefix; by default only new blobs after rule creation (option: copy existing / custom min creation time)
- Destination container is read-only while policy active (writes → 409 Conflict); reads & deletes allowed
- AllowCrossTenantReplication = false by default for accounts created since Dec 15, 2023
- Supports Microsoft-managed & customer-managed keys; not customer-provided keys; customer-managed failover not supported for OR accounts
- Can't disable versioning while OR policies exist
- URL: https://learn.microsoft.com/en-us/azure/storage/blobs/object-replication-overview

## Blob versioning (updated 2026-08-25)
- Each write (Put Blob, Put Block List, Copy Blob, Set Blob Metadata) creates a new version; version ID = timestamp; one current version; previous versions immutable
- Delete blob → current version becomes previous version (no current)
- Restore: copy a previous version over the base blob (promote)
- Supported: standard GPv2, premium block blob, legacy Blob Storage; NOT hierarchical namespace
- Doesn't protect against account or container deletion (use lock / container soft delete)
- Recommend < 1,000 versions per blob; use lifecycle management to delete old versions (cost)
- Disabling keeps existing versions; must remove object replication policies before disabling
- Deleting a previous version requires deleteBlobVersion/action (Storage Blob Data Owner)
- Billing: same rate as active data; unique blocks unless tier explicitly set
- URL: https://learn.microsoft.com/en-us/azure/storage/blobs/versioning-overview

## Azure Files planning (updated 2026-08-26)
- Management models: Classic file shares (Microsoft.Storage; in a storage account; SMB & NFS; SSD & HDD; all redundancy) vs File shares (Microsoft.FileShares RP; top-level resource w/o storage account; currently NFS only)
- SMB: versions 3.1.1, 3.0, 2.1; Windows/Linux/macOS; SSD & HDD; LRS/ZRS/GRS/GZRS; identity-based (Kerberos) or shared key (NTLMv2); Win32 ACLs; internet accessible (SMB 3.0+); port 445 (often blocked outbound by ISPs/orgs)
- NFS: 4.1; Linux only; SSD only; LRS/ZRS; host-based auth (no identity auth); POSIX; not internet accessible → needs service endpoint or private endpoint
- A share can't be both SMB and NFS (but same account can have both)
- Identity options (SMB): on-prem AD DS (storage account domain-joined; Kerberos; needs sync to Entra; hybrid identities); Microsoft Entra Domain Services (Microsoft-managed DCs; cloud-only or hybrid users; clients domain joined); Microsoft Entra Kerberos (hybrid OR cloud-only identities; Entra joined/hybrid joined clients; no DC line of sight needed; FSLogix; macOS); storage account key (not recommended; full admin-like access; NTLMv2)
- On-prem SMB access → VPN/ExpressRoute + private endpoint recommended
- Encryption in transit on by default (SMB 3.x w/ encryption or HTTPS); disabling allows SMB 2.1 (same region only)/HTTP
- Encryption at rest: SSE, Microsoft-managed keys default; CMK supported for classic shares (not Microsoft.FileShares)
- Soft delete enabled by default for new storage accounts (share-level)
- Share snapshots: read-only, incremental, up to 200 per share, retain up to 10 years; Azure Backup for SMB shares (GFS daily/weekly/monthly/yearly); Azure Backup takes delete lock on the account & enables soft delete
- Media tiers: SSD (premium) → provisioned v2 or provisioned v1 billing; HDD (standard) → provisioned v2 (recommended) or pay-as-you-go (PAYG access tiers: transaction optimized, hot, cool)
- Can't move a share between media tiers directly (create new share + copy)
- HDD shares support LRS/ZRS/GRS/GZRS; SSD shares LRS/ZRS only; RA-GRS/RA-GZRS accounts can host shares but no secondary read (billed as GRS/GZRS)
- Portal: storage account > Data storage > "Classic file shares"
- URL: https://learn.microsoft.com/en-us/azure/storage/files/storage-files-planning

## Azure Files identity-based auth overview (updated 2026-09-02)
- Only ONE identity source per storage account (applies to all shares); can change later
- AD DS: only hybrid identities (exist in both AD DS and Entra ID); share-level permission against Entra identity, directory/file permissions enforced by AD DS
- Entra Kerberos: hybrid (needs AD DS synced) or cloud-only; clients Entra joined or hybrid joined
- Entra Domain Services: storage account identity auto-created; all Entra users; clients joined to managed domain
- Not supported for NFS shares; no extra charge
- Two permission layers: share-level (Azure RBAC) + directory/file-level (Windows ACLs)
- URL: https://learn.microsoft.com/en-us/azure/storage/files/storage-files-active-directory-overview

## Share snapshots (updated 2026-07-16)
- Share-level, read-only, point-in-time, incremental; restore individual files (portal Restore, Windows "Previous Versions", copy) or whole share file-by-file
- Up to 200 snapshots per share; retain up to 10 years; snapshots don't count toward share size limit
- Can't delete a share and keep its snapshots (deleting share deletes snapshots)
- Snapshots have same redundancy as the share
- Must remove storage account locks before deleting a snapshot
- CLI: az storage share snapshot --name <share> --account-name <acct> ; PowerShell New-AzRmStorageShare ... -Snapshot
- Azure Backup doesn't support NFS file shares (snapshots do work for NFS)
- URL: https://learn.microsoft.com/en-us/azure/storage/files/storage-snapshots-files

## Azure Files soft delete (updated 2026-07-20)
- Share-level only (not individual files — use snapshots/backup for files); set at storage account level for all shares
- Enabled by default for new storage accounts; default retention 7 days; range 1–365 days
- Undelete restores share + contents + snapshots
- Portal: Classic file shares → toggle "Show deleted shares" → Undelete
- To purge early: undelete, disable soft delete, delete again
- CLI: az storage account file-service-properties update --enable-delete-retention true --delete-retention-days 7 ; PowerShell Update-AzStorageFileServiceProperty -EnableShareDeleteRetentionPolicy $true -ShareRetentionDays 7
- URL: https://learn.microsoft.com/en-us/azure/storage/files/storage-files-prevent-file-share-deletion

## Share-level permissions for Azure Files (updated 2026-08-24)
- Built-in roles: Storage File Data SMB Share Reader (read ~ Windows "read" share ACL); Storage File Data SMB Share Contributor (read/write/delete); Storage File Data SMB Share Elevated Contributor (read/write/delete + modify ACLs ~ "change"); Storage File Data Privileged Contributor (override ACLs, RW/delete/modify ACLs); Storage File Data Privileged Reader (read overriding ACLs); Storage File Data SMB Admin (admin access equivalent to storage account key over SMB); Storage File Data SMB Take Ownership
- Storage Explorer also needs Reader and Data Access role to browse shares
- Assign at file share scope (…/fileServices/default/fileshares/<share>) or broader
- Default share-level permission (storage account-wide, "Enable permissions for all authenticated users and groups") — initial value None; needs identity source enabled; useful when AD DS can't sync to Entra, multi-tenant, or ACL-only enforcement; computer accounts can use it
- If both default and specific assignments exist → higher permission wins
- Propagation usually within 30 minutes
- Hybrid identities: sync users AND groups from AD DS to Entra; cloud-only identity assignments only with Entra Kerberos
- Directory/file-level permissions = Windows ACLs (NTFS)
- URL: https://learn.microsoft.com/en-us/azure/storage/files/storage-files-identity-assign-share-level-permissions

## SAS overview (updated 2026-02-27)
- Types: User delegation SAS (secured with Entra credentials; Blob/DFS, Queue, Table, Files; RECOMMENDED); Service SAS (account key; one service); Account SAS (account key; one or more services + service-level ops)
- Forms: ad hoc SAS (params in URI; any type) vs service SAS with stored access policy
- User delegation SAS and account SAS must be ad hoc — NO stored access policies
- Creating user delegation SAS requires Microsoft.Storage/storageAccounts/blobServices/generateUserDelegationKey action
- SAS generation not audited/tracked; disallow Shared Key to prevent key-signed SAS
- Invalid SAS → 403 Forbidden
- Best practices: HTTPS; user delegation SAS; revocation plan; SAS expiration policy (applies to service & account SAS — warning/log when exceeded); stored access policy for service SAS (max five per container); near-term expiry; set start time ≥15 min in past or omit (clock skew); least privilege; billed for usage via SAS
- Copy blob→file or file→blob requires SAS even in same account
- URL: https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview

## Stored access policies (REST doc)
- Supported on blob containers, file shares, queues, tables
- Max FIVE stored access policies per container/share/queue/table (6th → 400 Bad Request)
- Changes can take up to 30 seconds to take effect
- Revoke: delete policy, rename signed identifier, or set expiry in the past → immediately affects associated SAS
- Can't specify same parameter on both SAS token and policy
- Only for service SAS (not account SAS or user delegation SAS)
- URL: https://learn.microsoft.com/en-us/rest/api/storageservices/define-stored-access-policy

## Access keys (updated 2026-08-15)
- Two 512-bit keys (key1/primary, key2/secondary) → full data access + ability to create SAS
- Recommend Entra ID + managed identities; if keys needed, store in Key Vault and rotate
- Manual rotation: point apps to key2 → regenerate key1 → point apps to key1 → regenerate key2
- Regenerating a key revokes account & service SAS signed with it; user delegation SAS NOT affected
- Key expiration policy ("Set rotation reminder"; --key-exp-days / -KeyExpirationPeriodInDay); must rotate both keys once first; built-in policy "Storage account keys should not be expired"
- View keys: Microsoft.Storage/storageAccounts/listkeys/action (Owner, Contributor, Storage Account Key Operator Service Role); regenerate: .../regeneratekey/action
- Can disallow Shared Key authorization (required for Conditional Access protection of storage)
- CLI: az storage account keys list ; az storage account keys renew --key primary ; PowerShell Get-AzStorageAccountKey ; New-AzStorageAccountKey -KeyName key1
- Portal: Security + networking > Access keys
- URL: https://learn.microsoft.com/en-us/azure/storage/common/storage-account-keys-manage

## Storage firewall & network rules (updated 2026-07-06)
- Four rule types: virtual network rules (subnets; needs service endpoint on subnet; VNet in any subscription/tenant/region; max 400); IP network rules (PUBLIC IP ranges; max 400); resource instance rules (specific Azure resource instances, same tenant; permissions via their RBAC); trusted service exceptions (trusted Azure services)
- Once rules configured, only allowed sources reach the public endpoint; others denied (403); clients still need authorization
- Service endpoints: Microsoft.Storage (same region as VNet) or Microsoft.Storage.Global (cross-region) — only one per subnet; portal auto-creates service endpoint when you add a subnet rule
- With service endpoint, traffic uses private source IP → IP rules for that subnet's public IP no longer apply
- VNet rules also grant access to RA-GRS secondary; pre-create paired-region VNets for DR
- On-prem via ExpressRoute: allow NAT IPs used for Microsoft peering
- SAS with IP restriction doesn't bypass network rules
- Portal labels (conceptual): allow all networks / selected virtual networks and IP addresses / disabled (private endpoints only). Newer portal splits "Public network access" (Enable/Disable/Secured by perimeter) and scope — describe conceptually, avoid exact label claims
- URL: https://learn.microsoft.com/en-us/azure/storage/common/storage-network-security

## Storage encryption at rest (updated 2026-08-15)
- SSE always on for all accounts, AES-256 (GCM), FIPS 140-2; can't be disabled; no cost; covers blobs (all tiers incl. archive), files, queues, tables, disks, metadata; primary + secondary
- Key management: Microsoft-managed keys (default) ; customer-managed keys (Blob Storage + Azure Files; queues/tables only if account created to support CMK) stored in Azure Key Vault or Key Vault Managed HSM ; customer-provided keys (per request, Blob Storage)
- Encryption scopes: key scoped to container or individual blob (Microsoft-managed or CMK) — isolate tenants' data in same account
- Infrastructure encryption: second AES-256 layer at infrastructure level with separate Microsoft-managed key ("double encryption") — enabled when creating the account (can't enable later)
- CMK Key Vault requires soft delete + purge protection (well-established requirement)
- URL: https://learn.microsoft.com/en-us/azure/storage/common/storage-service-encryption

## AzCopy v10 (updated 2026-09-09)
- Copy to/from/between storage accounts; Blob & Azure Files (and between them); from Amazon S3; Google Cloud Storage (preview)
- Authorization: Microsoft Entra ID (azcopy login — user identity, managed identity, service principal) OR SAS token appended to URL
- Account owner doesn't automatically get data access → need data role (e.g., Storage Blob Data Contributor) for Entra auth
- Commands: copy, sync, make (container/file share), list, remove, login, logout, login status, jobs (list/show/resume/remove/clean), set-properties (tier/metadata/tags), bench, env, doc — no rename
- Example: azcopy copy "C:\local\path" "https://account.blob.core.windows.net/mycontainer1/?<SAS>" --recursive=true
- For >1 TB migrations Microsoft points to Azure Storage Mover
- URL: https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azcopy-v10
- Storage Explorer: desktop app (Windows/macOS/Linux); connect via Entra sign-in, account name+key, SAS, connection string; uses AzCopy for transfers (well-known); needs Reader and Data Access for Files
