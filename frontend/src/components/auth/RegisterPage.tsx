import { type FormEvent, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout.tsx';
import { Input } from '../ui/Input.tsx';
import { Button } from '../ui/Button.tsx';
import { Alert } from '../ui/Alert.tsx';
import { useAuthStore } from '../../stores/authStore.ts';
import * as authService from '../../services/auth.service.ts';
import type { ApiError } from '../../types/auth.ts';
import axios from 'axios';

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [allowedDomain, setAllowedDomain] = useState<string | null>(null);

  useEffect(() => {
    axios.get<{ allowedEmailDomain: string }>('/public/config')
      .then((res) => setAllowedDomain(res.data.allowedEmailDomain))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      const data = await authService.register({ email, password, name });
      setAuth(data.user, data.accessToken);
      navigate('/', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const apiError = err.response.data as ApiError;
        if (apiError.error.details) {
          const errors: Record<string, string> = {};
          for (const detail of apiError.error.details) {
            errors[detail.field] = detail.message;
          }
          setFieldErrors(errors);
        } else {
          setError(apiError.error.message);
        }
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Konto erstellen" subtitle="Registriere dich für den Fahrzeugmanager">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} />}
        <Input
          label="Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors['name']}
          required
          autoComplete="name"
        />
        <Input
          label="E-Mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors['email']}
          required
          autoComplete="email"
        />
        {allowedDomain && (
          <p className="text-xs text-gray-500">
            Nur @{allowedDomain} E-Mail-Adressen erlaubt
          </p>
        )}
        <Input
          label="Passwort"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors['password']}
          required
          autoComplete="new-password"
          minLength={8}
        />
        <p className="text-xs text-gray-500">
          Mindestens 8 Zeichen, mit Groß- und Kleinbuchstaben und einer Ziffer.
        </p>
        <Button type="submit" loading={loading} className="w-full">
          Registrieren
        </Button>
        <p className="text-center text-sm text-gray-600">
          Bereits ein Konto?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Anmelden
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
