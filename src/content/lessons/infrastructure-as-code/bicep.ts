import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'bicep',
  moduleId: 'infrastructure-as-code',
  verified: '2026-09-14',
  sources: ['bicep-decompile', 'arm-deployment-modes'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'The same deployments, far less noise',
      blocks: [
        {
          type: 'lead',
          text: '**Bicep** is a language purpose-built for Azure deployments. It compiles to ARM JSON, so nothing changes about how Azure deploys — only how much you have to read and write.',
        },
        {
          type: 'explainer',
          technical: [
            'Declarations: `param`, `var`, `resource`, `module`, `output`, with decorators such as `@description` and `@allowed`.',
            'Referencing a resource by its symbolic name (for example `st.id`) creates the dependency automatically — no manual `dependsOn` in most cases.',
            '`az bicep build` compiles Bicep to ARM JSON; `az bicep decompile` converts JSON to Bicep on a best-effort basis.',
          ],
          simple: [
            'Bicep is a shorter, clearer way to write the same instructions. Azure turns it into the JSON version behind the scenes.',
            'If you already have JSON templates, a command converts them to Bicep to get you started.',
          ],
        },
      ],
    },
    {
      id: 'example',
      kind: 'example',
      title: 'The same storage account, in Bicep',
      blocks: [
        {
          type: 'code',
          tabs: [
            {
              lang: 'bicep',
              label: 'main.bicep',
              code: `@description('Performance and redundancy of the account.')
@allowed([ 'Standard_LRS', 'Standard_ZRS', 'Standard_GRS' ])
param storageAccountType string = 'Standard_LRS'

param location string = resourceGroup().location

var storageAccountName = 'store\${uniqueString(resourceGroup().id)}'

resource st 'Microsoft.Storage/storageAccounts@2025-06-01' = {
  name: storageAccountName
  location: location
  sku: { name: storageAccountType }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
  }
}

output storageAccountName string = st.name`,
              notes: [
                { token: '@allowed', note: 'A decorator that restricts parameter values, like allowedValues in ARM JSON.' },
                { token: 'st.name', note: 'Symbolic references make dependencies and outputs simple and type-checked.' },
              ],
            },
            {
              lang: 'bash',
              label: 'Build, convert, deploy',
              code: `az bicep build --file main.bicep        # produces main.json
az bicep decompile --file main.json     # JSON → Bicep (best effort)

az deployment group create --resource-group rg-app \\
  --template-file main.bicep --parameters storageAccountType=Standard_ZRS`,
              notes: [{ token: 'az deployment group create --template-file main.bicep', note: 'Bicep files deploy directly; the CLI compiles them for you.' }],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Decompiled Bicep is a starting point, not a finished file: review warnings, replace hard-coded values with parameters, and note that periods in parameter names become underscores.',
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Expect to modify a Bicep file (change a SKU, add a parameter) or to pick the command that converts JSON to Bicep: `az bicep decompile`.' },
        { type: 'quickcheck', questionIds: ['cmp-bicep-decompile'] },
      ],
    },
  ],
  takeaways: [
    'Bicep compiles to ARM JSON and deploys through the same Resource Manager engine.',
    'Symbolic references create dependencies automatically.',
    '`az bicep build` compiles; `az bicep decompile` converts JSON to Bicep.',
    'Decompiled files need review and parameterization.',
  ],
};

export default lesson;
