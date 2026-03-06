import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getIdParam } from '../utils/params.js';
import * as driversService from './drivers.service.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const includeInactive = req.query.includeInactive === 'true';
  const drivers = await driversService.listDrivers(includeInactive);
  res.json(drivers);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const driver = await driversService.getDriver(getIdParam(req));
  res.json(driver);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const driver = await driversService.createDriver(req.body);
  res.status(201).json(driver);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const driver = await driversService.updateDriver(getIdParam(req), req.body);
  res.json(driver);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await driversService.deleteDriver(getIdParam(req));
  res.status(204).send();
});
