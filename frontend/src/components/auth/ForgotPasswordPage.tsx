import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout.tsx';
import { Input } from '../ui/Input.tsx';
import { Button } from '../ui/Button.tsx';
import { Alert } from '../ui/Alert.tsx';
import * as authService from '../../services/auth.service.ts';
import { getApiErrorMessage } from '../../utils/apiError.ts';

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Ein unerwarteter Fehler ist aufgetreten'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Passwort vergessen" subtitle="Gib deine E-Mail-Adresse ein, um einen Code zum Zurücksetzen zu erhalten.">
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
        <Button type="submit" loading={loading} className="w-full">
          Code senden
        </Button>
        <p className="text-center text-sm text-gray-600">
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Zurück zum Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
