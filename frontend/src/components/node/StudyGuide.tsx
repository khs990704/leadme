import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { StudyGuide as StudyGuideType } from '@/types/api';

interface StudyGuideProps {
  guide: StudyGuideType | null;
}

export function StudyGuide({ guide }: StudyGuideProps) {
  if (!guide) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Study Guide</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="font-medium text-muted-foreground">목표</p>
          <p>{guide.objective}</p>
        </div>

        {guide.prerequisites.length > 0 && (
          <div>
            <p className="font-medium text-muted-foreground">사전 지식</p>
            <ul className="list-disc list-inside">
              {guide.prerequisites.map((prereq, i) => (
                <li key={i}>{prereq}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="font-medium text-muted-foreground">생성 근거</p>
          <p>{guide.generationBasis === 'volume_based' ? '분량 기반' : '구조 기반'}</p>
        </div>

        {guide.notes && (
          <div>
            <p className="font-medium text-muted-foreground">참고</p>
            <p>{guide.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
