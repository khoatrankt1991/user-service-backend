import { Request, Response, NextFunction } from 'express';
import { UserService } from '@/application/services/UserService';
import { createErrorResponse } from './errorHandler';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const createAuthMiddleware = (userService: UserService) => {
  const authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json(
          createErrorResponse('Access token required', 'UNAUTHORIZED')
        );
        return;
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        res.status(401).json(
          createErrorResponse('Invalid token format', 'UNAUTHORIZED')
        );
        return;
      }

      // Verify JWT token using UserService
      const decoded = await userService.verifyToken(token);
      
      // Attach user to request
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };

      next();
    } catch (error) {
      res.status(401).json(
        createErrorResponse('Invalid or expired token', 'UNAUTHORIZED')
      );
    }
  };

  const requireAdmin = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json(
        createErrorResponse('Authentication required', 'UNAUTHORIZED')
      );
      return;
    }

    if (req.user.role !== 'admin') {
      res.status(403).json(
        createErrorResponse('Administrator access required', 'FORBIDDEN')
      );
      return;
    }

    next();
  };

  const requireSelfOrAdmin = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json(
        createErrorResponse('Authentication required', 'UNAUTHORIZED')
      );
      return;
    }

    const targetUserId = req.params.userId || req.params.id;
    
    if (req.user.role !== 'admin' && req.user.id !== targetUserId) {
      res.status(403).json(
        createErrorResponse('You can only access your own resources or must be an admin', 'FORBIDDEN')
      );
      return;
    }

    next();
  };

  return { authenticate, requireAdmin, requireSelfOrAdmin };
};
