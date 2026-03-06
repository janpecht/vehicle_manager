import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getIdParam } from '../utils/params.js';
import { checklistQuerySchema } from './checklists.schemas.js';
import * as checklistsService from './checklists.service.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = checklistQuerySchema.parse(req.query);
  const result = await checklistsService.listChecklists(query);
  res.json(result);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const submission = await checklistsService.getChecklist(getIdParam(req));
  res.json(submission);
});

export const listPhotos = asyncHandler(async (req: Request, res: Response) => {
  const submissionId = getIdParam(req);
  const photos = await checklistsService.listPhotos(submissionId);
  res.json(photos);
});

export const servePhoto = asyncHandler(async (req: Request, res: Response) => {
  const photoId = getIdParam(req);
  const photo = await checklistsService.getPhoto(photoId);
  if (!photo) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Photo not found' } });
    return;
  }
  res.set('Content-Type', photo.mimeType);
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(photo.data);
});
