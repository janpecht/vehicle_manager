import nodemailer from 'nodemailer';
import { config } from '../config.js';

function isSmtpConfigured(): boolean {
  return !!(config.SMTP_HOST && config.SMTP_PORT);
}

export async function sendPasswordResetEmail(to: string, code: string, name: string): Promise<void> {
  if (!isSmtpConfigured()) {
    console.log(`[DEV] Password reset code for ${to}: ${code}`);
    return;
  }

  console.log(`[EMAIL] Sending password reset email to ${to} via ${config.SMTP_HOST}:${config.SMTP_PORT}`);

  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    ...(config.SMTP_USER && config.SMTP_PASS
      ? { auth: { user: config.SMTP_USER, pass: config.SMTP_PASS } }
      : {}),
  });

  const subject = 'Passwort zurücksetzen - Fahrzeugmanager';

  const text = [
    `Hallo ${name},`,
    '',
    `Ihr Code zum Zurücksetzen des Passworts lautet: ${code}`,
    '',
    `Dieser Code ist ${config.PASSWORD_RESET_CODE_EXPIRES_MINUTES} Minuten gültig.`,
    '',
    'Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.',
    '',
    'Bitte geben Sie diesen Code nicht an Dritte weiter.',
    '',
    'Fahrzeugmanager',
  ].join('\n');

  try {
    const info = await transporter.sendMail({
      from: config.SMTP_FROM ?? config.SMTP_USER ?? 'noreply@example.com',
      to,
      subject,
      text,
    });
    console.log(`[EMAIL] Password reset email sent successfully to ${to} (messageId: ${info.messageId})`);
  } catch (err) {
    console.error(`[EMAIL] Failed to send password reset email to ${to}:`, err);
    throw err;
  }
}
