import type { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';
import { config } from '../config.js';
import type { RegisterInput, LoginInput } from './auth.schemas.js';

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_PATH = '/auth';

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict',
    path: REFRESH_COOKIE_PATH,
    maxAge: config.REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict',
    path: REFRESH_COOKIE_PATH,
  });
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as RegisterInput;
    const { user, tokens } = await authService.register(input);

    setRefreshCookie(res, tokens.refreshToken);
    res.status(201).json({ user, accessToken: tokens.accessToken });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as LoginInput;
    const { user, tokens } = await authService.login(input);

    setRefreshCookie(res, tokens.refreshToken);
    res.json({ user, accessToken: tokens.accessToken });
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.refresh_token as string | undefined;
    if (!token) {
      res.status(401).json({ error: { code: 'AUTH_ERROR', message: 'No refresh token provided' } });
      return;
    }

    const { user, tokens } = await authService.refresh(token);

    setRefreshCookie(res, tokens.refreshToken);
    res.json({ user, accessToken: tokens.accessToken });
  } catch (error) {
    clearRefreshCookie(res);
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.refresh_token as string | undefined;
    if (token) {
      await authService.logout(token);
    }
    clearRefreshCookie(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getMe(req.user!.userId);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}
