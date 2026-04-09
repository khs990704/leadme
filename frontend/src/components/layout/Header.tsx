import { Link } from 'react-router-dom';
import { Menu, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { authService } from '@/services/auth';

export function Header() {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      logout();
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden"
          onClick={toggleSidebar}
          aria-label="메뉴 열기"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link to="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold text-xl text-primary">LeadMe</span>
        </Link>

        <div className="flex flex-1 items-center justify-end space-x-2">
          {user && (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-7 w-7 rounded-full"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
                <span className="hidden sm:inline">{user.name}</span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground"
                aria-label="로그아웃"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">로그아웃</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
