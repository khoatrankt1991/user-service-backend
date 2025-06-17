import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { createErrorResponse } from './errorHandler';
import config from '@/infrastructure/config/app';

// Rate limiting configurations
export const createRateLimit = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: createErrorResponse(message, 'RATE_LIMIT_EXCEEDED'),
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json(
        createErrorResponse('Too many requests, please try again later', 'RATE_LIMIT_EXCEEDED')
      );
    }
  });
};

// General rate limiting
export const generalLimiter = createRateLimit(
  config.security.rateLimitWindowMs,
  config.security.rateLimitMaxRequests,
  'Too many requests from this IP'
);

// Stricter rate limiting for auth endpoints
export const authLimiter = createRateLimit(
  config.security.rateLimitAuthWindowMs,
  config.security.rateLimitAuthMaxRequests,
  'Too many authentication attempts'
);

// Registration rate limiting
export const registerLimiter = createRateLimit(
  config.security.rateLimitRegisterWindowMs,
  config.security.rateLimitRegisterMaxRequests,
  'Too many registration attempts'
);

// Security headers configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\''],
      scriptSrc: ['\'self\''],
      imgSrc: ['\'self\'', 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// CORS configuration
export const corsOptions = cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 hours
});

// Request logging middleware
export const requestLogger = (req: any, res: any, next: any): void => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};
