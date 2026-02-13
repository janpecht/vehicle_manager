import bcrypt from 'bcrypt';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { AuthError, ConflictError } from '../utils/errors.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiresAt,
} from '../utils/tokens.js';
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
): Promise<{ user: UserResponse; tokens: AuthTokens }> {
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

  const tokens = await createTokenPair(user.id, user.email, user.role);
  return { user: toUserResponse(user), tokens };
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

  const tokens = await createTokenPair(user.id, user.email, user.role);
  return { user: toUserResponse(user), tokens };
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

