import express, { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import 'express-async-errors';

import config from '@/infrastructure/config/app';
import { UserService } from '@/application/services/UserService';
import { createUserRoutes } from './routes/userRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { 
  securityHeaders, 
  corsOptions, 
  generalLimiter, 
  requestLogger 
} from './middleware/security';

export class ExpressApp {
  private app: Express;
  private userService: UserService;

  constructor(userService: UserService) {
    this.app = express();
    this.userService = userService;
    
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
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: config.nodeEnv
      });
    });

    // API routes
    this.app.use('/api/v1/users', createUserRoutes(this.userService));

    // API Documentation
    if (config.docs.enabled) {
      const swaggerOptions = {
        definition: {
          openapi: '3.0.0',
          info: {
            title: config.docs.title,
            version: config.docs.version,
            description: config.docs.description
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
                  id: { type: 'string' },
                  username: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  role: { type: 'string', enum: ['user', 'admin'] },
                  profile: {
                    type: 'object',
                    properties: {
                      firstName: { type: 'string' },
                      lastName: { type: 'string' },
                      displayName: { type: 'string' },
                      avatarUrl: { type: 'string', format: 'uri' },
                      bio: { type: 'string' }
                    }
                  },
                  emailVerified: { type: 'boolean' },
                  isActive: { type: 'boolean' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              },
              ApiResponse: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
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
                      code: { type: 'string' },
                      message: { type: 'string' },
                      details: { type: 'array' }
                    }
                  },
                  timestamp: { type: 'string', format: 'date-time' }
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
        customSiteTitle: 'User Service API Documentation'
      }));
    }

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
