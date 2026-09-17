import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'deployments',
  moduleId: 'infrastructure-as-code',
  verified: '2026-09-14',
  sources: ['arm-deployment-modes', 'arm-export', 'bicep-decompile'],
  changes: [
    {
      topic: 'Complete deployment mode',
      previously: 'Complete mode was used to make a resource group match a template exactly, deleting anything else.',
      now: 'Microsoft recommends incremental mode and says complete mode will be gradually deprecated; deployment stacks are the recommended way to delete resources.',
      matters: 'Incremental is still the default, and the exam still expects you to know that complete mode deletes resources not in the template.',
    },
  ],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Incremental or complete — the difference is deletion',
      blocks: [
        {
          type: 'lead',
          text: 'Both modes create and update the resources in your template. Only **complete** mode deletes resources in the resource group that aren’t in the template.',
        },
        {
          type: 'explainer',
          technical: [
            '**Incremental** (default): resources in the resource group but not in the template are left untouched. Resources in the template are created or updated — and properties you omit are **reset to their defaults**, because the template describes the end state.',
            '**Complete**: resources in the resource group that aren’t in the template are **deleted**. It isn’t supported at subscription scope or in the portal, and nested or linked deployments always run incrementally.',
            'Run **what-if** before any significant deployment to see exactly what will change.',
          ],
          simple: [
            'Incremental: “make sure these things exist and look like this” — anything else in the room is left alone.',
            'Complete: “this list is the room” — anything not on the list is thrown out.',
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'See both modes run',
      blocks: [{ type: 'interactive', id: 'deployment-modes', intro: 'Choose which resources the template contains and compare what happens in incremental and complete mode.' }],
    },
    {
      id: 'configure',
      kind: 'configure',
      blocks: [
        {
          type: 'code',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# Default: incremental
az deployment group create --resource-group rg-app --template-file main.bicep

# Preview first
az deployment group what-if --resource-group rg-app --template-file main.bicep

# Complete mode: deletes resources in rg-app that aren't in the template
az deployment group create --resource-group rg-app --mode Complete --template-file main.bicep`,
              notes: [
                { token: '--mode Complete', note: 'Dangerous: everything not in the template is deleted from the resource group.' },
                { token: 'what-if', note: 'Reports Create, Modify, Delete, Deploy, Ignore and NoChange for each resource.' },
              ],
            },
            {
              lang: 'powershell',
              label: 'PowerShell',
              code: `New-AzResourceGroupDeployment -ResourceGroupName rg-app -TemplateFile main.bicep -WhatIf
New-AzResourceGroupDeployment -ResourceGroupName rg-app -TemplateFile main.bicep -Mode Complete`,
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
            { mistake: 'Running complete mode against a shared resource group.', fix: 'Use incremental mode; if resources must be removed, use deployment stacks or delete them explicitly.' },
            { mistake: 'Assuming properties left out of a template keep their current values in incremental mode.', fix: 'Unspecified properties are reset to defaults — describe the full desired state.' },
            { mistake: 'Skipping what-if for “small” changes.', fix: 'What-if takes seconds and prevents surprises such as an implicit resource replacement.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'trap', text: 'The default is **incremental**. Complete mode deletes resources not in the template, and isn’t supported at subscription scope or from the portal.' },
        { type: 'quickcheck', questionIds: ['cmp-deployment-mode', 'cmp-deployment-incremental-props'] },
      ],
    },
  ],
  takeaways: [
    'Incremental (default) leaves untouched resources alone; complete deletes what isn’t in the template.',
    'In both modes, unspecified properties of deployed resources reset to defaults.',
    'Use what-if before deploying.',
    'Complete mode isn’t supported at subscription scope or in the portal; nested deployments are always incremental.',
  ],
};

export default lesson;
