import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { QuestionStep, type QuestionConfig } from './QuestionStep';
import { AnswerSummary } from './AnswerSummary';
import { PlanPreview } from './PlanPreview';
import {
  useCreatePlan,
  useUpdatePlanParams,
  useGeneratePlan,
  useConfirmPlan,
} from '@/hooks/usePlans';
import type { GeneratePlanResponse, UpdatePlanParamsRequest } from '@/types/api';

const PRIMARY_QUESTIONS: QuestionConfig[] = [
  {
    id: 'subject',
    question: '무엇을 공부하시나요?',
    hint: '과목명, 기술, 자격증 등을 입력하세요.',
    type: 'text',
    required: true,
  },
  {
    id: 'finalGoal',
    question: '최종 목표는 무엇인가요?',
    hint: '예: 정보처리기사 필기 합격, 토익 900점',
    type: 'text',
    required: true,
  },
  {
    id: 'deadline',
    question: '언제까지 달성하고 싶으신가요?',
    hint: '구체적인 날짜나 기간을 알려주세요. (예: 2개월 후, 2026년 6월 15일)',
    type: 'text',
    required: true,
  },
  {
    id: 'availableTime',
    question: '하루에 학습에 투자할 수 있는 시간은?',
    hint: '예: 하루 2시간, 평일 1시간 주말 4시간',
    type: 'text',
    required: true,
  },
  {
    id: 'currentLevel',
    question: '현재 수준은 어떻게 되시나요?',
    hint: '해당 분야에 대한 사전 지식 수준을 알려주세요.',
    type: 'select',
    options: [
      { value: '입문', label: '입문 - 처음 접하는 분야' },
      { value: '초급', label: '초급 - 기초 지식 있음' },
      { value: '중급', label: '중급 - 실무/학습 경험 있음' },
      { value: '고급', label: '고급 - 심화 학습 필요' },
    ],
    required: true,
  },
  {
    id: 'source',
    question: '어떤 학습 소스를 사용하시나요?',
    hint: '교재명, 강의, 웹사이트 등을 알려주세요. (예: 시나공 정보처리기사 필기, p.1-500)',
    type: 'textarea',
    required: true,
  },
  {
    id: 'managementStyle',
    question: '어떤 관리 방식을 원하시나요?',
    hint: '학습 관리의 강도를 선택하세요.',
    type: 'select',
    options: [
      { value: 'soft', label: '부드러운 - 자율적, 가벼운 리마인드' },
      { value: 'normal', label: '보통 - 적절한 알림과 피드백' },
      { value: 'strict', label: '엄격한 - 강한 알림, 상세 피드백' },
    ],
    required: true,
  },
];

const SECONDARY_QUESTIONS: QuestionConfig[] = [
  {
    id: 'contentStructure',
    question: '학습 내용의 구조를 알려주세요.',
    hint: '목차, 챕터, 단원 등의 구조 (복붙도 괜찮습니다)',
    type: 'textarea',
    required: false,
  },
  {
    id: 'focusArea',
    question: '특히 집중하고 싶은 영역이 있나요?',
    hint: '취약한 부분, 중요도가 높은 부분 등',
    type: 'textarea',
    required: false,
  },
  {
    id: 'studyMode',
    question: '선호하는 학습 방식은?',
    hint: '예: 이론 먼저 후 문제풀이, 반복 학습, 요약 정리',
    type: 'text',
    required: false,
  },
  {
    id: 'weeklyGoal',
    question: '주간 학습 목표가 있나요?',
    hint: '예: 주 5회 학습, 주 15시간',
    type: 'text',
    required: false,
  },
  {
    id: 'motivationFocus',
    question: '동기 부여에 도움이 되는 것은?',
    hint: '예: 진행률 시각화, 격려 메시지, 경쟁심',
    type: 'text',
    required: false,
  },
];

type WizardPhase = 'primary' | 'secondary' | 'generating' | 'preview';

export function PlanWizard() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<WizardPhase>('primary');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [planId, setPlanId] = useState<string | null>(null);
  const [preview, setPreview] = useState<GeneratePlanResponse | null>(null);

  const createPlan = useCreatePlan();
  const updateParams = useUpdatePlanParams(planId ?? '');
  const generatePlan = useGeneratePlan(planId ?? '');
  const confirmPlan = useConfirmPlan(planId ?? '');

  const questions = phase === 'secondary' ? SECONDARY_QUESTIONS : PRIMARY_QUESTIONS;
  const currentQuestion = questions[step];
  const totalSteps = questions.length;
  const progressPercent = ((step + 1) / totalSteps) * 100;

  const handleAnswer = useCallback(
    (value: string) => {
      if (!currentQuestion) return;
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    },
    [currentQuestion]
  );

  const buildParams = useCallback(
    (ans: Record<string, string>): UpdatePlanParamsRequest => {
      const params: UpdatePlanParamsRequest = {};

      if (ans['subject'] || ans['source']) {
        params.studyMaterial = {};
        if (ans['subject']) params.studyMaterial.subject = ans['subject'];
        if (ans['source']) {
          params.studyMaterial.sources = [
            { type: 'book', name: ans['source'] },
          ];
        }
      }
      if (ans['finalGoal']) params.finalGoal = ans['finalGoal'];
      if (ans['deadline']) params.deadline = ans['deadline'];
      if (ans['availableTime']) params.availableTime = ans['availableTime'];
      if (ans['currentLevel']) params.currentLevel = ans['currentLevel'];
      if (ans['managementStyle']) {
        params.managementStyle = ans['managementStyle'] as 'soft' | 'normal' | 'strict';
      }
      if (ans['contentStructure']) params.contentStructure = ans['contentStructure'];
      if (ans['focusArea']) params.focusArea = ans['focusArea'];
      if (ans['studyMode']) params.studyMode = ans['studyMode'];
      if (ans['weeklyGoal']) params.weeklyGoal = ans['weeklyGoal'];
      if (ans['motivationFocus']) params.motivationFocus = ans['motivationFocus'];

      return params;
    },
    []
  );

  const handleNext = useCallback(async () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
      return;
    }

    // Last step of current phase
    const previousPhase = phase;
    setPhase('generating');

    try {
      let currentPlanId = planId;

      if (!currentPlanId) {
        const plan = await createPlan.mutateAsync({
          title: answers['finalGoal'] || answers['subject'] || '새 학습 계획',
        });
        currentPlanId = plan.id;
        setPlanId(currentPlanId);
      }

      await updateParams.mutateAsync(buildParams(answers));

      const mode = previousPhase === 'secondary' ? 'detailed' : 'basic';
      const result = await generatePlan.mutateAsync({ mode });

      setPreview(result);
      setPhase('preview');
    } catch {
      setPhase(previousPhase);
    }
  }, [
    step,
    totalSteps,
    planId,
    answers,
    phase,
    createPlan,
    updateParams,
    generatePlan,
    buildParams,
  ]);

  const handlePrev = useCallback(() => {
    if (step > 0) {
      setStep(step - 1);
    }
  }, [step]);

  const handleConfirm = useCallback(async () => {
    if (!planId) return;
    try {
      await confirmPlan.mutateAsync();
      navigate(`/plans/${planId}/kanban`);
    } catch {
      // error handled by TanStack Query
    }
  }, [planId, confirmPlan, navigate]);

  const handleRefine = useCallback(() => {
    setPhase('secondary');
    setStep(0);
  }, []);

  const handleRegenerate = useCallback(async () => {
    setPhase('generating');
    try {
      const mode = phase === 'preview' && preview?.generationMode === 'detailed' ? 'detailed' : 'basic';
      const result = await generatePlan.mutateAsync({ mode });
      setPreview(result);
      setPhase('preview');
    } catch {
      setPhase('primary');
    }
  }, [phase, preview, generatePlan]);

  if (phase === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">AI가 학습 계획을 생성하고 있습니다...</p>
        <p className="text-xs text-muted-foreground">최대 15초 정도 소요될 수 있습니다.</p>
      </div>
    );
  }

  if (phase === 'preview' && preview) {
    return (
      <PlanPreview
        preview={preview}
        onConfirm={handleConfirm}
        onRefine={handleRefine}
        onRegenerate={handleRegenerate}
        isConfirming={confirmPlan.isPending}
      />
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="space-y-6" data-testid="plan-wizard">
      <div>
        <h1 className="text-xl font-bold">학습 계획 만들기</h1>
        <div className="mt-2 space-y-1">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-sm text-muted-foreground">
            Step {step + 1} of {totalSteps}
            {phase === 'secondary' && ' (정밀화)'}
          </p>
        </div>
      </div>

      <QuestionStep
        config={currentQuestion}
        value={answers[currentQuestion.id] ?? ''}
        onChange={handleAnswer}
      />

      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrev} disabled={step === 0}>
          이전
        </Button>
        <Button
          onClick={handleNext}
          disabled={currentQuestion.required && !answers[currentQuestion.id]}
        >
          {step === totalSteps - 1 ? '계획 생성하기' : '다음'}
        </Button>
      </div>

      <AnswerSummary questions={questions} answers={answers} currentStep={step} />
    </div>
  );
}
