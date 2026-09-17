import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'choosing-compute',
  moduleId: 'compute-services',
  verified: '2026-09-14',
  sources: ['appservice-plans', 'aci-overview', 'aca-containers', 'aca-scale', 'vmss-modes'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Start from the workload, not the service',
      blocks: [
        {
          type: 'lead',
          text: 'Exam scenarios describe a workload and its constraints, then ask for the service. The constraints — OS control, container image, run duration, scale to zero, microservices — are what decide it.',
        },
        {
          type: 'list',
          style: 'bullet',
          items: [
            '**Does it need a specific OS configuration, a legacy dependency, or a lift-and-shift of an existing server?** → [[virtual-machine|Virtual Machine]], or [[vmss|VM Scale Sets]] when identical instances must scale.',
            '**Is it a web app or API on a supported runtime?** → [[app-service|App Service]], with [[deployment-slot|deployment slots]] for zero-downtime releases.',
            '**Is it a single container, run on demand or on a schedule — a build job, a batch task?** → [[container-instances|Container Instances]].',
            '**Is it containerized microservices that need service discovery, revisions and scale to zero?** → [[container-apps|Container Apps]].',
          ],
        },
      ],
    },
    {
      id: 'decide',
      kind: 'decide',
      title: 'Decision tree',
      blocks: [
        {
          type: 'decision',
          tree: {
            id: 'choose-compute',
            title: 'Which compute service?',
            start: 'q-os',
            nodes: {
              'q-os': {
                kind: 'question',
                text: 'Does the workload need control of the operating system — kernel settings, a legacy agent, or an unmodified lift-and-shift?',
                options: [
                  { label: 'Yes', next: 'q-scale-vm' },
                  { label: 'No', next: 'q-container' },
                ],
              },
              'q-scale-vm': {
                kind: 'question',
                text: 'Do you need many identical instances that scale automatically?',
                options: [
                  { label: 'Yes', next: 'r-vmss' },
                  { label: 'No — a few managed servers', next: 'r-vm' },
                ],
              },
              'q-container': {
                kind: 'question',
                text: 'Is the application packaged as a container image?',
                options: [
                  { label: 'Yes', next: 'q-container-shape' },
                  { label: 'No — source code on a supported runtime', next: 'r-appservice' },
                ],
              },
              'q-container-shape': {
                kind: 'question',
                text: 'What shape is the container workload?',
                help: 'Think about lifetime and how many services talk to each other.',
                options: [
                  { label: 'A single task that runs and exits', next: 'r-aci' },
                  { label: 'Long-running microservices with revisions and scale to zero', next: 'r-aca' },
                  { label: 'One web container, no orchestration needed', next: 'r-appservice-container' },
                ],
              },
              'r-vm': {
                kind: 'result',
                title: 'Virtual Machine',
                text: 'Full OS control, any software, any configuration — and full responsibility for patching, availability and scaling.',
                concepts: ['virtual-machine'],
              },
              'r-vmss': {
                kind: 'result',
                title: 'Virtual Machine Scale Sets',
                text: 'Identical VMs managed as one resource, with autoscale rules and zone spreading. Use the Flexible orchestration mode unless a feature requires Uniform.',
                concepts: ['vmss', 'autoscale'],
              },
              'r-appservice': {
                kind: 'result',
                title: 'App Service',
                text: 'Managed hosting for web apps and APIs: built-in TLS, custom domains, slots, autoscaling and no OS to patch.',
                concepts: ['app-service', 'deployment-slot'],
              },
              'r-appservice-container': {
                kind: 'result',
                title: 'App Service (container)',
                text: 'App Service also runs a single custom container, keeping slots, custom domains and managed certificates.',
                concepts: ['app-service', 'container-registry'],
              },
              'r-aci': {
                kind: 'result',
                title: 'Azure Container Instances',
                text: 'Per-second billing for containers that start, do their work and stop. No orchestrator, no load balancing, no scaling rules.',
                concepts: ['container-instances'],
              },
              'r-aca': {
                kind: 'result',
                title: 'Azure Container Apps',
                text: 'Serverless containers with ingress, revisions, KEDA-based scale rules and scale to zero — for microservices and event-driven work.',
                concepts: ['container-apps'],
              },
            },
          },
        },
      ],
    },
    {
      id: 'compare',
      kind: 'compare',
      title: 'The distinguishing features',
      blocks: [
        {
          type: 'table',
          columns: ['Service', 'Choose it when', 'Does not do'],
          rows: [
            ['Virtual Machine', 'OS control, legacy software, lift-and-shift', 'Patch or scale itself'],
            ['VM Scale Sets', 'Identical VMs with autoscale and zone spreading', 'Remove the OS from your responsibility'],
            ['App Service', 'Web apps and APIs on a managed runtime, slots, custom domains', 'Give you the underlying OS'],
            ['Container Instances', 'One-off or scheduled container tasks, fast start, per-second billing', 'Autoscale, ingress, service discovery'],
            ['Container Apps', 'Microservices, revisions, event-driven scaling including to zero', 'Give you node-level control (that is AKS)'],
          ],
        },
        {
          type: 'callout',
          variant: 'trap',
          text: 'Scale to zero and event-driven scaling point to Container Apps. A short-lived single container with no scaling requirement points to Container Instances.',
        },
      ],
    },
    {
      id: 'connections',
      kind: 'connections',
      title: 'Think like an administrator',
      blocks: [
        {
          type: 'adminLens',
          answers: [
            { q: 'service', a: 'Choose the least-management service the constraints allow. Drop to a VM only when OS control is genuinely required.' },
            { q: 'security', a: 'Every option supports [[managed-identity|managed identities]], so application credentials never live in configuration.' },
            { q: 'network', a: 'App Service reaches private resources through VNet integration; [[private-endpoint|private endpoints]] make the app itself reachable only from your network.' },
            { q: 'cost', a: 'Plan tier, VM size and scale rules are the main levers — Container Apps can scale to zero, VMs must be deallocated to stop compute charges.' },
            { q: 'monitoring', a: 'All of them emit platform metrics to [[azure-monitor|Azure Monitor]]; VMs additionally need the Azure Monitor Agent for guest metrics and logs.' },
          ],
        },
        { type: 'connections', conceptId: 'app-service' },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Read the constraint, not the workload name. “Must run a custom kernel module” → VM. “Must scale to zero” → Container Apps. “Runs for five minutes each night” → Container Instances.' },
        { type: 'quickcheck', questionIds: ['cmp-choose-aca', 'cmp-choose-aci'] },
      ],
    },
  ],
  takeaways: [
    'Constraints choose the service: OS control, container image, run duration, scale to zero.',
    'VMs and scale sets keep OS responsibility with you.',
    'App Service hosts web apps and APIs with slots and managed certificates.',
    'ACI runs short-lived single containers; Container Apps runs scaling microservices.',
  ],
};

export default lesson;
