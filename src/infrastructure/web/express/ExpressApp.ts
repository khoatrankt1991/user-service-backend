import express, { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import 'express-async-errors';

import config from '@/infrastructure/config/app';
import { createUserRoutes } from './routes/userRoutes';
import { createHealthRoutes } from './routes/healthRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { 
  securityHeaders, 
  corsOptions, 
  generalLimiter, 
  requestLogger 
} from './middleware/security';

export class ExpressApp {
  private app: Express;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(securityHeaders);
    this.app.use(corsOptions);
    this.app.use(generalLimiter);

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use(requestLogger);
  }

  private setupRoutes(): void {
    // Health check routes
    this.app.use('/health', createHealthRoutes());

    // API routes - now using dependency injection
    this.app.use('/api/v1/users', createUserRoutes());

    // API Documentation
    if (config.docs.enabled) {
      const swaggerOptions = {
        definition: {
          openapi: '3.0.0',
          info: {
            title: config.docs.title,
            version: config.docs.version,
            description: config.docs.description,
            contact: {
              name: 'API Support',
              email: 'support@example.com'
            }
          },
          servers: [
            {
              url: `http://localhost:${config.port}`,
              description: 'Development server'
            }
          ],
          components: {
            securitySchemes: {
              bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
              }
            },
            schemas: {
              User: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'user123' },
                  username: { type: 'string', example: 'john_doe' },
                  email: { type: 'string', format: 'email', example: 'john@example.com' },
                  role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
                  profile: {
                    type: 'object',
                    properties: {
                      firstName: { type: 'string', example: 'John' },
                      lastName: { type: 'string', example: 'Doe' },
                      displayName: { type: 'string', example: 'John Doe' },
                      avatarUrl: { type: 'string', format: 'uri' },
                      bio: { type: 'string', example: 'Software developer' }
                    }
                  },
                  emailVerified: { type: 'boolean', example: true },
                  isActive: { type: 'boolean', example: true },
                  isSuspended: { type: 'boolean', example: false },
                  loginCount: { type: 'number', example: 5 },
                  lastLoginAt: { type: 'string', format: 'date-time' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' }
                }
              },
              ApiResponse: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Operation successful' },
                  data: { type: 'object' },
                  meta: { type: 'object' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              },
              ErrorResponse: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'string', example: 'VALIDATION_ERROR' },
                      message: { type: 'string', example: 'Validation failed' },
                      details: { type: 'array', items: { type: 'object' } }
                    }
                  },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              },
              PaginationMeta: {
                type: 'object',
                properties: {
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'integer', example: 1 },
                      limit: { type: 'integer', example: 20 },
                      total: { type: 'integer', example: 100 },
                      pages: { type: 'integer', example: 5 }
                    }
                  }
                }
              }
            },
            responses: {
              UnauthorizedError: {
                description: 'Authentication required',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                  }
                }
              },
              ForbiddenError: {
                description: 'Insufficient permissions',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                  }
                }
              },
              NotFoundError: {
                description: 'Resource not found',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                  }
                }
              },
              ValidationError: {
                description: 'Validation error',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                  }
                }
              },
              ConflictError: {
                description: 'Resource conflict',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/ErrorResponse' }
                  }
                }
              }
            }
          }
        },
        apis: ['./src/interfaces/controllers/*.ts']
      };

      const specs = swaggerJsdoc(swaggerOptions);
      this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'User Service API Documentation',
        swaggerOptions: {
          persistAuthorization: true
        }
      }));
    }

    // API info endpoint
    this.app.get('/api/v1', (req, res) => {
      res.json({
        name: 'User Service API',
        version: '1.0.0',
        description: 'User management service with Clean Architecture',
        docs: config.docs.enabled ? '/api-docs' : null,
        health: '/health',
        endpoints: {
          users: '/api/v1/users',
          auth: {
            register: 'POST /api/v1/users/register',
            login: 'POST /api/v1/users/login'
          }
        }
      });
    });

    // Catch-all for undefined routes
    this.app.use('*', notFoundHandler);
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public getApp(): Express {
    return this.app;
  }
}