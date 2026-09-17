import type { Lab } from '../schema';

/**
 * Labs 1–5: the foundation, identity, governance, storage and networking track.
 * Every lab is designed to be run in a real subscription and cleaned up at the
 * end, and every task has a verification step so the learner knows it worked
 * rather than assuming it did.
 */
export const LABS_PART_1: Lab[] = [
  // ------------------------------------------------------------------- lab 1
  {
    id: 'lab-foundations',
    number: 1,
    title: 'Your first resource group, tags and locks',
    summary: 'Build the governance scaffolding every later lab sits on: a resource group, a tagging convention, a delete lock, and the CLI habits that make the rest fast.',
    minutes: 35,
    level: 1,
    estimatedCost: 'Free — no billable resources are created.',
    prerequisites: [
      'An Azure subscription where you have Contributor or Owner at the subscription scope',
      'Access to the Azure portal and Cloud Shell (no local install needed)',
    ],
    objectives: [
      'Create and inspect resource groups from the portal and the CLI',
      'Apply a consistent tagging convention and read tags back',
      'Understand what a CanNotDelete lock stops and what it allows',
      'Read a resource ID and know what each segment means',
    ],
    skills: ['ig.gov.rg', 'ig.gov.tags', 'ig.gov.locks'],
    concepts: ['resource-group', 'tags', 'resource-lock', 'resource-id', 'cloud-shell'],
    sources: ['arm-overview', 'tags', 'locks', 'cloud-shell'],
    tasks: [
      {
        id: 'l1-t1',
        title: 'Open Cloud Shell and set your context',
        goal: 'Get a working shell that is already authenticated as you, and confirm which subscription your commands will act on.',
        steps: [
          { text: 'In the Azure portal, select the Cloud Shell icon in the top bar and choose **Bash** when prompted. If asked, let it create the storage it needs.' },
          {
            text: 'List the subscriptions you can see and select the one you want to work in.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az account list --output table
az account set --subscription "<your-subscription-name>"
az account show --output table`,
                notes: [{ token: 'az account set', note: 'Every later command runs against this subscription until you change it.' }],
              },
            ],
          },
        ],
        verify: {
          text: 'The output of `az account show` names the subscription you intend to use.',
          expect: 'A table with your subscription name and "Enabled" state.',
        },
        why: 'Nearly every "it deployed to the wrong place" incident starts with an unset subscription context.',
      },
      {
        id: 'l1-t2',
        title: 'Create a resource group with tags',
        goal: 'Create the container the rest of this lab lives in, tagged so cost and ownership are attributable from day one.',
        steps: [
          {
            text: 'Create the group in a region near you, with three tags.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `LOCATION=westeurope
az group create --name rg-lab01-learn --location $LOCATION \\
  --tags env=lab owner="$(az ad signed-in-user show --query userPrincipalName -o tsv)" costCenter=training`,
              },
              {
                lang: 'powershell',
                label: 'PowerShell',
                code: `New-AzResourceGroup -Name rg-lab01-learn -Location westeurope \`
  -Tag @{ env = 'lab'; costCenter = 'training' }`,
              },
            ],
          },
          { text: 'In the portal, open **Resource groups → rg-lab01-learn → Overview** and confirm the tags appear in the Essentials panel.' },
        ],
        verify: {
          text: 'Read the tags back from the CLI.',
          code: [{ lang: 'bash', label: 'Azure CLI', code: `az group show --name rg-lab01-learn --query tags` }],
          expect: 'A JSON object containing env, owner and costCenter.',
        },
        why: 'The resource group location stores the group’s metadata. Resources inside it can live in other regions — a distinction the exam tests directly.',
      },
      {
        id: 'l1-t3',
        title: 'Create a resource and read its resource ID',
        goal: 'See how a resource ID is assembled, because every scope, lock and role assignment you write later uses one.',
        steps: [
          {
            text: 'Create a free-tier resource — a virtual network costs nothing until something uses it.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az network vnet create --resource-group rg-lab01-learn --name vnet-lab01 \\
  --address-prefix 10.10.0.0/16 --subnet-name snet-app --subnet-prefix 10.10.1.0/24

az network vnet show --resource-group rg-lab01-learn --name vnet-lab01 --query id -o tsv`,
              },
            ],
          },
          { text: 'Read the ID out loud, segment by segment: subscription, resource group, provider, type, name.' },
        ],
        verify: {
          text: 'The ID follows the pattern `/subscriptions/{id}/resourceGroups/rg-lab01-learn/providers/Microsoft.Network/virtualNetworks/vnet-lab01`.',
        },
        hint: 'If the command fails with a provider error, register it: `az provider register --namespace Microsoft.Network`.',
      },
      {
        id: 'l1-t4',
        title: 'Apply a CanNotDelete lock and feel its edges',
        goal: 'Prove to yourself what a lock stops and what it lets through.',
        steps: [
          {
            text: 'Lock the virtual network against deletion.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az lock create --name no-delete --lock-type CanNotDelete \\
  --resource-group rg-lab01-learn --resource vnet-lab01 \\
  --resource-type Microsoft.Network/virtualNetworks`,
              },
            ],
          },
          {
            text: 'Try to delete the virtual network. The command should fail.',
            code: [{ lang: 'bash', label: 'Azure CLI', code: `az network vnet delete --resource-group rg-lab01-learn --name vnet-lab01` }],
          },
          {
            text: 'Now add a subnet. This should **succeed** — CanNotDelete blocks deletion, not modification.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az network vnet subnet create --resource-group rg-lab01-learn --vnet-name vnet-lab01 \\
  --name snet-data --address-prefix 10.10.2.0/24`,
              },
            ],
          },
        ],
        verify: {
          text: 'The delete failed with a message naming the lock; the subnet creation succeeded.',
          expect: 'An error mentioning "scope ... is locked" on delete, and a successful subnet creation.',
        },
        why: 'Locks are inherited by child scopes and the most restrictive one wins. A ReadOnly lock would have blocked the subnet creation too — and would also block operations that look like reads, such as listing storage account keys.',
      },
    ],
    cleanup: {
      text: 'Remove the lock first — the resource group cannot be deleted while a lock exists inside it.',
      code: [
        {
          lang: 'bash',
          label: 'Azure CLI',
          code: `az lock delete --name no-delete --resource-group rg-lab01-learn \\
  --resource vnet-lab01 --resource-type Microsoft.Network/virtualNetworks

az group delete --name rg-lab01-learn --yes --no-wait`,
        },
      ],
    },
  },

  // ------------------------------------------------------------------- lab 2
  {
    id: 'lab-identity',
    number: 2,
    title: 'Users, groups and least-privilege RBAC',
    summary: 'Create identities, put them in a group, grant that group a built-in role at resource group scope, then build a custom role when the built-in ones do not fit.',
    minutes: 45,
    level: 2,
    estimatedCost: 'Free — identities and role assignments are not billed. Dynamic groups need Entra ID P1 and are read-only in this lab.',
    prerequisites: [
      'Lab 1 completed (or the ability to create a resource group)',
      'User Administrator in Microsoft Entra ID, and Owner or User Access Administrator on the subscription',
    ],
    objectives: [
      'Create users and a security group, and manage membership',
      'Assign a built-in role at resource group scope and verify effective access',
      'Create a custom role with the right Actions, NotActions and AssignableScopes',
      'Explain why RBAC assignments are additive',
    ],
    skills: ['ig.entra.create', 'ig.entra.properties', 'ig.access.builtin', 'ig.access.scopes'],
    concepts: ['entra-user', 'entra-group', 'azure-rbac', 'role-assignment', 'custom-role', 'rbac-scope'],
    buildsOn: ['lab-foundations'],
    sources: ['rbac-overview', 'rbac-custom-roles', 'users-bulk-add', 'roles-compare'],
    tasks: [
      {
        id: 'l2-t1',
        title: 'Create two users and a security group',
        goal: 'Have real principals to assign access to, so the rest of the lab is not hypothetical.',
        steps: [
          { text: 'In the portal, go to **Microsoft Entra ID → Users → New user → Create new user**. Create `lab-reader` and `lab-operator` with your tenant’s domain. Note the passwords.' },
          { text: 'Go to **Groups → New group**. Group type **Security**, name `sg-lab-operators`, membership type **Assigned**. Add `lab-operator` as a member.' },
          {
            text: 'Confirm from the CLI.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az ad group member list --group sg-lab-operators --query "[].userPrincipalName" -o tsv`,
              },
            ],
          },
        ],
        verify: {
          text: 'The group lists `lab-operator` and not `lab-reader`.',
        },
        why: 'Assign roles to groups, not to people. When someone changes job you edit one membership instead of auditing every scope in the subscription.',
      },
      {
        id: 'l2-t2',
        title: 'Assign a built-in role at resource group scope',
        goal: 'Grant the group the least privilege that does the job, at the narrowest scope that works.',
        steps: [
          {
            text: 'Create a resource group for this lab and give the group Reader on it.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az group create --name rg-lab02-rbac --location westeurope --tags env=lab

GROUP_ID=$(az ad group show --group sg-lab-operators --query id -o tsv)
RG_ID=$(az group show --name rg-lab02-rbac --query id -o tsv)

az role assignment create --assignee-object-id $GROUP_ID --assignee-principal-type Group \\
  --role "Reader" --scope $RG_ID`,
              },
            ],
          },
          { text: 'In the portal, open the resource group → **Access control (IAM)** → **Role assignments** and find the assignment.' },
        ],
        verify: {
          text: 'Use Check access to confirm what `lab-operator` can do.',
          code: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az role assignment list --scope $RG_ID --output table`,
            },
          ],
          expect: 'One Reader assignment for sg-lab-operators at the resource group scope.',
        },
      },
      {
        id: 'l2-t3',
        title: 'Build a custom role',
        goal: 'Meet a requirement no built-in role matches: restart virtual machines, but never resize or delete them.',
        steps: [
          {
            text: 'Save this definition as `vm-restart-role.json` in Cloud Shell (use `code vm-restart-role.json` to open the editor).',
            code: [
              {
                lang: 'json',
                label: 'vm-restart-role.json',
                code: `{
  "Name": "Lab VM Restart Operator",
  "Description": "Can view and restart virtual machines, but not resize or delete them.",
  "Actions": [
    "Microsoft.Compute/virtualMachines/read",
    "Microsoft.Compute/virtualMachines/restart/action",
    "Microsoft.Compute/virtualMachines/start/action",
    "Microsoft.Resources/subscriptions/resourceGroups/read"
  ],
  "NotActions": [],
  "AssignableScopes": [
    "/subscriptions/<your-subscription-id>"
  ]
}`,
              },
            ],
          },
          {
            text: 'Replace the subscription ID, then create and assign the role.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `SUB_ID=$(az account show --query id -o tsv)
sed -i "s|<your-subscription-id>|$SUB_ID|" vm-restart-role.json

az role definition create --role-definition @vm-restart-role.json
az role assignment create --assignee-object-id $GROUP_ID --assignee-principal-type Group \\
  --role "Lab VM Restart Operator" --scope $RG_ID`,
              },
            ],
          },
        ],
        verify: {
          text: 'List the role and confirm its assignable scopes.',
          code: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az role definition list --name "Lab VM Restart Operator" --query "[].{name:roleName, scopes:assignableScopes, actions:permissions[0].actions}"`,
            },
          ],
          expect: 'The four actions listed, and an assignable scope of your subscription.',
        },
        why: 'The role definition lives in the Entra tenant; AssignableScopes controls where it may be used. A custom role cannot be assigned outside them.',
        hint: 'Custom role creation can take a minute to propagate. If the assignment fails immediately after creation, wait and retry.',
      },
      {
        id: 'l2-t4',
        title: 'Prove that assignments are additive',
        goal: 'See for yourself that the effective permission set is the union of every assignment.',
        steps: [
          { text: 'In the portal, open the resource group → **Access control (IAM)** → **Check access**, and select the `lab-operator` user.' },
          { text: 'Note that both Reader and Lab VM Restart Operator appear. The user can now read everything and restart VMs — the union of the two.' },
          { text: 'Remove the Reader assignment and check again. The custom role remains; the user loses general read access but keeps VM read and restart.' },
        ],
        verify: {
          text: 'Check access shows exactly the roles you expect, at the scopes you expect.',
        },
        why: 'There is no "most specific wins" in Azure RBAC — permissions accumulate. Only a deny assignment overrides an allow.',
      },
    ],
    cleanup: {
      text: 'Remove the role assignments, the custom role definition, the group, the users and the resource group.',
      code: [
        {
          lang: 'bash',
          label: 'Azure CLI',
          code: `az role assignment delete --assignee-object-id $GROUP_ID --scope $RG_ID
az role definition delete --name "Lab VM Restart Operator"
az ad group delete --group sg-lab-operators
az ad user delete --id lab-reader@<your-domain>
az ad user delete --id lab-operator@<your-domain>
az group delete --name rg-lab02-rbac --yes --no-wait`,
        },
      ],
    },
  },

  // ------------------------------------------------------------------- lab 3
  {
    id: 'lab-governance',
    number: 3,
    title: 'Policy, initiatives and budgets',
    summary: 'Enforce a tagging and region standard with Azure Policy, watch a non-compliant deployment get blocked, then set a budget that alerts before the bill surprises anyone.',
    minutes: 45,
    level: 3,
    estimatedCost: 'Free — policy and budgets are not billed. One storage account is created and deleted.',
    prerequisites: ['Owner or Resource Policy Contributor on the subscription', 'Lab 1 completed'],
    objectives: [
      'Assign a built-in policy with an Audit effect and read compliance results',
      'Switch to Deny and watch a non-compliant deployment fail',
      'Group policies into an initiative and assign it once',
      'Create a budget with alert thresholds',
    ],
    skills: ['ig.gov.policy', 'ig.gov.costs', 'ig.gov.tags'],
    concepts: ['azure-policy', 'policy-effect', 'policy-initiative', 'budget', 'tags'],
    buildsOn: ['lab-foundations'],
    sources: ['policy-overview', 'policy-effects', 'budgets', 'tags'],
    tasks: [
      {
        id: 'l3-t1',
        title: 'Assign a policy in Audit mode',
        goal: 'Measure the impact of a rule before enforcing it — the order every safe rollout follows.',
        steps: [
          {
            text: 'Create a resource group, then assign the built-in "Allowed locations" policy in Audit mode at that scope.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az group create --name rg-lab03-gov --location westeurope --tags env=lab
RG_ID=$(az group show --name rg-lab03-gov --query id -o tsv)

az policy assignment create --name audit-locations --display-name "Audit allowed locations" \\
  --scope $RG_ID \\
  --policy "e56962a6-4747-49cd-b67b-bf8b01975c4c" \\
  --params '{"listOfAllowedLocations":{"value":["westeurope","northeurope"]}}' \\
  --enforcement-mode DoNotEnforce`,
              },
            ],
          },
          { text: 'In the portal, open **Policy → Compliance** and find the assignment. Evaluation can take several minutes.' },
        ],
        verify: {
          text: 'The assignment appears under Policy → Assignments with enforcement mode "Disabled" (DoNotEnforce).',
        },
        why: 'DoNotEnforce records what *would* happen without blocking anyone. It is how you find the surprises before they become incidents.',
        hint: 'Policy evaluation is not instant. Use **Compliance → the assignment → Trigger evaluation** or wait; a full scan runs roughly every 24 hours.',
      },
      {
        id: 'l3-t2',
        title: 'Enforce a tag requirement and watch it block a deployment',
        goal: 'Experience the difference between Audit and Deny from the receiving end.',
        steps: [
          {
            text: 'Assign the built-in "Require a tag on resources" policy with a Deny effect for the `env` tag.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az policy assignment create --name require-env-tag --display-name "Require env tag" \\
  --scope $RG_ID \\
  --policy "871b6d14-10aa-478d-b590-94f262ecfa99" \\
  --params '{"tagName":{"value":"env"}}'`,
              },
            ],
          },
          {
            text: 'Wait a few minutes, then try to create a storage account **without** the tag. It should be denied.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az storage account create --name stlab03$RANDOM --resource-group rg-lab03-gov \\
  --location westeurope --sku Standard_LRS`,
              },
            ],
          },
          {
            text: 'Create it again **with** the tag. It should succeed.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `STORAGE=stlab03$RANDOM
az storage account create --name $STORAGE --resource-group rg-lab03-gov \\
  --location westeurope --sku Standard_LRS --tags env=lab`,
              },
            ],
          },
        ],
        verify: {
          text: 'The first command fails with RequestDisallowedByPolicy naming the assignment; the second succeeds.',
          expect: 'An error containing "RequestDisallowedByPolicy" and the assignment name.',
        },
        why: 'Policy is evaluated by Resource Manager before the resource provider acts, which is why it can block a deployment outright rather than fixing it afterwards.',
      },
      {
        id: 'l3-t3',
        title: 'Group the policies into an initiative',
        goal: 'Assign a whole standard as one unit, and report on it as one unit.',
        steps: [
          { text: 'In the portal, go to **Policy → Definitions → + Initiative definition**.' },
          { text: 'Name it `Lab baseline`, set the definition location to your subscription, and add both policies used above.' },
          { text: 'Save, then assign the initiative to `rg-lab03-gov`, supplying the allowed locations and the tag name as initiative parameters.' },
          { text: 'Remove the two individual assignments — the initiative now covers both.' },
        ],
        verify: {
          text: 'Policy → Compliance shows one initiative assignment with a compliance state covering both rules.',
        },
        why: 'Real environments have dozens of rules. Initiatives are how a standard such as a security baseline is applied and measured as a single thing.',
      },
      {
        id: 'l3-t4',
        title: 'Create a budget with alerts',
        goal: 'Get a warning before spend becomes a problem — and understand what a budget does not do.',
        steps: [
          { text: 'In the portal, go to **Cost Management + Billing → Cost Management → Budgets → + Add**.' },
          { text: 'Scope it to your subscription, set a monthly amount you would notice, and add alert conditions at 50%, 80% and 100% of **Actual** cost.' },
          { text: 'Add your email address as the alert recipient, or attach an existing action group.' },
        ],
        verify: {
          text: 'The budget appears in the list with its thresholds and the current spend against it.',
        },
        why: 'A budget **alerts**; it never stops spending. Stopping something requires an action group that triggers automation — a distinction the exam tests.',
      },
    ],
    cleanup: {
      text: 'Delete the assignments, the initiative, the budget and the resource group.',
      code: [
        {
          lang: 'bash',
          label: 'Azure CLI',
          code: `az policy assignment delete --name audit-locations --scope $RG_ID
az policy assignment delete --name require-env-tag --scope $RG_ID
az group delete --name rg-lab03-gov --yes --no-wait`,
        },
      ],
    },
  },

  // ------------------------------------------------------------------- lab 4
  {
    id: 'lab-storage',
    number: 4,
    title: 'Storage accounts, lifecycle, SAS and the firewall',
    summary: 'Create a storage account, upload blobs, tier them automatically with a lifecycle rule, hand out scoped access with a SAS backed by a stored access policy, then lock the account down to your network.',
    minutes: 55,
    level: 3,
    estimatedCost: 'Pennies — a few small blobs in Standard LRS, deleted at the end.',
    prerequisites: ['Contributor on a resource group', 'Labs 1–3 recommended'],
    objectives: [
      'Create a storage account and choose redundancy deliberately',
      'Enable soft delete and versioning, and recover an overwritten blob',
      'Write a lifecycle rule that tiers and deletes blobs by age',
      'Issue a SAS bound to a stored access policy, then revoke it without rotating keys',
      'Restrict network access and confirm what breaks',
    ],
    skills: ['st.accounts.create', 'st.accounts.redundancy', 'st.data.lifecycle', 'st.access.sas', 'st.access.firewall', 'st.data.versioning', 'st.access.policies'],
    concepts: ['storage-account', 'storage-redundancy', 'access-tier', 'lifecycle-management', 'blob-versioning', 'blob-soft-delete', 'sas', 'stored-access-policy', 'storage-firewall'],
    buildsOn: ['lab-foundations'],
    sources: ['storage-account-overview', 'storage-redundancy', 'lifecycle', 'sas-overview', 'stored-access-policy', 'storage-firewall', 'blob-versioning'],
    tasks: [
      {
        id: 'l4-t1',
        title: 'Create the account with data protection on',
        goal: 'Start from a configuration you would actually put in production, rather than clicking through defaults.',
        steps: [
          {
            text: 'Create the account, then enable blob soft delete, container soft delete and versioning.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az group create --name rg-lab04-storage --location westeurope --tags env=lab
STORAGE=stlab04$RANDOM
echo "Storage account: $STORAGE"

az storage account create --name $STORAGE --resource-group rg-lab04-storage \\
  --location westeurope --sku Standard_LRS --kind StorageV2 \\
  --min-tls-version TLS1_2 --allow-blob-public-access false

az storage account blob-service-properties update --account-name $STORAGE \\
  --resource-group rg-lab04-storage \\
  --enable-delete-retention true --delete-retention-days 7 \\
  --enable-container-delete-retention true --container-delete-retention-days 7 \\
  --enable-versioning true`,
              },
            ],
          },
        ],
        verify: {
          text: 'Read the blob service properties back.',
          code: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az storage account blob-service-properties show --account-name $STORAGE \\
  --resource-group rg-lab04-storage --query "{softDelete:deleteRetentionPolicy, versioning:isVersioningEnabled}"`,
            },
          ],
          expect: 'Soft delete enabled with 7 days retention, and versioning true.',
        },
        why: '`--allow-blob-public-access false` and TLS 1.2 are the two settings most often missed, and both appear in security baselines.',
      },
      {
        id: 'l4-t2',
        title: 'Upload a blob, overwrite it, and get the old version back',
        goal: 'Prove that versioning does what you think it does.',
        steps: [
          {
            text: 'Create a container and upload a file, then overwrite it.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az storage container create --name docs --account-name $STORAGE --auth-mode login

echo "version one" > note.txt
az storage blob upload --container-name docs --name note.txt --file note.txt \\
  --account-name $STORAGE --auth-mode login --overwrite

echo "version two" > note.txt
az storage blob upload --container-name docs --name note.txt --file note.txt \\
  --account-name $STORAGE --auth-mode login --overwrite`,
              },
            ],
          },
          {
            text: 'List the versions and download the older one.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az storage blob list --container-name docs --account-name $STORAGE \\
  --auth-mode login --include v --query "[].{name:name, version:versionId, current:isCurrentVersion}" -o table`,
              },
            ],
          },
        ],
        verify: {
          text: 'Two versions are listed; only one is marked current.',
          expect: 'Two rows for note.txt with different versionId values.',
        },
        why: 'Versioning protects against overwrites; soft delete protects against deletes. Most teams need both, and neither is on by default.',
      },
      {
        id: 'l4-t3',
        title: 'Write a lifecycle rule',
        goal: 'Automate tiering so cost management is not a monthly chore.',
        steps: [
          {
            text: 'Save this policy as `lifecycle.json` and apply it.',
            code: [
              {
                lang: 'json',
                label: 'lifecycle.json',
                code: `{
  "rules": [
    {
      "enabled": true,
      "name": "tier-then-delete",
      "type": "Lifecycle",
      "definition": {
        "filters": { "blobTypes": [ "blockBlob" ], "prefixMatch": [ "docs/" ] },
        "actions": {
          "baseBlob": {
            "tierToCool": { "daysAfterModificationGreaterThan": 30 },
            "tierToArchive": { "daysAfterModificationGreaterThan": 180 },
            "delete": { "daysAfterModificationGreaterThan": 2555 }
          },
          "version": { "delete": { "daysAfterCreationGreaterThan": 90 } }
        }
      }
    }
  ]
}`,
              },
              {
                lang: 'bash',
                label: 'Apply it',
                code: `az storage account management-policy create --account-name $STORAGE \\
  --resource-group rg-lab04-storage --policy @lifecycle.json`,
              },
            ],
          },
        ],
        verify: {
          text: 'Read the policy back and confirm the rule name and actions.',
          code: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az storage account management-policy show --account-name $STORAGE --resource-group rg-lab04-storage --query "policy.rules[].name"`,
            },
          ],
        },
        why: 'Note the minimum retention periods: moving to Cool before 30 days, or Archive before 180, incurs an early-deletion charge. The rule above respects them.',
      },
      {
        id: 'l4-t4',
        title: 'Issue a revocable SAS',
        goal: 'Hand out time-limited access you can withdraw without rotating the account key.',
        steps: [
          {
            text: 'Create a stored access policy on the container, then generate a SAS that references it.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `EXPIRY=$(date -u -d "1 day" '+%Y-%m-%dT%H:%MZ')

az storage container policy create --container-name docs --name partner-read \\
  --permissions rl --expiry $EXPIRY --account-name $STORAGE --auth-mode login

SAS=$(az storage container generate-sas --name docs --policy-name partner-read \\
  --account-name $STORAGE --auth-mode login --as-user -o tsv)
echo "https://$STORAGE.blob.core.windows.net/docs?$SAS"`,
              },
            ],
          },
          {
            text: 'Now revoke it by deleting the policy, and confirm the SAS stops working.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az storage container policy delete --container-name docs --name partner-read \\
  --account-name $STORAGE --auth-mode login`,
              },
            ],
          },
        ],
        verify: {
          text: 'The URL worked before the policy was deleted and returns an authorization error afterwards.',
          expect: 'HTTP 403 after the stored access policy is removed.',
        },
        why: 'A SAS without a stored access policy can only be revoked by rotating the signing key — which breaks every other SAS signed with it at the same time.',
      },
      {
        id: 'l4-t5',
        title: 'Lock the account to selected networks',
        goal: 'See exactly what the firewall breaks, including your own access.',
        steps: [
          {
            text: 'Switch the default action to Deny, allowing only your current public IP.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `MYIP=$(curl -s https://api.ipify.org)
az storage account network-rule add --account-name $STORAGE \\
  --resource-group rg-lab04-storage --ip-address $MYIP

az storage account update --name $STORAGE --resource-group rg-lab04-storage \\
  --default-action Deny --bypass AzureServices`,
              },
            ],
          },
          { text: 'Try to list blobs from the portal’s Storage browser. Depending on where your session originates, it may now be blocked.' },
        ],
        verify: {
          text: 'The account shows "Enabled from selected virtual networks and IP addresses" and your rule is listed.',
          code: [{ lang: 'bash', label: 'Azure CLI', code: `az storage account show --name $STORAGE --resource-group rg-lab04-storage --query networkRuleSet` }],
        },
        why: 'The firewall applies to the **data plane** only. Control-plane operations still work — which is why you can still read the account’s configuration while being unable to read its blobs.',
        hint: 'Locked yourself out? Set `--default-action Allow` from the CLI; the control plane is unaffected by the data-plane firewall.',
      },
    ],
    cleanup: {
      text: 'Delete the resource group, which removes the storage account and everything in it.',
      code: [{ lang: 'bash', label: 'Azure CLI', code: `az group delete --name rg-lab04-storage --yes --no-wait` }],
    },
  },

  // ------------------------------------------------------------------- lab 5
  {
    id: 'lab-networking',
    number: 5,
    title: 'Virtual networks, NSGs, ASGs and peering',
    summary: 'Design an address space, split it into subnets, secure it with NSGs and application security groups, then peer two networks and prove that peering is not transitive.',
    minutes: 60,
    level: 4,
    estimatedCost: 'Free for the networking objects themselves; no VMs are created in this lab.',
    prerequisites: ['Contributor on a subscription', 'Labs 1–4 recommended'],
    objectives: [
      'Plan a non-overlapping address space and subnet it',
      'Write NSG rules and read the effective rules',
      'Use application security groups instead of IP ranges',
      'Peer two virtual networks and understand transitivity',
      'Use Network Watcher IP flow verify to explain a decision',
    ],
    skills: ['nw.vnet.create', 'nw.secure.nsg', 'nw.secure.effective', 'nw.vnet.peering', 'nw.vnet.troubleshoot'],
    concepts: ['vnet', 'subnet', 'nsg', 'asg', 'service-tag', 'effective-security-rules', 'vnet-peering', 'network-watcher'],
    buildsOn: ['lab-foundations'],
    sources: ['vnet-faq', 'nsg-overview', 'asg', 'peering', 'network-watcher'],
    tasks: [
      {
        id: 'l5-t1',
        title: 'Create two non-overlapping virtual networks',
        goal: 'Get the address planning right first, because it is the one thing that is painful to change later.',
        steps: [
          {
            text: 'Create a hub and a spoke with distinct address spaces.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az group create --name rg-lab05-net --location westeurope --tags env=lab

az network vnet create --resource-group rg-lab05-net --name vnet-hub \\
  --address-prefix 10.20.0.0/16 --subnet-name snet-shared --subnet-prefix 10.20.1.0/24

az network vnet create --resource-group rg-lab05-net --name vnet-spoke \\
  --address-prefix 10.30.0.0/16 --subnet-name snet-web --subnet-prefix 10.30.1.0/24

az network vnet subnet create --resource-group rg-lab05-net --vnet-name vnet-spoke \\
  --name snet-data --address-prefix 10.30.2.0/24`,
              },
            ],
          },
          { text: 'Work out how many usable addresses `snet-web` has. A /24 has 256 addresses; Azure reserves five.' },
        ],
        verify: {
          text: 'Both networks exist with the subnets listed.',
          code: [{ lang: 'bash', label: 'Azure CLI', code: `az network vnet list --resource-group rg-lab05-net --query "[].{name:name, space:addressSpace.addressPrefixes, subnets:subnets[].name}" -o json` }],
          expect: '251 usable addresses in a /24 — 256 minus the five Azure reserves.',
        },
      },
      {
        id: 'l5-t2',
        title: 'Secure the subnets with an NSG',
        goal: 'Write rules that are evaluated in the order you expect.',
        steps: [
          {
            text: 'Create an NSG, allow HTTPS from the internet, and associate it with the web subnet.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az network nsg create --resource-group rg-lab05-net --name nsg-web

az network nsg rule create --resource-group rg-lab05-net --nsg-name nsg-web \\
  --name allow-https --priority 100 --direction Inbound --access Allow \\
  --protocol Tcp --source-address-prefixes Internet \\
  --destination-address-prefixes '*' --destination-port-ranges 443

az network vnet subnet update --resource-group rg-lab05-net --vnet-name vnet-spoke \\
  --name snet-web --network-security-group nsg-web`,
              },
            ],
          },
          { text: 'List the rules, including the defaults, and note their priorities.' },
        ],
        verify: {
          text: 'The default rules appear alongside yours.',
          code: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az network nsg rule list --resource-group rg-lab05-net --nsg-name nsg-web \\
  --include-default --query "sort_by([], &priority)[].{name:name, priority:priority, access:access, direction:direction}" -o table`,
            },
          ],
          expect: 'Your rule at 100, then AllowVnetInBound (65000), AllowAzureLoadBalancerInBound (65001) and DenyAllInBound (65500).',
        },
        why: 'Rules are evaluated lowest priority number first and the **first match wins**. Nothing after a match is evaluated, which is why rule order matters more than rule count.',
      },
      {
        id: 'l5-t3',
        title: 'Replace IP ranges with application security groups',
        goal: 'Write a rule that stays correct as machines come and go.',
        steps: [
          {
            text: 'Create two ASGs and a rule that lets the web tier reach the data tier on 1433.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az network asg create --resource-group rg-lab05-net --name asg-web
az network asg create --resource-group rg-lab05-net --name asg-data

az network nsg create --resource-group rg-lab05-net --name nsg-data

az network nsg rule create --resource-group rg-lab05-net --nsg-name nsg-data \\
  --name allow-web-to-sql --priority 100 --direction Inbound --access Allow \\
  --protocol Tcp --source-asgs asg-web --destination-asgs asg-data \\
  --destination-port-ranges 1433

az network vnet subnet update --resource-group rg-lab05-net --vnet-name vnet-spoke \\
  --name snet-data --network-security-group nsg-data`,
              },
            ],
          },
        ],
        verify: {
          text: 'The rule references the ASGs rather than address prefixes.',
          code: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az network nsg rule show --resource-group rg-lab05-net --nsg-name nsg-data \\
  --name allow-web-to-sql --query "{src:sourceApplicationSecurityGroups[].id, dst:destinationApplicationSecurityGroups[].id}"`,
            },
          ],
        },
        why: 'A NIC joins an ASG, and the rule follows automatically. Both ends of an ASG rule must be in the same virtual network.',
      },
      {
        id: 'l5-t4',
        title: 'Peer the networks and check transitivity',
        goal: 'Connect hub and spoke, then reason about what a third network could and could not reach.',
        steps: [
          {
            text: 'Create the peering in both directions — peering is not established until both sides exist.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `HUB_ID=$(az network vnet show -g rg-lab05-net -n vnet-hub --query id -o tsv)
SPOKE_ID=$(az network vnet show -g rg-lab05-net -n vnet-spoke --query id -o tsv)

az network vnet peering create --resource-group rg-lab05-net --name hub-to-spoke \\
  --vnet-name vnet-hub --remote-vnet $SPOKE_ID --allow-vnet-access

az network vnet peering create --resource-group rg-lab05-net --name spoke-to-hub \\
  --vnet-name vnet-spoke --remote-vnet $HUB_ID --allow-vnet-access`,
              },
            ],
          },
          { text: 'Imagine a second spoke peered to the hub. Could it reach this spoke? Write down your answer before checking the note below.' },
        ],
        verify: {
          text: 'Both peerings report peeringState "Connected".',
          code: [{ lang: 'bash', label: 'Azure CLI', code: `az network vnet peering list --resource-group rg-lab05-net --vnet-name vnet-hub -o table` }],
          expect: 'peeringState: Connected on both sides.',
        },
        why: 'Peering is **not transitive**. Spoke-to-spoke traffic through a hub needs a network virtual appliance or gateway in the hub plus user-defined routes on each spoke — the peering alone does nothing for it.',
      },
      {
        id: 'l5-t5',
        title: 'Explain a decision with Network Watcher',
        goal: 'Use the tool that answers “would this packet be allowed, and which rule decided?”',
        steps: [
          { text: 'In the portal, open **Network Watcher → IP flow verify**.' },
          { text: 'Because this lab has no VMs, instead open **Network Watcher → Effective security rules** for any NIC in your subscription, or review the merged rule list you produced in task 2.' },
          { text: 'Trace what would happen to inbound TCP 80 against `snet-web`: your rule allows only 443, so DenyAllInBound at priority 65500 is the match.' },
        ],
        verify: {
          text: 'You can name the exact rule that would allow or deny a given flow, and its priority.',
        },
        why: 'In an incident this is the difference between guessing and knowing. IP flow verify names the deciding rule instead of leaving you to read the list yourself.',
      },
    ],
    cleanup: {
      text: 'Delete the resource group; peerings, NSGs and ASGs go with it.',
      code: [{ lang: 'bash', label: 'Azure CLI', code: `az group delete --name rg-lab05-net --yes --no-wait` }],
    },
  },
];
