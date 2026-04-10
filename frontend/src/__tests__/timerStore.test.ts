import { describe, it, expect, beforeEach } from 'vitest';
import { useTimerStore } from '../stores/timerStore';

describe('useTimerStore', () => {
  beforeEach(() => {
    useTimerStore.setState({
      timerType: 'pomodoro',
      status: 'idle',
      elapsed: 0,
      sessionId: null,
      nodeId: null,
      pomodoroCount: 0,
      pomodoroPhase: 'work',
      pomodoroWorkSeconds: 25 * 60,
    });
  });

  describe('setTimerType', () => {
    it('should set timer type to pomodoro', () => {
      useTimerStore.getState().setTimerType('pomodoro');
      expect(useTimerStore.getState().timerType).toBe('pomodoro');
    });

    it('should set timer type to stopwatch', () => {
      useTimerStore.getState().setTimerType('stopwatch');
      expect(useTimerStore.getState().timerType).toBe('stopwatch');
    });
  });

  describe('startTimer', () => {
    it('should set status to active and store session info', () => {
      useTimerStore.getState().startTimer('session-1', 'node-1');

      const state = useTimerStore.getState();
      expect(state.status).toBe('active');
      expect(state.sessionId).toBe('session-1');
      expect(state.nodeId).toBe('node-1');
      expect(state.elapsed).toBe(0);
      expect(state.pomodoroPhase).toBe('work');
    });
  });

  describe('setPomodoroDuration', () => {
    it('should set pomodoro duration from numeric minutes', () => {
      useTimerStore.getState().setPomodoroDuration(60);

      expect(useTimerStore.getState().pomodoroWorkSeconds).toBe(60 * 60);
    });

    it('should parse hour and minute strings', () => {
      useTimerStore.getState().setPomodoroDuration('1시간 30분');

      expect(useTimerStore.getState().pomodoroWorkSeconds).toBe(90 * 60);
    });

    it('should fall back to default when input is invalid', () => {
      useTimerStore.getState().setPomodoroDuration('알 수 없음');

      expect(useTimerStore.getState().pomodoroWorkSeconds).toBe(25 * 60);
    });
  });

  describe('restoreTimer', () => {
    it('should restore an active timer from server session data', () => {
      const startedAt = new Date(Date.now() - 90 * 1000).toISOString();

      useTimerStore.getState().restoreTimer('session-1', 'node-1', 'stopwatch', startedAt);

      const state = useTimerStore.getState();
      expect(state.status).toBe('active');
      expect(state.sessionId).toBe('session-1');
      expect(state.nodeId).toBe('node-1');
      expect(state.timerType).toBe('stopwatch');
      expect(state.elapsed).toBeGreaterThanOrEqual(90);
    });
  });

  describe('pauseTimer', () => {
    it('should set status to paused', () => {
      useTimerStore.getState().startTimer('session-1', 'node-1');
      useTimerStore.getState().pauseTimer();

      expect(useTimerStore.getState().status).toBe('paused');
    });
  });

  describe('resumeTimer', () => {
    it('should set status back to active', () => {
      useTimerStore.getState().startTimer('session-1', 'node-1');
      useTimerStore.getState().pauseTimer();
      useTimerStore.getState().resumeTimer();

      expect(useTimerStore.getState().status).toBe('active');
    });
  });

  describe('stopTimer', () => {
    it('should reset status to idle and clear sessionId', () => {
      useTimerStore.getState().startTimer('session-1', 'node-1');
      useTimerStore.getState().stopTimer();

      const state = useTimerStore.getState();
      expect(state.status).toBe('idle');
      expect(state.sessionId).toBeNull();
      expect(state.elapsed).toBe(0);
    });
  });

  describe('tick', () => {
    it('should increment elapsed by 1 when active', () => {
      useTimerStore.getState().startTimer('session-1', 'node-1');
      useTimerStore.getState().tick();

      expect(useTimerStore.getState().elapsed).toBe(1);
    });

    it('should not increment when paused', () => {
      useTimerStore.getState().startTimer('session-1', 'node-1');
      useTimerStore.getState().pauseTimer();
      useTimerStore.getState().tick();

      expect(useTimerStore.getState().elapsed).toBe(0);
    });

    it('should not increment when idle', () => {
      useTimerStore.getState().tick();
      expect(useTimerStore.getState().elapsed).toBe(0);
    });

    it('should accumulate ticks correctly', () => {
      useTimerStore.getState().startTimer('session-1', 'node-1');

      for (let i = 0; i < 10; i++) {
        useTimerStore.getState().tick();
      }

      expect(useTimerStore.getState().elapsed).toBe(10);
    });
  });

  describe('resetTimer', () => {
    it('should reset all timer state', () => {
      useTimerStore.getState().startTimer('session-1', 'node-1');
      useTimerStore.getState().tick();
      useTimerStore.getState().tick();
      useTimerStore.getState().resetTimer();

      const state = useTimerStore.getState();
      expect(state.status).toBe('idle');
      expect(state.elapsed).toBe(0);
      expect(state.sessionId).toBeNull();
      expect(state.nodeId).toBeNull();
      expect(state.pomodoroCount).toBe(0);
      expect(state.pomodoroPhase).toBe('work');
    });
  });

  describe('nextPomodoroPhase', () => {
    it('should transition from work to break and increment count', () => {
      useTimerStore.getState().startTimer('session-1', 'node-1');
      useTimerStore.getState().nextPomodoroPhase();

      const state = useTimerStore.getState();
      expect(state.pomodoroPhase).toBe('break');
      expect(state.pomodoroCount).toBe(1);
      expect(state.elapsed).toBe(0);
    });

    it('should transition from break back to work', () => {
      useTimerStore.getState().startTimer('session-1', 'node-1');
      useTimerStore.getState().nextPomodoroPhase(); // work -> break
      useTimerStore.getState().nextPomodoroPhase(); // break -> work

      const state = useTimerStore.getState();
      expect(state.pomodoroPhase).toBe('work');
      expect(state.pomodoroCount).toBe(1); // count only increments on work->break
      expect(state.elapsed).toBe(0);
    });

    it('should track multiple pomodoro cycles', () => {
      useTimerStore.getState().startTimer('session-1', 'node-1');

      // 3 full cycles
      for (let i = 0; i < 3; i++) {
        useTimerStore.getState().nextPomodoroPhase(); // work -> break
        useTimerStore.getState().nextPomodoroPhase(); // break -> work
      }

      expect(useTimerStore.getState().pomodoroCount).toBe(3);
      expect(useTimerStore.getState().pomodoroPhase).toBe('work');
    });
  });

  describe('getPomodoroRemaining', () => {
    it('should return configured work minutes for work phase at start', () => {
      useTimerStore.getState().setPomodoroDuration(60);
      useTimerStore.getState().startTimer('session-1', 'node-1');

      const remaining = useTimerStore.getState().getPomodoroRemaining();
      expect(remaining).toBe(60 * 60);
    });

    it('should decrease remaining as elapsed increases', () => {
      useTimerStore.getState().setPomodoroDuration(60);
      useTimerStore.getState().startTimer('session-1', 'node-1');

      useTimerStore.setState({ elapsed: 5 * 60 });

      const remaining = useTimerStore.getState().getPomodoroRemaining();
      expect(remaining).toBe(55 * 60);
    });

    it('should return 5 minutes for break phase at start', () => {
      useTimerStore.getState().startTimer('session-1', 'node-1');
      useTimerStore.getState().nextPomodoroPhase(); // work -> break

      const remaining = useTimerStore.getState().getPomodoroRemaining();
      expect(remaining).toBe(5 * 60); // 300 seconds
    });

    it('should not go below 0', () => {
      useTimerStore.getState().startTimer('session-1', 'node-1');
      useTimerStore.setState({ elapsed: 30 * 60 }); // 30 minutes > 25 minutes work

      const remaining = useTimerStore.getState().getPomodoroRemaining();
      expect(remaining).toBe(0);
    });
  });

  describe('getPomodoroTotal', () => {
    it('should return configured work minutes for work phase', () => {
      useTimerStore.getState().setPomodoroDuration(60);

      expect(useTimerStore.getState().getPomodoroTotal()).toBe(60 * 60);
    });

    it('should return 5 minutes for break phase', () => {
      useTimerStore.getState().startTimer('session-1', 'node-1');
      useTimerStore.getState().nextPomodoroPhase();

      expect(useTimerStore.getState().getPomodoroTotal()).toBe(5 * 60);
    });
  });
});
