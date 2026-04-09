import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';

export function useMe() {
  const { isAuthenticated, setUser, setLoading, logout } = useAuthStore();

  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await authService.getMe();
      return data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data);
      setLoading(false);
    }
    if (query.error) {
      logout();
    }
  }, [query.data, query.error, setUser, setLoading, logout]);

  return query;
}
