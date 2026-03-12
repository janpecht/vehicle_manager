import bcrypt from 'bcrypt';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { AuthError, ConflictError, EmailNotVerifiedError } from '../utils/errors.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiresAt,
} from '../utils/tokens.js';
import { createAndSendCode, verifyCode } from './verification.service.js';
import type { RegisterInput, LoginInput } from './auth.schemas.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
}

function toUserResponse(user: { id: string; email: string; name: string; role: string }): UserResponse {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

async function createTokenPair(userId: string, email: string, role: string): Promise<AuthTokens> {
  const accessToken = generateAccessToken({ userId, email, role });
  const refreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashRefreshToken(refreshToken),
      userId,
      expiresAt: getRefreshTokenExpiresAt(),
    },
  });

  return { accessToken, refreshToken };
}

export async function register(
  input: RegisterInput,
): Promise<{ user: UserResponse; requiresVerification: boolean }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError('Email already registered');
  }

  const passwordHash = await bcrypt.hash(input.password, config.BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
    },
  });

  // Send verification code instead of issuing tokens
  await createAndSendCode(user.id, user.email, user.name);

  return { user: toUserResponse(user), requiresVerification: true };
}

export async function login(
  input: LoginInput,
): Promise<{ user: UserResponse; tokens: AuthTokens }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new AuthError('Invalid email or password');
  }

  const validPassword = await bcrypt.compare(input.password, user.passwordHash);
  if (!validPassword) {
    throw new AuthError('Invalid email or password');
  }

  if (!user.emailVerified) {
    throw new EmailNotVerifiedError();
  }

  const tokens = await createTokenPair(user.id, user.email, user.role);
  return { user: toUserResponse(user), tokens };
}

export async function verifyEmail(
  email: string,
  code: string,
): Promise<{ user: UserResponse; tokens: AuthTokens }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AuthError('Ungültige E-Mail-Adresse');
  }

  await verifyCode(user.id, code);

  // Reload user after verification
  const verifiedUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  const tokens = await createTokenPair(verifiedUser.id, verifiedUser.email, verifiedUser.role);
  return { user: toUserResponse(verifiedUser), tokens };
}

export async function resendVerificationCode(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  // Silent success for unknown emails or already verified users (prevent enumeration)
  if (!user || user.emailVerified) return;

  await createAndSendCode(user.id, user.email, user.name);
}

export async function refresh(rawToken: string): Promise<{ user: UserResponse; tokens: AuthTokens }> {
  const tokenHash = hashRefreshToken(rawToken);

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!storedToken) {
    throw new AuthError('Invalid refresh token');
  }

  // Delete the used token (rotation)
  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  if (storedToken.expiresAt < new Date()) {
    throw new AuthError('Refresh token expired');
  }

  const { user } = storedToken;
  const tokens = await createTokenPair(user.id, user.email, user.role);
  return { user: toUserResponse(user), tokens };
}

export async function logout(rawToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(rawToken);
  await prisma.refreshToken.deleteMany({ where: { tokenHash } });
}

export async function getMe(userId: string): Promise<UserResponse> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AuthError('User not found');
  }
  return toUserResponse(user);
}
