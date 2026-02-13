import type { Request } from 'express';

export function getIdParam(req: Request, paramName = 'id'): string {
  const id = req.params[paramName];
  if (typeof id !== 'string') throw new Error(`Missing ${paramName} parameter`);
  return id;
}
