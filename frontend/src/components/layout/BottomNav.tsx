import { NavLink } from 'react-router-dom';
import { Home, BookOpen, CheckSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: '홈' },
  { to: '/plans', icon: BookOpen, label: '계획' },
  { to: '/precheck', icon: CheckSquare, label: '관리' },
  { to: '/profile', icon: User, label: '프로필' },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden" aria-label="하단 내비게이션">
      <div className="flex h-16 items-center justify-around">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-1 text-xs',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
