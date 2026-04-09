import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MilestoneWithChildren } from '@/types/api';

interface MilestoneFilterProps {
  milestones: MilestoneWithChildren[];
  value: string | null;
  onChange: (value: string | null) => void;
}

export function MilestoneFilter({ milestones, value, onChange }: MilestoneFilterProps) {
  return (
    <Select
      value={value ?? 'all'}
      onValueChange={(v) => onChange(v === 'all' ? null : v)}
    >
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Milestone 선택" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">전체 Milestone</SelectItem>
        {milestones.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
