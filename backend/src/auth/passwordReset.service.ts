import crypto from 'node:crypto';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { AuthError, ValidationError } from '../utils/errors.js';
import { sendPasswordResetEmail } from '../utils/passwordResetEmail.js';

function generateCode(): string {
  return String(crypto.randomInt(100000, 999999));
}

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export async function createAndSendResetCode(userId: string, email: string, name: string): Promise<void> {
  // Delete any existing codes for this user
  await prisma.passwordResetCode.deleteMany({ where: { userId } });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + config.PASSWORD_RESET_CODE_EXPIRES_MINUTES * 60 * 1000);

  await prisma.passwordResetCode.create({
    data: {
      userId,
      codeHash: hashCode(code),
      expiresAt,
    },
  });

  // Send email fire-and-forget
  sendPasswordResetEmail(email, code, name).catch(() => {
    // Error already logged inside sendPasswordResetEmail
  });
}

export async function verifyResetCodeAndChangePassword(
  userId: string,
  code: string,
  newPasswordHash: string,
): Promise<void> {
  const record = await prisma.passwordResetCode.findFirst({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    throw new ValidationError('Kein gültiger Code gefunden. Bitte fordern Sie einen neuen an.');
  }

  // Increment attempts
  const updated = await prisma.passwordResetCode.update({
    where: { id: record.id },
    data: { attempts: { increment: 1 } },
  });

  if (updated.attempts > 5) {
    await prisma.passwordResetCode.delete({ where: { id: record.id } });
    throw new ValidationError('Zu viele Fehlversuche. Bitte fordern Sie einen neuen Code an.');
  }

  const inputHash = hashCode(code);
  const storedHash = record.codeHash;

  // Constant-time comparison
  const inputBuf = Buffer.from(inputHash, 'hex');
  const storedBuf = Buffer.from(storedHash, 'hex');
  if (!crypto.timingSafeEqual(inputBuf, storedBuf)) {
    throw new AuthError('Ungültiger Code');
  }

  // Code valid — update password, delete all reset codes, invalidate all sessions
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash: newPasswordHash } }),
    prisma.passwordResetCode.deleteMany({ where: { userId } }),
    prisma.refreshToken.deleteMany({ where: { userId } }),
  ]);
}
