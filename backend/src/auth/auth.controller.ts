import type { Response } from 'express';
import * as authService from './auth.service.js';
import { config } from '../config.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { RegisterInput, LoginInput, VerifyEmailInput, ResendCodeInput, ForgotPasswordInput, ResetPasswordInput } from './auth.schemas.js';

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_PATH = '/auth';

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
    maxAge: config.REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
  });
}

export const register = asyncHandler(async (req, res) => {
  const input = req.body as RegisterInput;
  const result = await authService.register(input);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const input = req.body as LoginInput;
  const { user, tokens } = await authService.login(input);

  setRefreshCookie(res, tokens.refreshToken);
  res.json({ user, accessToken: tokens.accessToken });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body as VerifyEmailInput;
  const { user, tokens } = await authService.verifyEmail(email, code);

  setRefreshCookie(res, tokens.refreshToken);
  res.json({ user, accessToken: tokens.accessToken });
});

export const resendCode = asyncHandler(async (req, res) => {
  const { email } = req.body as ResendCodeInput;
  await authService.resendVerificationCode(email);
  res.json({ message: 'Falls die E-Mail registriert und nicht verifiziert ist, wurde ein neuer Code gesendet.' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body as ForgotPasswordInput;
  await authService.forgotPassword(email);
  res.json({ message: 'Ein Code zum Zurücksetzen wurde an Ihre E-Mail gesendet.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, password } = req.body as ResetPasswordInput;
  await authService.resetPassword(email, code, password);
  res.json({ message: 'Passwort erfolgreich zurückgesetzt.' });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refresh_token as string | undefined;
  if (!token) {
    res.status(401).json({ error: { code: 'AUTH_ERROR', message: 'No refresh token provided' } });
    return;
  }

  try {
    const { user, tokens } = await authService.refresh(token);
    setRefreshCookie(res, tokens.refreshToken);
    res.json({ user, accessToken: tokens.accessToken });
  } catch (error) {
    clearRefreshCookie(res);
    throw error;
  }
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refresh_token as string | undefined;
  if (token) {
    await authService.logout(token);
  }
  clearRefreshCookie(res);
  res.status(204).send();
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user!.userId);
  res.json({ user });
});
