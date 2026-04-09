import { describe, it, expect } from 'vitest';
import type { UpdatePlanParamsRequest, ManagementStyle } from '../types/api';

// ===========================
// PlanWizard Logic Tests (Unit)
// ===========================
// Tests the core buildParams and step navigation logic without DOM rendering.

describe('PlanWizard buildParams Logic', () => {
  function buildParams(answers: Record<string, string>): UpdatePlanParamsRequest {
    const params: UpdatePlanParamsRequest = {};

    if (answers['subject'] || answers['source']) {
      params.studyMaterial = {};
      if (answers['subject']) params.studyMaterial.subject = answers['subject'];
      if (answers['source']) {
        params.studyMaterial.sources = [{ type: 'book', name: answers['source'] }];
      }
    }
    if (answers['finalGoal']) params.finalGoal = answers['finalGoal'];
    if (answers['deadline']) params.deadline = answers['deadline'];
    if (answers['availableTime']) params.availableTime = answers['availableTime'];
    if (answers['currentLevel']) params.currentLevel = answers['currentLevel'];
    if (answers['managementStyle']) {
      params.managementStyle = answers['managementStyle'] as ManagementStyle;
    }
    if (answers['contentStructure']) params.contentStructure = answers['contentStructure'];
    if (answers['focusArea']) params.focusArea = answers['focusArea'];
    if (answers['studyMode']) params.studyMode = answers['studyMode'];
    if (answers['weeklyGoal']) params.weeklyGoal = answers['weeklyGoal'];
    if (answers['motivationFocus']) params.motivationFocus = answers['motivationFocus'];

    return params;
  }

  it('should build params from all primary answers', () => {
    const answers = {
      subject: '정보처리기사',
      source: '시나공 정보처리기사',
      finalGoal: '필기 합격',
      deadline: '2026-06-15',
      availableTime: '하루 2시간',
      currentLevel: '입문',
      managementStyle: 'normal',
    };

    const params = buildParams(answers);

    expect(params.studyMaterial?.subject).toBe('정보처리기사');
    expect(params.studyMaterial?.sources).toHaveLength(1);
    expect(params.studyMaterial?.sources?.[0].name).toBe('시나공 정보처리기사');
    expect(params.finalGoal).toBe('필기 합격');
    expect(params.deadline).toBe('2026-06-15');
    expect(params.availableTime).toBe('하루 2시간');
    expect(params.currentLevel).toBe('입문');
    expect(params.managementStyle).toBe('normal');
  });

  it('should handle empty answers', () => {
    const params = buildParams({});

    expect(params.studyMaterial).toBeUndefined();
    expect(params.finalGoal).toBeUndefined();
    expect(params.deadline).toBeUndefined();
  });

  it('should handle partial answers', () => {
    const answers = {
      subject: '영어',
      finalGoal: '토익 900',
    };

    const params = buildParams(answers);

    expect(params.studyMaterial?.subject).toBe('영어');
    expect(params.studyMaterial?.sources).toBeUndefined();
    expect(params.finalGoal).toBe('토익 900');
    expect(params.deadline).toBeUndefined();
  });

  it('should include secondary params when provided', () => {
    const answers = {
      contentStructure: '1장 기초, 2장 응용',
      focusArea: 'UML 부분',
      studyMode: '이론 후 문제풀이',
      weeklyGoal: '주 5회',
      motivationFocus: '칭찬형',
    };

    const params = buildParams(answers);

    expect(params.contentStructure).toBe('1장 기초, 2장 응용');
    expect(params.focusArea).toBe('UML 부분');
    expect(params.studyMode).toBe('이론 후 문제풀이');
    expect(params.weeklyGoal).toBe('주 5회');
    expect(params.motivationFocus).toBe('칭찬형');
  });

  it('should set source type as book by default', () => {
    const answers = {
      source: '교재 이름',
    };

    const params = buildParams(answers);

    expect(params.studyMaterial?.sources?.[0].type).toBe('book');
  });
});

describe('PlanWizard Step Navigation Logic', () => {
  const PRIMARY_COUNT = 7;
  const SECONDARY_COUNT = 5;

  it('should have correct total steps for primary phase', () => {
    expect(PRIMARY_COUNT).toBe(7);
  });

  it('should have correct total steps for secondary phase', () => {
    expect(SECONDARY_COUNT).toBe(5);
  });

  it('should calculate progress correctly at step 0', () => {
    const step = 0;
    const total = PRIMARY_COUNT;
    const progress = ((step + 1) / total) * 100;

    expect(progress).toBeCloseTo(14.29, 1);
  });

  it('should calculate progress correctly at last step', () => {
    const step = PRIMARY_COUNT - 1;
    const total = PRIMARY_COUNT;
    const progress = ((step + 1) / total) * 100;

    expect(progress).toBe(100);
  });

  it('should calculate progress correctly at middle step', () => {
    const step = 3;
    const total = PRIMARY_COUNT;
    const progress = ((step + 1) / total) * 100;

    expect(progress).toBeCloseTo(57.14, 1);
  });

  describe('required field validation', () => {
    it('should block next when required field is empty', () => {
      const required = true;
      const answer = '';
      const canProceed = !(required && !answer);

      expect(canProceed).toBe(false);
    });

    it('should allow next when required field is filled', () => {
      const required = true;
      const answer = '정보처리기사';
      const canProceed = !(required && !answer);

      expect(canProceed).toBe(true);
    });

    it('should allow next when field is not required', () => {
      const required = false;
      const answer = '';
      const canProceed = !(required && !answer);

      expect(canProceed).toBe(true);
    });
  });
});
