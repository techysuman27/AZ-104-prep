import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'storage-keys-sas',
  moduleId: 'storage',
  verified: '2026-09-14',
  sources: ['access-keys', 'sas-overview', 'stored-access-policy', 'locks'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Master keys, temporary passes and a kill switch',
      blocks: [
        {
          type: 'lead',
          text: 'Storage offers several ways to authorize data access. **Access keys** are master keys; **shared access signatures (SAS)** are scoped, temporary passes; **stored access policies** let you change or revoke those passes. Knowing how to revoke each is as important as knowing how to create it.',
        },
        {
          type: 'explainer',
          technical: [
            'Each account has two 512-bit [[access-keys|access keys]] granting full access to all data. Two keys enable rotation without downtime.',
            'A [[sas|SAS]] is a URI with a signature and parameters (permissions, expiry, IP range, protocol). **User delegation SAS** is signed with a key obtained via Microsoft Entra ID (recommended). **Service SAS** and **account SAS** are signed with an account key.',
            'A [[stored-access-policy|stored access policy]] on a container, share, queue or table defines permissions and expiry for linked **service SAS** tokens; changing or deleting it affects all of them.',
          ],
          simple: [
            'An access key is the master key to the whole warehouse.',
            'A SAS is a guest pass: “can read this container until Friday.” You hand over the pass, never the master key.',
            'A stored access policy is a guest list at the front desk. Passes that point to the list can be cancelled by editing the list.',
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'Build a SAS',
      blocks: [{ type: 'interactive', id: 'sas-builder', intro: 'Choose a SAS type and options to see the generated URL, what each parameter means, and how the token could be revoked.' }],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Types of SAS and how to revoke them',
      blocks: [
        {
          type: 'table',
          columns: ['SAS type', 'Signed with', 'Scope', 'Stored access policy?', 'How to revoke'],
          rows: [
            ['User delegation SAS', 'User delegation key (Microsoft Entra ID)', 'Blob/Data Lake, and other supported services', 'No', 'Let it expire, remove the creator’s permissions, or revoke user delegation keys — rotating account keys doesn’t affect it'],
            ['Service SAS (ad hoc)', 'Account key', 'One service', 'No', 'Regenerate the signing key (affects everything signed with it)'],
            ['Service SAS with stored access policy', 'Account key', 'One container, share, queue or table', 'Yes (up to 5 per object)', 'Delete or change the policy'],
            ['Account SAS', 'Account key', 'One or more services, service-level operations', 'No', 'Regenerate the signing key'],
          ],
        },
        {
          type: 'list',
          style: 'check',
          items: [
            'Stored access policy changes can take up to 30 seconds to take effect.',
            'A parameter can’t be specified in both the SAS and its stored access policy.',
            'Invalid or expired SAS tokens return 403 Forbidden.',
            'A SAS expiration policy can flag service and account SAS that exceed a maximum validity period.',
            'Disallowing Shared Key authorization blocks account keys and key-signed SAS entirely.',
          ],
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      title: 'Rotate keys without downtime',
      blocks: [
        {
          type: 'steps',
          steps: [
            { title: 'Point applications at key2', detail: 'Update connection strings or Key Vault secrets to use the secondary key.' },
            { title: 'Regenerate key1', detail: 'Anything still using key1 — including SAS signed with key1 — stops working.' },
            { title: 'Point applications back at key1', detail: 'Use the new key1 value.' },
            { title: 'Regenerate key2', detail: 'Both keys are now fresh.' },
          ],
        },
        {
          type: 'code',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `az storage account keys list --account-name stcontosodocs01 --resource-group rg-docs
az storage account keys renew --account-name stcontosodocs01 --resource-group rg-docs --key primary

# Stored access policy for a partner, then a service SAS that uses it
az storage container policy create --container-name exports --name partner-read \\
  --account-name stcontosodocs01 --permissions rl --expiry 2026-12-31T00:00Z --account-key <key>

az storage container generate-sas --name exports --policy-name partner-read \\
  --account-name stcontosodocs01 --account-key <key> --https-only`,
              notes: [
                { token: '--key primary', note: 'Regenerates key1; use `secondary` for key2.' },
                { token: '--permissions rl', note: 'Read and list, defined once in the policy.' },
                { token: '--policy-name', note: 'Links the SAS to the stored access policy, so deleting the policy revokes the SAS.' },
              ],
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
            { mistake: 'Issuing year-long ad hoc account SAS tokens to partners.', fix: 'Prefer user delegation SAS or service SAS with a stored access policy, with short expiry.' },
            { mistake: 'Rotating keys to revoke a user delegation SAS.', fix: 'Key rotation doesn’t affect user delegation SAS; revoke the user delegation keys or the creator’s permissions.' },
            { mistake: 'Putting a ReadOnly lock on the account and breaking tools that list keys.', fix: 'Use CanNotDelete, or move tools to Microsoft Entra authorization.' },
          ],
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'The most-tested pattern: revoke a specific set of SAS tokens without affecting other apps → stored access policy (service SAS only). Revoke everything signed with a key → regenerate the key.' },
        { type: 'quickcheck', questionIds: ['st-sas-revoke', 'st-sas-types'] },
      ],
    },
  ],
  takeaways: [
    'Access keys grant full access; rotate them using the two-key approach.',
    'User delegation SAS (Entra-based) is recommended; service and account SAS are signed with keys.',
    'Stored access policies (max five per container/share/queue/table) work only with service SAS.',
    'Regenerating a key revokes account and service SAS signed with it, not user delegation SAS.',
    'A SAS never bypasses storage firewall rules.',
  ],
};

export default lesson;
