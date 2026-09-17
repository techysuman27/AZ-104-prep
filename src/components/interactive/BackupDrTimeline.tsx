import { useState } from 'react';
import { CircleCheck, CircleX, Clock, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * The point of this widget is one idea the exam tests constantly: replication
 * copies mistakes, backups keep history. Replaying an incident against both
 * protections makes that concrete rather than memorised.
 */

type IncidentId = 'delete-file' | 'ransomware' | 'bad-release' | 'vm-lost' | 'region-out';

interface Protection {
  verdict: 'recovers' | 'partial' | 'cannot';
  headline: string;
  detail: string;
  /** Rough recovery characteristics, for the timeline row. */
  dataLost: string;
  timeToRecover: string;
}

interface Incident {
  id: IncidentId;
  label: string;
  story: string;
  backup: Protection;
  asr: Protection;
  verdict: string;
}

const INCIDENTS: Incident[] = [
  {
    id: 'delete-file',
    label: 'Someone deletes a file',
    story: 'A configuration file is deleted from a running production VM at 10:40. The application keeps running but misbehaves.',
    backup: {
      verdict: 'recovers',
      headline: 'File recovery from the last recovery point',
      detail: 'Mount the recovery point as a drive, copy the file back, unmount. The running VM is untouched.',
      dataLost: 'Only changes to that file since the recovery point',
      timeToRecover: 'Minutes',
    },
    asr: {
      verdict: 'cannot',
      headline: 'The deletion was replicated',
      detail: 'Replication is continuous, so the secondary region copy lost the file within minutes too.',
      dataLost: 'The file, in both regions',
      timeToRecover: '—',
    },
    verdict: 'Backup. Replication has no history to go back to.',
  },
  {
    id: 'ransomware',
    label: 'Ransomware encrypts the data',
    story: 'Malware encrypts the file system overnight. The encryption completed at 02:15 and was noticed at 07:00.',
    backup: {
      verdict: 'recovers',
      headline: 'Restore from a recovery point before 02:15',
      detail: 'Vault soft delete — and an immutable vault — are what stop the attacker deleting this copy as well.',
      dataLost: 'Everything written since the last clean recovery point',
      timeToRecover: 'Hours',
    },
    asr: {
      verdict: 'cannot',
      headline: 'The encrypted disks were replicated',
      detail: 'A faithful copy of encrypted data is still encrypted data. Failing over changes nothing.',
      dataLost: 'All of it, in both regions',
      timeToRecover: '—',
    },
    verdict: 'Backup, protected by soft delete and vault immutability.',
  },
  {
    id: 'bad-release',
    label: 'A release corrupts a database',
    story: 'A schema migration runs at 18:00 and silently corrupts records. The problem surfaces the next morning.',
    backup: {
      verdict: 'recovers',
      headline: 'Restore from a point before 18:00',
      detail: 'An Enhanced policy taking backups every four hours narrows how much legitimate work is lost alongside the corruption.',
      dataLost: 'Up to one backup interval of good data',
      timeToRecover: 'Hours',
    },
    asr: {
      verdict: 'cannot',
      headline: 'Corruption replicates like any other write',
      detail: 'The app-consistent recovery points in the secondary region contain the same corrupted records.',
      dataLost: 'Same corruption, both regions',
      timeToRecover: '—',
    },
    verdict: 'Backup — and backup frequency is what limits the collateral damage.',
  },
  {
    id: 'vm-lost',
    label: 'A VM is destroyed by a failed change',
    story: 'An automation run deletes a production VM and its disks at 14:00.',
    backup: {
      verdict: 'recovers',
      headline: 'Create new from the latest recovery point',
      detail: 'Replace existing is unavailable because the VM no longer exists, so Create new or Restore disks is the route.',
      dataLost: 'Changes since the last backup',
      timeToRecover: 'Hours',
    },
    asr: {
      verdict: 'partial',
      headline: 'Fail over the replicated copy',
      detail: 'Much faster than a restore and loses far less data, but the workload now runs in the secondary region until you fail back.',
      dataLost: 'Minutes',
      timeToRecover: 'Minutes',
    },
    verdict: 'Either — replication is faster, backup is simpler and keeps the workload in region.',
  },
  {
    id: 'region-out',
    label: 'The region becomes unavailable',
    story: 'A regional incident makes every resource in the primary region unreachable, with no estimated resolution.',
    backup: {
      verdict: 'partial',
      headline: 'Cross Region Restore into the paired region',
      detail: 'Only possible on a geo-redundant vault with Cross Region Restore enabled, and it is a vault-tier restore — correct, but slow.',
      dataLost: 'Up to one backup interval',
      timeToRecover: 'Hours',
    },
    asr: {
      verdict: 'recovers',
      headline: 'Fail over with the recovery plan',
      detail: 'Choose Latest processed for the lowest RTO, or Latest for the lowest RPO. Commit once verified, then reprotect.',
      dataLost: 'Minutes',
      timeToRecover: 'Minutes',
    },
    verdict: 'Site Recovery. This is the failure it exists for.',
  },
];

const STYLE = {
  recovers: { ring: 'border-success-100 bg-success-50/50', chip: 'bg-success-100 text-success-700', label: 'Recovers' },
  partial: { ring: 'border-warning-100 bg-warning-50/50', chip: 'bg-warning-100 text-warning-700', label: 'Partial' },
  cannot: { ring: 'border-danger-100 bg-danger-50/40', chip: 'bg-danger-100 text-danger-700', label: 'Cannot help' },
} as const;

function Card({ title, p }: { title: string; p: Protection }) {
  const s = STYLE[p.verdict];
  return (
    <div className={cn('rounded-xl border p-3', s.ring)}>
      <div className="flex items-center gap-2">
        <span className="text-[13.5px] font-semibold text-ink">{title}</span>
        <span className={cn('ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-2xs font-semibold', s.chip)}>
          {p.verdict === 'cannot' ? <CircleX className="size-3" aria-hidden="true" /> : p.verdict === 'partial' ? <TriangleAlert className="size-3" aria-hidden="true" /> : <CircleCheck className="size-3" aria-hidden="true" />}
          {s.label}
        </span>
      </div>
      <p className="mt-1.5 text-[13px] font-medium text-ink-2">{p.headline}</p>
      <p className="mt-1 text-[12.5px] leading-snug text-ink-3">{p.detail}</p>
      <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12px]">
        <div>
          <dt className="inline text-ink-4">Data lost: </dt>
          <dd className="inline text-ink-2">{p.dataLost}</dd>
        </div>
        <div>
          <dt className="inline text-ink-4">Time to recover: </dt>
          <dd className="inline text-ink-2">{p.timeToRecover}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function BackupDrTimeline() {
  const [id, setId] = useState<IncidentId>('ransomware');
  const incident = INCIDENTS.find((i) => i.id === id)!;

  return (
    <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="min-w-0 space-y-2 border-b border-line p-4 lg:border-r lg:border-b-0">
        <div className="text-2xs font-semibold tracking-wide text-ink-4 uppercase">Incident</div>
        {INCIDENTS.map((i) => (
          <button
            key={i.id}
            type="button"
            aria-pressed={id === i.id}
            onClick={() => setId(i.id)}
            className={cn(
              'block w-full rounded-lg border px-3 py-2 text-left text-[13px]',
              id === i.id ? 'border-brand-600 bg-brand-50 font-semibold text-ink' : 'border-line text-ink-2 hover:border-line-strong',
            )}
          >
            {i.label}
          </button>
        ))}
      </div>

      <div className="min-w-0 space-y-3 p-4">
        <p className="rounded-lg bg-subtle px-3 py-2 text-[13px] leading-snug text-ink-2">{incident.story}</p>

        <div className="grid gap-3 md:grid-cols-2">
          <Card title="Azure Backup" p={incident.backup} />
          <Card title="Site Recovery replication" p={incident.asr} />
        </div>

        <div aria-live="polite" className="flex items-start gap-2 rounded-xl bg-design-50 px-4 py-3">
          <Clock className="mt-0.5 size-4 shrink-0 text-design-500" aria-hidden="true" />
          <p className="text-[13px] leading-snug text-ink-2">
            <span className="font-semibold text-ink">What saves you: </span>
            {incident.verdict}
          </p>
        </div>

        <p className="text-xs leading-relaxed text-ink-3">
          Replication keeps a current copy, so it copies deletions, corruption and ransomware within minutes. Backup keeps history, so it can go back to before the damage — but a full restore is measured in hours, not minutes. Most production workloads need both.
        </p>
      </div>
    </div>
  );
}
