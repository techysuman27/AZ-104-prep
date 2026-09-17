import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'arm-templates',
  moduleId: 'infrastructure-as-code',
  verified: '2026-09-14',
  sources: ['arm-deployment-modes', 'arm-export', 'arm-overview'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Describing infrastructure instead of clicking it',
      blocks: [
        {
          type: 'lead',
          text: 'An **ARM template** is a JSON document describing the resources you want. Azure Resource Manager compares it with what exists and makes the difference — the same way, every time.',
        },
        {
          type: 'explainer',
          technical: [
            'A template has `$schema`, `contentVersion`, `parameters`, `variables`, `resources` and `outputs`. Resources declare `type`, `apiVersion`, `name`, `location` and `properties`.',
            'Template functions build values: `resourceGroup().location`, `uniqueString()`, `concat()`, `resourceId()`.',
            'Templates are **declarative and idempotent**: deploying the same template again produces the same end state.',
          ],
          simple: [
            'A template is a shopping list plus assembly instructions. Hand it to Azure and it builds exactly what’s on the list.',
            'Run it again tomorrow and you get the same result — no missed steps, no forgotten settings.',
          ],
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Reading a template',
      blocks: [
        {
          type: 'code',
          title: 'A storage account template',
          tabs: [
            {
              lang: 'json',
              label: 'azuredeploy.json',
              code: `{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "storageAccountType": {
      "type": "string",
      "defaultValue": "Standard_LRS",
      "allowedValues": [ "Standard_LRS", "Standard_ZRS", "Standard_GRS" ],
      "metadata": { "description": "Performance and redundancy of the account." }
    },
    "location": {
      "type": "string",
      "defaultValue": "[resourceGroup().location]"
    }
  },
  "variables": {
    "storageAccountName": "[concat('store', uniquestring(resourceGroup().id))]"
  },
  "resources": [
    {
      "type": "Microsoft.Storage/storageAccounts",
      "apiVersion": "2025-06-01",
      "name": "[variables('storageAccountName')]",
      "location": "[parameters('location')]",
      "sku": { "name": "[parameters('storageAccountType')]" },
      "kind": "StorageV2",
      "properties": { "minimumTlsVersion": "TLS1_2", "allowBlobPublicAccess": false }
    }
  ],
  "outputs": {
    "storageAccountName": {
      "type": "string",
      "value": "[variables('storageAccountName')]"
    }
  }
}`,
              notes: [
                { token: 'parameters', note: 'Values supplied at deployment time. `allowedValues` restricts the choices; `defaultValue` makes them optional.' },
                { token: 'variables', note: 'Values computed inside the template, often names built with `uniquestring()`.' },
                { token: 'apiVersion', note: 'The resource provider API version the resource definition targets.' },
                { token: 'outputs', note: 'Values returned after deployment — useful for pipelines and linked templates.' },
              ],
            },
            {
              lang: 'bash',
              label: 'Deploy',
              code: `az deployment group create --resource-group rg-app \\
  --template-file azuredeploy.json \\
  --parameters storageAccountType=Standard_ZRS

# Preview changes before deploying
az deployment group what-if --resource-group rg-app \\
  --template-file azuredeploy.json --parameters storageAccountType=Standard_ZRS`,
              notes: [{ token: 'what-if', note: 'Shows what would be created, modified or deleted — always run it before a production deployment.' }],
            },
          ],
        },
        {
          type: 'list',
          style: 'check',
          items: [
            'Dependencies between resources are declared with `dependsOn` (or created implicitly by `reference()` and `resourceId()` in Bicep).',
            'You can’t change an existing resource’s location or type through a deployment.',
            'Define subnets inside the virtual network’s `subnets` property so redeployments don’t remove them.',
          ],
        },
      ],
    },
    {
      id: 'example',
      kind: 'example',
      title: 'Getting a template from an existing environment',
      blocks: [
        {
          type: 'table',
          columns: ['Source', 'What you get', 'Caveats'],
          rows: [
            ['Resource group → Export template', 'A snapshot of current state, as ARM JSON or Bicep', 'Up to 200 resources; many hard-coded values; export isn’t guaranteed for every resource type'],
            ['Deployment history → Template', 'The exact template that was deployed, with its parameters', 'ARM JSON only; doesn’t include manual changes made afterwards'],
            ['Portal create blade → Download a template for automation', 'A template for what you just configured', 'A good starting point for parameterization'],
          ],
        },
        {
          type: 'code',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az group export --name rg-app > rg-app.json
az bicep decompile --file rg-app.json   # convert to Bicep (best effort)`,
              notes: [{ token: 'az group export', note: 'Exports the resource group as an ARM template snapshot.' }],
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
        { type: 'callout', variant: 'exam', text: 'You’ll be shown a template and asked what it deploys or which section to modify. Learn the five sections and where SKUs, names and locations live.' },
        { type: 'quickcheck', questionIds: ['cmp-arm-sections'] },
      ],
    },
  ],
  takeaways: [
    'ARM templates are declarative JSON with parameters, variables, resources and outputs.',
    'Deployments are idempotent — the template describes the desired end state.',
    'Use what-if to preview changes.',
    'Export from a resource group gives a snapshot; deployment history gives the exact template deployed.',
  ],
};

export default lesson;
