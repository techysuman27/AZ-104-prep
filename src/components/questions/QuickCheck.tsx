import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { QUESTION_INDEX } from '@/content/questions';
import type { Question } from '@/content/schema';
import { gradeQuestion, isAnswered, type Answer } from '@/engine/grading';
import { useLearner } from '@/store/learner';
import { Button } from '@/components/ui/Button';
import { ExplanationPanel, QuestionBody, QuestionMeta, QuestionStem } from './QuestionCard';

export function InlineQuestion({ question, mode = 'lesson' }: { question: Question; mode?: 'lesson' | 'practice' | 'review' }) {
  const [answer, setAnswer] = useState<Answer>(undefined);
  const [revealed, setRevealed] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const recordAttempts = useLearner((s) => s.recordAttempts);

  const check = () => {
    const r = gradeQuestion(question, answer);
    recordAttempts([{ questionId: question.id, correct: r.correct, score: r.score, at: Date.now(), mode, ms: Date.now() - startedAt }]);
    setRevealed(true);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <QuestionMeta question={question} />
      <QuestionStem question={question} />
      <QuestionBody question={question} answer={answer} onAnswerChange={setAnswer} revealed={revealed} />
      {!revealed ? (
        <div className="flex items-center gap-3">
          <Button onClick={check} disabled={!isAnswered(question, answer)}>
            Check answer
          </Button>
          {!isAnswered(question, answer) && <span className="text-xs text-ink-3">Choose an answer to check it.</span>}
        </div>
      ) : (
        <>
          <ExplanationPanel question={question} answer={answer} />
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw className="size-3.5" />}
            onClick={() => {
              setAnswer(undefined);
              setRevealed(false);
              setStartedAt(Date.now());
            }}
          >
            Try again
          </Button>
        </>
      )}
    </div>
  );
}

export default function QuickCheck({ questionIds }: { questionIds: string[] }) {
  const questions = questionIds.map((id) => QUESTION_INDEX[id]).filter(Boolean);
  if (!questions.length) return null;
  return (
    <div className="space-y-4">
      {questions.map((q) => (
        <InlineQuestion key={q.id} question={q} />
      ))}
    </div>
  );
}
