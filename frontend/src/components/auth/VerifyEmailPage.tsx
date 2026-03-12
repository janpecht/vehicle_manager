import { type FormEvent, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from './AuthLayout.tsx';
import { Button } from '../ui/Button.tsx';
import { Alert } from '../ui/Alert.tsx';
import { useAuthStore } from '../../stores/authStore.ts';
import * as authService from '../../services/auth.service.ts';
import { getApiErrorMessage } from '../../utils/apiError.ts';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);

  const email = (location.state as { email?: string })?.email ?? '';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  if (!email) {
    return (
      <AuthLayout title="E-Mail bestätigen" subtitle="">
        <Alert type="error" message="Keine E-Mail-Adresse angegeben." />
        <div className="mt-4 text-center">
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Zurück zur Registrierung
          </Link>
        </div>
      </AuthLayout>
    );
  }

  function handleDigitChange(index: number, value: string) {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pasted[i] ?? '';
    }
    setCode(newCode);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Bitte gib den vollständigen 6-stelligen Code ein.');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.verifyEmail({ email, code: fullCode });
      setAuth(data.user, data.accessToken);
      navigate('/', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Verifizierung fehlgeschlagen'));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setResendMessage('');
    try {
      await authService.resendVerificationCode(email);
      setResendMessage('Ein neuer Code wurde gesendet.');
      setResendCooldown(60);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Code konnte nicht gesendet werden'));
    }
  }

  return (
    <AuthLayout title="E-Mail bestätigen" subtitle={`Wir haben einen Code an ${email} gesendet.`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <Alert type="error" message={error} />}
        {resendMessage && <Alert type="success" message={resendMessage} />}

        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-12 w-12 rounded-md border border-gray-300 text-center text-lg font-semibold focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus={i === 0}
            />
          ))}
        </div>

        <p className="text-center text-xs text-gray-500">
          Der Code ist 15 Minuten gültig.
        </p>

        <Button type="submit" loading={loading} className="w-full">
          Bestätigen
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="text-sm font-medium text-blue-600 hover:text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0
              ? `Code erneut senden (${resendCooldown}s)`
              : 'Code erneut senden'}
          </button>
        </div>

        <p className="text-center text-sm text-gray-600">
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Zurück zum Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
