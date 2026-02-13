import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { config } from './config.js';
import authRoutes from './auth/auth.routes.js';
import vehicleRoutes from './vehicles/vehicles.routes.js';
import damageRoutes from './damages/damages.routes.js';
import vehicleTypeRoutes from './vehicle-types/vehicleTypes.routes.js';
import publicRoutes from './public/public.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { openApiSpec } from './openapi.js';
import { createRateLimiter } from './utils/rateLimiter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  // Trust proxy (for running behind nginx/reverse proxy)
  app.set('trust proxy', 1);

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

  // API documentation (disabled in test mode)
  if (config.NODE_ENV !== 'test') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  }

  // Static file serving for uploads
  app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

  // Public routes (no authentication required)
  app.use('/public', apiLimiter, publicRoutes);

  // Routes
  app.use('/auth', authRoutes);
  app.use('/api/vehicles', apiLimiter, vehicleRoutes);
  app.use('/api/vehicles/:vehicleId/damages', apiLimiter, damageRoutes);
  app.use('/api/vehicle-types', apiLimiter, vehicleTypeRoutes);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
