import { Navigate } from 'react-router-dom';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';
import { useAuthStore } from '@/stores/authStore';

export function LoginPage() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col items-center space-y-8 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">LeadMe</h1>
        <p className="text-muted-foreground">
          공부를 시작하고, 지속하고,
          <br />
          복기할 수 있도록.
        </p>
      </div>

      <GoogleLoginButton />
    </div>
  );
}
