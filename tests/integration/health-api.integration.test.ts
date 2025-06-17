import request from 'supertest';
import { ExpressApp } from '@/infrastructure/web/express/ExpressApp';
describe('Health Endpoints', () => {
  let app: any;

  beforeAll(async () => {
    // Only create Express app, database already connected in setup
    const expressApp = new ExpressApp();
    app = expressApp.getApp();
  });

    it('should return basic health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          status: 'OK',
          timestamp: expect.any(String),
          version: '1.0.0',
          environment: expect.any(String)
        })
      );
    });

    it('should return detailed health status', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'Health check passed',
          data: expect.objectContaining({
            status: 'OK',
            services: expect.objectContaining({
              database: expect.objectContaining({
                status: 'UP'
              }),
              memory: expect.objectContaining({
                status: 'UP'
              })
            })
          })
        })
      );
    });

    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          status: 'READY'
        })
      );
    });

    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          status: 'ALIVE',
          timestamp: expect.any(String),
          uptime: expect.any(Number)
        })
      );
    });
  });
