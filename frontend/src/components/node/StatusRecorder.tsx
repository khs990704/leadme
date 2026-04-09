import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAddSessionLog } from '@/hooks/useSessions';
import { useTimerStore } from '@/stores/timerStore';
import type { DistractionType } from '@/types/api';

export function StatusRecorder() {
  const { sessionId, status: timerStatus } = useTimerStore();
  const addLog = useAddSessionLog();

  const [progressPercent, setProgressPercent] = useState<string>('');
  const [focusLevel, setFocusLevel] = useState<string>('');
  const [distractionType, setDistractionType] = useState<string>('none');
  const [note, setNote] = useState('');

  const handleSubmit = useCallback(async () => {
    if (!sessionId) return;

    try {
      await addLog.mutateAsync({
        sessionId,
        data: {
          progressPercent: progressPercent ? Number(progressPercent) : null,
          focusLevel: focusLevel ? Number(focusLevel) : null,
          distractionType: distractionType as DistractionType,
          note: note || null,
        },
      });

      setProgressPercent('');
      setFocusLevel('');
      setDistractionType('none');
      setNote('');
    } catch {
      // error handled
    }
  }, [sessionId, progressPercent, focusLevel, distractionType, note, addLog]);

  const isDisabled = timerStatus === 'idle' || !sessionId;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">상태 기록</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="progress">진행도 (%)</Label>
            <Input
              id="progress"
              type="number"
              min={0}
              max={100}
              value={progressPercent}
              onChange={(e) => setProgressPercent(e.target.value)}
              placeholder="0-100"
              disabled={isDisabled}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="focus">집중도</Label>
            <Select value={focusLevel} onValueChange={setFocusLevel} disabled={isDisabled}>
              <SelectTrigger id="focus">
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((level) => (
                  <SelectItem key={level} value={String(level)}>
                    {'*'.repeat(level)} ({level}/5)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="distraction">방해 요소</Label>
          <Select value={distractionType} onValueChange={setDistractionType} disabled={isDisabled}>
            <SelectTrigger id="distraction">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">없음</SelectItem>
              <SelectItem value="internal">내적 (집중력 저하, 졸음 등)</SelectItem>
              <SelectItem value="external">외적 (소음, 알림 등)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="note">메모</Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="학습 중 메모..."
            rows={2}
            disabled={isDisabled}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isDisabled || addLog.isPending}
          className="w-full"
          size="sm"
        >
          {addLog.isPending ? '저장 중...' : '기록 저장'}
        </Button>
      </CardContent>
    </Card>
  );
}
