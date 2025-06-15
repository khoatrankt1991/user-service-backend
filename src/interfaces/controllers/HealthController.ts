import { Request, Response } from 'express';
import { createSuccessResponse, createErrorResponse } from '@/infrastructure/web/express/middleware/errorHandler';
import { databaseConfig } from '@/infrastructure/config/database';

export class HealthController {
  /**
   * @swagger
   * /health:
   *   get:
   *     tags:
   *       - Health
   *     summary: Basic health check
   *     description: Returns basic application health status
   *     responses:
   *       200:
   *         description: Application is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: OK
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                 version:
   *                   type: string
   *                   example: "1.0.0"
   *                 environment:
   *                   type: string
   *                   example: development
   */
  public async getHealthStatus(req: Request, res: Response): Promise<void> {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  }

  /**
   * @swagger
   * /health/detailed:
   *   get:
   *     tags:
   *       - Health
   *     summary: Detailed health check
   *     description: Returns detailed application and dependencies health status
   *     responses:
   *       200:
   *         description: Detailed health information
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: object
   *                       properties:
   *                         status:
   *                           type: string
   *                         services:
   *                           type: object
   *                         uptime:
   *                           type: number
   *                         memory:
   *                           type: object
   *       503:
   *         description: Service unavailable
   */
  public async getDetailedHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        services: {} as Record<string, any>,
        memory: process.memoryUsage()
      };

      // Check database connectivity
      try {
        const isDbConnected = databaseConfig.isConnected();
        health.services.database = {
          status: isDbConnected ? 'UP' : 'DOWN',
          type: 'MongoDB',
          connected: isDbConnected
        };
      } catch (error: any) {
        health.services.database = {
          status: 'DOWN',
          type: 'MongoDB',
          error: error.message
        };
      }

      // Check memory usage
      const memUsage = process.memoryUsage();
      health.services.memory = {
        status: 'UP',
        usage: {
          rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
        }
      };

      // Overall health status
      const allServicesUp = Object.values(health.services)
        .every(service => service.status === 'UP');

      if (!allServicesUp) {
        health.status = 'DEGRADED';
        res.status(503).json(createErrorResponse('Service degraded', 'SERVICE_DEGRADED', health));
        return;
      }

      res.json(createSuccessResponse(health, 'Health check passed'));
    } catch (error: any) {
      res.status(503).json(
        createErrorResponse('Health check failed', 'HEALTH_CHECK_ERROR', error.message)
      );
    }
  }

  /**
   * @swagger
   * /health/ready:
   *   get:
   *     tags:
   *       - Health
   *     summary: Readiness check
   *     description: Returns readiness status for load balancers
   *     responses:
   *       200:
   *         description: Application is ready
   *       503:
   *         description: Application is not ready
   */
  public async getReadinessStatus(req: Request, res: Response): Promise<void> {
    try {
      const isReady = databaseConfig.isConnected();
      
      if (isReady) {
        res.json({ status: 'READY' });
      } else {
        res.status(503).json({ status: 'NOT_READY', reason: 'Database not connected' });
      }
    } catch (error) {
      res.status(503).json({ status: 'NOT_READY', reason: 'Health check failed' });
    }
  }

  /**
   * @swagger
   * /health/live:
   *   get:
   *     tags:
   *       - Health
   *     summary: Liveness check
   *     description: Returns liveness status for container orchestration
   *     responses:
   *       200:
   *         description: Application is alive
   */
  public async getLivenessStatus(req: Request, res: Response): Promise<void> {
    res.json({ 
      status: 'ALIVE',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }
}