import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'vm-anatomy',
  moduleId: 'virtual-machines',
  verified: '2026-09-14',
  sources: ['vm-availability', 'disk-types', 'default-outbound', 'bastion-config'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'A VM is a small system, not one resource',
      blocks: [
        {
          type: 'lead',
          text: 'Creating a virtual machine creates several resources: the VM itself, an OS disk, a network interface, and usually a public IP and network security group. Knowing which resource owns which setting makes VMs far easier to build, change and delete.',
        },
        {
          type: 'explainer',
          technical: [
            'A [[virtual-machine|VM]] is IaaS: Azure runs the hardware and hypervisor; you own the operating system, patching, software and configuration.',
            'Every VM has a [[network-interface|NIC]] in a [[subnet]], at least one [[managed-disk|OS disk]], an optional temporary disk provided by the host, and optional data disks.',
            'VM **size** (family and series) determines vCPU, memory, maximum disks, network bandwidth and which features — such as premium storage or encryption at host — are supported.',
          ],
          simple: [
            'A VM is a rented computer. Azure keeps the building, power and physical machine running; everything inside the operating system is yours to manage.',
            'The parts arrive separately: the computer, its hard disk, its network card, and optionally an internet address — each of which you can see as its own resource in Azure.',
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'What “create a VM” actually creates',
      blocks: [
        {
          type: 'flow',
          title: 'Resources behind one VM',
          alt: 'A VM resource connects to an OS disk, a data disk, a network interface in a subnet, an optional public IP, and an NSG. A temporary disk is provided by the host.',
          spec: {
            root: {
              type: 'group',
              id: 'rg',
              label: 'rg-app-prod',
              kind: 'rg',
              children: [
                { type: 'node', id: 'vm', label: 'vm-app01', sub: 'Standard_D2s_v5', icon: 'vm', tone: 'accent', concept: 'virtual-machine' },
                { type: 'node', id: 'os', label: 'OS disk', sub: 'Premium SSD, managed', icon: 'disk', concept: 'managed-disk' },
                { type: 'node', id: 'data', label: 'Data disk', sub: 'Optional, attached', icon: 'disk' },
                { type: 'node', id: 'nic', label: 'NIC', sub: '10.1.2.4', icon: 'nic', concept: 'network-interface' },
                { type: 'node', id: 'nsg', label: 'NSG', sub: 'Filters traffic', icon: 'nsg', concept: 'nsg' },
                { type: 'node', id: 'tmp', label: 'Temporary disk', sub: 'On the host — data can be lost', icon: 'disk', tone: 'warn', detail: 'The temporary disk (often D: on Windows) lives on the physical host. Redeploys, resizes and maintenance can wipe it. Never store data you need there.' },
              ],
            },
            edges: [
              { from: 'vm', to: 'os' },
              { from: 'vm', to: 'data' },
              { from: 'vm', to: 'nic' },
              { from: 'nic', to: 'nsg', style: 'dashed' },
              { from: 'vm', to: 'tmp', style: 'dashed', tone: 'muted' },
            ],
          },
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Sizes, states and billing',
      blocks: [
        {
          type: 'table',
          caption: 'VM power states and what you pay for',
          columns: ['State', 'How you get there', 'Compute billed?', 'Disks billed?'],
          rows: [
            ['Running', 'Normal operation', 'Yes', 'Yes'],
            ['Stopped', 'Shut down inside the guest OS', 'Yes — resources stay allocated', 'Yes'],
            ['Stopped (deallocated)', 'Stop in the portal, `az vm deallocate`', 'No', 'Yes'],
            ['Deleted', 'Delete the VM resource', 'No', 'Only if disks are deleted too'],
          ],
        },
        {
          type: 'callout',
          variant: 'trap',
          text: 'Shutting a VM down from inside Windows or Linux leaves it **allocated** — you keep paying for compute. Deallocate from Azure to stop compute charges.',
        },
        {
          type: 'list',
          style: 'check',
          items: [
            'VM series are optimized for general purpose, compute, memory, storage or GPU workloads.',
            'Resizing restarts the VM. If the target size isn’t available on the current hardware cluster, deallocate first and then resize.',
            'Deleting a VM doesn’t automatically delete its disks and NIC unless you selected that option at creation.',
          ],
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      title: 'Create and resize a VM',
      blocks: [
        {
          type: 'code',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# A Linux VM with no public IP — administration happens through Bastion
az vm create --resource-group rg-app-prod --name vm-app01 \\
  --image Ubuntu2204 --size Standard_D2s_v5 \\
  --vnet-name vnet-app --subnet snet-app \\
  --public-ip-address "" --nsg "" \\
  --admin-username azureuser --generate-ssh-keys

# Which sizes can this VM be resized to right now?
az vm list-vm-resize-options --resource-group rg-app-prod --name vm-app01 --output table

az vm resize --resource-group rg-app-prod --name vm-app01 --size Standard_D4s_v5

# Stop compute billing
az vm deallocate --resource-group rg-app-prod --name vm-app01`,
              notes: [
                { token: '--public-ip-address ""', note: 'Creates the VM without a public IP address.' },
                { token: '--nsg ""', note: 'Skips creating a NIC-level NSG — rely on the subnet NSG instead.' },
                { token: 'list-vm-resize-options', note: 'Sizes available without deallocating, based on the current hardware cluster.' },
              ],
            },
            {
              lang: 'powershell',
              label: 'PowerShell',
              code: `Get-AzVMSize -ResourceGroupName rg-app-prod -VMName vm-app01 | Select-Object Name, NumberOfCores, MemoryInMB

$vm = Get-AzVM -ResourceGroupName rg-app-prod -Name vm-app01
$vm.HardwareProfile.VmSize = "Standard_D4s_v5"
Update-AzVM -ResourceGroupName rg-app-prod -VM $vm

Stop-AzVM -ResourceGroupName rg-app-prod -Name vm-app01 -Force`,
              notes: [{ token: 'Stop-AzVM', note: 'Deallocates the VM (use -StayProvisioned to keep it allocated).' }],
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
            { mistake: 'Giving every VM a public IP so administrators can connect.', fix: 'Use Azure Bastion and keep VMs without public IPs.' },
            { mistake: 'Deleting VMs and leaving orphaned disks, NICs and public IPs behind.', fix: 'Check the resource group afterwards, or enable delete-with-VM options at creation.' },
            { mistake: 'Storing application data on the temporary disk.', fix: 'Use data disks or Azure Files; the temporary disk isn’t persistent.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Billing states are a favourite: shut down inside the OS = still billed; deallocated = compute not billed, disks still billed.' },
        { type: 'quickcheck', questionIds: ['cmp-vm-deallocate', 'cmp-vm-resize'] },
      ],
    },
  ],
  takeaways: [
    'A VM comes with disks, a NIC and often a public IP and NSG — each a separate resource.',
    'Deallocating stops compute charges; stopping inside the guest OS doesn’t.',
    'The temporary disk isn’t persistent.',
    'Resizing restarts the VM and may require deallocation.',
    'Prefer Bastion over public IPs for administration.',
  ],
};

export default lesson;
