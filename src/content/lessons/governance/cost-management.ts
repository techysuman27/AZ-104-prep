import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'cost-management',
  moduleId: 'governance',
  verified: '2026-09-14',
  sources: ['budgets', 'advisor', 'tags'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Seeing and steering cloud spend',
      blocks: [
        {
          type: 'lead',
          text: 'Cloud costs grow quietly — a forgotten VM here, an oversized database there. **Budgets** warn you before overspending, **cost analysis** shows where money goes, and **Azure Advisor** tells you what to change.',
        },
        {
          type: 'explainer',
          technical: [
            'A [[budget]] defines an amount for a scope (management group, subscription, resource group, or billing scope) and reset period, with alert conditions on **actual** or **forecasted** cost.',
            'Budgets are evaluated about once every 24 hours and only notify — they never stop resources. At subscription and resource group scope they can call an [[action-group|action group]] to trigger automation you build.',
            '[[azure-advisor|Azure Advisor]] provides recommendations in five categories: Reliability, Security, Performance, Cost and Operational excellence.',
          ],
          simple: [
            'A budget is a spending alarm: “tell me when we’ve used 80% of this month’s money, or when we’re on track to go over.”',
            'It doesn’t switch anything off — it makes sure someone knows in time to act.',
            'Advisor is a consultant who looks at your setup and says “this VM is barely used — shrink it and save money.”',
          ],
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'How budgets and alerts work',
      blocks: [
        {
          type: 'table',
          columns: ['Setting', 'Options and limits'],
          rows: [
            ['Scope', 'Management group, subscription, resource group (plus billing account scopes)'],
            ['Reset period', 'Monthly, quarterly or annually (billing month/quarter/year for some offers)'],
            ['Alert type', 'Actual cost or forecasted cost'],
            ['Thresholds', 'Up to five thresholds per budget, from 0.01% to 1000%'],
            ['Recipients', 'Up to five email addresses; action groups at subscription and resource group scopes'],
            ['Timing', 'Cost data arrives within 8–24 hours; budgets are evaluated every 24 hours'],
            ['Filters', 'Narrow to resource groups, services, tags and other dimensions'],
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'A **forecasted** alert at 90–100% warns you mid-month that you’re on course to overspend, while there’s still time to act. An **actual** alert at 100% confirms you have.',
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      blocks: [
        {
          type: 'portal',
          title: 'Create a monthly budget for a resource group',
          path: ['Cost Management', 'Budgets', 'Add'],
          steps: [
            { label: 'Scope and details', fields: [{ name: 'Scope', value: 'rg-data-analytics' }, { name: 'Reset period', value: 'Monthly' }, { name: 'Amount', value: '5000' }] },
            { label: 'Alert conditions', fields: [{ name: 'Forecasted', value: '90%', hint: 'Early warning before the money is spent.' }, { name: 'Actual', value: '100%' }] },
            { label: 'Recipients', fields: [{ name: 'Alert recipients (email)', value: 'data-leads@contoso.com' }, { name: 'Action group', value: 'ag-data-oncall', hint: 'Can trigger a runbook, Logic App or webhook.' }] },
          ],
        },
        {
          type: 'list',
          style: 'check',
          items: [
            'Owners can create and modify all budgets; Contributors and Cost Management Contributors can create and modify their own; Readers can view.',
            'New subscriptions can take up to 48 hours before Cost Management features are usable.',
            'Group cost analysis by **tag** to show spend by application, owner or cost center.',
          ],
        },
      ],
    },
    {
      id: 'example',
      kind: 'example',
      title: 'Act on Advisor recommendations',
      blocks: [
        {
          type: 'steps',
          steps: [
            { title: 'Open Advisor → Cost', detail: 'Review recommendations such as right-sizing or shutting down underutilized VMs.' },
            { title: 'Validate with the owner', detail: 'Low average CPU can hide monthly batch peaks — check metrics before resizing.' },
            { title: 'Implement, postpone or dismiss', detail: 'Postponed and dismissed recommendations can be reactivated later. Implemented changes can take up to a day to disappear from the list.' },
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
            { mistake: 'Assuming a budget caps spending and stops resources.', fix: 'Budgets only alert. Build automation with an action group if resources must be stopped.' },
            { mistake: 'Only using actual-cost alerts.', fix: 'Add forecasted alerts so you’re warned before the money is spent.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'trap', text: '“Automatically stop VMs when the budget is exceeded” can’t be done with a budget alone — you need a budget alert calling an action group that runs automation.' },
        { type: 'quickcheck', questionIds: ['gov-budget-stop', 'gov-advisor-categories'] },
      ],
    },
  ],
  takeaways: [
    'Budgets alert on actual or forecasted cost; they never stop resources by themselves.',
    'Up to five thresholds and five emails per budget; action groups at subscription and resource group scope.',
    'Budgets are evaluated every 24 hours and cost data can lag by up to a day.',
    'Advisor categories: Reliability, Security, Performance, Cost, Operational excellence.',
  ],
};

export default lesson;
