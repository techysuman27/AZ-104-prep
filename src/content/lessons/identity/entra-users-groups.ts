import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'entra-users-groups',
  moduleId: 'identity',
  verified: '2026-09-14',
  sources: ['dynamic-groups', 'users-bulk-add', 'group-licensing', 'roles-compare', 'rbac-overview'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Identities first, access second',
      blocks: [
        {
          type: 'lead',
          text: 'Before anyone can manage a VM or read a file, they need an identity. In Azure that identity lives in **Microsoft Entra ID** as a **user**, and access is best granted through **groups**.',
        },
        {
          type: 'explainer',
          technical: [
            'A [[entra-user|user]] is a directory object with a user principal name (UPN), authentication methods and properties such as `department`, `jobTitle` and `usageLocation`. Users are **members** (your organization) or **guests** (invited external users).',
            'A [[entra-group|group]] collects identities so access, licences and app assignments are granted once. **Security groups** grant access; **Microsoft 365 groups** add collaboration features such as a shared mailbox and SharePoint site.',
            'Membership is **assigned** (managed manually) or **dynamic** ([[dynamic-group|rule-based]], requires Microsoft Entra ID P1).',
          ],
          simple: [
            'A **user** is one person’s account — their sign-in name plus details like department and job title.',
            'A **group** is a list of people. Instead of giving 50 people access one by one, you give the group access once and manage who is on the list.',
            'A **dynamic group** manages its own list using a rule such as “everyone in the Sales department” — people join and leave automatically when their details change.',
          ],
        },
      ],
    },
    {
      id: 'why',
      kind: 'why',
      blocks: [
        {
          type: 'p',
          text: 'Access granted to individuals doesn’t survive real life. People change teams, go on leave and resign. When permissions are attached to groups, the joiner-mover-leaver process becomes “update group membership” — and with dynamic groups, even that happens automatically from HR data.',
        },
        {
          type: 'analogy',
          title: 'Keys vs a badge system',
          story: 'A small shop gives every employee physical keys. When someone leaves, the owner must remember which keys they had. A large office uses badges tied to roles: change the person’s role in the system and every door they can open changes with it.',
          mapping: [
            { analogy: 'The person’s badge', azure: '[[entra-user|User account]]' },
            { analogy: 'A role in the badge system (“Finance staff”)', azure: '[[entra-group|Group]]' },
            { analogy: 'Automatic role assignment from HR records', azure: '[[dynamic-group|Dynamic membership rule]]' },
            { analogy: 'The door access list', azure: 'Role assignments, licences and app assignments on the group' },
          ],
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'User and group types',
      blocks: [
        {
          type: 'table',
          caption: 'Group types and membership types',
          columns: ['', 'Security group', 'Microsoft 365 group'],
          rows: [
            ['Main purpose', 'Grant access to resources, apps and Azure roles', 'Collaboration: mailbox, calendar, SharePoint, Teams'],
            ['Members', 'Users, devices, service principals, other groups', 'Users only'],
            ['Assigned membership', 'Yes', 'Yes'],
            ['Dynamic membership', 'Users **or** devices', 'Users only'],
            ['Can receive Azure roles', 'Yes', 'Yes'],
          ],
        },
        {
          type: 'steps',
          title: 'How dynamic membership works',
          steps: [
            { title: 'Write a rule', detail: 'For example `user.department -eq "Sales"`, or all members but not guests: `(user.objectId -ne null) -and (user.userType -eq "Member")`.' },
            { title: 'Entra ID evaluates it', detail: 'Users (or devices) whose properties match are added; those who stop matching are removed. Processing isn’t instant.' },
            { title: 'Everything granted to the group follows', detail: 'Licences, app access and Azure role assignments apply to the current members.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Limits worth remembering',
          text: 'You can’t add members manually to a dynamic group. A rule targets users or devices, not both. Dynamic groups need a Microsoft Entra ID P1 licence for each unique user member, and a tenant can have up to 15,000 dynamic membership groups. Groups that are assigned Microsoft Entra roles must use assigned membership.',
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      title: 'Create users and groups',
      blocks: [
        {
          type: 'portal',
          title: 'Create a dynamic security group',
          path: ['Microsoft Entra admin center', 'Groups', 'All groups', 'New group'],
          steps: [
            {
              label: 'Basics',
              fields: [
                { name: 'Group type', value: 'Security', hint: 'Use Microsoft 365 only when you need collaboration features.' },
                { name: 'Group name', value: 'Sales – All staff' },
                { name: 'Membership type', value: 'Dynamic User', hint: 'Assigned lets you add members manually; Dynamic Device targets devices.' },
              ],
            },
            {
              label: 'Dynamic user members',
              detail: 'Select **Add dynamic query**, then build the rule in the rule builder or edit the rule syntax directly.',
              fields: [
                { name: 'Property', value: 'department' },
                { name: 'Operator', value: 'Equals' },
                { name: 'Value', value: 'Sales', hint: 'The value must match the attribute data coming from HR or on-premises AD.' },
              ],
            },
            { label: 'Create and validate', detail: 'Use **Validate rules** to test the rule against specific users before saving.' },
          ],
        },
        {
          type: 'code',
          title: 'Script users and groups',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# Create a cloud-only user who must change the password at first sign-in
az ad user create \\
  --display-name "Ada Lovelace" \\
  --user-principal-name ada@contoso.onmicrosoft.com \\
  --password "<temporary-strong-password>" \\
  --force-change-password-next-sign-in true

# Create an assigned security group and add the user
az ad group create --display-name "App Team - Prod" --mail-nickname appteamprod
az ad group member add --group "App Team - Prod" \\
  --member-id $(az ad user show --id ada@contoso.onmicrosoft.com --query id -o tsv)`,
              notes: [
                { token: '--force-change-password-next-sign-in', note: 'The temporary password must be replaced at first sign-in.' },
                { token: '--mail-nickname', note: 'Required by the directory even for security groups.' },
                { token: '--member-id', note: 'The object ID of the user, group or service principal to add.' },
              ],
            },
            {
              lang: 'powershell',
              label: 'Microsoft Graph PowerShell',
              code: `Connect-MgGraph -Scopes "Group.ReadWrite.All"

# Dynamic security group for the Sales department
New-MgGroup -DisplayName "Sales - All staff" \`
  -MailEnabled:$false -MailNickname "salesallstaff" -SecurityEnabled \`
  -GroupTypes "DynamicMembership" \`
  -MembershipRule 'user.department -eq "Sales"' \`
  -MembershipRuleProcessingState "On"`,
              notes: [
                { token: '-GroupTypes "DynamicMembership"', note: 'Makes membership rule-based.' },
                { token: '-MembershipRuleProcessingState "On"', note: 'Starts evaluating the rule. "Paused" stops processing.' },
              ],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'For many users at once, use **Users → Bulk create** (at least User Administrator): download the CSV template, fill in one user per row and upload it. Bulk create makes member accounts and sends no invitations; use bulk invite for guests.',
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
            { mistake: 'Assigning Azure roles directly to dozens of individual users.', fix: 'Assign roles to groups. Access reviews, onboarding and offboarding become membership changes.' },
            { mistake: 'Building dynamic rules on attributes that HR doesn’t reliably fill in.', fix: 'Agree on authoritative attributes (department, employeeType, country) and keep them clean first.' },
            { mistake: 'Trying to add a manager manually to a dynamic group “just this once”.', fix: 'Dynamic groups don’t allow manual members. Create a separate assigned group or adjust the attribute.' },
          ],
        },
      ],
    },
    {
      id: 'scenario',
      kind: 'scenario',
      blocks: [
        {
          type: 'scenario',
          company: 'Tailwind Traders',
          context: 'Tailwind hires about 40 retail staff a month across 12 stores. IT currently adds each person to six groups by hand.',
          problem: 'New staff wait days for access, and people who move stores keep their old store’s access.',
          approach: [
            'Agree with HR that `department`, `officeLocation` and `employeeType` are authoritative and always populated.',
            'Create dynamic security groups such as `user.officeLocation -eq "Store-017"`.',
            'Grant app access and licences to the dynamic groups instead of individuals.',
            'Confirm the organization has Microsoft Entra ID P1 licences for the dynamic group members.',
          ],
          outcome: 'Access follows HR records: a store transfer updates group membership automatically, and IT stops hand-editing groups.',
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
          variant: 'trap',
          text: 'If a question says membership must update automatically, the answer is a dynamic group — and the licence requirement is Microsoft Entra ID P1. If the group must hold Microsoft Entra roles, it can’t be dynamic.',
        },
        { type: 'quickcheck', questionIds: ['id-dynamic-group-rule', 'id-group-types'] },
      ],
    },
  ],
  takeaways: [
    'Users are members or guests; key properties such as department and usage location drive automation and licensing.',
    'Security groups grant access; Microsoft 365 groups add collaboration and contain users only.',
    'Dynamic membership is rule-based, needs Entra ID P1 for user members, and can’t include manual members.',
    'Assign access to groups, not individuals.',
  ],
  interview: [
    {
      q: 'How would you automate access for employees based on their department?',
      a: 'Use dynamic security groups with rules on an authoritative attribute such as department, make sure the attribute is populated reliably from HR or AD, assign licences, app access and Azure roles to those groups, and confirm the tenant has Entra ID P1 licensing for the members.',
    },
  ],
};

export default lesson;
