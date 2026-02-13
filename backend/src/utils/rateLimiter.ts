import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';
import { config } from '../config.js';

interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message?: string;
}

export function createRateLimiter(opts: RateLimiterOptions): RequestHandler {
  if (config.NODE_ENV === 'test') {
    return (_req, _res, next) => next();
  }

  return rateLimit({
    windowMs: opts.windowMs,
    max: opts.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: 'RATE_LIMIT',
        message: opts.message ?? 'Too many requests, please try again later',
      },
    },
  });
}
