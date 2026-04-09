import type { QuestionConfig } from './QuestionStep';

interface AnswerSummaryProps {
  questions: QuestionConfig[];
  answers: Record<string, string>;
  currentStep: number;
}

export function AnswerSummary({ questions, answers, currentStep }: AnswerSummaryProps) {
  const answeredQuestions = questions.slice(0, currentStep).filter((q) => answers[q.id]);

  if (answeredQuestions.length === 0) {
    return null;
  }

  return (
    <div className="border-t pt-4 mt-4">
      <p className="text-sm font-medium text-muted-foreground mb-2">이전 답변 요약:</p>
      <ul className="space-y-1">
        {answeredQuestions.map((q) => {
          const answer = answers[q.id];
          if (!answer) return null;
          const label = q.question.replace(/\?$/, '').split(',')[0];
          return (
            <li key={q.id} className="text-sm text-muted-foreground">
              <span className="mr-1">&middot;</span>
              {label}: <span className="text-foreground">{answer}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
