import { Router } from 'express';
import { UserController } from '@/interfaces/controllers/UserController';
import { createAuthMiddleware } from '../middleware/auth';
import { validateRequest, validateQuery, validateParams } from '../middleware/validation';
import { authLimiter, registerLimiter } from '../middleware/security';
import { CreateUserDtoSchema } from '@/application/dto/CreateUserDto';
import { UpdateUserDtoSchema } from '@/application/dto/UpdateUserDto';
import { LoginDtoSchema, LinkSocialAccountDtoSchema } from '@/application/dto/LoginDto';
import { UserFilterQueryDtoSchema, SearchQueryDtoSchema, UserParamsSchema } from '@/application/dto/QueryDto';
import { container } from '@/infrastructure/config/container';

export const createUserRoutes = (): Router => {
  const router = Router();
  const userController = container.getUserController();
  const userService = container.getUserService();
  const { authenticate, requireAdmin, requireSelfOrAdmin } = createAuthMiddleware(userService);

  // Public routes (no authentication required)
  router.post('/register', 
    registerLimiter,
    validateRequest(CreateUserDtoSchema),
    userController.register.bind(userController)
  );

  router.post('/login',
    authLimiter,
    validateRequest(LoginDtoSchema),
    userController.login.bind(userController)
  );

  // Protected routes (authentication required)
  router.use(authenticate);

  // User profile routes
  router.get('/profile', userController.getProfile.bind(userController));

  router.get('/search',
    validateQuery(SearchQueryDtoSchema),
    userController.searchUsers.bind(userController)
  );

  // Admin only routes
  router.get('/',
    requireAdmin,
    validateQuery(UserFilterQueryDtoSchema),
    userController.getAllUsers.bind(userController)
  );

  // Self or Admin routes
  router.get('/:userId',
    validateParams(UserParamsSchema),
    requireSelfOrAdmin,
    userController.getUser.bind(userController)
  );

  router.put('/:userId',
    validateParams(UserParamsSchema),
    requireSelfOrAdmin,
    validateRequest(UpdateUserDtoSchema),
    userController.updateUser.bind(userController)
  );

  router.delete('/:userId',
    validateParams(UserParamsSchema),
    requireSelfOrAdmin,
    userController.deleteUser.bind(userController)
  );

  router.post('/:userId/social',
    validateParams(UserParamsSchema),
    requireSelfOrAdmin,
    validateRequest(LinkSocialAccountDtoSchema),
    userController.linkSocialAccount.bind(userController)
  );

  return router;
};
