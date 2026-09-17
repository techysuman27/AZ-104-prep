import type { Lab } from '../schema';

/**
 * Labs 6–10: compute, infrastructure as code, App Service, containers and the
 * monitoring/backup close-out. These labs create billable resources, so every
 * one ends with a cleanup step that removes them.
 */
export const LABS_PART_2: Lab[] = [
  // ------------------------------------------------------------------- lab 6
  {
    id: 'lab-virtual-machines',
    number: 6,
    title: 'Virtual machines: zones, disks and secure access',
    summary: 'Deploy two VMs across availability zones, attach and expand a data disk, enable encryption at host, then reach the guest without opening a single inbound port.',
    minutes: 60,
    level: 4,
    estimatedCost: 'A few pounds or dollars if left running. Deallocate or delete at the end of the session.',
    prerequisites: ['Labs 1 and 5 completed', 'Contributor on a subscription in a region that offers availability zones'],
    objectives: [
      'Deploy VMs into separate availability zones',
      'Attach, initialise and expand a managed data disk',
      'Enable encryption at host and know what it covers',
      'Run a command inside a VM with no inbound network path',
    ],
    skills: ['cp.vm.create', 'cp.vm.availability', 'cp.vm.disks', 'cp.vm.encryption'],
    concepts: ['virtual-machine', 'availability-zone', 'managed-disk', 'encryption-at-host', 'nsg'],
    buildsOn: ['lab-networking'],
    sources: ['availability-zones', 'disk-types', 'disk-encryption', 'vm-availability', 'bastion-config'],
    tasks: [
      {
        id: 'l6-t1',
        title: 'Register encryption at host for the subscription',
        goal: 'Do the one-off opt-in first, because it has to be done before the VMs are created.',
        steps: [
          {
            text: 'Register the feature and wait for it to report Registered — this can take several minutes.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az feature register --namespace Microsoft.Compute --name EncryptionAtHost
az feature show --namespace Microsoft.Compute --name EncryptionAtHost --query properties.state -o tsv

# Once it says Registered, propagate it to the provider
az provider register --namespace Microsoft.Compute`,
              },
            ],
          },
        ],
        verify: {
          text: 'The feature state reads `Registered`.',
          expect: 'Registered (not Registering).',
        },
        why: 'Encryption at host encrypts the temporary disk and the OS and data disk caches on the host itself — the coverage Azure Disk Encryption and server-side encryption do not give you.',
      },
      {
        id: 'l6-t2',
        title: 'Deploy two VMs into different zones',
        goal: 'Build the availability pattern that survives losing a whole datacentre.',
        steps: [
          {
            text: 'Create the network and two VMs, one per zone, with encryption at host enabled.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az group create --name rg-lab06-vm --location westeurope --tags env=lab

az network vnet create --resource-group rg-lab06-vm --name vnet-lab06 \\
  --address-prefix 10.40.0.0/16 --subnet-name snet-app --subnet-prefix 10.40.1.0/24

for Z in 1 2; do
  az vm create --resource-group rg-lab06-vm --name vm-app0$Z --zone $Z \\
    --image Ubuntu2404 --size Standard_B2s \\
    --vnet-name vnet-lab06 --subnet snet-app --public-ip-address "" \\
    --admin-username azureuser --generate-ssh-keys \\
    --encryption-at-host true
done`,
              },
            ],
          },
        ],
        verify: {
          text: 'Confirm each VM reports a different zone.',
          code: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az vm list --resource-group rg-lab06-vm --show-details \\
  --query "[].{name:name, zone:zones[0], host:securityProfile.encryptionAtHost, publicIp:publicIps}" -o table`,
            },
          ],
          expect: 'Two VMs, zones 1 and 2, encryptionAtHost true, and no public IP addresses.',
        },
        why: '`--public-ip-address ""` deliberately creates no public IP. Availability set membership and zone placement are both fixed at creation, so this decision cannot be revisited later without rebuilding.',
        hint: 'If the size is unavailable in your region, pick another with `az vm list-sizes --location westeurope -o table`.',
      },
      {
        id: 'l6-t3',
        title: 'Attach and expand a data disk',
        goal: 'Practise the disk operations that appear constantly in real work and on the exam.',
        steps: [
          {
            text: 'Attach a new 32 GiB Premium SSD data disk to the first VM.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az vm disk attach --resource-group rg-lab06-vm --vm-name vm-app01 \\
  --name disk-app01-data --new --size-gb 32 --sku Premium_LRS`,
              },
            ],
          },
          {
            text: 'Now expand it to 64 GiB. The VM must be deallocated for most expansions.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az vm deallocate --resource-group rg-lab06-vm --name vm-app01
az disk update --resource-group rg-lab06-vm --name disk-app01-data --size-gb 64
az vm start --resource-group rg-lab06-vm --name vm-app01`,
              },
            ],
          },
          { text: 'Try to shrink the disk back to 32 GiB. It will fail — managed disks can only grow.' },
        ],
        verify: {
          text: 'The disk reports 64 GiB and the shrink attempt was rejected.',
          code: [{ lang: 'bash', label: 'Azure CLI', code: `az disk show --resource-group rg-lab06-vm --name disk-app01-data --query "{size:diskSizeGb, sku:sku.name}"` }],
        },
        why: 'Deallocate is also what stops compute billing. A guest-OS shutdown leaves the VM "Stopped (not deallocated)" and you keep paying for compute.',
      },
      {
        id: 'l6-t4',
        title: 'Reach the guest with no inbound path',
        goal: 'Fix something inside a VM that has no public IP, no Bastion and no inbound rules.',
        steps: [
          {
            text: 'Run a command through the Azure VM agent.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az vm run-command invoke --resource-group rg-lab06-vm --name vm-app01 \\
  --command-id RunShellScript \\
  --scripts "lsblk; echo '---'; hostnamectl"`,
              },
            ],
          },
          {
            text: 'Enable boot diagnostics and capture a screenshot — the first thing to check when a VM will not start.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az vm boot-diagnostics enable --resource-group rg-lab06-vm --name vm-app01
az vm boot-diagnostics get-boot-log --resource-group rg-lab06-vm --name vm-app01 | tail -20`,
              },
            ],
          },
        ],
        verify: {
          text: 'The run command output lists the block devices, including the 64 GiB data disk.',
          expect: 'A JSON result with the lsblk output in its message field.',
        },
        why: 'Run Command needs an RBAC permission, not a network path — which is why it works when RDP and SSH are unreachable, and why the permission to use it should be treated as remote code execution.',
      },
    ],
    cleanup: {
      text: 'Delete the resource group. This removes both VMs, their disks, NICs and the virtual network.',
      code: [{ lang: 'bash', label: 'Azure CLI', code: `az group delete --name rg-lab06-vm --yes --no-wait` }],
    },
  },

  // ------------------------------------------------------------------- lab 7
  {
    id: 'lab-scale-and-balance',
    number: 7,
    title: 'Scale sets, load balancing and autoscale',
    summary: 'Put a zone-spanning scale set behind a Standard load balancer, watch a health probe take an instance out of rotation, then tune autoscale rules so they do not oscillate.',
    minutes: 60,
    level: 5,
    estimatedCost: 'A few pounds or dollars while running. Delete at the end of the session.',
    prerequisites: ['Labs 5 and 6 completed'],
    objectives: [
      'Deploy a Flexible orchestration scale set across zones',
      'Configure a Standard load balancer with a health probe',
      'Break a probe deliberately and observe the effect',
      'Write autoscale rules with enough threshold headroom',
    ],
    skills: ['cp.vm.vmss', 'nw.dnslb.lb', 'nw.dnslb.troubleshoot'],
    concepts: ['vmss', 'autoscale', 'load-balancer', 'health-probe', 'availability-zone', 'public-ip'],
    buildsOn: ['lab-virtual-machines'],
    sources: ['vmss-modes', 'lb-skus', 'lb-components', 'lb-probes', 'default-outbound'],
    tasks: [
      {
        id: 'l7-t1',
        title: 'Create the scale set and load balancer',
        goal: 'Build the standard web tier: instances spread across zones behind one public front end.',
        steps: [
          {
            text: 'Create the scale set with Flexible orchestration, spread across three zones, with a load balancer.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az group create --name rg-lab07-scale --location westeurope --tags env=lab

az vmss create --resource-group rg-lab07-scale --name vmss-web \\
  --orchestration-mode Flexible --zones 1 2 3 \\
  --image Ubuntu2404 --vm-sku Standard_B1s --instance-count 2 \\
  --admin-username azureuser --generate-ssh-keys \\
  --load-balancer lb-web --lb-sku Standard \\
  --upgrade-policy-mode Automatic`,
              },
            ],
          },
          {
            text: 'Install a web server on every instance so there is something to probe.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az vmss extension set --resource-group rg-lab07-scale --vmss-name vmss-web \\
  --publisher Microsoft.Azure.Extensions --name CustomScript --version 2.1 \\
  --settings '{"commandToExecute":"apt-get update && apt-get install -y nginx && echo $(hostname) > /var/www/html/index.html && mkdir -p /var/www/html && echo ok > /var/www/html/health"}'`,
              },
            ],
          },
        ],
        verify: {
          text: 'Instances exist in more than one zone.',
          code: [{ lang: 'bash', label: 'Azure CLI', code: `az vm list --resource-group rg-lab07-scale --show-details --query "[].{name:name, zone:zones[0]}" -o table` }],
          expect: 'Two instances in different zones.',
        },
        why: 'Orchestration mode is fixed at creation. Flexible instances are ordinary VM resources, so they can span zones and fault domains and be managed individually.',
      },
      {
        id: 'l7-t2',
        title: 'Add an HTTP health probe and a rule',
        goal: 'Make the load balancer route only to instances that are actually serving.',
        steps: [
          {
            text: 'Create an HTTP probe on `/health` and a load balancing rule for port 80.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az network lb probe create --resource-group rg-lab07-scale --lb-name lb-web \\
  --name probe-http --protocol Http --port 80 --path /health \\
  --interval 5 --probe-threshold 2

az network lb rule create --resource-group rg-lab07-scale --lb-name lb-web \\
  --name rule-http --protocol Tcp --frontend-port 80 --backend-port 80 \\
  --frontend-ip-name loadBalancerFrontEnd \\
  --backend-pool-name $(az network lb address-pool list -g rg-lab07-scale --lb-name lb-web --query "[0].name" -o tsv) \\
  --probe-name probe-http`,
              },
            ],
          },
          {
            text: 'Allow inbound HTTP — a Standard public IP is closed by default.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `NSG=$(az network nsg list -g rg-lab07-scale --query "[0].name" -o tsv)
az network nsg rule create --resource-group rg-lab07-scale --nsg-name $NSG \\
  --name allow-http --priority 200 --direction Inbound --access Allow \\
  --protocol Tcp --destination-port-ranges 80`,
              },
            ],
          },
          {
            text: 'Browse to the load balancer’s public IP and refresh a few times.',
            code: [{ lang: 'bash', label: 'Azure CLI', code: `az network public-ip list -g rg-lab07-scale --query "[0].ipAddress" -o tsv` }],
          },
        ],
        verify: {
          text: 'The page loads and the hostname changes between refreshes.',
          expect: 'Different instance hostnames as the five-tuple hash distributes new flows.',
        },
        why: 'A Standard public IP is secure by default. Forgetting the NSG rule is the single most common reason a new load-balanced service appears to be broken.',
      },
      {
        id: 'l7-t3',
        title: 'Break a probe on purpose',
        goal: 'See what an unhealthy instance does to traffic, and what it does not do.',
        steps: [
          {
            text: 'Pick one instance and remove its health endpoint.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `VM=$(az vm list -g rg-lab07-scale --query "[0].name" -o tsv)
az vm run-command invoke -g rg-lab07-scale -n $VM --command-id RunShellScript \\
  --scripts "rm -f /var/www/html/health"`,
              },
            ],
          },
          { text: 'Wait about 15 seconds, then refresh the page repeatedly. Only the healthy instance should answer now.' },
          {
            text: 'Restore the endpoint and watch the instance return to rotation.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az vm run-command invoke -g rg-lab07-scale -n $VM --command-id RunShellScript \\
  --scripts "echo ok > /var/www/html/health"`,
              },
            ],
          },
        ],
        verify: {
          text: 'The hostname stops varying while the probe fails, and starts varying again once it is restored.',
        },
        why: 'A failing probe stops **new** flows to that instance; existing TCP connections continue until they end. An HTTP probe is healthy only on a 200 response — a 302 is a failure.',
      },
      {
        id: 'l7-t4',
        title: 'Write autoscale rules that settle',
        goal: 'Build a control loop, not two independent rules.',
        steps: [
          {
            text: 'Create the autoscale setting with a clear gap between the thresholds and a real cool-down.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `VMSS_ID=$(az vmss show -g rg-lab07-scale -n vmss-web --query id -o tsv)

az monitor autoscale create --resource-group rg-lab07-scale --resource $VMSS_ID \\
  --name autoscale-web --min-count 2 --max-count 6 --count 2

az monitor autoscale rule create --resource-group rg-lab07-scale --autoscale-name autoscale-web \\
  --condition "Percentage CPU > 75 avg 10m" --scale out 1 --cooldown 10

az monitor autoscale rule create --resource-group rg-lab07-scale --autoscale-name autoscale-web \\
  --condition "Percentage CPU < 40 avg 10m" --scale in 1 --cooldown 10`,
              },
            ],
          },
          {
            text: 'Generate CPU load on the instances and watch the instance count over the next 15–20 minutes.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `for VM in $(az vm list -g rg-lab07-scale --query "[].name" -o tsv); do
  az vm run-command invoke -g rg-lab07-scale -n $VM --command-id RunShellScript \\
    --scripts "nohup sh -c 'timeout 900 yes > /dev/null' &"
done`,
              },
            ],
          },
        ],
        verify: {
          text: 'The instance count rises and then settles, without repeatedly adding and removing.',
          code: [{ lang: 'bash', label: 'Azure CLI', code: `az monitor autoscale show -g rg-lab07-scale -n autoscale-web --query "profiles[0].capacity"` }],
          expect: 'A stable count above the minimum while load is applied.',
        },
        why: 'A 35-point gap and a 10-minute cool-down are what stop the set oscillating. Thresholds of 70 and 65 would flap: removing an instance would immediately push the average back above 70.',
        hint: 'Autoscale evaluates on a schedule — do not expect an instant reaction. Watch the instance count metric rather than refreshing the blade.',
      },
    ],
    cleanup: {
      text: 'Delete the resource group — scale set, load balancer, public IP and NSG go with it.',
      code: [{ lang: 'bash', label: 'Azure CLI', code: `az group delete --name rg-lab07-scale --yes --no-wait` }],
    },
  },

  // ------------------------------------------------------------------- lab 8
  {
    id: 'lab-iac',
    number: 8,
    title: 'Infrastructure as code with Bicep',
    summary: 'Deploy a parameterised Bicep template, preview a change with what-if, see what complete mode would delete, and export an existing environment back to a template.',
    minutes: 45,
    level: 4,
    estimatedCost: 'Pennies — one storage account and one virtual network.',
    prerequisites: ['Lab 1 completed', 'Cloud Shell (Bicep is pre-installed) or the Azure CLI with Bicep'],
    objectives: [
      'Read and modify a Bicep file',
      'Deploy with parameters and preview with what-if',
      'Explain the difference between incremental and complete mode',
      'Export a resource group and decompile it to Bicep',
    ],
    skills: ['cp.iac.interpret', 'cp.iac.modify-bicep', 'cp.iac.deploy', 'cp.iac.export'],
    concepts: ['bicep', 'arm-template', 'storage-account', 'vnet'],
    buildsOn: ['lab-foundations'],
    sources: ['arm-deployment-modes', 'bicep-decompile', 'arm-export', 'arm-overview'],
    tasks: [
      {
        id: 'l8-t1',
        title: 'Write and deploy a Bicep file',
        goal: 'Get a working deployment you can then change safely.',
        steps: [
          {
            text: 'Save this as `main.bicep` in Cloud Shell.',
            code: [
              {
                lang: 'bicep',
                label: 'main.bicep',
                code: `@description('Performance and redundancy of the storage account.')
@allowed([ 'Standard_LRS', 'Standard_ZRS', 'Standard_GRS' ])
param storageAccountType string = 'Standard_LRS'

param location string = resourceGroup().location

var storageAccountName = 'stlab08\${uniqueString(resourceGroup().id)}'

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

resource vnet 'Microsoft.Network/virtualNetworks@2024-05-01' = {
  name: 'vnet-lab08'
  location: location
  properties: {
    addressSpace: { addressPrefixes: [ '10.50.0.0/16' ] }
    subnets: [
      { name: 'snet-app', properties: { addressPrefix: '10.50.1.0/24' } }
    ]
  }
}

output storageAccountName string = st.name`,
              },
              {
                lang: 'bash',
                label: 'Deploy',
                code: `az group create --name rg-lab08-iac --location westeurope --tags env=lab

az deployment group create --resource-group rg-lab08-iac \\
  --template-file main.bicep --parameters storageAccountType=Standard_LRS`,
              },
            ],
          },
        ],
        verify: {
          text: 'The deployment succeeds and returns the generated storage account name as an output.',
          code: [{ lang: 'bash', label: 'Azure CLI', code: `az deployment group show -g rg-lab08-iac -n main --query properties.outputs` }],
        },
        why: 'Subnets are defined inside the virtual network’s `subnets` property so a redeployment does not remove them — a classic source of accidental outages.',
      },
      {
        id: 'l8-t2',
        title: 'Preview a change with what-if',
        goal: 'See exactly what a deployment would do before it does it.',
        steps: [
          {
            text: 'Run what-if with a different SKU and read the report.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az deployment group what-if --resource-group rg-lab08-iac \\
  --template-file main.bicep --parameters storageAccountType=Standard_GRS`,
              },
            ],
          },
          { text: 'Note the change is reported as **Modify** on the storage account’s sku.name, and **NoChange** on the virtual network.' },
          {
            text: 'Now apply it.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az deployment group create --resource-group rg-lab08-iac \\
  --template-file main.bicep --parameters storageAccountType=Standard_GRS`,
              },
            ],
          },
        ],
        verify: {
          text: 'The storage account now reports Standard_GRS.',
          code: [{ lang: 'bash', label: 'Azure CLI', code: `az storage account list -g rg-lab08-iac --query "[].{name:name, sku:sku.name}" -o table` }],
        },
        why: 'What-if reports Create, Modify, Delete, Deploy, Ignore and NoChange per resource. It costs seconds and prevents the deployment that quietly replaces a resource.',
      },
      {
        id: 'l8-t3',
        title: 'Understand complete mode without regretting it',
        goal: 'See what complete mode would remove — safely.',
        steps: [
          {
            text: 'Create an extra resource that the template does not define.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az network nsg create --resource-group rg-lab08-iac --name nsg-extra`,
              },
            ],
          },
          {
            text: 'Run what-if in complete mode. **Do not deploy it.**',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az deployment group what-if --resource-group rg-lab08-iac --mode Complete \\
  --template-file main.bicep --parameters storageAccountType=Standard_GRS`,
              },
            ],
          },
        ],
        verify: {
          text: 'The report lists `nsg-extra` under **Delete**.',
          expect: 'A Delete entry for the network security group.',
        },
        why: 'Incremental mode is the default and leaves untouched resources alone. Complete mode treats the template as the definition of the resource group. Microsoft now recommends incremental mode plus deployment stacks for managed deletion.',
      },
      {
        id: 'l8-t4',
        title: 'Export and decompile an existing environment',
        goal: 'Bring a hand-built environment under source control.',
        steps: [
          {
            text: 'Export the resource group to ARM JSON, then convert it to Bicep.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az group export --name rg-lab08-iac > exported.json
az bicep decompile --file exported.json
head -40 exported.bicep`,
              },
            ],
          },
          { text: 'Read the warnings. Note the hard-coded values and generated parameter names — this is a starting point, not a finished file.' },
        ],
        verify: {
          text: '`exported.bicep` exists and contains the storage account and virtual network.',
        },
        why: 'Export is a snapshot of current state and is not guaranteed for every resource type. The deployment history holds the exact template that was deployed, which is often the better starting point.',
      },
    ],
    cleanup: {
      text: 'Delete the resource group.',
      code: [{ lang: 'bash', label: 'Azure CLI', code: `az group delete --name rg-lab08-iac --yes --no-wait` }],
    },
  },

  // ------------------------------------------------------------------- lab 9
  {
    id: 'lab-app-service',
    number: 9,
    title: 'App Service: plans, slots and a safe release',
    summary: 'Create a plan and an app, add a staging slot, pin the environment-specific settings, swap into production with zero downtime, then roll it back.',
    minutes: 50,
    level: 4,
    estimatedCost: 'A Standard S1 plan is billed hourly. Delete the resource group at the end of the session.',
    prerequisites: ['Lab 1 completed'],
    objectives: [
      'Provision an App Service plan and an app',
      'Create a deployment slot and understand what shares the plan',
      'Mark settings as slot settings so they do not swap',
      'Swap with preview, then roll back by swapping again',
    ],
    skills: ['cp.app.plan', 'cp.app.create', 'cp.app.slots', 'cp.app.scaling'],
    concepts: ['app-service', 'app-service-plan', 'deployment-slot'],
    buildsOn: ['lab-foundations'],
    sources: ['appservice-plans', 'appservice-slots', 'appservice-limits', 'appservice-scale-up'],
    tasks: [
      {
        id: 'l9-t1',
        title: 'Create a Standard plan and an app',
        goal: 'Standard is the first tier with deployment slots and autoscale, which is why this lab starts there.',
        steps: [
          {
            text: 'Create the plan and app.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az group create --name rg-lab09-app --location westeurope --tags env=lab
APP=app-lab09-$RANDOM
echo "App name: $APP"

az appservice plan create --name plan-lab09 --resource-group rg-lab09-app \\
  --location westeurope --is-linux --sku S1 --number-of-workers 1

az webapp create --name $APP --resource-group rg-lab09-app \\
  --plan plan-lab09 --runtime "NODE:20-lts"`,
              },
            ],
          },
        ],
        verify: {
          text: 'Browsing to `https://<app>.azurewebsites.net` returns the default page.',
          code: [{ lang: 'bash', label: 'Azure CLI', code: `az webapp show -g rg-lab09-app -n $APP --query "{state:state, host:defaultHostName}"` }],
        },
        why: 'The plan fixes the OS and region permanently. Tier and instance count remain adjustable — that is the scale-up and scale-out distinction.',
      },
      {
        id: 'l9-t2',
        title: 'Add a staging slot and two settings',
        goal: 'Set up the release mechanism, including the setting that must not travel.',
        steps: [
          {
            text: 'Create the slot, then add one setting that should swap and one that should stick.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az webapp deployment slot create --name $APP --resource-group rg-lab09-app --slot staging

# Production values
az webapp config appsettings set -g rg-lab09-app -n $APP \\
  --settings RELEASE=v1 DB_NAME=prod-db --slot-settings DB_NAME

# Staging values
az webapp config appsettings set -g rg-lab09-app -n $APP --slot staging \\
  --settings RELEASE=v2 DB_NAME=staging-db --slot-settings DB_NAME`,
              },
            ],
          },
        ],
        verify: {
          text: 'DB_NAME is marked as a slot setting in both slots; RELEASE is not.',
          code: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az webapp config appsettings list -g rg-lab09-app -n $APP --query "[].{name:name, value:value, slotSetting:slotSetting}" -o table`,
            },
          ],
          expect: 'DB_NAME with slotSetting true, RELEASE with slotSetting false.',
        },
        why: 'Leaving the staging connection string unmarked is how production quietly ends up pointing at the staging database after a swap.',
      },
      {
        id: 'l9-t3',
        title: 'Swap with preview, then complete it',
        goal: 'Validate the source slot running with production settings before any traffic moves.',
        steps: [
          {
            text: 'Start a swap with preview. This applies production’s slot settings to staging and pauses.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az webapp deployment slot swap -g rg-lab09-app -n $APP \\
  --slot staging --target-slot production --action preview`,
              },
            ],
          },
          {
            text: 'Check staging’s settings during the pause — DB_NAME should now be the production value, because slot settings are applied from the target.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az webapp config appsettings list -g rg-lab09-app -n $APP --slot staging \\
  --query "[?name=='DB_NAME' || name=='RELEASE'].{name:name, value:value}" -o table`,
              },
            ],
          },
          {
            text: 'Complete the swap.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az webapp deployment slot swap -g rg-lab09-app -n $APP \\
  --slot staging --target-slot production --action swap`,
              },
            ],
          },
        ],
        verify: {
          text: 'Production now has RELEASE=v2 and still has DB_NAME=prod-db.',
          code: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az webapp config appsettings list -g rg-lab09-app -n $APP \\
  --query "[?name=='DB_NAME' || name=='RELEASE'].{name:name, value:value}" -o table`,
            },
          ],
          expect: 'RELEASE v2 (swapped), DB_NAME prod-db (sticky).',
        },
        why: 'Production must always be the **target** slot. All the restarting and warm-up happens on the source, so production stays online until routing switches once.',
      },
      {
        id: 'l9-t4',
        title: 'Roll back',
        goal: 'Prove the rollback is a routing change, not a redeployment.',
        steps: [
          {
            text: 'Swap the same two slots again.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az webapp deployment slot swap -g rg-lab09-app -n $APP \\
  --slot staging --target-slot production --action swap`,
              },
            ],
          },
        ],
        verify: {
          text: 'Production is back to RELEASE=v1, and DB_NAME never moved.',
          expect: 'RELEASE v1 in production.',
        },
        why: 'After a swap the previous production app is sitting in the staging slot. That is why swapping again is the fastest rollback available — and why you should not deploy over staging until the release has soaked.',
      },
    ],
    cleanup: {
      text: 'Delete the resource group. The App Service plan is billed until it is gone.',
      code: [{ lang: 'bash', label: 'Azure CLI', code: `az group delete --name rg-lab09-app --yes --no-wait` }],
    },
  },

  // ------------------------------------------------------------------ lab 10
  {
    id: 'lab-monitor-protect',
    number: 10,
    title: 'Monitor it, alert on it, back it up, restore it',
    summary: 'The capstone: route logs to a workspace, query them with KQL, alert through an action group, protect a VM with Azure Backup and prove the restore works.',
    minutes: 75,
    level: 6,
    estimatedCost: 'A small VM, a Log Analytics workspace and vault storage. Delete everything at the end.',
    prerequisites: ['Labs 1, 5 and 6 completed', 'Contributor on a subscription'],
    objectives: [
      'Send activity and resource logs to a Log Analytics workspace',
      'Answer “who changed this?” with a KQL query',
      'Create an action group and a metric alert rule',
      'Protect a VM with a backup policy and run an on-demand backup',
      'Restore and verify, choosing the right restore option',
    ],
    skills: ['mo.monitor.logs', 'mo.monitor.query', 'mo.monitor.alerts', 'mo.backup.rsv', 'mo.backup.policy', 'mo.backup.operations'],
    concepts: ['log-analytics-workspace', 'diagnostic-settings', 'activity-log', 'kql', 'alert-rule', 'action-group', 'recovery-services-vault', 'backup-policy', 'azure-backup'],
    buildsOn: ['lab-virtual-machines'],
    sources: ['diagnostic-settings', 'activity-log', 'kql-getting-started', 'alerts-overview', 'rsv-overview', 'vm-backup-enhanced', 'vm-restore'],
    tasks: [
      {
        id: 'l10-t1',
        title: 'Create a workspace and export the activity log',
        goal: 'Make the “who changed this?” question answerable beyond 90 days.',
        steps: [
          {
            text: 'Create the resource group, a workspace and a small VM to monitor.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az group create --name rg-lab10-ops --location westeurope --tags env=lab

az monitor log-analytics workspace create --resource-group rg-lab10-ops \\
  --workspace-name law-lab10 --location westeurope

az vm create --resource-group rg-lab10-ops --name vm-ops01 \\
  --image Ubuntu2404 --size Standard_B1s \\
  --admin-username azureuser --generate-ssh-keys --public-ip-address ""`,
              },
            ],
          },
          {
            text: 'Export the subscription activity log to the workspace.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `LAW_ID=$(az monitor log-analytics workspace show -g rg-lab10-ops -n law-lab10 --query id -o tsv)

az monitor diagnostic-settings subscription create --name activity-to-law \\
  --location westeurope --workspace $LAW_ID \\
  --logs '[{"category":"Administrative","enabled":true},{"category":"Policy","enabled":true}]'`,
              },
            ],
          },
        ],
        verify: {
          text: 'The diagnostic setting exists at subscription scope.',
          code: [{ lang: 'bash', label: 'Azure CLI', code: `az monitor diagnostic-settings subscription list --query "value[].name" -o tsv` }],
        },
        why: 'The activity log is the only place that records who created a resource, and Azure keeps it for just 90 days. Exporting it is what turns it into an audit trail.',
      },
      {
        id: 'l10-t2',
        title: 'Make a change, then find it with KQL',
        goal: 'Run the query you will actually reach for during an incident.',
        steps: [
          {
            text: 'Make a visible change to the VM.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az vm update -g rg-lab10-ops -n vm-ops01 --set tags.changedBy=lab10`,
              },
            ],
          },
          { text: 'Wait a few minutes — activity log entries are usually available within 3 to 20 minutes.' },
          {
            text: 'Open the workspace → **Logs** and run this query.',
            code: [
              {
                lang: 'kusto',
                label: 'KQL',
                code: `AzureActivity
| where TimeGenerated > ago(1h)
| where CategoryValue == "Administrative"
| where _ResourceId has "vm-ops01"
| project TimeGenerated, Caller, OperationNameValue, ActivityStatusValue
| sort by TimeGenerated desc`,
              },
            ],
          },
        ],
        verify: {
          text: 'The query returns a write operation on the VM, with your account in the Caller column.',
          expect: 'At least one row with OperationNameValue containing "virtualMachines/write".',
        },
        why: 'Values in AzureActivity can vary in case, which is why `has` and `=~` are safer than `==` for string comparisons here.',
      },
      {
        id: 'l10-t3',
        title: 'Create an action group and a metric alert',
        goal: 'Separate detection from notification, the way the alerting model is designed.',
        steps: [
          {
            text: 'Create the action group with your email, then an alert rule that uses it.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `MY_EMAIL=$(az ad signed-in-user show --query mail -o tsv)

az monitor action-group create --name ag-lab10 --resource-group rg-lab10-ops \\
  --short-name lab10 --action email me "$MY_EMAIL"

VM_ID=$(az vm show -g rg-lab10-ops -n vm-ops01 --query id -o tsv)
AG_ID=$(az monitor action-group show -g rg-lab10-ops -n ag-lab10 --query id -o tsv)

az monitor metrics alert create --name vm-cpu-high --resource-group rg-lab10-ops \\
  --scopes $VM_ID --condition "max Percentage CPU > 80" \\
  --window-size 5m --evaluation-frequency 1m --severity 2 --action $AG_ID`,
              },
            ],
          },
          {
            text: 'Drive the CPU up and wait for the alert.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az vm run-command invoke -g rg-lab10-ops -n vm-ops01 --command-id RunShellScript \\
  --scripts "nohup sh -c 'timeout 600 yes > /dev/null' &"`,
              },
            ],
          },
        ],
        verify: {
          text: 'The alert fires and an email arrives; the alert appears under **Monitor → Alerts**.',
          code: [{ lang: 'bash', label: 'Azure CLI', code: `az monitor metrics alert list -g rg-lab10-ops -o table` }],
        },
        why: 'The condition uses **max**, not average — average over five minutes would smooth exactly the spike you want to catch. Metric alerts are stateful by default and resolve after three consecutive passing checks.',
      },
      {
        id: 'l10-t4',
        title: 'Protect the VM and take an on-demand backup',
        goal: 'Create the vault correctly — redundancy first — then protect the machine.',
        steps: [
          {
            text: 'Create the vault and set its redundancy **before** protecting anything.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az backup vault create --name rsv-lab10 --resource-group rg-lab10-ops --location westeurope

az backup vault backup-properties set --name rsv-lab10 --resource-group rg-lab10-ops \\
  --backup-storage-redundancy GeoRedundant`,
              },
            ],
          },
          {
            text: 'Enable protection with the default policy, then take an on-demand backup.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az backup protection enable-for-vm --resource-group rg-lab10-ops --vault-name rsv-lab10 \\
  --vm $VM_ID --policy-name DefaultPolicy

az backup protection backup-now --resource-group rg-lab10-ops --vault-name rsv-lab10 \\
  --container-name vm-ops01 --item-name vm-ops01 \\
  --retain-until $(date -u -d "30 days" '+%d-%m-%Y')`,
              },
            ],
          },
        ],
        verify: {
          text: 'A backup job runs to completion and a recovery point exists.',
          code: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az backup job list -g rg-lab10-ops --vault-name rsv-lab10 -o table
az backup recoverypoint list -g rg-lab10-ops --vault-name rsv-lab10 \\
  --container-name vm-ops01 --item-name vm-ops01 -o table`,
            },
          ],
          expect: 'A Completed backup job and at least one recovery point.',
        },
        why: 'Storage redundancy cannot be changed once the vault holds a protected item. Getting it right on the empty vault is the whole point of doing it first.',
        hint: 'The first backup transfers the full VM and can take a while. Continue to the next task and come back to it.',
      },
      {
        id: 'l10-t5',
        title: 'Restore, and choose the right option',
        goal: 'Finish the loop — an untested backup is a hypothesis.',
        steps: [
          {
            text: 'Restore the disks from the recovery point into a separate resource group.',
            code: [
              {
                lang: 'bash',
                label: 'Azure CLI',
                code: `az group create --name rg-lab10-restore --location westeurope --tags env=lab
STAGING=stlab10$RANDOM
az storage account create --name $STAGING --resource-group rg-lab10-restore \\
  --location westeurope --sku Standard_LRS

RP=$(az backup recoverypoint list -g rg-lab10-ops --vault-name rsv-lab10 \\
  --container-name vm-ops01 --item-name vm-ops01 --query "[0].name" -o tsv)

az backup restore restore-disks --resource-group rg-lab10-ops --vault-name rsv-lab10 \\
  --container-name vm-ops01 --item-name vm-ops01 --rp-name $RP \\
  --storage-account $STAGING --target-resource-group rg-lab10-restore`,
              },
            ],
          },
          { text: 'Ask yourself why **Replace existing** was not the right choice here — and in which situation it would have been.' },
        ],
        verify: {
          text: 'Restored managed disks appear in `rg-lab10-restore`.',
          code: [{ lang: 'bash', label: 'Azure CLI', code: `az disk list -g rg-lab10-restore -o table` }],
        },
        why: 'Restore disks gives you the disks plus an ARM template, which is the option for a VM with a special network configuration. Replace existing needs the VM to still exist and is unsupported for classic, unmanaged and generalized VMs.',
      },
    ],
    cleanup: {
      text: 'Stop protection with delete data before removing the vault, then delete both resource groups and the subscription diagnostic setting.',
      code: [
        {
          lang: 'bash',
          label: 'Azure CLI',
          code: `az backup protection disable --resource-group rg-lab10-ops --vault-name rsv-lab10 \\
  --container-name vm-ops01 --item-name vm-ops01 --delete-backup-data true --yes

az monitor diagnostic-settings subscription delete --name activity-to-law --yes
az group delete --name rg-lab10-restore --yes --no-wait
az group delete --name rg-lab10-ops --yes --no-wait`,
        },
      ],
    },
  },
];
