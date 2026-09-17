import type { Lesson } from '../../schema';

const lesson: Lesson = {
  id: 'blob-containers-tiers',
  moduleId: 'storage',
  verified: '2026-09-14',
  sources: ['access-tiers', 'storage-account-overview', 'storage-redundancy'],
  sections: [
    {
      id: 'intro',
      kind: 'intro',
      title: 'Paying for data the way it’s used',
      blocks: [
        {
          type: 'lead',
          text: 'Blobs live in **containers**. Each block blob has an **access tier** — hot, cool, cold or archive — that trades cheaper storage for more expensive and slower access.',
        },
        {
          type: 'explainer',
          technical: [
            'Containers organize blobs within an account. Anonymous read access can be granted per container only when the account allows it — most organizations disable that at the account level.',
            '[[access-tier|Access tiers]] apply to block blobs. Hot has the highest storage and lowest access price; cool (30-day minimum), cold (90-day minimum) and archive (180-day minimum) progressively lower storage prices and raise access prices.',
            'Archive is **offline**: blobs must be rehydrated to an online tier before they can be read, which can take up to 15 hours at Standard priority.',
          ],
          simple: [
            'Hot is the shelf by the front door — expensive rent, instant to grab. Cool and cold are further back. Archive is a warehouse across town: very cheap to store, but you must order the box back and wait hours.',
            'Leaving before the minimum stay means paying for the rest of the stay anyway — that’s the early deletion charge.',
          ],
        },
      ],
    },
    {
      id: 'visual',
      kind: 'visual',
      title: 'The tiers side by side',
      blocks: [{ type: 'diagram', id: 'access-tiers', alt: 'Comparison of hot, cool, cold and archive tiers by relative storage cost, access cost, minimum retention and availability.' }],
    },
    {
      id: 'how',
      kind: 'how',
      title: 'Rules you must know',
      blocks: [
        {
          type: 'list',
          style: 'check',
          items: [
            'The **account default tier** can be hot, cool or cold (never archive) and applies to blobs without an explicit tier; new GPv2 accounts default to hot.',
            'Moving a blob to a cooler tier, or from cool/cold back to hot, takes effect immediately. Moving out of archive requires **rehydration**.',
            'Rehydrate by changing the tier (Set Blob Tier) or by copying the blob to an online tier; priority is **Standard** or **High**.',
            '**Early deletion**: deleting, overwriting or moving a blob before 30 (cool), 90 (cold) or 180 (archive) days incurs a prorated charge.',
            'Archive isn’t supported with ZRS, GZRS or RA-GZRS redundancy.',
            'Lifecycle management can move blobs to archive but can’t rehydrate them.',
          ],
        },
      ],
    },
    {
      id: 'configure',
      kind: 'configure',
      blocks: [
        {
          type: 'code',
          title: 'Create a container and change a blob’s tier',
          tabs: [
            {
              lang: 'bash',
              label: 'Azure CLI',
              code: `# Create a private container using your Entra identity
az storage container create --name invoices --account-name stcontosodocs01 --auth-mode login

# Move one blob to the cool tier
az storage blob set-tier --account-name stcontosodocs01 --container-name invoices \\
  --name 2025/inv-1001.pdf --tier Cool --auth-mode login

# Rehydrate an archived blob with high priority
az storage blob set-tier --account-name stcontosodocs01 --container-name invoices \\
  --name 2019/inv-0042.pdf --tier Hot --rehydrate-priority High --auth-mode login`,
              notes: [
                { token: '--auth-mode login', note: 'Uses your Microsoft Entra identity (needs a Storage Blob Data role) instead of an account key.' },
                { token: '--rehydrate-priority', note: '`Standard` (up to 15 hours) or `High` (faster, costs more).' },
              ],
            },
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
          company: 'Fourth Coffee',
          context: 'Fourth Coffee stores security camera footage: frequently reviewed for 7 days, occasionally for 60 days, and kept for 3 years for legal holds.',
          problem: 'All footage sits in the hot tier and storage costs keep rising.',
          approach: [
            'Keep new footage in **hot** for the first week of frequent review.',
            'Move footage older than 7 days to **cool** — but note cool’s 30-day minimum, so data moved to cold or deleted before day 37 incurs early deletion charges.',
            'Move footage older than 90 days to **archive**, accepting hours of rehydration time for rare legal requests.',
            'Use GRS rather than GZRS so archive remains available.',
            'Automate all of it with a lifecycle management rule.',
          ],
          outcome: 'Most of the footage ends up in archive at a fraction of the hot-tier storage price, with retrieval time documented for the legal team.',
        },
      ],
    },
    {
      id: 'exam',
      kind: 'exam',
      title: 'How AZ-104 tests this',
      blocks: [
        { type: 'callout', variant: 'exam', text: 'Minimums: cool 30, cold 90, archive 180 days. Archive is offline and needs rehydration (up to 15 hours at Standard priority). Default account tier can’t be archive.' },
        { type: 'quickcheck', questionIds: ['st-tier-rehydrate', 'st-tier-early-delete'] },
      ],
    },
  ],
  takeaways: [
    'Access tiers apply to block blobs: hot, cool (30 days), cold (90 days), archive (180 days).',
    'Archive is offline; rehydrate with Set Blob Tier or copy, at Standard or High priority.',
    'Early deletion charges apply when blobs leave a tier before its minimum.',
    'Account default tier: hot, cool or cold — not archive.',
    'Archive isn’t supported on ZRS, GZRS or RA-GZRS accounts.',
  ],
};

export default lesson;
