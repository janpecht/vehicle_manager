import express, { type RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { config } from './config.js';
import authRoutes from './auth/auth.routes.js';
import vehicleRoutes from './vehicles/vehicles.routes.js';
import damageRoutes from './damages/damages.routes.js';
import publicRoutes from './public/public.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { openApiSpec } from './openapi.js';

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

  // General API rate limiter (disabled in test mode)
  const apiLimiter: RequestHandler =
    config.NODE_ENV === 'test'
      ? (_req, _res, next) => next()
      : rateLimit({
          windowMs: 60 * 1000,
          max: 100,
          standardHeaders: true,
          legacyHeaders: false,
          message: { error: { code: 'RATE_LIMIT', message: 'Too many requests, please try again later' } },
        });

  // API documentation (disabled in test mode)
  if (config.NODE_ENV !== 'test') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  }

  // Public routes (no authentication required)
  app.use('/public', apiLimiter, publicRoutes);

  // Routes
  app.use('/auth', authRoutes);
  app.use('/api/vehicles', apiLimiter, vehicleRoutes);
  app.use('/api/vehicles/:vehicleId/damages', apiLimiter, damageRoutes);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
