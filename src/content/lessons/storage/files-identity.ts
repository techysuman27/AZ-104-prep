import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'files-identity',
  moduleId: 'storage',
  verified: '2026-09-14',
  sources: ['files-identity', 'files-share-permissions', 'files-planning'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Real user permissions on cloud file shares',
      blocks: [
        {
          type: 'lead',
          text: 'Mounting a share with the storage account key gives everyone the same all-powerful access. **Identity-based authentication** lets people use their own Kerberos identities, with **share-level Azure roles** and **Windows ACLs** controlling exactly what they can do.',
        },
        {
          type: 'explainer',
          technical: [
            'Choose **one** identity source per storage account: on-premises **AD DS**, **Microsoft Entra Domain Services**, or **Microsoft Entra Kerberos**.',
            'Authorization has two layers: **share-level permissions** assigned as Azure roles (for example Storage File Data SMB Share Contributor) and **directory/file-level permissions** as Windows ACLs.',
            'A **default share-level permission** can grant all authenticated identities a role on every share in the account; it starts as “no share-level permission”.',
          ],
          simple: [
            'The first layer is the building door: can this person open the share at all, and with read or read-write access?',
            'The second layer is the folder locks inside: which folders and files can they open or change — just like on a Windows file server.',
          ],
        },
      ],
    },
    {
      id: 'compare',
      kind: 'compare',
      title: 'Pick the identity source',
      blocks: [
        {
          type: 'table',
          columns: ['Identity source', 'Identities', 'Clients', 'Typical scenario'],
          rows: [
            ['On-premises AD DS', 'Hybrid identities (in AD DS and synced to Entra ID)', 'Domain-joined, with line of sight to domain controllers', 'Replace on-premises file servers in a hybrid organization'],
            ['Microsoft Entra Domain Services', 'Entra users (cloud-only or hybrid)', 'VMs joined to the managed domain', 'Lift-and-shift apps needing a domain without running DCs'],
            ['Microsoft Entra Kerberos', 'Hybrid or cloud-only identities', 'Microsoft Entra joined or hybrid joined devices', 'Cloud-first organizations, FSLogix profiles, no DC line of sight'],
            ['Storage account key', 'Anyone with the key', 'Any client', 'Not recommended — full admin-like access'],
          ],
        },
      ],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Share-level roles',
      blocks: [
        {
          type: 'table',
          columns: ['Role', 'Access'],
          rows: [
            ['Storage File Data SMB Share Reader', 'Read files and directories'],
            ['Storage File Data SMB Share Contributor', 'Read, write and delete'],
            ['Storage File Data SMB Share Elevated Contributor', 'Read, write, delete **and modify Windows ACLs**'],
            ['Storage File Data Privileged Contributor / Reader', 'Override existing ACLs (write or read)'],
            ['Storage File Data SMB Admin', 'Admin access equivalent to using the storage account key over SMB'],
          ],
        },
        {
          type: 'list',
          style: 'check',
          items: [
            'Assign roles at the file share scope or broader.',
            'If both a default share-level permission and a specific assignment apply, the higher permission wins.',
            'Share-level role assignments usually propagate within 30 minutes.',
            'Identity-based authentication isn’t supported for NFS shares.',
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
          company: 'Bellows College',
          context: 'The college moved departmental shares to Azure Files with AD DS authentication. Staff are hybrid identities.',
          problem: 'Faculty must read and write their department share; department heads must also manage folder permissions; the registrar folder must be restricted to registrar staff.',
          approach: [
            'Assign **Storage File Data SMB Share Contributor** on each department share to the faculty groups (synced from AD DS).',
            'Assign **Storage File Data SMB Share Elevated Contributor** to department heads so they can edit ACLs.',
            'Set NTFS ACLs on the Registrar folder to allow only the registrar group.',
          ],
          outcome: 'Access works like the old file servers, controlled by groups, without anyone knowing a storage account key.',
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'trap', text: 'A user with Contributor on the storage account still can’t read files over SMB with identity-based access — share-level access needs a Storage File Data SMB role.' },
        { type: 'quickcheck', questionIds: ['st-files-roles', 'st-files-identity-source'] },
      ],
    },
  ],
  takeaways: [
    'One identity source per account: AD DS, Microsoft Entra Domain Services or Microsoft Entra Kerberos.',
    'Two permission layers: share-level Azure roles and Windows ACLs.',
    'Elevated Contributor can modify ACLs; Contributor can read, write and delete; Reader can read.',
    'A default share-level permission can apply to all authenticated identities.',
    'NFS shares don’t support identity-based authentication.',
  ],
};

export default lesson;
