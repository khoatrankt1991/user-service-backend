import request from 'supertest';
import { ExpressApp } from '@/infrastructure/web/express/ExpressApp';

describe('Error Handling', () => {
  let app: any;

  beforeAll(async () => {
    // Only create Express app, database already connected in setup
    const expressApp = new ExpressApp();
    app = expressApp.getApp();
  });

    it('should handle 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent')
        .expect(404);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'NOT_FOUND'
          })
        })
      );
    });

    it('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/v1/users/register')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/users/register')
        .send({})
        .expect(400);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR'
          })
        })
      );
    });
  });