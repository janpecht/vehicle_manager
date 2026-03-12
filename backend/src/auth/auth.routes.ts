import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { registerSchema, loginSchema, verifyEmailSchema, resendCodeSchema } from './auth.schemas.js';
import { createRateLimiter } from '../utils/rateLimiter.js';

const router = Router();

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many attempts, please try again later',
});

const refreshLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many attempts, please try again later',
});

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/verify-email', authLimiter, validate(verifyEmailSchema), authController.verifyEmail);
router.post('/resend-code', authLimiter, validate(resendCodeSchema), authController.resendCode);
router.post('/refresh', refreshLimiter, authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
