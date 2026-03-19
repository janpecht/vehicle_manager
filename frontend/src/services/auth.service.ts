import api from './api.ts';
import type { AuthResponse, RegisterResponse, RegisterInput, LoginInput, User } from '../types/auth.ts';

export async function register(input: RegisterInput): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>('/auth/register', input);
  return data;
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', input);
  return data;
}

export async function verifyEmail(input: { email: string; code: string }): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/verify-email', input);
  return data;
}

export async function resendVerificationCode(email: string): Promise<void> {
  await api.post('/auth/resend-code', { email });
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email });
}

export async function resetPassword(input: { email: string; code: string; password: string }): Promise<void> {
  await api.post('/auth/reset-password', input);
}

export async function refresh(): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/refresh');
  return data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<{ user: User }>('/auth/me');
  return data.user;
}
