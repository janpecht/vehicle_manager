import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout.tsx';
import { Input } from '../ui/Input.tsx';
import { Button } from '../ui/Button.tsx';
import { Alert } from '../ui/Alert.tsx';
import { useAuthStore } from '../../stores/authStore.ts';
import * as authService from '../../services/auth.service.ts';
import { getApiErrorMessage } from '../../utils/apiError.ts';
import type { ApiError } from '../../types/auth.ts';
import axios from 'axios';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authService.login({ email, password });
      setAuth(data.user, data.accessToken);
      navigate('/', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const apiError = err.response.data as ApiError;
        if (apiError.error.code === 'EMAIL_NOT_VERIFIED') {
          // Resend code and redirect to verification page
          await authService.resendVerificationCode(email).catch(() => {});
          navigate('/verify-email', { state: { email }, replace: true });
          return;
        }
      }
      setError(getApiErrorMessage(err, 'Ein unerwarteter Fehler ist aufgetreten'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Fahrzeugmanager" subtitle="Melde dich an">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} />}
        <Input
          label="E-Mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          label="Passwort"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Passwort vergessen?
          </Link>
        </div>
        <Button type="submit" loading={loading} className="w-full">
          Anmelden
        </Button>
        <p className="text-center text-sm text-gray-600">
          Noch kein Konto?{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Registrieren
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
