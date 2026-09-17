import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'admin-toolkit',
  moduleId: 'foundations',
  verified: '2026-09-14',
  sources: ['arm-overview', 'cloud-shell', 'bicep-decompile'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Four tools, one API',
      blocks: [
        {
          type: 'lead',
          text: 'Azure administrators switch between the **portal**, **Cloud Shell**, the **Azure CLI** and **Azure PowerShell** all day. They all call Azure Resource Manager, so the choice is about speed, repeatability and habit — not capability.',
        },
        {
          type: 'explainer',
          technical: [
            'The [[azure-portal|Azure portal]] is best for discovery and visual investigation. The [[azure-cli|Azure CLI]] (`az`) is cross-platform and fits Bash scripts. [[azure-powershell|Azure PowerShell]] (the Az module) returns objects that pipe naturally into other cmdlets.',
            '[[cloud-shell|Azure Cloud Shell]] is an authenticated browser terminal with both Bash and PowerShell and the CLI and Az module preinstalled. Its `$HOME` persists in an Azure file share.',
            'For anything you’ll deploy more than once, capture the desired state in [[bicep|Bicep]] or an [[arm-template|ARM template]] rather than in click-by-click instructions.',
          ],
          simple: [
            'The **portal** is like using a website with forms. It’s great for learning and looking around.',
            'The **CLI** and **PowerShell** are like typing instructions. They’re faster when you repeat work and they can be saved and shared.',
            '**Cloud Shell** is a command window inside your browser that’s already signed in — no installing anything.',
            '**Templates** are a written description of what you want to exist. Azure reads the description and builds it the same way every time.',
          ],
        },
      ],
    },
    {
      id: 'compare',
      kind: 'compare',
      title: 'Pick the right tool',
      blocks: [
        {
          type: 'compare',
          items: [
            { name: 'Azure portal', bestFor: 'Exploring, one-off changes, visual diagnostics', points: ['Shows every option with guidance', 'Metrics charts, topology and cost views', 'Hard to repeat exactly'] },
            { name: 'Azure CLI', bestFor: 'Bash scripts, pipelines, quick queries', points: ['`az <group> <command>` syntax', '`--query` filters JSON output', 'Runs on Windows, macOS and Linux'] },
            { name: 'Azure PowerShell', bestFor: 'PowerShell automation and object pipelines', points: ['`Verb-AzNoun` cmdlets such as `Get-AzVM`', 'Objects pipe between cmdlets', 'Familiar to Windows administrators'] },
            { name: 'Cloud Shell', bestFor: 'Running commands from any browser', points: ['Bash or PowerShell, already authenticated', 'Times out after 20 minutes without interaction', '`$HOME` persisted in a 5-GB file share'] },
            { name: 'Bicep / ARM templates', bestFor: 'Repeatable environments and change review', points: ['Declarative desired state', 'Preview changes with what-if', 'Store in source control'] },
          ],
        },
      ],
    },
    {
      id: 'example',
      kind: 'example',
      title: 'The same task in each tool',
      blocks: [
        {
          type: 'p',
          text: 'Creating a resource group and a storage account shows how the tools map to the same operations.',
        },
        {
          type: 'code',
          title: 'Create a resource group and storage account',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az group create --name rg-toolkit-demo --location westeurope

az storage account create \\
  --name sttoolkit$RANDOM \\
  --resource-group rg-toolkit-demo \\
  --location westeurope \\
  --sku Standard_ZRS \\
  --kind StorageV2 \\
  --min-tls-version TLS1_2 \\
  --allow-blob-public-access false`,
              notes: [
                { token: '--sku Standard_ZRS', note: 'Redundancy and performance combined: Standard tier with zone-redundant storage.' },
                { token: '--kind StorageV2', note: 'General-purpose v2, the recommended account type.' },
                { token: '--allow-blob-public-access false', note: 'Prevents containers from ever allowing anonymous read access.' },
              ],
            },
            {
              lang: 'powershell',
              label: 'PowerShell',
              code: `New-AzResourceGroup -Name rg-toolkit-demo -Location westeurope

New-AzStorageAccount -ResourceGroupName rg-toolkit-demo \`
  -Name "sttoolkit$(Get-Random -Maximum 99999)" \`
  -Location westeurope \`
  -SkuName Standard_ZRS \`
  -Kind StorageV2 \`
  -MinimumTlsVersion TLS1_2 \`
  -AllowBlobPublicAccess $false`,
            },
            {
              lang: 'bicep',
              label: 'Bicep',
              code: `param location string = resourceGroup().location

resource st 'Microsoft.Storage/storageAccounts@2025-06-01' = {
  name: 'sttoolkit\${uniqueString(resourceGroup().id)}'
  location: location
  sku: { name: 'Standard_ZRS' }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
  }
}`,
              notes: [
                { token: 'uniqueString(resourceGroup().id)', note: 'Generates a deterministic suffix so the globally unique name is stable across redeployments.' },
                { token: '@2025-06-01', note: 'The resource provider API version the template is written against.' },
              ],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Deploy the Bicep file with `az deployment group create --resource-group rg-toolkit-demo --template-file main.bicep`. Delete everything afterwards with `az group delete --name rg-toolkit-demo`.',
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Habits that save administrators time',
      blocks: [
        {
          type: 'list',
          style: 'check',
          items: [
            'Use `--output table` for reading and `--query` (JMESPath) to pull out exactly the property you need, e.g. `az vm list --query "[].{name:name, size:hardwareProfile.vmSize}" -o table`.',
            'Set a default subscription explicitly before scripting: `az account set --subscription <name-or-id>` or `Set-AzContext`.',
            'In the portal, many create experiences let you view or download a template of what you configured — a good bridge to infrastructure as code.',
            'Store scripts and templates in source control so changes are reviewed and repeatable.',
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
            { mistake: 'Running a destructive script against the wrong subscription.', fix: 'Check `az account show` (or `Get-AzContext`) first, and pass `--subscription` explicitly in scripts.' },
            { mistake: 'Documenting a production build as 40 portal screenshots.', fix: 'Capture it as Bicep so it can be reviewed, redeployed and compared with what-if.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        {
          type: 'callout',
          variant: 'exam',
          text: 'The exam shows CLI and PowerShell snippets and asks what they do or which parameter completes them. Read parameter names carefully — they encode the setting (for example `--sku Standard_GRS`, `--lock-type CanNotDelete`).',
        },
        { type: 'quickcheck', questionIds: ['st-cli-storage-sku'] },
      ],
    },
  ],
  takeaways: [
    'Portal, CLI, PowerShell, Cloud Shell and templates all use the same Azure Resource Manager API and permissions.',
    'Use the portal to explore, scripts to repeat, and templates to define environments.',
    'Cloud Shell includes Bash, PowerShell, the Azure CLI and Az module, and persists files in an Azure file share.',
    'Always confirm the active subscription before running scripts.',
  ],
};

export default lesson;
