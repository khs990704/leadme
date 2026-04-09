import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../stores/authStore';
import type { UserResponse } from '../types/api';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

const mockUser: UserResponse = {
  id: 'cly1abc123',
  email: 'test@gmail.com',
  name: 'Test User',
  avatarUrl: null,
  createdAt: '2026-04-09T00:00:00.000Z',
};

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
    });
  });

  describe('setAuth', () => {
    it('should set user, tokens, and isAuthenticated', () => {
      const store = useAuthStore.getState();
      store.setAuth(mockUser, 'access-token', 'refresh-token');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('access-token');
      expect(state.refreshToken).toBe('refresh-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should save tokens to localStorage', () => {
      const store = useAuthStore.getState();
      store.setAuth(mockUser, 'access-token', 'refresh-token');

      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', 'refresh-token');
    });
  });

  describe('setUser', () => {
    it('should update user only', () => {
      const store = useAuthStore.getState();
      store.setUser(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
    });
  });

  describe('logout', () => {
    it('should clear all auth state', () => {
      // Arrange: set auth first
      const store = useAuthStore.getState();
      store.setAuth(mockUser, 'access-token', 'refresh-token');

      // Act
      useAuthStore.getState().logout();

      // Assert
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should remove tokens from localStorage', () => {
      const store = useAuthStore.getState();
      store.setAuth(mockUser, 'access-token', 'refresh-token');

      vi.clearAllMocks();
      useAuthStore.getState().logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
    });
  });

  describe('hydrateFromStorage', () => {
    it('should restore auth state from localStorage', () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'accessToken') return 'stored-access';
        if (key === 'refreshToken') return 'stored-refresh';
        return null;
      });

      useAuthStore.getState().hydrateFromStorage();

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('stored-access');
      expect(state.refreshToken).toBe('stored-refresh');
      expect(state.isAuthenticated).toBe(true);
    });

    it('should set isLoading false when no tokens in storage', () => {
      localStorageMock.getItem.mockReturnValue(null);

      useAuthStore.getState().hydrateFromStorage();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should not authenticate when only accessToken exists', () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'accessToken') return 'stored-access';
        return null;
      });

      useAuthStore.getState().hydrateFromStorage();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });
  });
});
