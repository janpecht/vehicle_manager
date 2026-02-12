import { Router, type RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from './auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { registerSchema, loginSchema } from './auth.schemas.js';
import { config } from '../config.js';

const router = Router();

const isTest = config.NODE_ENV === 'test';

const authLimiter: RequestHandler = isTest
  ? (_req, _res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMIT', message: 'Too many attempts, please try again later' } },
    });

const refreshLimiter: RequestHandler = isTest
  ? (_req, _res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 30,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMIT', message: 'Too many attempts, please try again later' } },
    });

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', refreshLimiter, authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
