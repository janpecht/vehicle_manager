import { z } from 'zod';
import { config } from '../config.js';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address').refine(
    (val) => val.endsWith(`@${config.ALLOWED_EMAIL_DOMAIN}`),
    { message: `Registration is only allowed for @${config.ALLOWED_EMAIL_DOMAIN} email addresses` },
  ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a digit'),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d{6}$/, 'Code must be 6 digits'),
});

export const resendCodeSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendCodeInput = z.infer<typeof resendCodeSchema>;
