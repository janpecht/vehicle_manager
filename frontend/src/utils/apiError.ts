import axios from 'axios';
import type { ApiError } from '../types/auth.ts';

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data) {
    return (err.response.data as ApiError).error.message;
  }
  return fallback;
}

export function isNotFoundError(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 404;
}
