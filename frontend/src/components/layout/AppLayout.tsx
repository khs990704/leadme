import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="md:pl-64 pb-20 md:pb-0">
        <div className="container py-6">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
