import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.ts';
import * as authService from '../../services/auth.service.ts';
import { Button } from '../ui/Button.tsx';

export function AppLayout() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  async function handleLogout() {
    try {
      await authService.logout();
    } finally {
      clearAuth();
      navigate('/login', { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Sprinter Damage Manager</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <Button variant="secondary" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
