import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'container-instances',
  moduleId: 'containers',
  verified: '2026-09-16',
  sources: ['aci-overview', 'aci-container-groups', 'aci-restart-policy', 'acr-auth'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'A container, running, in seconds',
      blocks: [
        {
          type: 'lead',
          text: '[[container-instances|Azure Container Instances]] runs a container without a cluster, an orchestrator or a VM. You specify an image, CPU and memory; Azure starts it and bills by the second.',
        },
        {
          type: 'explainer',
          technical: [
            'The top-level resource is the **container group**: a set of containers scheduled on the same host, sharing a lifecycle, local network and storage volumes — the same idea as a Kubernetes pod. Multi-container groups support **Linux containers only**.',
            'A group can expose one public IP address with one or more ports and a **DNS name label**, giving `<label>.<region>.azurecontainer.io`. Inside the group, containers reach each other over `localhost` on any port.',
            'Volumes can be an Azure Files share, a secret, an empty directory or a cloned git repo. A group needs a minimum of 1 CPU and 1 GB of memory in total.',
          ],
          simple: [
            'You hand Azure a container image and it runs it — nothing to build, patch or scale.',
            'If your job needs two containers side by side (an app and a log collector), you put them in one group so they share a network and a lifecycle.',
            'You pay for the seconds it runs, which is why it suits jobs that start, work and stop.',
          ],
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Restart policy decides what "finished" means',
      blocks: [
        {
          type: 'table',
          caption: 'The three documented restart policy values.',
          columns: ['Restart policy', 'Behaviour', 'Use it for'],
          rows: [
            ['`Always`', 'Containers are always restarted. This is the **default** when no policy is specified.', 'A long-running service that should stay up'],
            ['`OnFailure`', 'Restarted only when the process terminates with a nonzero exit code. The container runs at least once.', 'A task that must complete successfully, with retries'],
            ['`Never`', 'Not restarted when the process exits successfully (exit code 0). On a nonzero exit code the platform might still restart it.', 'A run-once task where a failure should not be retried'],
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          text: 'When a container with `Never` or `OnFailure` finishes, its status becomes **Terminated** and you read its output with `az container logs`. Billing stops when the container stops.',
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      blocks: [
        {
          type: 'code',
          title: 'Run a container',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# A public web container with a DNS label
az container create --resource-group rg-apps --name aci-web \\
  --image acrcontoso.azurecr.io/web:2.4 \\
  --cpu 1 --memory 1.5 --ports 80 \\
  --ip-address Public --dns-name-label contoso-web-demo \\
  --registry-login-server acrcontoso.azurecr.io \\
  --assign-identity <user-assigned-identity-id> \\
  --acr-identity <user-assigned-identity-id>

# A nightly job that runs once and stops
az container create --resource-group rg-apps --name aci-import \\
  --image acrcontoso.azurecr.io/import:1.0 --restart-policy OnFailure \\
  --azure-file-volume-share-name data --azure-file-volume-mount-path /data \\
  --azure-file-volume-account-name stappdata001

az container logs --resource-group rg-apps --name aci-import
az container export --resource-group rg-apps --name aci-web -f aci-web.yaml`,
              notes: [
                { token: '--dns-name-label', note: 'Gives the group an FQDN of <label>.<region>.azurecontainer.io. The IP can change if the group restarts.' },
                { token: '--acr-identity', note: 'Pull from Azure Container Registry with a managed identity instead of registry credentials.' },
                { token: '--restart-policy OnFailure', note: 'Runs the task at least once and retries only on a nonzero exit code.' },
                { token: 'az container export', note: 'Writes the group’s configuration to YAML so it can be stored as code.' },
              ],
            },
          ],
        },
        {
          type: 'list',
          style: 'check',
          items: [
            'Deploy a group into a **virtual network** to reach private resources — outbound connectivity from a network-joined group requires a NAT gateway.',
            'A group can be pinned to a specific **availability zone**.',
            'A group’s public IP address and FQDN are released when the group is deleted, and the IP can change on restart — don’t hard-code it.',
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Know the default restart policy (`Always`), which policy suits a run-once task (`OnFailure` or `Never`), that multi-container groups are Linux-only, and that a group is the unit of IP address, DNS label and lifecycle.' },
        { type: 'quickcheck', questionIds: ['app-aci-restart-policy', 'app-aci-group'] },
      ],
    },
  ],
  takeaways: [
    'The container group is the top-level resource: shared host, lifecycle, local network and volumes.',
    'Multi-container groups are Linux only; Windows supports a single container instance.',
    'Restart policy: Always (default), OnFailure, Never.',
    'A group gets one public IP with exposed ports and an optional DNS name label; billing is per second.',
  ],
};

export default lesson;
