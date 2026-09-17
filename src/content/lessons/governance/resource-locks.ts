import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'resource-locks',
  moduleId: 'governance',
  verified: '2026-09-14',
  sources: ['locks', 'control-data-plane', 'move-resources'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'A safety catch that even Owners must release',
      blocks: [
        {
          type: 'lead',
          text: 'One mistaken `az group delete` can remove a production network. **Resource locks** prevent deletion or modification of critical resources for **every** user, regardless of their role.',
        },
        {
          type: 'explainer',
          technical: [
            'A [[resource-lock|lock]] is either **CanNotDelete** (portal: *Delete*) — read and modify allowed, delete blocked — or **ReadOnly** (portal: *Read-only*) — read allowed, update and delete blocked.',
            'Locks can be applied to subscriptions, resource groups and resources, and are inherited by child resources, including ones created later. The most restrictive lock in the chain applies.',
            'Locks apply to **control plane** operations through Azure Resource Manager only. They don’t protect data inside a resource, such as blobs or database rows.',
            'Creating and removing locks requires `Microsoft.Authorization/locks/*` — included in Owner and User Access Administrator.',
          ],
          simple: [
            'A **Delete** lock is a “do not throw away” sign. You can still use and adjust the item, but not remove it.',
            'A **Read-only** lock is a “look but don’t touch” sign. You can’t change or delete anything — and some everyday actions that count as changes stop working too.',
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'Test which operations still work',
      blocks: [
        {
          type: 'interactive',
          id: 'lock-evaluator',
          intro: 'Place locks at subscription, resource group or resource level and try common administrator operations. Some Read-only results surprise even experienced admins.',
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Surprising side effects of ReadOnly',
      blocks: [
        {
          type: 'p',
          text: 'Many operations that look like reads are implemented as POST requests, so a ReadOnly lock blocks them:',
        },
        {
          type: 'table',
          columns: ['Lock', 'What breaks', 'Why it matters'],
          rows: [
            ['ReadOnly on a storage account', 'Listing access keys; creating role assignments scoped to the account', 'Tools that authenticate with keys stop working'],
            ['ReadOnly on a resource group with VMs', 'Starting or restarting VMs', 'Operations teams can’t recover a stopped VM'],
            ['ReadOnly on a resource group with an App Service plan', 'Scaling the plan up or out', 'Autoscale and manual scaling fail'],
            ['ReadOnly on a resource group or subscription', 'Moving resources in or out', 'Reorganizations are blocked'],
            ['CanNotDelete on a resource or resource group', 'Deleting role assignments at that scope', 'Access clean-up fails'],
            ['CanNotDelete on the resource group Azure Backup uses for restore points', 'Backups fail when old restore points can’t be cleaned up', 'Data protection silently degrades'],
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'A lock on a single resource inside a resource group makes deleting the whole resource group fail — nothing is partially deleted.',
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      title: 'Create and remove locks',
      blocks: [
        {
          type: 'code',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# Protect a resource group from deletion
az lock create --name protect-network --lock-type CanNotDelete \\
  --resource-group rg-network-prod --notes "Shared hub network"

# List locks in a resource group
az lock list --resource-group rg-network-prod --output table

# Remove a lock before planned decommissioning
az lock delete --name protect-network --resource-group rg-network-prod`,
              notes: [
                { token: '--lock-type', note: '`CanNotDelete` or `ReadOnly`.' },
                { token: '--notes', note: 'Explain why the lock exists so the next administrator doesn’t remove it casually.' },
              ],
            },
            {
              lang: 'powershell',
              label: 'PowerShell',
              code: `New-AzResourceLock -LockName protect-network -LockLevel CanNotDelete \`
  -ResourceGroupName rg-network-prod -LockNotes "Shared hub network"`,
            },
            {
              lang: 'bicep',
              label: 'Bicep',
              code: `resource lock 'Microsoft.Authorization/locks@2016-09-01' = {
  name: 'protect-network'
  properties: {
    level: 'CanNotDelete'
    notes: 'Shared hub network'
  }
}`,
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
            { mistake: 'Using ReadOnly as a general “protect production” lock.', fix: 'Use CanNotDelete for most protection; ReadOnly breaks routine operations such as VM start and key listing.' },
            { mistake: 'Expecting a delete lock on a storage account to prevent blob deletion.', fix: 'Locks don’t protect data. Use soft delete, versioning and restricted data roles.' },
            { mistake: 'Trying to lock a management group.', fix: 'Lock the subscriptions or resource groups beneath it.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'trap', text: 'If an Owner “can’t delete” a resource, check for a lock at the resource, resource group or subscription before assuming a permission problem.' },
        { type: 'quickcheck', questionIds: ['gov-lock-readonly-vm', 'gov-lock-data-plane'] },
      ],
    },
  ],
  takeaways: [
    'CanNotDelete blocks deletion; ReadOnly blocks updates and deletion.',
    'Locks apply to subscriptions, resource groups and resources, inherit downward, and affect everyone including Owners.',
    'Locks affect the control plane only, not data inside resources.',
    'ReadOnly blocks POST-based operations such as listing storage keys and starting VMs.',
    'Owner and User Access Administrator can manage locks.',
  ],
};

export default lesson;
