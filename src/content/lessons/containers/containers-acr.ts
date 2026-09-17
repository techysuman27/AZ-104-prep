import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'containers-acr',
  moduleId: 'containers',
  verified: '2026-09-16',
  sources: ['acr-skus', 'acr-auth', 'managed-identities'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Image, registry, container',
      blocks: [
        {
          type: 'lead',
          text: 'An **image** is a packaged application and everything it needs to run. A **registry** stores images. A **container** is an image that is running. [[container-registry|Azure Container Registry]] is the managed private registry.',
        },
        {
          type: 'explainer',
          technical: [
            'Images are addressed as `<registry>.azurecr.io/<repository>:<tag>`, for example `acrcontoso.azurecr.io/web:2.4`. A tag is a moving label; the digest is the immutable identity.',
            'A registry is a resource in a resource group and region, with its own pricing plan (Basic, Standard, Premium) that determines included storage, throughput and features.',
            'Access is authorised with Microsoft Entra: assign **AcrPull** to whatever pulls the image and **AcrPush** to whatever publishes it.',
          ],
          simple: [
            'An image is like an installer that already contains the app and its dependencies.',
            'The registry is the private app store where your team keeps those installers.',
            'A container is one copy of the app actually running.',
          ],
        },
      ],
    },
    {
      id: 'compare',
      kind: 'compare',
      title: 'The three pricing plans',
      blocks: [
        {
          type: 'table',
          caption: 'Documented ACR plan features. All three plans share the same APIs and have zone redundancy enabled by default in supported regions.',
          columns: ['Resource or feature', 'Basic', 'Standard', 'Premium'],
          rows: [
            ['Included storage', '10 GiB', '100 GiB', '500 GiB'],
            ['Webhooks', '2', '10', '500'],
            ['Anonymous pull access', 'Not available', 'Supported', 'Supported'],
            ['Geo-replication', 'Not available', 'Not available', 'Supported'],
            ['Private link with private endpoints', 'Not available', 'Not available', 'Supported'],
            ['IP access rules', 'Not available', 'Not available', 'Supported'],
            ['Customer-managed keys', 'Not available', 'Not available', 'Supported'],
            ['Content trust', 'Not available', 'Not available', 'Supported'],
          ],
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'The Premium triggers',
          text: 'Geo-replication, private endpoints, IP access rules, customer-managed keys and content trust all mean Premium. You can change plan at any time with no downtime, but you must delete geo-replications before moving down from Premium.',
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      title: 'Create, push and authorise',
      blocks: [
        {
          type: 'code',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az acr create --resource-group rg-apps --name acrcontoso --sku Standard

# Build in Azure and push, without a local Docker daemon
az acr build --registry acrcontoso --image web:2.4 .

# Or push an image you built locally
az acr login --name acrcontoso
docker push acrcontoso.azurecr.io/web:2.4

# Let a container app pull with its managed identity — no passwords anywhere
az role assignment create --assignee <managed-identity-principal-id> \\
  --role AcrPull --scope $(az acr show --name acrcontoso --query id -o tsv)

az acr update --name acrcontoso --sku Premium   # when you need geo-replication or private endpoints
az acr replication create --registry acrcontoso --location northeurope`,
              notes: [
                { token: 'az acr build', note: 'Runs the build in Azure using ACR Tasks and pushes the result — useful when the build host has no Docker.' },
                { token: 'AcrPull', note: 'The built-in role for pulling images. AcrPush adds publishing. Prefer these over the admin user.' },
                { token: 'az acr replication create', note: 'Geo-replication requires the Premium plan.' },
              ],
            },
          ],
        },
        {
          type: 'list',
          style: 'check',
          items: [
            'Prefer **managed identities** with AcrPull for services that pull images — ACI, Container Apps, App Service and AKS all support it.',
            'The **admin user** is a single shared username and password on the registry. It is meant for testing, is disabled by default, and every client using it shares one identity.',
            'Use **repository-scoped tokens** when a client should see only some repositories.',
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'trap', text: 'When a question asks for the most secure way to let a service pull an image, the answer is a managed identity with the AcrPull role — not the admin user and not a service principal secret.' },
        { type: 'quickcheck', questionIds: ['app-acr-sku', 'app-acr-pull-auth'] },
      ],
    },
  ],
  takeaways: [
    'Image → registry → container; images are referenced as registry/repository:tag.',
    'Basic, Standard and Premium differ by storage, throughput and features.',
    'Geo-replication, private endpoints, IP rules, CMK and content trust need Premium.',
    'Grant AcrPull to a managed identity instead of enabling the admin user.',
  ],
};

export default lesson;
