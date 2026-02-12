import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../src/components/auth/LoginPage.tsx';

// Mock auth service
vi.mock('../src/services/auth.service.ts', () => ({
  login: vi.fn(),
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import * as authService from '../src/services/auth.service.ts';

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form', () => {
    renderLoginPage();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/register/i)).toBeInTheDocument();
  });

  it('should call login service on submit', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.mocked(authService.login);
    mockLogin.mockResolvedValueOnce({
      user: { id: '1', email: 'test@test.de', name: 'Test', role: 'USER' },
      accessToken: 'token',
    });

    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'test@test.de');
    await user.type(screen.getByLabelText(/password/i), 'Test1234');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@test.de',
        password: 'Test1234',
      });
    });
  });

  it('should display error on failed login', async () => {
    const user = userEvent.setup();
    const mockLogin = vi.mocked(authService.login);

    // Simulate an Axios-like error with isAxiosError flag
    const error = new Error('Request failed') as Error & { isAxiosError: boolean; response: unknown };
    error.isAxiosError = true;
    error.response = {
      data: { error: { code: 'AUTH_ERROR', message: 'Invalid email or password' } },
    };

    mockLogin.mockRejectedValueOnce(error);

    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'test@test.de');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it('should have link to register page', () => {
    renderLoginPage();

    const link = screen.getByRole('link', { name: /register/i });
    expect(link).toHaveAttribute('href', '/register');
  });
});
