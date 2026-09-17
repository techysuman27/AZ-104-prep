import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'entra-sspr',
  moduleId: 'identity',
  verified: '2026-09-14',
  sources: ['sspr-licensing', 'sspr-howitworks'],
  changes: [
    {
      topic: 'Azure AD SSPR naming',
      previously: 'Azure AD self-service password reset, configured in the Azure Active Directory blade.',
      now: 'Microsoft Entra self-service password reset, configured in the Microsoft Entra admin center (Password reset).',
      matters: 'Same feature and settings. Recognize both names in older material.',
    },
  ],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Resetting passwords without the help desk',
      blocks: [
        {
          type: 'lead',
          text: '**Self-service password reset (SSPR)** lets users who forget their password prove their identity with registered methods and choose a new one — any time, without waiting for IT.',
        },
        {
          type: 'explainer',
          technical: [
            '[[sspr|SSPR]] is enabled for **None**, **Selected** groups or **All** users. Users register authentication methods; at reset time they must satisfy the configured number of methods (one or two).',
            'Available methods include Microsoft Authenticator notifications, software OATH tokens, hardware OATH tokens (preview), SMS, voice call and email one-time passcode.',
            'For synchronized (hybrid) users, **password writeback** through Microsoft Entra Connect or cloud sync writes the new password back to on-premises Active Directory.',
            'Administrator accounts always use a stronger, two-gate reset policy regardless of the settings you choose for users.',
          ],
          simple: [
            'SSPR is the “Forgot my password?” link that actually works without calling anyone.',
            'Users set up proof of identity in advance — like the Authenticator app or their phone number. When they forget their password, they prove who they are with those methods and pick a new password.',
            'If passwords come from an on-premises Active Directory, writeback sends the new password back there too.',
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'The reset flow',
      blocks: [
        {
          type: 'flow',
          title: 'SSPR for a hybrid user',
          alt: 'A user opens the password reset portal, verifies with registered authentication methods, sets a new password in Microsoft Entra ID, and password writeback updates on-premises Active Directory.',
          spec: {
            root: {
              type: 'group',
              id: 'root',
              label: 'SSPR flow',
              kind: 'plain',
              children: [
                { type: 'node', id: 'user', label: 'User', sub: 'Forgot password', icon: 'user', concept: 'entra-user' },
                { type: 'node', id: 'verify', label: 'Verify identity', sub: '1 or 2 methods', icon: 'shield', detail: 'The user must pass the number of methods configured (one or two), chosen from those enabled by the administrator and registered by the user.' },
                { type: 'node', id: 'entra', label: 'Microsoft Entra ID', sub: 'New password set', icon: 'identity', concept: 'entra-id' },
                {
                  type: 'group',
                  id: 'onprem',
                  label: 'On-premises',
                  kind: 'onprem',
                  children: [{ type: 'node', id: 'ad', label: 'Active Directory', sub: 'Via writeback', icon: 'server', detail: 'Password writeback (Microsoft Entra Connect or cloud sync) is required for synchronized users. Without it, they are told to contact an administrator.' }],
                },
              ],
            },
            edges: [
              { from: 'user', to: 'verify', tone: 'data' },
              { from: 'verify', to: 'entra', tone: 'allow' },
              { from: 'entra', to: 'ad', label: 'password writeback', style: 'dashed', tone: 'data' },
            ],
            flows: [{ id: 'reset', label: 'Reset a password', path: ['user', 'verify', 'entra', 'ad'], tone: 'allow', description: 'After verification the password changes in Entra ID and, with writeback, on-premises — so the user signs in everywhere with the new password.' }],
          },
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Licensing is part of the design',
      blocks: [
        {
          type: 'table',
          caption: 'Which licence covers which scenario',
          columns: ['Scenario', 'Licences that include it'],
          rows: [
            ['Cloud-only user **changes** a known password', 'Microsoft Entra ID Free, Microsoft 365 Business Standard, Business Premium, Entra ID P1 or P2'],
            ['Cloud-only user **resets** a forgotten password', 'Microsoft 365 Business Standard, Business Premium, Entra ID P1 or P2'],
            ['Hybrid user resets or changes with **on-premises writeback**', 'Microsoft 365 Business Premium, Entra ID P1 or P2'],
          ],
        },
        {
          type: 'list',
          style: 'check',
          items: [
            '**Registration**: optionally require users to register when they sign in, and ask them to reconfirm their information every 0–730 days (0 means never).',
            '**Notifications**: notify users when their password is reset, and notify all admins when another admin resets their password.',
            'When only one method is required, Microsoft Authenticator can’t be the only available method.',
            'Guests who use personal Microsoft accounts can’t use Microsoft Entra SSPR.',
          ],
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      blocks: [
        {
          type: 'portal',
          title: 'Pilot SSPR for one group',
          path: ['Microsoft Entra admin center', 'Password reset'],
          steps: [
            { label: 'Properties', fields: [{ name: 'Self service password reset enabled', value: 'Selected', hint: 'Choose a pilot group such as SSPR-Pilot. Switch to All when ready.' }] },
            { label: 'Authentication methods', fields: [{ name: 'Number of methods required to reset', value: '2', hint: 'Two methods give stronger verification.' }, { name: 'Methods available to users', value: 'Mobile app notification, Mobile phone, Email' }] },
            { label: 'Registration', fields: [{ name: 'Require users to register when signing in', value: 'Yes' }, { name: 'Days before users are asked to reconfirm', value: '180', hint: 'Range 0–730; 0 never asks.' }] },
            { label: 'On-premises integration', detail: 'For synchronized users, enable password writeback in Microsoft Entra Connect or cloud sync, then enable writeback here.' },
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
            { mistake: 'Enabling SSPR for all users on Entra ID Free and expecting forgotten-password resets to work for cloud users.', fix: 'Reset requires Entra ID P1/P2 or Microsoft 365 Business Standard/Premium licences.' },
            { mistake: 'Rolling out to everyone at once.', fix: 'Pilot with a selected group, monitor registration and usage, then expand.' },
            { mistake: 'Forgetting writeback in a hybrid environment.', fix: 'Configure password writeback or synchronized users can’t complete a reset.' },
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
          variant: 'trap',
          text: '“Change” and “reset” are different in licensing questions. Free covers **change** for cloud users; **reset** for cloud users needs P1/P2 or Microsoft 365 Business Standard/Premium; hybrid writeback needs Business Premium or P1/P2.',
        },
        { type: 'quickcheck', questionIds: ['id-sspr-license', 'id-sspr-writeback'] },
      ],
    },
  ],
  takeaways: [
    'SSPR can be enabled for none, selected groups or all users.',
    'One or two methods can be required; registration reconfirmation ranges from 0 to 730 days.',
    'Cloud-user reset needs Entra ID P1/P2 or Microsoft 365 Business Standard/Premium; Free only covers password change.',
    'Hybrid users need password writeback (Business Premium or P1/P2).',
    'Administrators always get a stronger two-gate reset policy.',
  ],
};

export default lesson;
