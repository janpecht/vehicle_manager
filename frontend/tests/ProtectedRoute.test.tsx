import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../src/components/layout/ProtectedRoute.tsx';
import { useAuthStore } from '../src/stores/authStore.ts';

describe('ProtectedRoute', () => {
  it('should redirect to login when not authenticated', () => {
    useAuthStore.setState({ isAuthenticated: false, isLoading: false });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('should render children when authenticated', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'test@test.de', name: 'Test', role: 'USER' },
      accessToken: 'token',
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should show loading spinner while loading', () => {
    useAuthStore.setState({ isAuthenticated: false, isLoading: true });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    // Spinner is rendered (an animated div)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
