import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { config } from './config.js';
import authRoutes from './auth/auth.routes.js';
import vehicleRoutes from './vehicles/vehicles.routes.js';
import damageRoutes from './damages/damages.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { openApiSpec } from './openapi.js';

export function createApp() {
  const app = express();

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

  // API documentation (disabled in test mode)
  if (config.NODE_ENV !== 'test') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  }

  // Routes
  app.use('/auth', authRoutes);
  app.use('/api/vehicles', vehicleRoutes);
  app.use('/api/vehicles/:vehicleId/damages', damageRoutes);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
