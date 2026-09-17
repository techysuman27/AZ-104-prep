import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'vm-encryption',
  moduleId: 'virtual-machines',
  verified: '2026-09-14',
  sources: ['disk-encryption', 'storage-encryption'],
  changes: [
    {
      topic: 'VM disk encryption in the exam outline',
      previously: 'Older outlines asked candidates to configure **Azure Disk Encryption** (BitLocker or DM-Crypt inside the guest).',
      now: 'The April 2026 outline asks you to **configure encryption at host**. Azure Disk Encryption retires on September 15, 2028.',
      matters: 'Know what encryption at host adds over server-side encryption and that ADE is the legacy path.',
    },
  ],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Three layers, one exam answer',
      blocks: [
        {
          type: 'lead',
          text: 'Managed disks are always encrypted at rest. **Encryption at host** extends that protection to the temporary disk, disk caches and the data flowing between the host and storage — without using VM CPU.',
        },
        {
          type: 'explainer',
          technical: [
            '**Server-side encryption (SSE)** is always on for managed disks, using platform-managed keys by default or customer-managed keys through a **disk encryption set**. It doesn’t cover temp disks or caches.',
            '**[[encryption-at-host|Encryption at host]]** is a VM setting: the host encrypts temp disks and caches at rest and encrypts the flow to storage. It works with custom images and uses no guest CPU.',
            '**Azure Disk Encryption (ADE)** encrypts inside the guest with BitLocker or DM-Crypt and Key Vault. It **retires on September 15, 2028**, and can’t be combined with encryption at host on the same VM.',
          ],
          simple: [
            'Azure already scrambles the data on your VM’s disks in storage.',
            'Encryption at host also scrambles the scratch disk and the temporary copies kept on the physical server, and the traffic between them.',
            'The older approach encrypted inside the operating system; it’s being retired.',
          ],
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'What each option covers',
      blocks: [
        {
          type: 'table',
          columns: ['Protection', 'OS and data disks at rest', 'Temp disk', 'Disk caches', 'Uses VM CPU', 'Status'],
          rows: [
            ['Server-side encryption (always on)', 'Yes', 'No', 'No', 'No', 'Default'],
            ['Encryption at host', 'Yes', 'Yes', 'Yes', 'No', 'Recommended'],
            ['Azure Disk Encryption', 'Yes (in guest)', 'Yes (Windows)', 'n/a', 'Yes', 'Retires 15 Sep 2028'],
          ],
        },
        {
          type: 'steps',
          title: 'Enable encryption at host',
          steps: [
            { title: 'Register the feature', detail: 'Register `EncryptionAtHost` for the `Microsoft.Compute` namespace on the subscription (one time).' },
            { title: 'Check the VM size', detail: 'Not every VM size supports encryption at host.' },
            { title: 'Deallocate the VM', detail: 'Existing VMs must be stopped (deallocated) before the setting can change.' },
            { title: 'Enable and start', detail: 'Set `securityProfile.encryptionAtHost = true`, then start the VM.' },
          ],
        },
        {
          type: 'code',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# One-time subscription feature registration
az feature register --namespace Microsoft.Compute --name EncryptionAtHost
az feature show --namespace Microsoft.Compute --name EncryptionAtHost --query properties.state

# New VM with encryption at host
az vm create --resource-group rg-app-prod --name vm-app02 --image Ubuntu2204 \\
  --size Standard_D2s_v5 --encryption-at-host true \\
  --admin-username azureuser --generate-ssh-keys

# Existing VM (deallocate first)
az vm deallocate --resource-group rg-app-prod --name vm-app01
az vm update --resource-group rg-app-prod --name vm-app01 --set securityProfile.encryptionAtHost=true
az vm start --resource-group rg-app-prod --name vm-app01`,
              notes: [
                { token: 'az feature register', note: 'Required once per subscription before the setting can be used.' },
                { token: '--encryption-at-host true', note: 'Enables it at creation time.' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'If a requirement mentions encrypting the **temporary disk** or **disk caches**, the answer is encryption at host — not server-side encryption alone and not ADE.' },
        { type: 'quickcheck', questionIds: ['cmp-encryption-host'] },
      ],
    },
  ],
  takeaways: [
    'Server-side encryption of managed disks is always on and can use customer-managed keys via a disk encryption set.',
    'Encryption at host adds temp disk, cache and in-flight encryption without using VM CPU.',
    'The feature must be registered per subscription, the VM size must support it, and existing VMs must be deallocated.',
    'Azure Disk Encryption is legacy and retires on September 15, 2028.',
  ],
};

export default lesson;
