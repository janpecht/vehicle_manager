import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.ts';
import * as authService from '../../services/auth.service.ts';
import { Button } from '../ui/Button.tsx';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
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
          <div className="flex items-center gap-6">
            <Link to="/" className="text-lg font-semibold text-gray-900 hover:text-gray-700">
              Fahrzeugmanager
            </Link>
            <nav className="flex gap-4">
              <Link
                to="/"
                className={`text-sm font-medium ${location.pathname === '/' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Fahrzeuge
              </Link>
              <Link
                to="/vehicle-types"
                className={`text-sm font-medium ${location.pathname === '/vehicle-types' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Fahrzeugtypen
              </Link>
              <Link
                to="/drivers"
                className={`text-sm font-medium ${location.pathname === '/drivers' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Fahrer
              </Link>
              <Link
                to="/checklists"
                className={`text-sm font-medium ${location.pathname === '/checklists' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Checklisten
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <Button variant="secondary" onClick={handleLogout}>
              Abmelden
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
