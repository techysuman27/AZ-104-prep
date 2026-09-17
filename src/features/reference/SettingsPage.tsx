import { useRef, useState } from 'react';
import { Download, RotateCcw, Upload } from 'lucide-react';
import { PageContainer } from '@/components/layout/Page';
import { Card, PageHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Overlay';
import { Switch } from '@/components/ui/Switch';
import { useLearner, type LearnerState } from '@/store/learner';

const DATA_KEYS = ['version', 'lessons', 'attempts', 'srs', 'bookmarks', 'recent', 'mocks', 'labs', 'trouble', 'design', 'activityDays', 'settings'] as const;

export default function SettingsPage() {
  const settings = useLearner((s) => s.settings);
  const setSetting = useLearner((s) => s.setSetting);
  const importState = useLearner((s) => s.importState);
  const resetAll = useLearner((s) => s.resetAll);
  const attempts = useLearner((s) => s.attempts.length);
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const exportData = () => {
    const state = useLearner.getState();
    const data = Object.fromEntries(DATA_KEYS.map((k) => [k, state[k]]));
    const blob = new Blob([JSON.stringify({ app: 'stratus', exportedAt: new Date().toISOString(), data }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stratus-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ tone: 'good', text: 'Progress exported.' });
  };

  const importData = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed?.app !== 'stratus' || typeof parsed.data !== 'object') throw new Error('This file is not a Stratus progress export.');
      const data = parsed.data as Partial<LearnerState>;
      if (!Array.isArray(data.attempts) || typeof data.lessons !== 'object') throw new Error('The export is missing progress data.');
      importState(data);
      setMessage({ tone: 'good', text: `Imported progress with ${data.attempts.length} answered questions.` });
    } catch (e) {
      setMessage({ tone: 'bad', text: e instanceof Error ? e.message : 'Import failed.' });
    }
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow={<span className="text-xs font-semibold tracking-wide text-brand-700 uppercase">Settings &amp; data</span>}
        title="Settings"
        description="Your progress is stored locally in this browser. Export it to back it up or move it to another device."
      />
      <div className="max-w-2xl space-y-5">
        <Card className="space-y-5 p-5">
          <div>
            <label htmlFor="exam-date" className="text-[14px] font-semibold text-ink">
              Exam date
            </label>
            <p className="text-[13px] text-ink-3">Shows a countdown on your dashboard.</p>
            <input
              id="exam-date"
              type="date"
              value={settings.examDate ?? ''}
              onChange={(e) => setSetting('examDate', e.target.value || undefined)}
              className="mt-2 h-10 rounded-lg border border-line bg-surface px-3 text-[14px] text-ink focus-visible:shadow-focus focus-visible:outline-none"
            />
          </div>
          <div className="border-t border-line pt-5">
            <Switch
              checked={settings.explanationMode === 'simple'}
              onCheckedChange={(v) => setSetting('explanationMode', v ? 'simple' : 'technical')}
              label="Explain it like I'm new to Azure"
              description="Show plain-language explanations first in lessons, concepts and flashcards."
            />
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <div>
            <h2 className="text-[14px] font-semibold text-ink">Your data</h2>
            <p className="text-[13px] text-ink-3">{attempts} answered questions are stored in this browser.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={<Download className="size-4" />} onClick={exportData}>
              Export progress
            </Button>
            <Button variant="secondary" icon={<Upload className="size-4" />} onClick={() => fileRef.current?.click()}>
              Import progress
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importData(f);
                e.target.value = '';
              }}
            />
          </div>
          {message && (
            <p role="status" className={message.tone === 'good' ? 'rounded-lg bg-success-50 px-3 py-2 text-[13px] text-success-700' : 'rounded-lg bg-danger-50 px-3 py-2 text-[13px] text-danger-700'}>
              {message.text}
            </p>
          )}
        </Card>

        <Card className="border-danger-100 p-5">
          <h2 className="text-[14px] font-semibold text-danger-700">Reset all progress</h2>
          <p className="mt-0.5 text-[13px] text-ink-3">Deletes lessons, answers, flashcard schedules, mock exams and lab progress from this browser.</p>
          <Button variant="danger" className="mt-3" icon={<RotateCcw className="size-4" />} onClick={() => setConfirmReset(true)}>
            Reset progress
          </Button>
        </Card>
      </div>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset} title="Reset all progress?" description="This cannot be undone. Export your progress first if you may want it back.">
        <div className="flex justify-end gap-2 p-5">
          <Button variant="secondary" onClick={() => setConfirmReset(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              resetAll();
              setConfirmReset(false);
              setMessage({ tone: 'good', text: 'All progress was reset.' });
            }}
          >
            Reset everything
          </Button>
        </div>
      </Dialog>
    </PageContainer>
  );
}
