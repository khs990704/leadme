import { PlanParams } from '../types/index.js';

export function buildPlannerPrompt(params: PlanParams): string {
  const material = params.studyMaterial;
  const sources = material?.sources
    ?.map((s) => {
      const parts = [`유형: ${s.type}`];
      if (s.name) parts.push(`이름: ${s.name}`);
      if (s.totalVolume) parts.push(`분량: ${s.totalVolume}`);
      if (s.additionalInfo) parts.push(`참고: ${s.additionalInfo}`);
      return parts.join(', ');
    })
    .join('\n  - ') || '없음';

  return `당신은 학습 계획 생성 전문가입니다.
사용자의 학습 정보를 바탕으로 분량 기반(volume_based) 학습 계획을 생성합니다.

# 학습 정보
- 과목: ${material?.subject || '미정'}
- 학습 자료:
  - ${sources}
- 최종 목표: ${params.finalGoal || '미정'}
- 마감일: ${params.deadline || '미정'}
- 가용 시간: ${params.availableTime || '미정'}
- 현재 수준: ${params.currentLevel || '미정'}
- 관리 스타일: ${params.managementStyle || 'normal'}

# 생성 규칙
1. MacroGoal은 1~3개로 구성합니다.
2. 각 MacroGoal에는 2~5개의 Milestone을 배치합니다.
3. 각 Milestone에는 3~8개의 TodoNode를 배치합니다.
4. TodoNode의 estimatedMinutes는 30~180분 사이여야 합니다.
5. 분량 기반으로 페이지/챕터/강의를 균등 분배합니다.
6. targetDate는 마감일을 기준으로 역산하여 배분합니다.

# 출력 형식 (JSON)
{
  "macroGoals": [
    {
      "title": "목표 제목",
      "description": "목표 설명",
      "order": 0,
      "milestones": [
        {
          "title": "마일스톤 제목",
          "description": "마일스톤 설명",
          "targetDate": "YYYY-MM-DD",
          "order": 0,
          "todos": [
            {
              "title": "할 일 제목 (페이지/범위 포함)",
              "estimatedMinutes": 60,
              "order": 0,
              "studyGuide": {
                "objective": "학습 목표",
                "prerequisites": ["사전 지식"],
                "generationBasis": "volume_based",
                "notes": null
              }
            }
          ]
        }
      ]
    }
  ]
}

반드시 위 JSON 형식만 출력하세요. 설명이나 마크다운 없이 순수 JSON만 반환합니다.`;
}
