export interface CoachContext {
  scope: 'node' | 'plan';
  planTitle: string;
  managementStyle: string | null;
  // Node scope context
  nodeTitle?: string;
  nodeStatus?: string;
  totalStudiedMinutes?: number;
  estimatedMinutes?: number | null;
  sessionLogs?: Array<{
    progressPercent: number | null;
    focusLevel: number | null;
    distractionType: string | null;
    note: string | null;
  }>;
  reviews?: Array<{
    reflection: string | null;
    difficulty: string | null;
    distraction: string | null;
    improvement: string | null;
  }>;
  // Plan scope context
  totalNodes?: number;
  doneNodes?: number;
  inProgressNodes?: number;
  todoNodes?: number;
  milestones?: Array<{
    title: string;
    status: string;
    nodeCount: number;
    doneCount: number;
  }>;
}

export function buildCoachPrompt(context: CoachContext): string {
  const styleInstruction =
    context.managementStyle === 'strict'
      ? '사용자는 엄격한 관리를 원합니다. 직설적이고 목표 지향적인 피드백을 제공하세요.'
      : context.managementStyle === 'soft'
        ? '사용자는 부드러운 관리를 원합니다. 격려와 공감 위주의 피드백을 제공하세요.'
        : '균형 잡힌 톤으로 피드백을 제공하세요.';

  if (context.scope === 'node') {
    return `당신은 학습 코치입니다. 학습자의 특정 학습 노드에 대해 피드백을 제공합니다.

${styleInstruction}

# 학습 정보
- 계획: ${context.planTitle}
- 노드: ${context.nodeTitle || ''}
- 상태: ${context.nodeStatus || ''}
- 예상 시간: ${context.estimatedMinutes || '미정'}분
- 실제 학습 시간: ${context.totalStudiedMinutes || 0}분

# 세션 로그
${
  context.sessionLogs?.length
    ? context.sessionLogs
        .map(
          (log, i) =>
            `세션 ${i + 1}: 진행도=${log.progressPercent ?? '?'}%, 집중도=${log.focusLevel ?? '?'}/5, 방해요소=${log.distractionType ?? '없음'}, 메모=${log.note ?? '없음'}`,
        )
        .join('\n')
    : '세션 로그 없음'
}

# 학습 리뷰
${
  context.reviews?.length
    ? context.reviews
        .map(
          (r, i) =>
            `리뷰 ${i + 1}: 회고=${r.reflection ?? '없음'}, 어려움=${r.difficulty ?? '없음'}, 방해=${r.distraction ?? '없음'}, 보완점=${r.improvement ?? '없음'}`,
        )
        .join('\n')
    : '리뷰 없음'
}

# 출력 형식 (JSON)
{
  "summary": "전체 피드백 요약 (2-3문장)",
  "progressAnalysis": {
    "expected": 0,
    "actual": 0,
    "gap": 0
  },
  "suggestions": ["제안1", "제안2", "제안3"],
  "motivationMessage": "동기부여 메시지"
}

progressAnalysis의 expected는 예상 시간 대비 진행률, actual은 실제 세션 로그 기반 진행률입니다.
반드시 위 JSON 형식만 출력하세요.`;
  }

  // Plan scope
  const totalNodes = context.totalNodes || 0;
  const doneNodes = context.doneNodes || 0;
  const progress = totalNodes > 0 ? Math.round((doneNodes / totalNodes) * 100) : 0;

  return `당신은 학습 코치입니다. 학습자의 전체 학습 계획에 대해 피드백을 제공합니다.

${styleInstruction}

# 계획 정보
- 계획: ${context.planTitle}
- 전체 노드: ${totalNodes}개
- 완료: ${doneNodes}개
- 진행 중: ${context.inProgressNodes || 0}개
- 대기: ${context.todoNodes || 0}개
- 진행률: ${progress}%

# 마일스톤 현황
${
  context.milestones?.length
    ? context.milestones
        .map(
          (m) =>
            `- ${m.title}: ${m.status} (${m.doneCount}/${m.nodeCount} 완료)`,
        )
        .join('\n')
    : '마일스톤 없음'
}

# 출력 형식 (JSON)
{
  "summary": "전체 피드백 요약 (2-3문장)",
  "progressAnalysis": {
    "expected": ${progress},
    "actual": ${progress},
    "gap": 0
  },
  "suggestions": ["제안1", "제안2", "제안3"],
  "motivationMessage": "동기부여 메시지"
}

반드시 위 JSON 형식만 출력하세요.`;
}
