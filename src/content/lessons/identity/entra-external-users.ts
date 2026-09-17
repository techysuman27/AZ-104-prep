import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'entra-external-users',
  moduleId: 'identity',
  verified: '2026-09-14',
  sources: ['external-collab', 'roles-compare'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Letting partners in — on your terms',
      blocks: [
        {
          type: 'lead',
          text: 'Auditors, contractors and partner engineers often need access to your apps or Azure resources. **B2B collaboration** invites them as **guest users** who sign in with their own accounts, while you control who can invite them and what they can see.',
        },
        {
          type: 'explainer',
          technical: [
            '[[b2b-collaboration|B2B collaboration]] creates a [[guest-user|guest user]] object (`userType` Guest) in your tenant. The guest authenticates with their home identity provider, so you never manage their password.',
            '**External collaboration settings** control three things: what guests can see in your directory, who can invite guests, and which domains collaboration is allowed or blocked for.',
            '**Cross-tenant access settings** add finer inbound and outbound controls for specific Microsoft Entra organizations.',
          ],
          simple: [
            'A guest is like a visitor badge. The visitor proves who they are with their own company login, and your organization decides where the badge works.',
            'You also decide who in your company is allowed to hand out visitor badges, and whether visitors from certain companies are welcome at all.',
          ],
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'The settings that matter',
      blocks: [
        {
          type: 'table',
          caption: 'Guest user access (what guests can see)',
          columns: ['Option', 'Effect'],
          rows: [
            ['Guest users have the same access as members (most inclusive)', 'Guests can read directory information like members.'],
            ['Guest users have limited access to properties and memberships of directory objects', '**Default.** Guests can’t enumerate users and groups broadly.'],
            ['Guest user access is restricted to properties and memberships of their own directory objects (most restrictive)', 'Guests see only their own objects.'],
          ],
        },
        {
          type: 'table',
          caption: 'Guest invite settings (who can invite)',
          columns: ['Option', 'Who can invite'],
          rows: [
            ['Anyone in the organization can invite guest users including guests and non-admins (most inclusive)', '**Default** — every user, including guests.'],
            ['Member users and users assigned to specific admin roles can invite guest users including guests with member permissions', 'Members and admins, not ordinary guests.'],
            ['Only users assigned to specific admin roles can invite guest users', 'Admins such as User Administrator, and users with the **Guest Inviter** role.'],
            ['No one in the organization can invite guest users including admins (most restrictive)', 'Nobody.'],
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: '**Collaboration restrictions** let you either allow invitations only to listed domains (allow list) or block listed domains (deny list) — not both at the same time.',
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      blocks: [
        {
          type: 'portal',
          title: 'Lock down guest invitations',
          path: ['Microsoft Entra admin center', 'External Identities', 'External collaboration settings'],
          steps: [
            { label: 'Guest user access', fields: [{ name: 'Guest user access', value: 'Limited access (default)', hint: 'Choose the most restrictive option for highly regulated tenants.' }] },
            { label: 'Guest invite settings', fields: [{ name: 'Who can invite', value: 'Only users assigned to specific admin roles', hint: 'Then give the Guest Inviter role to people who legitimately invite partners.' }] },
            { label: 'Collaboration restrictions', fields: [{ name: 'Mode', value: 'Allow invitations only to the specified domains', hint: 'Add partner domains such as fabrikam.com.' }] },
          ],
        },
        {
          type: 'p',
          text: 'Once a guest exists, give them access exactly like a member: add them to groups, assign apps, or assign an Azure role at the narrowest scope that works.',
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
            { mistake: 'Leaving the default invite setting, so any user — even an existing guest — can invite more guests.', fix: 'Restrict invitations to admin roles and grant Guest Inviter where needed.' },
            { mistake: 'Making a partner engineer a Global Administrator so they can “see everything”.', fix: 'Assign an Azure role such as Reader at the specific resource group they support.' },
            { mistake: 'Forgetting guests when reviewing access.', fix: 'Include guests in periodic access reviews and remove those who no longer need access.' },
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
          company: 'Contoso Pharmaceuticals',
          context: 'An external audit firm, auditpartners.com, needs read access to production resources for three weeks. Company policy says only IT may invite external users.',
          problem: 'The compliance manager (not an IT admin) must be able to invite the auditors, and nobody else outside IT should be able to invite anyone.',
          approach: [
            'Set guest invite settings to **Only users assigned to specific admin roles can invite guest users**.',
            'Assign the compliance manager the **Guest Inviter** role.',
            'Add auditpartners.com to an allow list under collaboration restrictions.',
            'Invite the auditors, add them to an “External auditors” group, and assign that group **Reader** on the production subscription.',
            'Remove the group’s role assignment and the guests when the audit ends.',
          ],
          outcome: 'The auditors get least-privilege read access, and invitation rights stay tightly controlled.',
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
          text: 'Know the defaults: guests have **limited access** to directory objects, and **anyone including guests** can invite. Know that **Guest Inviter** lets a non-admin invite when invitations are limited to admin roles.',
        },
        { type: 'quickcheck', questionIds: ['id-guest-inviter'] },
      ],
    },
  ],
  takeaways: [
    'B2B guests sign in with their own identities; your tenant controls their access.',
    'Default guest access is limited; default invite setting allows anyone, including guests, to invite.',
    'The Guest Inviter role lets specific users invite guests when invitations are restricted to admin roles.',
    'Collaboration restrictions use an allow list or a deny list of domains.',
  ],
};

export default lesson;
