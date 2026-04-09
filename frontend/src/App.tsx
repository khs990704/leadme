import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { WizardLayout } from '@/components/layout/WizardLayout';
import { LoginPage } from '@/pages/LoginPage';
import { LoginCallbackPage } from '@/pages/LoginCallbackPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PlansPage } from '@/pages/PlansPage';
import { PlanWizardPage } from '@/pages/PlanWizardPage';
import { PlanDetailPage } from '@/pages/PlanDetailPage';
import { KanbanPage } from '@/pages/KanbanPage';
import { NodePage } from '@/pages/NodePage';
import { FeedbackPage } from '@/pages/FeedbackPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>
            <Route path="/login/callback" element={<LoginCallbackPage />} />

            {/* Protected routes */}
            <Route element={<AuthGuard />}>
              {/* Main app layout */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/plans" element={<PlansPage />} />
                <Route path="/plans/:planId" element={<PlanDetailPage />} />
                <Route path="/plans/:planId/kanban" element={<KanbanPage />} />
                <Route path="/plans/:planId/feedback" element={<FeedbackPage />} />
                <Route path="/nodes/:nodeId" element={<NodePage />} />
              </Route>

              {/* Wizard layout */}
              <Route element={<WizardLayout />}>
                <Route path="/plans/new" element={<PlanWizardPage />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
