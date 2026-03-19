import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ResetPasswordPage } from '../src/components/auth/ResetPasswordPage.tsx';

vi.mock('../src/services/auth.service.ts', () => ({
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
}));

const mockNavigate = vi.fn();
let mockLocationState: unknown = {};
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockLocationState, pathname: '/reset-password', search: '', hash: '', key: 'test' }),
  };
});

import * as authService from '../src/services/auth.service.ts';

function renderResetPasswordPage() {
  return render(
    <MemoryRouter>
      <ResetPasswordPage />
    </MemoryRouter>,
  );
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationState = { email: 'test@dieeisfabrik.de' };
  });

  it('should render code inputs and password fields', () => {
    renderResetPasswordPage();

    // 6 code digit inputs
    const codeInputs = screen.getAllByRole('textbox');
    expect(codeInputs.length).toBe(6);

    expect(screen.getByLabelText(/neues passwort/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/passwort bestätigen/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /passwort zurücksetzen/i })).toBeInTheDocument();
  });

  it('should show error when no email in state', () => {
    mockLocationState = {};
    renderResetPasswordPage();

    expect(screen.getByText(/keine e-mail-adresse angegeben/i)).toBeInTheDocument();
  });

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderResetPasswordPage();

    // Fill in the 6-digit code
    const codeInputs = screen.getAllByRole('textbox');
    for (let i = 0; i < 6; i++) {
      await user.type(codeInputs[i]!, String(i + 1));
    }

    await user.type(screen.getByLabelText(/neues passwort/i), 'NewPass1234');
    await user.type(screen.getByLabelText(/passwort bestätigen/i), 'DifferentPass1');
    await user.click(screen.getByRole('button', { name: /passwort zurücksetzen/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwörter stimmen nicht überein/i)).toBeInTheDocument();
    });
  });

  it('should show success message after reset', async () => {
    const user = userEvent.setup();
    const mockResetPassword = vi.mocked(authService.resetPassword);
    mockResetPassword.mockResolvedValueOnce(undefined);

    renderResetPasswordPage();

    // Fill in the 6-digit code
    const codeInputs = screen.getAllByRole('textbox');
    for (let i = 0; i < 6; i++) {
      await user.type(codeInputs[i]!, String(i + 1));
    }

    await user.type(screen.getByLabelText(/neues passwort/i), 'NewPass1234');
    await user.type(screen.getByLabelText(/passwort bestätigen/i), 'NewPass1234');
    await user.click(screen.getByRole('button', { name: /passwort zurücksetzen/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwort erfolgreich zurückgesetzt/i)).toBeInTheDocument();
    });
  });

  it('should show error on API failure', async () => {
    const user = userEvent.setup();
    const mockResetPassword = vi.mocked(authService.resetPassword);

    const error = new Error('Request failed') as Error & { isAxiosError: boolean; response: unknown };
    error.isAxiosError = true;
    error.response = {
      data: { error: { code: 'AUTH_ERROR', message: 'Ungültiger Code' } },
    };
    mockResetPassword.mockRejectedValueOnce(error);

    renderResetPasswordPage();

    const codeInputs = screen.getAllByRole('textbox');
    for (let i = 0; i < 6; i++) {
      await user.type(codeInputs[i]!, String(i + 1));
    }

    await user.type(screen.getByLabelText(/neues passwort/i), 'NewPass1234');
    await user.type(screen.getByLabelText(/passwort bestätigen/i), 'NewPass1234');
    await user.click(screen.getByRole('button', { name: /passwort zurücksetzen/i }));

    await waitFor(() => {
      expect(screen.getByText(/ungültiger code/i)).toBeInTheDocument();
    });
  });
});
