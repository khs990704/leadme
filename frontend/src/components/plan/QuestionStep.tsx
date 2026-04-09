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

export interface QuestionConfig {
  id: string;
  question: string;
  hint: string;
  type: 'text' | 'textarea' | 'select';
  options?: Array<{ value: string; label: string }>;
  required: boolean;
}

interface QuestionStepProps {
  config: QuestionConfig;
  value: string;
  onChange: (value: string) => void;
}

export function QuestionStep({ config, value, onChange }: QuestionStepProps) {
  return (
    <div className="space-y-4" data-testid={`question-step-${config.id}`}>
      <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 space-y-2">
        <p className="font-medium text-foreground">{config.question}</p>
        <p className="text-sm text-muted-foreground">{config.hint}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={config.id}>답변</Label>
        {config.type === 'text' && (
          <Input
            id={config.id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="답변을 입력하세요"
          />
        )}
        {config.type === 'textarea' && (
          <Textarea
            id={config.id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="답변을 입력하세요"
            rows={4}
          />
        )}
        {config.type === 'select' && config.options && (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder="선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {config.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
