import crypto from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config.js';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    algorithm: 'HS256',
    expiresIn: config.ACCESS_TOKEN_EXPIRES_IN as unknown as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.JWT_ACCESS_SECRET, { algorithms: ['HS256'] }) as AccessTokenPayload;
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getRefreshTokenExpiresAt(): Date {
  const date = new Date();
  date.setDate(date.getDate() + config.REFRESH_TOKEN_EXPIRES_IN_DAYS);
  return date;
}
