import { useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import { useTimerStore } from '@/stores/timerStore';
import { useCreateSession, useUpdateSession } from '@/hooks/useSessions';
import { formatTimer } from '@/lib/utils';
import type { TimerType } from '@/types/api';

interface FocusTimerProps {
  nodeId: string;
  estimatedMinutes?: number | string | null;
}

export function FocusTimer({ nodeId, estimatedMinutes }: FocusTimerProps) {
  const {
    timerType,
    status,
    elapsed,
    sessionId,
    pomodoroPhase,
    setTimerType,
    setPomodoroDuration,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    tick,
    resetTimer,
    getPomodoroRemaining,
    nextPomodoroPhase,
  } = useTimerStore();

  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer tick
  useEffect(() => {
    if (status === 'active') {
      intervalRef.current = setInterval(tick, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status, tick]);

  useEffect(() => {
    if (status === 'idle') {
      setPomodoroDuration(estimatedMinutes);
    }
  }, [estimatedMinutes, setPomodoroDuration, status]);

  // Pomodoro phase completion
  useEffect(() => {
    if (timerType === 'pomodoro' && status === 'active') {
      const remaining = getPomodoroRemaining();
      if (remaining <= 0) {
        nextPomodoroPhase();
      }
    }
  }, [elapsed, timerType, status, getPomodoroRemaining, nextPomodoroPhase]);

  const handleStart = useCallback(async () => {
    try {
      const session = await createSession.mutateAsync({
        nodeId,
        timerType,
      });
      startTimer(session.id, nodeId);
    } catch {
      // error handled by TanStack Query
    }
  }, [nodeId, timerType, createSession, startTimer]);

  const handlePause = useCallback(async () => {
    if (!sessionId) return;
    pauseTimer();
    try {
      await updateSession.mutateAsync({
        sessionId,
        data: { status: 'paused' },
      });
    } catch {
      resumeTimer();
    }
  }, [sessionId, pauseTimer, resumeTimer, updateSession]);

  const handleResume = useCallback(async () => {
    if (!sessionId) return;
    resumeTimer();
    try {
      await updateSession.mutateAsync({
        sessionId,
        data: { status: 'active' },
      });
    } catch {
      pauseTimer();
    }
  }, [sessionId, resumeTimer, pauseTimer, updateSession]);

  const handleStop = useCallback(async () => {
    if (!sessionId) return;
    try {
      await updateSession.mutateAsync({
        sessionId,
        data: {
          status: 'completed',
          endTime: new Date().toISOString(),
        },
      });
      stopTimer();
    } catch {
      // error handled
    }
  }, [sessionId, updateSession, stopTimer]);

  const handleTypeChange = useCallback(
    (type: TimerType) => {
      if (status !== 'idle') return;
      setTimerType(type);
    },
    [status, setTimerType]
  );

  const displayTime =
    timerType === 'pomodoro' ? formatTimer(getPomodoroRemaining()) : formatTimer(elapsed);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Focus Timer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer type selector */}
        <div className="flex gap-2">
          <Button
            variant={timerType === 'pomodoro' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTypeChange('pomodoro')}
            disabled={status !== 'idle'}
          >
            뽀모도로
          </Button>
          <Button
            variant={timerType === 'stopwatch' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTypeChange('stopwatch')}
            disabled={status !== 'idle'}
          >
            스톱워치
          </Button>
        </div>

        {/* Timer display */}
        <div className="text-center">
          <p className="text-5xl font-mono font-bold tracking-wider" aria-live="polite">
            {displayTime}
          </p>
          {timerType === 'pomodoro' && status !== 'idle' && (
            <p className="text-sm text-muted-foreground mt-1">
              {pomodoroPhase === 'work' ? '집중 시간' : '휴식 시간'}
            </p>
          )}
          {timerType === 'pomodoro' && estimatedMinutes && (
            <p className="text-sm text-muted-foreground mt-1">설정된 예상 시간 기준으로 진행됩니다.</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-3">
          {status === 'idle' && (
            <Button onClick={handleStart} className="gap-2" disabled={createSession.isPending}>
              <Play className="h-4 w-4" />
              시작
            </Button>
          )}
          {status === 'active' && (
            <>
              <Button variant="outline" onClick={handlePause} className="gap-2">
                <Pause className="h-4 w-4" />
                일시정지
              </Button>
              <Button variant="destructive" onClick={handleStop} className="gap-2">
                <Square className="h-4 w-4" />
                종료
              </Button>
            </>
          )}
          {status === 'paused' && (
            <>
              <Button onClick={handleResume} className="gap-2">
                <Play className="h-4 w-4" />
                재개
              </Button>
              <Button variant="destructive" onClick={handleStop} className="gap-2">
                <Square className="h-4 w-4" />
                종료
              </Button>
            </>
          )}
          {status !== 'idle' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                if (sessionId) {
                  try {
                    await updateSession.mutateAsync({
                      sessionId,
                      data: {
                        status: 'completed',
                        endTime: new Date().toISOString(),
                      },
                    });
                  } catch {
                    // best-effort session cleanup
                  }
                }
                resetTimer();
              }}
              aria-label="타이머 초기화"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
