import crypto from 'node:crypto';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { AuthError, ValidationError } from '../utils/errors.js';
import { sendVerificationEmail } from '../utils/verificationEmail.js';

function generateCode(): string {
  return String(crypto.randomInt(100000, 999999));
}

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export async function createAndSendCode(userId: string, email: string, name: string): Promise<void> {
  // Delete any existing codes for this user
  await prisma.emailVerificationCode.deleteMany({ where: { userId } });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + config.VERIFICATION_CODE_EXPIRES_MINUTES * 60 * 1000);

  await prisma.emailVerificationCode.create({
    data: {
      userId,
      codeHash: hashCode(code),
      expiresAt,
    },
  });

  // Send email fire-and-forget — code is already stored in DB,
  // user can request a new one if delivery fails
  sendVerificationEmail(email, code, name).catch(() => {
    // Error already logged inside sendVerificationEmail
  });
}

export async function verifyCode(userId: string, code: string): Promise<void> {
  const record = await prisma.emailVerificationCode.findFirst({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    throw new ValidationError('Kein gültiger Bestätigungscode gefunden. Bitte fordere einen neuen an.');
  }

  // Increment attempts
  const updated = await prisma.emailVerificationCode.update({
    where: { id: record.id },
    data: { attempts: { increment: 1 } },
  });

  if (updated.attempts > 5) {
    await prisma.emailVerificationCode.delete({ where: { id: record.id } });
    throw new ValidationError('Zu viele Fehlversuche. Bitte fordere einen neuen Code an.');
  }

  const inputHash = hashCode(code);
  const storedHash = record.codeHash;

  // Constant-time comparison
  const inputBuf = Buffer.from(inputHash, 'hex');
  const storedBuf = Buffer.from(storedHash, 'hex');
  if (!crypto.timingSafeEqual(inputBuf, storedBuf)) {
    throw new AuthError('Ungültiger Bestätigungscode');
  }

  // Code is valid — verify user and clean up
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { emailVerified: true } }),
    prisma.emailVerificationCode.deleteMany({ where: { userId } }),
  ]);
}
