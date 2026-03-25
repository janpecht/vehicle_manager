import nodemailer from 'nodemailer';
import { config } from '../config.js';

function isSmtpConfigured(): boolean {
  return !!(config.SMTP_HOST && config.SMTP_PORT);
}

export async function sendVerificationEmail(to: string, code: string, name: string): Promise<void> {
  if (!isSmtpConfigured()) {
    if (config.NODE_ENV === 'development') {
      console.log(`[DEV] Verification code for ${to}: ${code}`);
    } else {
      console.warn(`[WARN] SMTP not configured — verification email to ${to} could not be sent`);
    }
    return;
  }

  console.log(`[EMAIL] Sending verification email to ${to} via ${config.SMTP_HOST}:${config.SMTP_PORT}`);

  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    ...(config.SMTP_USER && config.SMTP_PASS
      ? { auth: { user: config.SMTP_USER, pass: config.SMTP_PASS } }
      : {}),
  });

  const subject = 'Ihr Bestätigungscode - Fahrzeugmanager';

  const text = [
    `Hallo ${name},`,
    '',
    `Ihr Bestätigungscode lautet: ${code}`,
    '',
    `Dieser Code ist ${config.VERIFICATION_CODE_EXPIRES_MINUTES} Minuten gültig.`,
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
    console.log(`[EMAIL] Verification email sent successfully to ${to} (messageId: ${info.messageId})`);
  } catch (err) {
    console.error(`[EMAIL] Failed to send verification email to ${to}:`, err);
    throw err;
  }
}
