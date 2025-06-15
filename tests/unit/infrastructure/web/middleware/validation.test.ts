import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateRequest } from '@/infrastructure/web/express/middleware/validation';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  const testSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format'),
    age: z.number().min(18, 'Must be at least 18 years old')
  });

  describe('validateRequest', () => {
    it('should pass validation with valid data', () => {
      // Arrange
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25
      };

      const middleware = validateRequest(testSchema);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 400 with validation errors for invalid data', () => {
      // Arrange
      mockRequest.body = {
        name: '',
        email: 'invalid-email',
        age: 16
      };

      const middleware = validateRequest(testSchema);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'name',
                message: 'Name is required'
              }),
              expect.objectContaining({
                field: 'email',
                message: 'Invalid email format'
              }),
              expect.objectContaining({
                field: 'age',
                message: 'Must be at least 18 years old'
              })
            ])
          })
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});