import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ForgotPasswordPage } from '../src/components/auth/ForgotPasswordPage.tsx';

vi.mock('../src/services/auth.service.ts', () => ({
  forgotPassword: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import * as authService from '../src/services/auth.service.ts';

function renderForgotPasswordPage() {
  return render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>,
  );
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render email input and submit button', () => {
    renderForgotPasswordPage();

    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /code senden/i })).toBeInTheDocument();
  });

  it('should show error for unknown email (404 response)', async () => {
    const user = userEvent.setup();
    const mockForgotPassword = vi.mocked(authService.forgotPassword);

    const error = new Error('Request failed') as Error & { isAxiosError: boolean; response: unknown };
    error.isAxiosError = true;
    error.response = {
      data: { error: { code: 'NOT_FOUND', message: 'E-Mail-Adresse nicht gefunden' } },
    };
    mockForgotPassword.mockRejectedValueOnce(error);

    renderForgotPasswordPage();

    await user.type(screen.getByLabelText(/e-mail/i), 'unknown@dieeisfabrik.de');
    await user.click(screen.getByRole('button', { name: /code senden/i }));

    await waitFor(() => {
      expect(screen.getByText(/e-mail-adresse nicht gefunden/i)).toBeInTheDocument();
    });
  });

  it('should navigate to /reset-password on success', async () => {
    const user = userEvent.setup();
    const mockForgotPassword = vi.mocked(authService.forgotPassword);
    mockForgotPassword.mockResolvedValueOnce(undefined);

    renderForgotPasswordPage();

    await user.type(screen.getByLabelText(/e-mail/i), 'test@dieeisfabrik.de');
    await user.click(screen.getByRole('button', { name: /code senden/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/reset-password', {
        state: { email: 'test@dieeisfabrik.de' },
      });
    });
  });

  it('should have link back to login page', () => {
    renderForgotPasswordPage();

    const link = screen.getByRole('link', { name: /zurück zum login/i });
    expect(link).toHaveAttribute('href', '/login');
  });
});
