import apiClient from '@/lib/axios';
import type {
  GoogleAuthRequest,
  GoogleAuthResponse,
  RefreshResponse,
  UserResponse,
} from '@/types/api';

export const authService = {
  googleLogin(data: GoogleAuthRequest) {
    return apiClient.post<GoogleAuthResponse>('/auth/google', data);
  },

  refresh(refreshToken: string) {
    return apiClient.post<RefreshResponse>('/auth/refresh', { refreshToken });
  },

  logout() {
    return apiClient.post('/auth/logout');
  },

  getMe() {
    return apiClient.get<UserResponse>('/auth/me');
  },
};
