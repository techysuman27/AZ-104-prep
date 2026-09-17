import type { Source } from './schema';

/**
 * Official sources used to validate Stratus content.
 * `pageUpdated` is the update date shown in the Microsoft Learn page metadata
 * at verification time. `verified` is when Stratus last checked the content.
 * See docs/CONTENT_VALIDATION.md for the review workflow.
 */
const V = '2026-09-14';

const list: Source[] = [
  // Exam
  { id: 'exam-az104', title: 'Study guide for Exam AZ-104: Microsoft Azure Administrator', url: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104', publisher: 'Microsoft Learn', pageUpdated: '2026-03-19', verified: V },

  // Foundations
  { id: 'regions-paired', title: 'Azure region pairs and nonpaired regions', url: 'https://learn.microsoft.com/en-us/azure/reliability/regions-paired', publisher: 'Microsoft Learn', pageUpdated: '2025-03-19', verified: V },
  { id: 'availability-zones', title: 'What are Azure availability zones?', url: 'https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview', publisher: 'Microsoft Learn', pageUpdated: '2026-02-11', verified: V },
  { id: 'arm-overview', title: 'What is Azure Resource Manager?', url: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/overview', publisher: 'Microsoft Learn', pageUpdated: '2026-08-04', verified: V },
  { id: 'control-data-plane', title: 'Control plane and data plane operations', url: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/control-plane-and-data-plane', publisher: 'Microsoft Learn', pageUpdated: '2026-02-27', verified: V },
  { id: 'resource-providers', title: 'Azure resource providers and types', url: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/resource-providers-and-types', publisher: 'Microsoft Learn', pageUpdated: '2026-02-27', verified: V },
  { id: 'cloud-shell', title: 'What is Azure Cloud Shell?', url: 'https://learn.microsoft.com/en-us/azure/cloud-shell/overview', publisher: 'Microsoft Learn', pageUpdated: '2026-08-07', verified: V },
  { id: 'subscription-tenant', title: 'Add an existing Azure subscription to your Microsoft Entra tenant', url: 'https://learn.microsoft.com/en-us/entra/fundamentals/how-subscriptions-associated-directory', publisher: 'Microsoft Learn', pageUpdated: '2026-06-19', verified: V },

  // Identity
  { id: 'sspr-licensing', title: 'Licensing requirements for Microsoft Entra self-service password reset', url: 'https://learn.microsoft.com/en-us/entra/identity/authentication/concept-sspr-licensing', publisher: 'Microsoft Learn', pageUpdated: '2026-02-13', verified: V },
  { id: 'sspr-howitworks', title: 'Self-service password reset deep dive', url: 'https://learn.microsoft.com/en-us/entra/identity/authentication/concept-sspr-howitworks', publisher: 'Microsoft Learn', pageUpdated: '2026-03-27', verified: V },
  { id: 'group-licensing', title: 'Assign or unassign licenses to a group (group-based licensing)', url: 'https://learn.microsoft.com/en-us/microsoft-365/admin/manage/manage-group-licenses', publisher: 'Microsoft Learn', pageUpdated: '2026-05-18', verified: V },
  { id: 'users-bulk-add', title: 'Bulk create users in Microsoft Entra ID', url: 'https://learn.microsoft.com/en-us/entra/identity/users/users-bulk-add', publisher: 'Microsoft Learn', pageUpdated: '2026-04-02', verified: V },
  { id: 'dynamic-groups', title: 'Manage rules for dynamic membership groups in Microsoft Entra ID', url: 'https://learn.microsoft.com/en-us/entra/identity/users/groups-dynamic-membership', publisher: 'Microsoft Learn', pageUpdated: '2026-08-13', verified: V },
  { id: 'external-collab', title: 'Configure external collaboration settings', url: 'https://learn.microsoft.com/en-us/entra/external-id/external-collaboration-settings-configure', publisher: 'Microsoft Learn', pageUpdated: '2026-04-25', verified: V },
  { id: 'roles-compare', title: 'Azure roles, Microsoft Entra roles, and classic subscription administrator roles', url: 'https://learn.microsoft.com/en-us/azure/role-based-access-control/rbac-and-directory-admin-roles', publisher: 'Microsoft Learn', pageUpdated: '2026-05-07', verified: V },
  { id: 'rbac-overview', title: 'What is Azure role-based access control (Azure RBAC)?', url: 'https://learn.microsoft.com/en-us/azure/role-based-access-control/overview', publisher: 'Microsoft Learn', pageUpdated: '2025-10-15', verified: V },
  { id: 'rbac-custom-roles', title: 'Azure custom roles', url: 'https://learn.microsoft.com/en-us/azure/role-based-access-control/custom-roles', publisher: 'Microsoft Learn', pageUpdated: '2026-04-30', verified: V },
  { id: 'managed-identities', title: 'Managed identities for Azure resources', url: 'https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview', publisher: 'Microsoft Learn', pageUpdated: '2026-06-15', verified: V },

  // Governance
  { id: 'management-groups', title: 'Organize your resources with management groups', url: 'https://learn.microsoft.com/en-us/azure/governance/management-groups/overview', publisher: 'Microsoft Learn', pageUpdated: '2025-07-21', verified: V },
  { id: 'policy-overview', title: 'Overview of Azure Policy', url: 'https://learn.microsoft.com/en-us/azure/governance/policy/overview', publisher: 'Microsoft Learn', pageUpdated: '2026-07-08', verified: V },
  { id: 'policy-effects', title: 'Azure Policy definitions effect basics', url: 'https://learn.microsoft.com/en-us/azure/governance/policy/concepts/effect-basics', publisher: 'Microsoft Learn', pageUpdated: '2025-12-01', verified: V },
  { id: 'policy-exemptions', title: 'Details of the policy exemption structure', url: 'https://learn.microsoft.com/en-us/azure/governance/policy/concepts/exemption-structure', publisher: 'Microsoft Learn', pageUpdated: '2026-08-04', verified: V },
  { id: 'tags', title: 'Use tags to organize your Azure resources and management hierarchy', url: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/tag-resources', publisher: 'Microsoft Learn', pageUpdated: '2025-12-08', verified: V },
  { id: 'locks', title: 'Lock your Azure resources to protect your infrastructure', url: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/lock-resources', publisher: 'Microsoft Learn', pageUpdated: '2026-04-10', verified: V },
  { id: 'move-resources', title: 'Move Azure resources to a new resource group or subscription', url: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/move-resource-group-and-subscription', publisher: 'Microsoft Learn', pageUpdated: '2026-03-16', verified: V },
  { id: 'budgets', title: 'Tutorial: Create and manage budgets', url: 'https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-acm-create-budgets', publisher: 'Microsoft Learn', pageUpdated: '2025-09-26', verified: V },
  { id: 'advisor', title: 'Introduction to Azure Advisor', url: 'https://learn.microsoft.com/en-us/azure/advisor/advisor-overview', publisher: 'Microsoft Learn', pageUpdated: '2026-05-18', verified: V },

  // Storage
  { id: 'storage-account-overview', title: 'Storage account overview', url: 'https://learn.microsoft.com/en-us/azure/storage/common/storage-account-overview', publisher: 'Microsoft Learn', pageUpdated: '2026-07-17', verified: V },
  { id: 'storage-redundancy', title: 'Azure Storage redundancy', url: 'https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy', publisher: 'Microsoft Learn', pageUpdated: '2026-08-15', verified: V },
  { id: 'access-tiers', title: 'Access tiers for blob data', url: 'https://learn.microsoft.com/en-us/azure/storage/blobs/access-tiers-overview', publisher: 'Microsoft Learn', pageUpdated: '2026-06-15', verified: V },
  { id: 'blob-soft-delete', title: 'Soft delete for blobs', url: 'https://learn.microsoft.com/en-us/azure/storage/blobs/soft-delete-blob-overview', publisher: 'Microsoft Learn', pageUpdated: '2026-08-25', verified: V },
  { id: 'container-soft-delete', title: 'Soft delete for containers', url: 'https://learn.microsoft.com/en-us/azure/storage/blobs/soft-delete-container-overview', publisher: 'Microsoft Learn', pageUpdated: '2026-06-13', verified: V },
  { id: 'blob-versioning', title: 'Blob versioning', url: 'https://learn.microsoft.com/en-us/azure/storage/blobs/versioning-overview', publisher: 'Microsoft Learn', pageUpdated: '2026-08-25', verified: V },
  { id: 'lifecycle', title: 'Azure Blob Storage lifecycle management overview', url: 'https://learn.microsoft.com/en-us/azure/storage/blobs/lifecycle-management-overview', publisher: 'Microsoft Learn', pageUpdated: '2026-08-25', verified: V },
  { id: 'object-replication', title: 'Object replication for block blobs', url: 'https://learn.microsoft.com/en-us/azure/storage/blobs/object-replication-overview', publisher: 'Microsoft Learn', pageUpdated: '2026-09-11', verified: V },
  { id: 'files-planning', title: 'Plan an Azure Files deployment', url: 'https://learn.microsoft.com/en-us/azure/storage/files/storage-files-planning', publisher: 'Microsoft Learn', pageUpdated: '2026-08-26', verified: V },
  { id: 'files-identity', title: 'Overview of Azure Files identity-based authentication for SMB access', url: 'https://learn.microsoft.com/en-us/azure/storage/files/storage-files-active-directory-overview', publisher: 'Microsoft Learn', pageUpdated: '2026-09-02', verified: V },
  { id: 'files-share-permissions', title: 'Assign share-level permissions for Azure Files', url: 'https://learn.microsoft.com/en-us/azure/storage/files/storage-files-identity-assign-share-level-permissions', publisher: 'Microsoft Learn', pageUpdated: '2026-08-24', verified: V },
  { id: 'files-snapshots', title: 'Use share snapshots with Azure Files', url: 'https://learn.microsoft.com/en-us/azure/storage/files/storage-snapshots-files', publisher: 'Microsoft Learn', pageUpdated: '2026-07-16', verified: V },
  { id: 'files-soft-delete', title: 'Enable soft delete on Azure file shares', url: 'https://learn.microsoft.com/en-us/azure/storage/files/storage-files-prevent-file-share-deletion', publisher: 'Microsoft Learn', pageUpdated: '2026-07-20', verified: V },
  { id: 'sas-overview', title: 'Grant limited access to data with shared access signatures (SAS)', url: 'https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview', publisher: 'Microsoft Learn', pageUpdated: '2026-02-27', verified: V },
  { id: 'stored-access-policy', title: 'Define a stored access policy', url: 'https://learn.microsoft.com/en-us/rest/api/storageservices/define-stored-access-policy', publisher: 'Microsoft Learn', pageUpdated: '2023-07-11', verified: V },
  { id: 'access-keys', title: 'Manage storage account access keys', url: 'https://learn.microsoft.com/en-us/azure/storage/common/storage-account-keys-manage', publisher: 'Microsoft Learn', pageUpdated: '2026-08-15', verified: V },
  { id: 'storage-firewall', title: 'Azure Storage firewall rules and network access', url: 'https://learn.microsoft.com/en-us/azure/storage/common/storage-network-security', publisher: 'Microsoft Learn', pageUpdated: '2026-07-06', verified: V },
  { id: 'storage-encryption', title: 'Azure Storage encryption for data at rest', url: 'https://learn.microsoft.com/en-us/azure/storage/common/storage-service-encryption', publisher: 'Microsoft Learn', pageUpdated: '2026-08-15', verified: V },
  { id: 'azcopy', title: 'Get started with AzCopy', url: 'https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azcopy-v10', publisher: 'Microsoft Learn', pageUpdated: '2026-09-09', verified: V },

  // Networking
  { id: 'default-outbound', title: 'Default outbound access in Azure', url: 'https://learn.microsoft.com/en-us/azure/virtual-network/ip-services/default-outbound-access', publisher: 'Microsoft Learn', pageUpdated: '2026-09-10', verified: V },
  { id: 'public-ip', title: 'Public IP addresses in Azure', url: 'https://learn.microsoft.com/en-us/azure/virtual-network/ip-services/public-ip-addresses', publisher: 'Microsoft Learn', pageUpdated: '2026-02-25', verified: V },
  { id: 'vnet-faq', title: 'Azure Virtual Network FAQ', url: 'https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-faq', publisher: 'Microsoft Learn', pageUpdated: '2026-07-09', verified: V },
  { id: 'nsg-overview', title: 'Network security groups overview', url: 'https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview', publisher: 'Microsoft Learn', pageUpdated: '2025-10-23', verified: V },
  { id: 'asg', title: 'Application security groups', url: 'https://learn.microsoft.com/en-us/azure/virtual-network/application-security-groups', publisher: 'Microsoft Learn', pageUpdated: '2025-07-25', verified: V },
  { id: 'routing', title: 'Virtual network traffic routing', url: 'https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-udr-overview', publisher: 'Microsoft Learn', pageUpdated: '2026-06-11', verified: V },
  { id: 'peering', title: 'Virtual network peering', url: 'https://learn.microsoft.com/en-us/azure/virtual-network/virtual-network-peering-overview', publisher: 'Microsoft Learn', pageUpdated: '2026-08-13', verified: V },
  { id: 'bastion-config', title: 'About Azure Bastion configuration settings', url: 'https://learn.microsoft.com/en-us/azure/bastion/configuration-settings', publisher: 'Microsoft Learn', pageUpdated: '2026-08-12', verified: V },
  { id: 'private-endpoint-dns', title: 'Azure private endpoint private DNS zone values', url: 'https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-dns', publisher: 'Microsoft Learn', pageUpdated: '2026-08-11', verified: V },
  { id: 'dns-autoregistration', title: 'What is the autoregistration feature in Azure DNS private zones?', url: 'https://learn.microsoft.com/en-us/azure/dns/private-dns-autoregistration', publisher: 'Microsoft Learn', pageUpdated: '2025-09-23', verified: V },
  { id: 'lb-skus', title: 'Azure Load Balancer SKUs', url: 'https://learn.microsoft.com/en-us/azure/load-balancer/skus', publisher: 'Microsoft Learn', pageUpdated: '2026-05-04', verified: V },
  { id: 'lb-components', title: 'Azure Load Balancer components', url: 'https://learn.microsoft.com/en-us/azure/load-balancer/components', publisher: 'Microsoft Learn', pageUpdated: '2026-08-17', verified: V },
  { id: 'lb-probes', title: 'Azure Load Balancer health probes', url: 'https://learn.microsoft.com/en-us/azure/load-balancer/load-balancer-custom-probe-overview', publisher: 'Microsoft Learn', pageUpdated: '2026-09-10', verified: V },
  { id: 'network-watcher', title: 'What is Azure Network Watcher?', url: 'https://learn.microsoft.com/en-us/azure/network-watcher/network-watcher-overview', publisher: 'Microsoft Learn', pageUpdated: '2026-02-25', verified: V },
  { id: 'connection-monitor', title: 'Connection monitor overview', url: 'https://learn.microsoft.com/en-us/azure/network-watcher/connection-monitor-overview', publisher: 'Microsoft Learn', pageUpdated: '2026-08-27', verified: V },

  // Compute
  { id: 'disk-encryption', title: 'Overview of managed disk encryption options', url: 'https://learn.microsoft.com/en-us/azure/virtual-machines/disk-encryption-overview', publisher: 'Microsoft Learn', pageUpdated: '2026-07-16', verified: V },
  { id: 'disk-types', title: 'Select a disk type for Azure IaaS VMs', url: 'https://learn.microsoft.com/en-us/azure/virtual-machines/disks-types', publisher: 'Microsoft Learn', pageUpdated: '2026-09-11', verified: V },
  { id: 'vm-availability', title: 'Availability options for Azure Virtual Machines', url: 'https://learn.microsoft.com/en-us/azure/virtual-machines/availability', publisher: 'Microsoft Learn', pageUpdated: '2026-06-24', verified: V },
  { id: 'availability-sets', title: 'Availability sets overview', url: 'https://learn.microsoft.com/en-us/azure/virtual-machines/availability-set-overview', publisher: 'Microsoft Learn', pageUpdated: '2026-04-07', verified: V },
  { id: 'vmss-modes', title: 'Orchestration modes for Virtual Machine Scale Sets', url: 'https://learn.microsoft.com/en-us/azure/virtual-machine-scale-sets/virtual-machine-scale-sets-orchestration-modes', publisher: 'Microsoft Learn', pageUpdated: '2026-09-04', verified: V },
  { id: 'arm-deployment-modes', title: 'Azure Resource Manager deployment modes', url: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/deployment-modes', publisher: 'Microsoft Learn', pageUpdated: '2026-06-26', verified: V },
  { id: 'arm-export', title: 'Use Azure portal to export a template', url: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/templates/export-template-portal', publisher: 'Microsoft Learn', pageUpdated: '2026-06-26', verified: V },
  { id: 'bicep-decompile', title: 'Decompile a JSON ARM template to Bicep', url: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/decompile', publisher: 'Microsoft Learn', pageUpdated: '2026-07-14', verified: V },
  { id: 'appservice-plans', title: 'Azure App Service plans', url: 'https://learn.microsoft.com/en-us/azure/app-service/overview-hosting-plans', publisher: 'Microsoft Learn', pageUpdated: '2026-08-31', verified: V },
  { id: 'appservice-slots', title: 'Set up staging environments in Azure App Service', url: 'https://learn.microsoft.com/en-us/azure/app-service/deploy-staging-slots', publisher: 'Microsoft Learn', pageUpdated: '2025-11-28', verified: V },
  { id: 'appservice-backup', title: 'Back up and restore an app in Azure App Service', url: 'https://learn.microsoft.com/en-us/azure/app-service/manage-backup', publisher: 'Microsoft Learn', pageUpdated: '2026-06-02', verified: V },
  { id: 'appservice-networking', title: 'App Service networking features', url: 'https://learn.microsoft.com/en-us/azure/app-service/networking-features', publisher: 'Microsoft Learn', pageUpdated: '2026-08-31', verified: V },
  { id: 'appservice-certs', title: 'Add and manage TLS/SSL certificates in Azure App Service', url: 'https://learn.microsoft.com/en-us/azure/app-service/configure-ssl-certificate', publisher: 'Microsoft Learn', pageUpdated: '2026-06-18', verified: V },
  { id: 'appservice-custom-domain', title: 'Map an existing custom DNS name to Azure App Service', url: 'https://learn.microsoft.com/en-us/azure/app-service/app-service-web-tutorial-custom-domain', publisher: 'Microsoft Learn', pageUpdated: '2026-04-14', verified: V },
  { id: 'appservice-limits', title: 'Azure subscription and service limits, quotas, and constraints — App Service limits', url: 'https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/azure-subscription-service-limits', publisher: 'Microsoft Learn', pageUpdated: '2026-08-12', verified: V },
  { id: 'appservice-scale-up', title: 'Scale up an app in Azure App Service', url: 'https://learn.microsoft.com/en-us/azure/app-service/manage-scale-up', publisher: 'Microsoft Learn', pageUpdated: '2025-09-09', verified: V },
  { id: 'acr-skus', title: 'Azure Container Registry SKU features and limits', url: 'https://learn.microsoft.com/en-us/azure/container-registry/container-registry-skus', publisher: 'Microsoft Learn', pageUpdated: '2026-09-03', verified: V },
  { id: 'acr-auth', title: 'Authenticate with an Azure container registry', url: 'https://learn.microsoft.com/en-us/azure/container-registry/container-registry-authentication', publisher: 'Microsoft Learn', pageUpdated: '2026-06-12', verified: V },
  { id: 'aci-overview', title: 'What is Azure Container Instances?', url: 'https://learn.microsoft.com/en-us/azure/container-instances/container-instances-overview', publisher: 'Microsoft Learn', pageUpdated: '2026-07-26', verified: V },
  { id: 'aci-restart-policy', title: 'Restart policy for run-once tasks in Azure Container Instances', url: 'https://learn.microsoft.com/en-us/azure/container-instances/container-instances-restart-policy', publisher: 'Microsoft Learn', pageUpdated: '2026-07-26', verified: V },
  { id: 'aci-container-groups', title: 'Introduction to container groups in Azure Container Instances', url: 'https://learn.microsoft.com/en-us/azure/container-instances/container-instances-container-groups', publisher: 'Microsoft Learn', pageUpdated: '2026-01-13', verified: V },
  { id: 'aca-scale', title: 'Set scaling rules in Azure Container Apps', url: 'https://learn.microsoft.com/en-us/azure/container-apps/scale-app', publisher: 'Microsoft Learn', pageUpdated: '2026-05-20', verified: V },
  { id: 'aca-environment', title: 'Azure Container Apps environments', url: 'https://learn.microsoft.com/en-us/azure/container-apps/environment', publisher: 'Microsoft Learn', pageUpdated: '2026-02-27', verified: V },
  { id: 'aca-containers', title: 'Containers in Azure Container Apps', url: 'https://learn.microsoft.com/en-us/azure/container-apps/containers', publisher: 'Microsoft Learn', pageUpdated: '2026-03-25', verified: V },

  // Monitoring
  { id: 'diagnostic-settings', title: 'Diagnostic settings in Azure Monitor', url: 'https://learn.microsoft.com/en-us/azure/azure-monitor/platform/diagnostic-settings', publisher: 'Microsoft Learn', pageUpdated: '2026-06-29', verified: V },
  { id: 'activity-log', title: 'Azure Monitor activity log', url: 'https://learn.microsoft.com/en-us/azure/azure-monitor/platform/activity-log', publisher: 'Microsoft Learn', pageUpdated: '2026-07-14', verified: V },
  { id: 'kql-getting-started', title: 'Get started with log queries in Azure Monitor Logs', url: 'https://learn.microsoft.com/en-us/azure/azure-monitor/logs/get-started-queries', publisher: 'Microsoft Learn', pageUpdated: '2026-08-25', verified: V },
  { id: 'alerts-overview', title: 'What are Azure Monitor alerts?', url: 'https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-overview', publisher: 'Microsoft Learn', pageUpdated: '2026-07-08', verified: V },
  { id: 'alerts-types', title: 'Types of Azure Monitor alerts', url: 'https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-types', publisher: 'Microsoft Learn', pageUpdated: '2026-07-08', verified: V },
  { id: 'alert-processing-rules', title: 'Alert processing rules', url: 'https://learn.microsoft.com/en-us/azure/azure-monitor/alerts/alerts-processing-rules', publisher: 'Microsoft Learn', pageUpdated: '2026-04-30', verified: V },
  { id: 'ama-overview', title: 'Azure Monitor Agent overview', url: 'https://learn.microsoft.com/en-us/azure/azure-monitor/agents/azure-monitor-agent-overview', publisher: 'Microsoft Learn', pageUpdated: '2026-07-28', verified: V },
  { id: 'metrics-overview', title: 'Azure Monitor Metrics overview', url: 'https://learn.microsoft.com/en-us/azure/azure-monitor/metrics/data-platform-metrics', publisher: 'Microsoft Learn', pageUpdated: '2026-08-09', verified: V },

  // Backup & recovery
  { id: 'backup-vault', title: 'Overview of Backup vaults', url: 'https://learn.microsoft.com/en-us/azure/backup/backup-vault-overview', publisher: 'Microsoft Learn', pageUpdated: '2026-02-12', verified: V },
  { id: 'rsv-overview', title: 'Recovery Services vaults overview', url: 'https://learn.microsoft.com/en-us/azure/backup/backup-azure-recovery-services-vault-overview', publisher: 'Microsoft Learn', pageUpdated: '2026-02-12', verified: V },
  { id: 'vm-backup-enhanced', title: 'Back up an Azure VM using Enhanced policy', url: 'https://learn.microsoft.com/en-us/azure/backup/backup-azure-vms-enhanced-policy', publisher: 'Microsoft Learn', pageUpdated: '2026-06-16', verified: V },
  { id: 'vm-restore', title: 'How to restore Azure VM data in Azure portal', url: 'https://learn.microsoft.com/en-us/azure/backup/backup-azure-arm-restore-vms', publisher: 'Microsoft Learn', pageUpdated: '2026-05-27', verified: V },
  { id: 'asr-architecture', title: 'Azure to Azure disaster recovery architecture', url: 'https://learn.microsoft.com/en-us/azure/site-recovery/azure-to-azure-architecture', publisher: 'Microsoft Learn', pageUpdated: '2025-10-07', verified: V },
  { id: 'asr-failover', title: 'Fail over and reprotect Azure VMs between regions', url: 'https://learn.microsoft.com/en-us/azure/site-recovery/azure-to-azure-tutorial-failover-failback', publisher: 'Microsoft Learn', pageUpdated: '2025-10-07', verified: V },
  { id: 'backup-monitoring', title: 'Monitor Azure Backup protected workloads', url: 'https://learn.microsoft.com/en-us/azure/backup/backup-azure-monitoring-built-in-monitor', publisher: 'Microsoft Learn', pageUpdated: '2026-03-13', verified: V },
  { id: 'backup-reports', title: 'Configure Azure Backup reports', url: 'https://learn.microsoft.com/en-us/azure/backup/configure-reports', publisher: 'Microsoft Learn', pageUpdated: '2025-11-27', verified: V },
];

export const SOURCES: Record<string, Source> = Object.fromEntries(list.map((s) => [s.id, s]));
export const SOURCE_LIST = list;
