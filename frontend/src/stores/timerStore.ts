import { create } from 'zustand';
import type { TimerType, SessionStatus } from '@/types/api';

const DEFAULT_POMODORO_WORK = 25 * 60;
const POMODORO_BREAK = 5 * 60;
const MINUTE_IN_SECONDS = 60;

type PomodoroPhase = 'work' | 'break';

function parseDurationInputToSeconds(duration: number | string | null | undefined): number | null {
  if (typeof duration === 'number' && Number.isFinite(duration) && duration > 0) {
    return Math.round(duration * MINUTE_IN_SECONDS);
  }

  if (typeof duration !== 'string') return null;

  const normalized = duration.trim().toLowerCase();
  if (!normalized) return null;

  let totalMinutes = 0;

  const hourMatches = normalized.matchAll(/(\d+(?:\.\d+)?)\s*(?:시간|hour|hours|hr|hrs|h)/g);
  for (const match of hourMatches) {
    totalMinutes += Math.round(Number(match[1]) * 60);
  }

  const minuteMatches = normalized.matchAll(/(\d+(?:\.\d+)?)\s*(?:분|minute|minutes|min|mins|m)/g);
  for (const match of minuteMatches) {
    totalMinutes += Math.round(Number(match[1]));
  }

  if (totalMinutes > 0) return totalMinutes * MINUTE_IN_SECONDS;

  const fallbackMinutes = Number(normalized.replace(/[^\d.]/g, ''));
  return Number.isFinite(fallbackMinutes) && fallbackMinutes > 0
    ? Math.round(fallbackMinutes * MINUTE_IN_SECONDS)
    : null;
}

interface TimerState {
  timerType: TimerType;
  status: SessionStatus | 'idle';
  elapsed: number;
  sessionId: string | null;
  nodeId: string | null;
  pomodoroCount: number;
  pomodoroPhase: PomodoroPhase;
  pomodoroWorkSeconds: number;

  setTimerType: (type: TimerType) => void;
  setPomodoroDuration: (duration: number | string | null | undefined) => void;
  startTimer: (sessionId: string, nodeId: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  tick: () => void;
  resetTimer: () => void;
  nextPomodoroPhase: () => void;

  getPomodoroRemaining: () => number;
  getPomodoroTotal: () => number;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  timerType: 'pomodoro',
  status: 'idle',
  elapsed: 0,
  sessionId: null,
  nodeId: null,
  pomodoroCount: 0,
  pomodoroPhase: 'work',
  pomodoroWorkSeconds: DEFAULT_POMODORO_WORK,

  setTimerType: (type) => set({ timerType: type }),

  setPomodoroDuration: (duration) => {
    const parsedSeconds = parseDurationInputToSeconds(duration);
    set({
      pomodoroWorkSeconds: parsedSeconds ?? DEFAULT_POMODORO_WORK,
    });
  },

  startTimer: (sessionId, nodeId) =>
    set({
      status: 'active',
      sessionId,
      nodeId,
      elapsed: 0,
      pomodoroPhase: 'work',
    }),

  pauseTimer: () => set({ status: 'paused' }),

  resumeTimer: () => set({ status: 'active' }),

  stopTimer: () =>
    set({
      status: 'idle',
      sessionId: null,
      elapsed: 0,
    }),

  tick: () => {
    const state = get();
    if (state.status !== 'active') return;
    set({ elapsed: state.elapsed + 1 });
  },

  resetTimer: () =>
    set({
      status: 'idle',
      elapsed: 0,
      sessionId: null,
      nodeId: null,
      pomodoroCount: 0,
      pomodoroPhase: 'work',
    }),

  nextPomodoroPhase: () => {
    const state = get();
    if (state.pomodoroPhase === 'work') {
      set({
        pomodoroPhase: 'break',
        pomodoroCount: state.pomodoroCount + 1,
        elapsed: 0,
      });
    } else {
      set({ pomodoroPhase: 'work', elapsed: 0 });
    }
  },

  getPomodoroRemaining: () => {
    const state = get();
    const total = state.pomodoroPhase === 'work' ? state.pomodoroWorkSeconds : POMODORO_BREAK;
    return Math.max(0, total - state.elapsed);
  },

  getPomodoroTotal: () => {
    const state = get();
    return state.pomodoroPhase === 'work' ? state.pomodoroWorkSeconds : POMODORO_BREAK;
  },
}));
