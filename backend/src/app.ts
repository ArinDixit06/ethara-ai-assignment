import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { requestLogger } from './middleware/requestLogger.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';
import { ApiError } from './utils/ApiError';

// Import route modules
import authRouter from './modules/auth/auth.routes';
import usersRouter from './modules/users/users.routes';
import categoriesRouter from './modules/categories/categories.routes';
import productsRouter from './modules/products/products.routes';
import suppliersRouter from './modules/suppliers/suppliers.routes';
import inventoryRouter from './modules/inventory/inventory.routes';
import ordersRouter from './modules/orders/orders.routes';
import reportsRouter from './modules/reports/reports.routes';

const app = express();

// Security configuration
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - only allow connections
app.use(cors({
  origin: '*', // Customize this with a list of frontend domains in production if needed
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Global parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Access Logging middleware
app.use(requestLogger);

// Static uploads directory serving
const uploadPath = path.resolve(process.cwd(), env.UPLOAD_DIR);
app.use('/uploads', express.static(uploadPath));

// Auth rate limiting: maximum of 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Swagger UI at /api/docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount routes
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/users', usersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/reports', reportsRouter);

// Fallback 404 handler
app.use((req, _res, next) => {
  next(new ApiError(404, `API endpoint not found: ${req.method} ${req.url}`));
});

// Global error handler
app.use(errorHandler);

export default app;
export { app };
