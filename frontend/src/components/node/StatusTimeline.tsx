import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SessionLogResponse } from '@/types/api';

interface StatusTimelineProps {
  logs: SessionLogResponse[];
}

export function StatusTimeline({ logs }: StatusTimelineProps) {
  if (logs.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">상태 기록 타임라인</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-3 text-sm border-l-2 border-primary/20 pl-3">
              <div className="flex-shrink-0 text-xs text-muted-foreground">
                {new Date(log.createdAt).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div className="space-y-1">
                {log.progressPercent !== null && (
                  <p>진행도: {log.progressPercent}%</p>
                )}
                {log.focusLevel !== null && (
                  <p>집중도: {'*'.repeat(log.focusLevel)}</p>
                )}
                {log.distractionType && log.distractionType !== 'none' && (
                  <p className="text-muted-foreground">
                    방해요소: {log.distractionType === 'internal' ? '내적' : '외적'}
                    {log.distractionDetail && ` - ${log.distractionDetail}`}
                  </p>
                )}
                {log.note && <p className="text-muted-foreground">{log.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
