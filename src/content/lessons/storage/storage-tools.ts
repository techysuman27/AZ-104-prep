import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'storage-tools',
  moduleId: 'storage',
  verified: '2026-09-14',
  sources: ['azcopy', 'files-share-permissions'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Moving data in, out and around',
      blocks: [
        {
          type: 'lead',
          text: 'Administrators constantly move data: seeding a new account, copying between regions, fixing a single blob. **Azure Storage Explorer** is the graphical tool; **AzCopy** is the fast, scriptable one.',
        },
        {
          type: 'explainer',
          technical: [
            '[[azcopy|AzCopy]] v10 copies to, from and between storage accounts for Blob Storage and Azure Files (and from Amazon S3). It authorizes with Microsoft Entra ID (`azcopy login`) or a [[sas|SAS token]] appended to the URL.',
            'With Entra authorization, the identity needs a **data** role such as Storage Blob Data Contributor — being the account Owner isn’t enough.',
            '[[storage-explorer|Storage Explorer]] is a free desktop app for Windows, macOS and Linux that connects with Entra sign-in, account keys, SAS or connection strings, and uses AzCopy for transfers.',
          ],
          simple: [
            'Storage Explorer is like File Explorer for your storage accounts — drag and drop.',
            'AzCopy is a command you type (or put in a script) to copy lots of data quickly.',
          ],
        },
      ],
    },
    {
      id: 'example',
      kind: 'example',
      title: 'Common AzCopy tasks',
      blocks: [
        {
          type: 'code',
          tabs: [
            {
              lang: 'bash',
              label: 'AzCopy',
              code: `# Sign in with Microsoft Entra ID (needs a Storage Blob Data role)
azcopy login

# Upload a folder recursively to a container
azcopy copy "./invoices" "https://stcontosodocs01.blob.core.windows.net/invoices" --recursive=true

# Copy a container between two accounts using a SAS on each side
azcopy copy "https://stsource.blob.core.windows.net/data?<SAS>" \\
            "https://stdest.blob.core.windows.net/data?<SAS>" --recursive=true

# Make the destination match the source (adds and updates changed files)
azcopy sync "./site" "https://stweb.blob.core.windows.net/$web?<SAS>" --recursive=true`,
              notes: [
                { token: 'azcopy login', note: 'Interactive Entra sign-in; managed identities and service principals are also supported.' },
                { token: '--recursive=true', note: 'Includes subdirectories.' },
                { token: 'azcopy sync', note: 'Compares source and destination and transfers only what changed.' },
              ],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          text: 'AzCopy has no rename command. To “rename” a blob, copy it to the new name and remove the original.',
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
            { mistake: 'Running `azcopy login` as a subscription Owner and getting 403 errors.', fix: 'Assign Storage Blob Data Contributor (or Reader) on the account or container.' },
            { mistake: 'Sharing an account key with a partner so they can upload data.', fix: 'Issue a narrowly scoped, short-lived SAS instead.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Tool selection questions: bulk or scripted copy between accounts → AzCopy; occasional interactive browsing and editing → Storage Explorer. Authorization for AzCopy → Entra data role or SAS.' },
        { type: 'quickcheck', questionIds: ['st-azcopy-auth'] },
      ],
    },
  ],
  takeaways: [
    'AzCopy: fast, scriptable copy and sync for Blob Storage and Azure Files.',
    'AzCopy authorizes with Microsoft Entra ID (needs a data role) or SAS tokens.',
    'Storage Explorer: cross-platform GUI using Entra, keys, SAS or connection strings.',
    'There’s no rename in AzCopy — copy then remove.',
  ],
};

export default lesson;
