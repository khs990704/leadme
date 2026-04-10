import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateParamCompleteness } from '../services/plan.service';
import type { PlanParams } from '../types/index';

// ===========================
// calculateParamCompleteness
// ===========================

describe('calculateParamCompleteness', () => {
  it('should return all zeros when params is null', () => {
    const result = calculateParamCompleteness(null);

    expect(result).toEqual({
      primary: 0,
      primaryTotal: 7,
      secondary: 0,
      secondaryTotal: 9,
      isReadyForBasic: false,
      isReadyForDetailed: false,
    });
  });

  it('should return all zeros when params has no filled fields', () => {
    const params: PlanParams = {
      studyMaterial: null,
      finalGoal: null,
      deadline: null,
      availableTime: null,
      currentLevel: null,
      managementStyle: null,
      contentStructure: null,
      focusArea: null,
      studyMode: null,
      weeklyGoal: null,
      notificationFrequency: null,
      motivationFocus: null,
    };

    const result = calculateParamCompleteness(params);

    expect(result.primary).toBe(0);
    expect(result.secondary).toBe(0);
    expect(result.isReadyForBasic).toBe(false);
    expect(result.isReadyForDetailed).toBe(false);
  });

  it('should count primary fields correctly', () => {
    const params: PlanParams = {
      studyMaterial: {
        subject: '정보처리기사',
        sources: [{ type: 'book', name: null, totalVolume: null, additionalInfo: null }],
      },
      finalGoal: '합격',
      deadline: '2026-06-15',
      availableTime: '하루 2시간',
      currentLevel: '입문',
      managementStyle: 'normal',
      contentStructure: null,
      focusArea: null,
      studyMode: null,
      weeklyGoal: null,
      notificationFrequency: null,
      motivationFocus: null,
    };

    const result = calculateParamCompleteness(params);

    expect(result.primary).toBe(7);
    expect(result.isReadyForBasic).toBe(true);
  });

  it('should count secondary fields correctly', () => {
    const params: PlanParams = {
      studyMaterial: {
        subject: '정보처리기사',
        sources: [
          {
            type: 'book',
            name: '시나공',
            totalVolume: '900페이지',
            additionalInfo: '하루 1단원',
          },
        ],
      },
      finalGoal: '합격',
      deadline: '2026-06-15',
      availableTime: '하루 2시간',
      currentLevel: '입문',
      managementStyle: 'normal',
      contentStructure: '1장 소프트웨어 설계...',
      focusArea: 'UML',
      studyMode: '이론 위주',
      weeklyGoal: '주 5회',
      notificationFrequency: '매일',
      motivationFocus: '칭찬형',
    };

    const result = calculateParamCompleteness(params);

    expect(result.primary).toBe(7);
    expect(result.secondary).toBe(9); // 6 fields + 3 source details
    expect(result.isReadyForBasic).toBe(true);
    expect(result.isReadyForDetailed).toBe(true);
  });

  it('should require at least 1 secondary for detailed mode', () => {
    const params: PlanParams = {
      studyMaterial: {
        subject: '정보처리기사',
        sources: [{ type: 'book', name: null, totalVolume: null, additionalInfo: null }],
      },
      finalGoal: '합격',
      deadline: '2026-06-15',
      availableTime: '하루 2시간',
      currentLevel: '입문',
      managementStyle: 'normal',
      contentStructure: null,
      focusArea: null,
      studyMode: null,
      weeklyGoal: null,
      notificationFrequency: null,
      motivationFocus: null,
    };

    const result = calculateParamCompleteness(params);

    expect(result.isReadyForBasic).toBe(true);
    expect(result.isReadyForDetailed).toBe(false);
  });

  it('should count subject without sources as 1 primary', () => {
    const params: PlanParams = {
      studyMaterial: {
        subject: '영어',
        sources: [],
      },
      finalGoal: null,
      deadline: null,
      availableTime: null,
      currentLevel: null,
      managementStyle: null,
      contentStructure: null,
      focusArea: null,
      studyMode: null,
      weeklyGoal: null,
      notificationFrequency: null,
      motivationFocus: null,
    };

    const result = calculateParamCompleteness(params);

    expect(result.primary).toBe(1); // subject only, sources empty
  });

  it('should handle partial primary completion', () => {
    const params: PlanParams = {
      studyMaterial: null,
      finalGoal: '토익 900점',
      deadline: '3개월',
      availableTime: null,
      currentLevel: '초급',
      managementStyle: null,
      contentStructure: null,
      focusArea: null,
      studyMode: null,
      weeklyGoal: null,
      notificationFrequency: null,
      motivationFocus: null,
    };

    const result = calculateParamCompleteness(params);

    expect(result.primary).toBe(3); // finalGoal + deadline + currentLevel
    expect(result.isReadyForBasic).toBe(false);
  });
});
