import { create } from 'zustand';
import type { TimerType, SessionStatus } from '@/types/api';

const POMODORO_WORK = 25 * 60;
const POMODORO_BREAK = 5 * 60;

type PomodoroPhase = 'work' | 'break';

interface TimerState {
  timerType: TimerType;
  status: SessionStatus | 'idle';
  elapsed: number;
  sessionId: string | null;
  nodeId: string | null;
  pomodoroCount: number;
  pomodoroPhase: PomodoroPhase;

  setTimerType: (type: TimerType) => void;
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

  setTimerType: (type) => set({ timerType: type }),

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
    const total = state.pomodoroPhase === 'work' ? POMODORO_WORK : POMODORO_BREAK;
    return Math.max(0, total - state.elapsed);
  },

  getPomodoroTotal: () => {
    const state = get();
    return state.pomodoroPhase === 'work' ? POMODORO_WORK : POMODORO_BREAK;
  },
}));
