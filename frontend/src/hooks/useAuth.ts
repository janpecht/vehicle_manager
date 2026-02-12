import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore.ts';
import * as authService from '../services/auth.service.ts';

/** Attempt silent refresh on app startup to restore session */
export function useAuthInit() {
  const { setAuth, clearAuth, isLoading } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const data = await authService.refresh();
        if (!cancelled) {
          setAuth(data.user, data.accessToken);
        }
      } catch {
        if (!cancelled) {
          clearAuth();
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [setAuth, clearAuth]);

  return isLoading;
}
