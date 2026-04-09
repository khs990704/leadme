import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PlanStatus } from '@/types/api';

interface FilterTabsProps {
  value: string;
  onChange: (value: string) => void;
  counts: Record<string, number>;
}

const TAB_CONFIG: Array<{ value: PlanStatus | 'all'; label: string }> = [
  { value: 'active', label: '진행 중' },
  { value: 'completed', label: '완료됨' },
  { value: 'archived', label: '보관됨' },
];

export function FilterTabs({ value, onChange, counts }: FilterTabsProps) {
  return (
    <Tabs value={value} onValueChange={onChange}>
      <TabsList>
        {TAB_CONFIG.map(({ value: tabValue, label }) => (
          <TabsTrigger key={tabValue} value={tabValue}>
            {label} ({counts[tabValue] ?? 0})
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
