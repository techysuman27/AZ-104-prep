import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'storage-encryption',
  moduleId: 'storage',
  verified: '2026-09-14',
  sources: ['storage-encryption', 'managed-identities'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Encrypted by default — you choose who holds the keys',
      blocks: [
        {
          type: 'lead',
          text: 'Every byte written to Azure Storage is encrypted at rest with AES-256, automatically and at no cost. The decisions an administrator makes are about **key management** and **extra layers** of encryption.',
        },
        {
          type: 'explainer',
          technical: [
            '[[storage-encryption|Storage service encryption]] can’t be disabled. It covers blobs in every tier, files, queues, tables and metadata in both primary and secondary regions.',
            '**Microsoft-managed keys** are the default. **Customer-managed keys** live in [[key-vault|Azure Key Vault]] or Key Vault Managed HSM, and the storage account uses a [[managed-identity|managed identity]] to access them. **Customer-provided keys** are sent with individual Blob Storage requests.',
            '**Encryption scopes** use different keys for different containers or blobs in one account. **Infrastructure encryption** adds a second AES-256 layer with a separate key and must be chosen when the account is created.',
          ],
          simple: [
            'Azure always locks your data before storing it. The question is who keeps the key.',
            'Microsoft can keep it for you (easy), or you can keep it in your own key safe, Key Vault, so you control and can revoke it.',
            'If rules demand two locks, turn on infrastructure encryption when you create the account.',
          ],
        },
      ],
    },
    {
      id: 'compare',
      kind: 'compare',
      title: 'Key management options',
      blocks: [
        {
          type: 'compare',
          items: [
            { name: 'Microsoft-managed keys', bestFor: 'Most workloads', points: ['Default, no configuration', 'Microsoft rotates and protects keys', 'No Key Vault dependency'] },
            { name: 'Customer-managed keys', bestFor: 'Compliance that requires key control', points: ['Key in Key Vault or Managed HSM', 'You rotate or revoke the key', 'Storage account needs an identity with key permissions'] },
            { name: 'Customer-provided keys', bestFor: 'Per-request keys for Blob Storage', points: ['Client supplies the key with each request', 'Azure doesn’t store the key'] },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'trap', text: 'You can’t turn encryption at rest off, and you can’t add infrastructure encryption to an existing account — both appear as distractors.' },
        { type: 'quickcheck', questionIds: ['st-encryption-options'] },
      ],
    },
  ],
  takeaways: [
    'Storage encryption at rest is always on, AES-256, and free.',
    'Keys: Microsoft-managed (default), customer-managed in Key Vault or Managed HSM, or customer-provided per request.',
    'Encryption scopes allow different keys per container or blob.',
    'Infrastructure encryption (double encryption) must be enabled at account creation.',
  ],
};

export default lesson;
