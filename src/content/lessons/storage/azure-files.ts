import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'azure-files',
  moduleId: 'storage',
  verified: '2026-09-14',
  sources: ['files-planning', 'files-snapshots', 'files-soft-delete', 'storage-redundancy'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'File shares without file servers',
      blocks: [
        {
          type: 'lead',
          text: '**Azure Files** provides fully managed file shares that Windows, Linux and macOS clients mount over **SMB**, or Linux clients mount over **NFS** — so applications that expect a file server keep working.',
        },
        {
          type: 'explainer',
          technical: [
            '[[azure-files|Azure Files]] classic file shares live in a storage account. **SMB** shares support HDD (standard) and SSD (premium) media, all standard redundancy options except read-access geo, identity-based authentication and Windows ACLs, and are reachable from the internet over TCP 445.',
            '**NFS 4.1** shares are Linux-only, require SSD (premium) media with LRS or ZRS, don’t support identity-based authentication, and aren’t reachable from the internet — use a service endpoint or private endpoint.',
            'Recovery features: [[share-snapshot|share snapshots]] for point-in-time file recovery, share soft delete for deleted shares, and Azure Backup for scheduled protection of SMB shares.',
          ],
          simple: [
            'Azure Files is a network drive in the cloud. Map it like the shared S: drive at the office.',
            'SMB is the Windows-style sharing language; NFS is the Linux-style one.',
            'Snapshots are photos of the share you can copy files back from, and soft delete brings back a share someone deleted.',
          ],
        },
      ],
    },
    {
      id: 'compare',
      kind: 'compare',
      title: 'SMB vs NFS shares',
      blocks: [
        {
          type: 'table',
          columns: ['', 'SMB', 'NFS 4.1'],
          rows: [
            ['Clients', 'Windows, Linux, macOS', 'Linux'],
            ['Media', 'HDD (standard) or SSD (premium)', 'SSD (premium) only'],
            ['Redundancy', 'LRS, ZRS, GRS, GZRS (SSD: LRS/ZRS)', 'LRS, ZRS'],
            ['Authentication', 'Identity-based (Kerberos) or storage account key', 'Host-based; no identity-based authentication'],
            ['Internet access', 'Yes (SMB 3.x over TCP 445)', 'No — service or private endpoint required'],
            ['Azure Backup', 'Supported', 'Not supported (snapshots work)'],
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Many ISPs and corporate networks block outbound TCP 445. On-premises access usually goes over VPN or ExpressRoute with a private endpoint.',
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      title: 'Create, protect and recover shares',
      blocks: [
        {
          type: 'code',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# Create a 1 TiB SMB share
az storage share-rm create --resource-group rg-files --storage-account stcontosofiles \\
  --name finance --quota 1024

# Share soft delete: keep deleted shares for 14 days
az storage account file-service-properties update --resource-group rg-files \\
  --account-name stcontosofiles --enable-delete-retention true --delete-retention-days 14

# Take a snapshot before a risky change
az storage share snapshot --name finance --account-name stcontosofiles`,
              notes: [
                { token: 'share-rm', note: 'Manages the share through Azure Resource Manager (control plane).' },
                { token: '--quota', note: 'Share size in GiB.' },
                { token: '--delete-retention-days', note: 'Share soft delete retention: 1–365 days (7 by default for new accounts).' },
              ],
            },
            {
              lang: 'powershell',
              label: 'Mount (Windows)',
              code: `# Check that outbound TCP 445 is reachable first
Test-NetConnection -ComputerName stcontosofiles.file.core.windows.net -Port 445

# Map the share (identity-based access uses your signed-in Kerberos identity)
New-PSDrive -Name S -PSProvider FileSystem -Root "\\\\stcontosofiles.file.core.windows.net\\finance" -Persist`,
              notes: [{ token: 'Test-NetConnection … -Port 445', note: 'The quickest way to rule out blocked SMB traffic.' }],
            },
          ],
        },
        {
          type: 'table',
          caption: 'Snapshot and soft delete facts',
          columns: ['Feature', 'Details'],
          rows: [
            ['Share snapshots', 'Read-only, incremental, share-level; up to 200 per share; retained up to 10 years; restore files via portal, Previous Versions or copy'],
            ['Deleting a share', 'Deletes its snapshots too'],
            ['Share soft delete', 'Share-level only (not individual files); on by default for new accounts with 7 days; 1–365 days'],
            ['Restore a deleted share', 'Show deleted shares → Undelete (restores contents and snapshots)'],
          ],
        },
      ],
    },
    {
      id: 'troubleshoot',
      kind: 'troubleshoot',
      title: 'Share won’t mount',
      blocks: [
        {
          type: 'decision',
          tree: {
            id: 'mount',
            title: 'Diagnose a failed SMB mount',
            start: 'q1',
            nodes: {
              q1: { kind: 'question', text: 'Does `Test-NetConnection <account>.file.core.windows.net -Port 445` succeed?', options: [{ label: 'No', next: 'r-445' }, { label: 'Yes', next: 'q2' }] },
              q2: { kind: 'question', text: 'Does the storage account firewall allow the client’s network?', options: [{ label: 'No / not sure', next: 'r-fw' }, { label: 'Yes', next: 'r-auth' }] },
              'r-445': { kind: 'result', title: 'Port 445 is blocked', text: 'Use VPN or ExpressRoute with a private endpoint, or Azure File Sync to a local server.', tone: 'caution', concepts: ['private-endpoint'] },
              'r-fw': { kind: 'result', title: 'Network rules deny the client', text: 'Add the client’s public IP or subnet (with a service endpoint), or connect through a private endpoint.', tone: 'caution', concepts: ['storage-firewall'] },
              'r-auth': { kind: 'result', title: 'Check authorization', text: 'Confirm the identity source is configured and the user has a share-level role and NTFS permissions — or that the key used is current.', concepts: ['files-identity-auth'] },
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
        { type: 'callout', variant: 'trap', text: 'Recover one accidentally deleted file → share snapshot or Azure Backup. Recover a deleted share → share soft delete. Share soft delete doesn’t protect individual files.' },
        { type: 'quickcheck', questionIds: ['st-files-port', 'st-files-recover'] },
      ],
    },
  ],
  takeaways: [
    'SMB shares: Windows/Linux/macOS, TCP 445, identity-based or key authentication.',
    'NFS 4.1 shares: Linux, SSD only, LRS/ZRS, no identity auth, no internet access.',
    'Share snapshots: up to 200 per share, retained up to 10 years, deleted with the share.',
    'Share soft delete protects whole shares, not individual files; on by default for new accounts.',
    'Azure Files doesn’t support RA-GRS or RA-GZRS.',
  ],
};

export default lesson;
