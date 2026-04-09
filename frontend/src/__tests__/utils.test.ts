import { describe, it, expect } from 'vitest';
import { cn, formatMinutes, formatTimer, formatDate, formatRelativeTime } from '../lib/utils';

describe('cn (class names utility)', () => {
  it('should merge class names', () => {
    const result = cn('px-4', 'py-2');
    expect(result).toBe('px-4 py-2');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base', isActive && 'active');
    expect(result).toContain('active');
  });

  it('should merge tailwind conflicts', () => {
    const result = cn('px-4', 'px-6');
    expect(result).toBe('px-6');
  });

  it('should handle empty inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should filter falsy values', () => {
    const result = cn('base', false, null, undefined, 'extra');
    expect(result).toBe('base extra');
  });
});

describe('formatMinutes', () => {
  it('should format minutes only', () => {
    expect(formatMinutes(45)).toBe('45분');
  });

  it('should format hours only', () => {
    expect(formatMinutes(120)).toBe('2시간');
  });

  it('should format hours and minutes', () => {
    expect(formatMinutes(150)).toBe('2시간 30분');
  });

  it('should handle zero', () => {
    expect(formatMinutes(0)).toBe('0분');
  });

  it('should format exactly 60 minutes as 1 hour', () => {
    expect(formatMinutes(60)).toBe('1시간');
  });
});

describe('formatTimer', () => {
  it('should format seconds as MM:SS', () => {
    expect(formatTimer(0)).toBe('00:00');
  });

  it('should format 90 seconds', () => {
    expect(formatTimer(90)).toBe('01:30');
  });

  it('should format 25 minutes (pomodoro)', () => {
    expect(formatTimer(1500)).toBe('25:00');
  });

  it('should pad single digits', () => {
    expect(formatTimer(5)).toBe('00:05');
    expect(formatTimer(65)).toBe('01:05');
  });

  it('should handle large values', () => {
    expect(formatTimer(3661)).toBe('61:01');
  });
});

describe('formatDate', () => {
  it('should format ISO date to Korean locale', () => {
    const result = formatDate('2026-04-09T14:00:00.000Z');
    // Korean format: YYYY년 M월 D일
    expect(result).toContain('2026');
    expect(result).toContain('4');
    expect(result).toContain('9');
  });
});

describe('formatRelativeTime', () => {
  it('should show "방금 전" for recent times', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('방금 전');
  });

  it('should show minutes for recent past', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe('5분 전');
  });

  it('should show hours for past hours', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeHoursAgo)).toBe('3시간 전');
  });

  it('should show days for past days', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoDaysAgo)).toBe('2일 전');
  });

  it('should show formatted date for 30+ days', () => {
    const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const result = formatRelativeTime(twoMonthsAgo);
    // Should fall back to formatDate
    expect(result).toContain('년');
  });
});
