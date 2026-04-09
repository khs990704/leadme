import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth';

export function LoginCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const code = searchParams.get('code');
    if (!code) {
      navigate('/login', { replace: true });
      return;
    }

    authService
      .googleLogin({
        code,
        redirectUri: `${window.location.origin}/login/callback`,
      })
      .then(({ data }) => {
        setAuth(data.user, data.accessToken, data.refreshToken);
        navigate(data.isNewUser ? '/plans/new' : '/', { replace: true });
      })
      .catch(() => {
        navigate('/login', { replace: true });
      });
  }, [searchParams, setAuth, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-muted-foreground">로그인 처리 중...</p>
      </div>
    </div>
  );
}
