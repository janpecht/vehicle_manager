import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { config } from './config.js';
import authRoutes from './auth/auth.routes.js';
import vehicleRoutes from './vehicles/vehicles.routes.js';
import damageRoutes from './damages/damages.routes.js';
import vehicleTypeRoutes from './vehicle-types/vehicleTypes.routes.js';
import * as vehicleTypesController from './vehicle-types/vehicleTypes.controller.js';
import driverRoutes from './drivers/drivers.routes.js';
import checklistRoutes from './checklists/checklists.routes.js';
import publicRoutes from './public/public.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { openApiSpec } from './openapi.js';
import { createRateLimiter } from './utils/rateLimiter.js';

export function createApp() {
  const app = express();

  // Trust proxy chain (Traefik -> nginx -> Express = 2 hops by default)
  app.set('trust proxy', config.TRUST_PROXY);

  // Security headers
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
    }),
  );

  // Body parsing with size limit
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // General API rate limiter
  const apiLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 100,
  });

  // API documentation (only in development)
  if (config.NODE_ENV === 'development') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  }

  // Serve vehicle type images from DB (public, no auth)
  app.get('/api/vehicle-type-images/:id/:side', vehicleTypesController.serveImage);

  // Public routes (no authentication required)
  app.use('/public', apiLimiter, publicRoutes);

  // Routes
  app.use('/auth', authRoutes);
  app.use('/api/vehicles', apiLimiter, vehicleRoutes);
  app.use('/api/vehicles/:vehicleId/damages', apiLimiter, damageRoutes);
  app.use('/api/vehicle-types', apiLimiter, vehicleTypeRoutes);
  app.use('/api/drivers', apiLimiter, driverRoutes);
  app.use('/api/checklists', apiLimiter, checklistRoutes);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
