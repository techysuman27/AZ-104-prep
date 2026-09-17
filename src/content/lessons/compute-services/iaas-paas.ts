import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'iaas-paas',
  moduleId: 'compute-services',
  verified: '2026-09-14',
  sources: ['appservice-plans', 'aci-overview', 'aca-containers'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'The line between your job and Azure’s',
      blocks: [
        {
          type: 'lead',
          text: 'Every compute service draws the line in a different place. Move up the stack and Azure takes over the operating system, the runtime and the scaling — and takes away the knobs that go with them.',
        },
        {
          type: 'explainer',
          technical: [
            '**IaaS** ([[virtual-machine|virtual machines]], [[vmss|scale sets]]): you own the guest OS, patching, the runtime and the application; Azure owns the hypervisor, hardware, network and datacentre.',
            '**PaaS** ([[app-service|App Service]], [[container-apps|Container Apps]]): Azure owns the OS and platform; you own the application, its configuration and its data.',
            'Identity, data classification, and access management are **always** yours, in every model.',
          ],
          simple: [
            'A VM is like renting an empty apartment: you furnish it and fix what breaks inside.',
            'App Service is a serviced apartment: the building handles maintenance, you just live there — but you can’t knock down walls.',
            'In both cases, who holds the keys is still your responsibility.',
          ],
        },
      ],
    },
    {
      id: 'compare',
      kind: 'compare',
      title: 'Who does what',
      blocks: [
        {
          type: 'table',
          caption: 'Responsibility by model. “You” means the customer; “Azure” means Microsoft.',
          columns: ['Layer', 'VM (IaaS)', 'App Service (PaaS)', 'Container Apps'],
          rows: [
            ['Application code', 'You', 'You', 'You'],
            ['Runtime / language stack', 'You', 'Azure', 'You (in the image)'],
            ['Guest OS patching', 'You', 'Azure', 'Azure'],
            ['Scaling', 'You (or a scale set)', 'You configure; Azure runs it', 'Azure, from rules — can scale to zero'],
            ['Host, hardware, physical network', 'Azure', 'Azure', 'Azure'],
            ['Identity and access, data', 'You', 'You', 'You'],
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          text: 'The trade is control for operational load. Ask what you actually need to control: if nothing on the list needs a custom OS configuration, a VM is a cost you’re choosing to carry.',
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Responsibility questions are usually phrased as “who is responsible for X?” Guest OS patching is the classic divider: yours on VMs, Azure’s on App Service and Container Apps.' },
        { type: 'quickcheck', questionIds: ['cmp-responsibility-patching'] },
      ],
    },
  ],
  takeaways: [
    'IaaS gives you the guest OS and everything above it; PaaS starts at your application.',
    'Guest OS patching is the clearest dividing line between VMs and App Service.',
    'Identity, access and data are your responsibility in every model.',
  ],
};

export default lesson;
