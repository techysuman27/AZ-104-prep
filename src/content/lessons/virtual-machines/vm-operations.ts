import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'vm-operations',
  moduleId: 'virtual-machines',
  verified: '2026-09-14',
  sources: ['bastion-config', 'ama-overview', 'vm-availability'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Day two: connect, configure, diagnose',
      blocks: [
        {
          type: 'lead',
          text: 'Once VMs are running, most of the work is connecting to them securely, applying configuration at scale with **extensions**, and diagnosing them when they don’t behave.',
        },
        {
          type: 'explainer',
          technical: [
            'Connect with [[bastion|Azure Bastion]] (no public IP), or with **Run Command** to execute a script without any network path at all.',
            '**Extensions** are small agents Azure installs into the guest: Custom Script Extension for configuration, the [[azure-monitor-agent|Azure Monitor Agent]] for logs and metrics, the Network Watcher agent for connectivity tests.',
            '**Boot diagnostics** capture a screenshot and serial log; the **serial console** gives keyboard access to a VM that won’t boot or network correctly.',
          ],
          simple: [
            'Bastion is the secure door. Run Command is a way to hand a script to the VM through Azure when you can’t open any door.',
            'Extensions are helpers Azure installs inside the VM: one collects logs, another runs setup scripts.',
            'Boot diagnostics is a photo of the screen when a VM won’t start — usually the fastest way to see what’s wrong.',
          ],
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      blocks: [
        {
          type: 'code',
          title: 'Everyday operations',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# Run a script inside a VM without any inbound connectivity
az vm run-command invoke --resource-group rg-app-prod --name vm-app01 \\
  --command-id RunShellScript --scripts "systemctl restart nginx"

# Install the Custom Script Extension
az vm extension set --resource-group rg-app-prod --vm-name vm-app01 \\
  --publisher Microsoft.Azure.Extensions --name CustomScript \\
  --settings '{"commandToExecute":"apt-get update && apt-get install -y nginx"}'

# Boot diagnostics and a screenshot of a VM that won't start
az vm boot-diagnostics enable --resource-group rg-app-prod --name vm-app01
az vm boot-diagnostics get-boot-log --resource-group rg-app-prod --name vm-app01`,
              notes: [
                { token: 'run-command invoke', note: 'Uses the Azure agent, so it works even when RDP/SSH is blocked. Requires appropriate RBAC permissions.' },
                { token: 'CustomScript', note: 'On Windows use publisher Microsoft.Compute and name CustomScriptExtension.' },
                { token: 'boot-diagnostics', note: 'Screenshot and serial log — the first place to look when a VM won’t boot.' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'troubleshoot',
      kind: 'troubleshoot',
      title: 'A VM you can’t reach',
      blocks: [
        {
          type: 'decision',
          tree: {
            id: 'vm-trouble',
            title: 'Diagnose a VM you can’t connect to',
            start: 'q1',
            nodes: {
              q1: { kind: 'question', text: 'What does the VM’s status show?', options: [{ label: 'Stopped or deallocated', next: 'r-start' }, { label: 'Running', next: 'q2' }] },
              q2: { kind: 'question', text: 'Does Network Watcher IP flow verify allow your connection to the RDP/SSH port?', options: [{ label: 'No — denied by a rule', next: 'r-nsg' }, { label: 'Yes', next: 'q3' }] },
              q3: { kind: 'question', text: 'Does the boot diagnostics screenshot show a healthy login screen or console?', options: [{ label: 'No — errors or a boot loop', next: 'r-boot' }, { label: 'Yes', next: 'r-guest' }] },
              'r-start': { kind: 'result', title: 'Start the VM', text: 'Start it, then check whether an automation schedule or a budget-driven runbook stopped it.', concepts: ['virtual-machine'] },
              'r-nsg': { kind: 'result', title: 'Fix the network rule', text: 'Update the NSG (or connect through Bastion, which needs 3389/22 allowed from the Bastion subnet).', concepts: ['nsg', 'bastion'] },
              'r-boot': { kind: 'result', title: 'Use the serial console', text: 'Boot diagnostics and the serial console let you repair boot configuration, disk or driver problems.', tone: 'caution', concepts: ['virtual-machine'] },
              'r-guest': { kind: 'result', title: 'Look inside the guest', text: 'Use Run Command to check the service, guest firewall and listening ports.', concepts: ['virtual-machine'] },
            },
          },
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Tool questions: run a script without network access → Run Command; see why a VM won’t boot → boot diagnostics / serial console; collect guest logs → Azure Monitor Agent with a data collection rule.' },
        { type: 'quickcheck', questionIds: ['cmp-run-command'] },
      ],
    },
  ],
  takeaways: [
    'Bastion and Run Command give secure access without public IPs.',
    'Extensions install agents and run configuration inside the guest.',
    'Boot diagnostics and the serial console diagnose VMs that won’t boot.',
    'Guest logs and metrics need the Azure Monitor Agent and a data collection rule.',
  ],
};

export default lesson;
