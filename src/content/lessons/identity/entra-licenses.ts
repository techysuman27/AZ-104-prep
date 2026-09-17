import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'entra-licenses',
  moduleId: 'identity',
  verified: '2026-09-14',
  sources: ['group-licensing', 'dynamic-groups', 'sspr-licensing'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Licences that follow membership',
      blocks: [
        {
          type: 'lead',
          text: 'Features such as dynamic groups and self-service password reset depend on licences. **Group-based licensing** assigns them to a group so people receive licences when they join and release them when they leave.',
        },
        {
          type: 'explainer',
          technical: [
            'Assign a product licence to a security group, mail-enabled security group or Microsoft 365 group. Every **direct** member receives it; **nested groups aren’t supported**.',
            'A user needs a **usage location** for licence assignment. With group-based licensing, users without one inherit the tenant’s location.',
            'Managing group licences requires at least the Groups Administrator, License Administrator or User Administrator role.',
          ],
          simple: [
            'A licence is a paid seat for a product, like Microsoft 365 or Microsoft Entra ID P1.',
            'Rather than handing out seats to each person, you give seats to a group. Whoever is in the group gets a seat; take them out and the seat is freed up.',
          ],
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'How group-based licensing behaves',
      blocks: [
        {
          type: 'list',
          style: 'check',
          items: [
            'Licences are applied to direct members of the group, including members added by a dynamic rule.',
            'Members of a nested group inside the licensed group don’t receive the licence.',
            'You can disable individual service plans inside a product licence for a group.',
            'When a user is in two licensed groups for the same product, they consume one licence.',
            'Problems appear on the group as licence errors: not enough licences, conflicting service plans, missing dependent services, proxy address conflicts or usage location issues.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Moving users between licensed groups',
          text: 'Add the user to the new group first, confirm the licence is applied, then remove them from the old group — this avoids a gap in service.',
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      blocks: [
        {
          type: 'portal',
          title: 'Assign a licence to a group',
          path: ['Microsoft 365 admin center', 'Billing', 'Licenses', 'Choose a product'],
          steps: [
            { label: 'Open the product', detail: 'Select the product (for example Microsoft 365 E5 or Microsoft Entra ID P1) and choose the option to assign licences to groups.' },
            { label: 'Choose the group', detail: 'Pick a security, mail-enabled security or Microsoft 365 group. Don’t rely on nested groups.' },
            { label: 'Select apps and services', detail: 'Optionally turn off service plans the group shouldn’t receive.' },
            { label: 'Review errors', detail: 'Check the group for licence assignment errors after processing completes.' },
          ],
        },
      ],
    },
    {
      id: 'troubleshoot',
      kind: 'troubleshoot',
      title: 'A member has no licence',
      blocks: [
        {
          type: 'decision',
          tree: {
            id: 'lic-missing',
            title: 'Why didn’t the user get the licence?',
            start: 'q1',
            nodes: {
              q1: { kind: 'question', text: 'Is the user a direct member of the licensed group?', options: [{ label: 'No, they’re in a nested group', next: 'r-nested' }, { label: 'Yes', next: 'q2' }] },
              q2: { kind: 'question', text: 'Does the group show a licence error for the user?', options: [{ label: 'Not enough licences', next: 'r-count' }, { label: 'Conflicting or missing service plans', next: 'r-conflict' }, { label: 'No error yet', next: 'r-wait' }] },
              'r-nested': { kind: 'result', title: 'Nested groups aren’t supported', text: 'Add the user (or their nested group’s members) directly to the licensed group, or license the nested group itself.', tone: 'caution', concepts: ['group-based-licensing'] },
              'r-count': { kind: 'result', title: 'Buy or free up licences', text: 'Purchase more licences or remove them from users who no longer need them; processing then retries.', tone: 'caution' },
              'r-conflict': { kind: 'result', title: 'Resolve the plan conflict', text: 'Two products may include incompatible service plans, or a required dependent service is disabled. Adjust the selected services on one of the groups.', tone: 'caution' },
              'r-wait': { kind: 'result', title: 'Allow processing time', text: 'Group licence changes are processed in the background. Check again, and confirm the user has a usage location (or that the tenant location is appropriate).' },
            },
          },
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
          text: 'A classic distractor: “license the Engineering group, which contains the Developers group”. Developers get nothing — nested groups aren’t supported for group-based licensing.',
        },
        { type: 'quickcheck', questionIds: ['id-license-nested'] },
      ],
    },
  ],
  takeaways: [
    'Group-based licensing assigns licences to all direct members of a security, mail-enabled security or Microsoft 365 group.',
    'Nested group members don’t receive licences.',
    'Users without a usage location inherit the tenant location for group-based licensing.',
    'Licence errors are visible on the group and must be resolved there.',
  ],
};

export default lesson;
