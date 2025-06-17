import request from 'supertest';
import { ExpressApp } from '@/infrastructure/web/express/ExpressApp';
import mongoose from 'mongoose';

describe('User API Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    // Only create Express app, database already connected in setup
    const expressApp = new ExpressApp();
    app = expressApp.getApp();
  });

  describe('API Info', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/api/v1')
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          name: 'User Service API',
          version: '1.0.0',
          description: expect.any(String),
          endpoints: expect.objectContaining({
            users: '/api/v1/users',
            auth: expect.objectContaining({
              register: 'POST /api/v1/users/register',
              login: 'POST /api/v1/users/login'
            })
          })
        })
      );
    });
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser_integration',
        email: 'integration@test.com',
        password: 'password123',
        firstName: 'Integration',
        lastName: 'Test'
      };

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(userData)
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'User registered successfully',
          data: expect.objectContaining({
            username: userData.username,
            email: userData.email,
            profile: expect.objectContaining({
              firstName: userData.firstName,
              lastName: userData.lastName
            }),
            role: 'user',
            isActive: true,
            emailVerified: false
          }),
          meta: expect.objectContaining({
            requiresEmailVerification: true
          })
        })
      );

      // Verify no password in response
      expect(response.body.data).not.toHaveProperty('passwordHash');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should reject duplicate email registration', async () => {
      const userData = {
        username: 'testuser1',
        email: 'duplicate@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      // Register first user
      await request(app)
        .post('/api/v1/users/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const duplicateData = { ...userData, username: 'testuser2' };
      
      const response = await request(app)
        .post('/api/v1/users/register')
        .send(duplicateData)
        .expect(409);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'CONFLICT',
            message: expect.stringContaining('already')
          })
        })
      );
    });

    it('should validate registration input', async () => {
      const invalidData = {
        username: 'ab', // Too short
        email: 'invalid-email',
        password: '123', // Too short
        firstName: '',
        lastName: ''
      };

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: expect.any(String),
                message: expect.any(String)
              })
            ])
          })
        })
      );
    });
  });

  describe('User Authentication', () => {
    beforeEach(async () => {
      // Create test user for login tests
      await request(app)
        .post('/api/v1/users/register')
        .send({
          username: 'loginuser',
          email: 'login@example.com',
          password: 'password123',
          firstName: 'Login',
          lastName: 'User'
        });
        // Activate user trong database
        const User = mongoose.model('User');
        await User.updateOne(
          { email: 'login@example.com' },
          { isActive: true, emailVerified: true, isSuspended: false }
        );
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'Login successful',
          data: expect.objectContaining({
            user: expect.objectContaining({
              email: loginData.email,
              username: 'loginuser'
            }),
            tokens: expect.objectContaining({
              accessToken: expect.any(String),
              refreshToken: expect.any(String)
            })
          })
        })
      );
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(loginData)
        .expect(401);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'UNAUTHORIZED'
          })
        })
      );
    });

    it('should reject non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'UNAUTHORIZED'
          })
        })
      );
    });
  });

  describe('Protected Endpoints', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      // Register and login to get auth token
      const registerResponse = await request(app)
        .post('/api/v1/users/register')
        .send({
          username: 'protecteduser',
          email: 'protected@example.com',
          password: 'password123',
          firstName: 'Protected',
          lastName: 'User'
        });

      const User = mongoose.model('User');
      await User.updateOne(
        { email: 'protected@example.com' },
        { isActive: true, emailVerified: true, isSuspended: false }
      );
      userId = registerResponse.body.data.id;

      const loginResponse = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'protected@example.com',
          password: 'password123'
        });
      authToken = loginResponse.body.data.tokens.accessToken;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'Profile retrieved successfully',
          data: expect.objectContaining({
            email: 'protected@example.com',
            username: 'protecteduser'
          })
        })
      );
    });

    it('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .expect(401);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'UNAUTHORIZED'
          })
        })
      );
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'UNAUTHORIZED'
          })
        })
      );
    });

    it('should search users with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/users/search?q=protected')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'Search results retrieved successfully',
          data: expect.any(Array)
        })
      );
    });

    it('should update user profile', async () => {
      const updateData = {
        profile: {
          firstName: 'Updated',
          bio: 'Updated bio'
        }
      };

      const response = await request(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'User updated successfully',
          data: expect.objectContaining({
            profile: expect.objectContaining({
              firstName: 'Updated',
              bio: 'Updated bio'
            })
          })
        })
      );
    });
  });
});