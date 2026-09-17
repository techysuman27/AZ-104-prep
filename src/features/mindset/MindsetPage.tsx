import { useState } from 'react';
import { ArrowRight, CircleCheck } from 'lucide-react';
import { ADMIN_QUESTIONS, ADMIN_QUESTION_ORDER } from '@/content/mindset';
import type { AdminQuestionId } from '@/content/schema';
import { PageContainer } from '@/components/layout/Page';
import { Card, PageHeader } from '@/components/ui/Card';
import { LinkButton } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { InlineText } from '@/components/content/InlineText';
import { cn } from '@/lib/cn';

const WORKED: Record<AdminQuestionId, string> = {
  goal: 'An internal expense-approval web app for 600 employees. It must be reachable only from the corporate network and must keep receipts for seven years.',
  service: '[[app-service|App Service]] on a Premium v3 plan for the web app, [[blob-storage|Blob Storage]] for receipts. No VM is needed because the app runs on a supported runtime.',
  security: 'Users sign in with Microsoft Entra ID. The app reaches storage with a [[managed-identity|managed identity]] and the *Storage Blob Data Contributor* role — no keys or connection strings in configuration.',
  network: 'A [[private-endpoint|private endpoint]] for the web app and for storage, resolved through [[private-dns-zone|private DNS zones]] linked to the hub VNet. Public network access is disabled on both.',
  access: 'The finance app team gets *Contributor* on the workload resource group; auditors get *Reader*. Assignments go to groups, never individuals.',
  governance: '[[azure-policy|Azure Policy]] requires the *CostCenter* tag and denies storage accounts with public network access. A *CanNotDelete* [[resource-lock|lock]] protects the storage account.',
  monitoring: '[[diagnostic-settings|Diagnostic settings]] send App Service and storage logs to a [[log-analytics-workspace|Log Analytics workspace]]. A metric [[alert-rule|alert]] on HTTP 5xx errors notifies the on-call [[action-group|action group]].',
  backup: '[[blob-soft-delete|Blob soft delete]] and [[blob-versioning|versioning]] protect receipts from accidental deletion and overwrites; App Service backups protect the app configuration.',
  failure: 'The App Service plan is zone-redundant in a region with availability zones, so instances are spread across zones. Receipts use [[storage-redundancy|ZRS]], which keeps three synchronous copies across zones.',
  cost: '[[autoscale|Autoscale]] adds instances only during month-end peaks; a [[lifecycle-management|lifecycle policy]] moves receipts older than 90 days to the cold tier and deletes them after seven years; a [[budget]] alerts at 80% of the monthly forecast.',
};

export default function MindsetPage() {
  const [active, setActive] = useState<AdminQuestionId>('goal');
  const meta = ADMIN_QUESTIONS[active];

  return (
    <PageContainer>
      <PageHeader
        eyebrow={<span className="text-xs font-semibold tracking-wide text-brand-700 uppercase">Think like an Azure administrator</span>}
        title="Ten questions before you build anything"
        description="Experienced administrators don’t start by opening the portal. They ask the same ten questions about every workload. Answering them turns a vague request into a secure, observable, recoverable and affordable design — and it is exactly how AZ-104 scenario questions are built."
      />

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <ol className="space-y-1.5" aria-label="The ten questions">
          {ADMIN_QUESTION_ORDER.map((q, i) => {
            const m = ADMIN_QUESTIONS[q];
            return (
              <li key={q}>
                <button
                  type="button"
                  onClick={() => setActive(q)}
                  aria-current={active === q ? 'step' : undefined}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all',
                    active === q ? 'border-brand-300 bg-brand-50 shadow-xs' : 'border-transparent hover:border-line hover:bg-surface',
                  )}
                >
                  <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', active === q ? 'bg-brand-600 text-white' : 'bg-subtle text-ink-2')}>
                    <Icon name={m.icon} className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-2xs font-semibold text-ink-4 tabular">{String(i + 1).padStart(2, '0')}</span>
                    <span className="block text-[14px] font-medium text-ink">{m.question}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="space-y-5">
          <Card key={active} className="animate-rise-in overflow-hidden">
            <div className="blueprint px-6 py-5 text-white">
              <div className="flex items-center gap-2 text-2xs font-semibold tracking-wide text-white/60 uppercase">
                <Icon name={meta.icon} className="size-3.5" /> {meta.label}
              </div>
              <h2 className="mt-1 text-[24px] font-semibold">{meta.question}</h2>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-white/80">{meta.prompt}</p>
            </div>
            <div className="grid gap-5 p-6 md:grid-cols-2">
              <div>
                <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Good answers look like</div>
                <ul className="mt-2 space-y-2">
                  {meta.examples.map((e) => (
                    <li key={e} className="flex gap-2 text-[14px] leading-relaxed text-ink-2">
                      <CircleCheck className="mt-1 size-4 shrink-0 text-success-600" aria-hidden="true" />
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-design-100 bg-design-50 p-4">
                <div className="text-2xs font-semibold tracking-wide text-design-700 uppercase">Worked example: expense-approval app</div>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
                  <InlineText text={WORKED[active]} />
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-[17px] font-semibold text-ink">The full worked example</h2>
            <p className="mt-1 text-[14px] text-ink-3">Read top to bottom: each answer constrains the next.</p>
            <dl className="mt-4 divide-y divide-line">
              {ADMIN_QUESTION_ORDER.map((q) => (
                <div key={q} className="grid gap-1 py-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
                  <dt className="flex items-center gap-2 text-[13.5px] font-semibold text-ink">
                    <Icon name={ADMIN_QUESTIONS[q].icon} className="size-4 text-ink-3" />
                    {ADMIN_QUESTIONS[q].label}
                  </dt>
                  <dd className="text-[14px] leading-relaxed text-ink-2">
                    <InlineText text={WORKED[q]} />
                  </dd>
                </div>
              ))}
            </dl>
          </Card>

          <div className="flex flex-col gap-3 rounded-2xl border border-brand-150 bg-brand-25 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[15px] font-semibold text-ink">Practise the method</div>
              <p className="text-[13.5px] text-ink-3">The Solution Design Lab gives you business requirements and scores every decision.</p>
            </div>
            <LinkButton to="/design" iconRight={<ArrowRight className="size-4" />}>
              Open the design lab
            </LinkButton>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
