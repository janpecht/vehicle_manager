import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RegisterPage } from '../src/components/auth/RegisterPage.tsx';

vi.mock('../src/services/auth.service.ts', () => ({
  register: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import * as authService from '../src/services/auth.service.ts';

function renderRegisterPage() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  );
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render register form', () => {
    renderRegisterPage();

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  it('should call register service on submit', async () => {
    const user = userEvent.setup();
    const mockRegister = vi.mocked(authService.register);
    mockRegister.mockResolvedValueOnce({
      user: { id: '1', email: 'new@test.de', name: 'New User', role: 'USER' },
      accessToken: 'token',
    });

    renderRegisterPage();

    await user.type(screen.getByLabelText(/name/i), 'New User');
    await user.type(screen.getByLabelText(/email/i), 'new@test.de');
    await user.type(screen.getByLabelText(/password/i), 'Test1234');
    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'new@test.de',
        password: 'Test1234',
        name: 'New User',
      });
    });
  });

  it('should have link to login page', () => {
    renderRegisterPage();

    const link = screen.getByRole('link', { name: /sign in/i });
    expect(link).toHaveAttribute('href', '/login');
  });

  it('should show password requirements', () => {
    renderRegisterPage();

    expect(screen.getByText(/minimum 8 characters/i)).toBeInTheDocument();
  });
});
