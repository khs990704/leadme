import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { NodeListItem } from '@/types/api';

interface TodayTodosProps {
  nodes: NodeListItem[];
}

export function TodayTodos({ nodes }: TodayTodosProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">오늘 할 일</CardTitle>
      </CardHeader>
      <CardContent>
        {nodes.length === 0 ? (
          <p className="text-sm text-muted-foreground">오늘 진행할 항목이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {nodes.map((node) => (
              <li key={node.id}>
                <Link
                  to={`/nodes/${node.id}`}
                  className="flex items-center gap-2 rounded-md p-2 text-sm hover:bg-accent transition-colors"
                >
                  <span
                    className={`h-4 w-4 rounded border flex-shrink-0 ${
                      node.status === 'done'
                        ? 'bg-primary border-primary'
                        : node.status === 'in_progress'
                          ? 'border-primary bg-primary/20'
                          : 'border-muted-foreground'
                    }`}
                    aria-hidden="true"
                  />
                  <span className={node.status === 'done' ? 'line-through text-muted-foreground' : ''}>
                    {node.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
