import { Request, Response } from 'express';
import { UserService } from '@/application/services/UserService';
import { CreateUserDto } from '@/application/dto/CreateUserDto';
import { UpdateUserDto } from '@/application/dto/UpdateUserDto';
import { LoginDto, LinkSocialAccountDto } from '@/application/dto/LoginDto';
import { UserFilterQueryDto, SearchQueryDto } from '@/application/dto/QueryDto';
import { UserPresenter } from '@/interfaces/presenters/UserPresenter';

import { createSuccessResponse } from '@/infrastructure/web/express/middleware/errorHandler';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export class UserController {
  constructor(
    private userService: UserService,
    private userPresenter: UserPresenter = new UserPresenter()
  ) {}

  /**
   * @swagger
   * /api/v1/users/register:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Register a new user
   *     description: Create a new user account with email and password
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - email
   *               - password
   *               - firstName
   *               - lastName
   *             properties:
   *               username:
   *                 type: string
   *                 minLength: 3
   *                 maxLength: 50
   *                 pattern: '^[a-zA-Z0-9_]+$'
   *                 example: john_doe
   *               email:
   *                 type: string
   *                 format: email
   *                 example: john@example.com
   *               password:
   *                 type: string
   *                 minLength: 8
   *                 example: password123
   *               firstName:
   *                 type: string
   *                 example: John
   *               lastName:
   *                 type: string
   *                 example: Doe
   *               role:
   *                 type: string
   *                 enum: [user, admin]
   *                 default: user
   *               gender:
   *                 type: string
   *                 enum: [male, female, other]
   *               phone:
   *                 type: string
   *                 maxLength: 20
   *               dateOfBirth:
   *                 type: string
   *                 format: date-time
   *               bio:
   *                 type: string
   *                 maxLength: 500
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/User'
   *                     meta:
   *                       type: object
   *                       properties:
   *                         requiresEmailVerification:
   *                           type: boolean
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       409:
   *         $ref: '#/components/responses/ConflictError'
   */
  public async register(req: Request, res: Response): Promise<void> {
    const dto = req.body as CreateUserDto;
    const result = await this.userService.createUser(dto);
    
    const responseData = this.userPresenter.presentUser(result.user);
    
    res.status(201).json(
      createSuccessResponse(
        responseData,
        'User registered successfully',
        { requiresEmailVerification: result.requiresEmailVerification }
      )
    );
  }

  /**
   * @swagger
   * /api/v1/users/login:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Login user
   *     description: Authenticate user with email and password
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: john@example.com
   *               password:
   *                 type: string
   *                 example: password123
   *     responses:
   *       200:
   *         description: Login successful
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
   *                         user:
   *                           $ref: '#/components/schemas/User'
   *                         tokens:
   *                           type: object
   *                           properties:
   *                             accessToken:
   *                               type: string
   *                             refreshToken:
   *                               type: string
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   */
  public async login(req: Request, res: Response): Promise<void> {
    const dto = req.body as LoginDto;
    const result = await this.userService.loginUser(dto);
    
    const responseData = {
      user: this.userPresenter.presentUser(result.user),
      tokens: result.tokens
    };
    
    res.json(
      createSuccessResponse(responseData, 'Login successful')
    );
  }

  /**
   * @swagger
   * /api/v1/users:
   *   get:
   *     tags:
   *       - Users
   *     summary: Get all users (Admin only)
   *     description: Retrieve paginated list of users with filtering options
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [createdAt, updatedAt, username, email, lastLoginAt]
   *           default: createdAt
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: desc
   *       - in: query
   *         name: role
   *         schema:
   *           type: string
   *           enum: [user, admin]
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *       - in: query
   *         name: emailVerified
   *         schema:
   *           type: boolean
   *     responses:
   *       200:
   *         description: Users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/User'
   *                     meta:
   *                       $ref: '#/components/schemas/PaginationMeta'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   */
  public async getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    const queryDto = req.query as unknown as UserFilterQueryDto;
    const result = await this.userService.listUsers(req.user!.role, queryDto);
    
    const responseData = this.userPresenter.presentUserList(result.data);
    
    res.json(
      createSuccessResponse(
        responseData,
        'Users retrieved successfully',
        { pagination: result.pagination }
      )
    );
  }

  /**
   * @swagger
   * /api/v1/users/{userId}:
   *   get:
   *     tags:
   *       - Users
   *     summary: Get user by ID
   *     description: Retrieve user details by ID (own profile or admin)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: User retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/User'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   */
  public async getUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.params.userId;
    if (!userId) {
      throw new Error('User ID is required');
    }
    const user = await this.userService.getUserById(userId, req.user!.id, req.user!.role);
    
    const responseData = this.userPresenter.presentUser(user);
    
    res.json(
      createSuccessResponse(responseData, 'User retrieved successfully')
    );
  }

  /**
   * @swagger
   * /api/v1/users/profile:
   *   get:
   *     tags:
   *       - Users
   *     summary: Get current user profile
   *     description: Retrieve the authenticated user's profile
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Profile retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/User'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   */
  public async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = await this.userService.getUserById(req.user!.id, req.user!.id, req.user!.role);
    
    const responseData = this.userPresenter.presentUser(user);
    
    res.json(
      createSuccessResponse(responseData, 'Profile retrieved successfully')
    );
  }

  /**
   * @swagger
   * /api/v1/users/{userId}:
   *   put:
   *     tags:
   *       - Users
   *     summary: Update user
   *     description: Update user profile (own profile or admin)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               profile:
   *                 type: object
   *                 properties:
   *                   firstName:
   *                     type: string
   *                   lastName:
   *                     type: string
   *                   displayName:
   *                     type: string
   *                   gender:
   *                     type: string
   *                     enum: [male, female, other]
   *                   avatarUrl:
   *                     type: string
   *                     format: uri
   *                   phone:
   *                     type: string
   *                   bio:
   *                     type: string
   *               preferences:
   *                 type: object
   *                 properties:
   *                   language:
   *                     type: string
   *                   timezone:
   *                     type: string
   *                   notifications:
   *                     type: object
   *                     properties:
   *                       email:
   *                         type: boolean
   *                       push:
   *                         type: boolean
   *                       sms:
   *                         type: boolean
   *     responses:
   *       200:
   *         description: User updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/User'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   */
  public async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.params.userId;
    const dto = req.body as UpdateUserDto;
    if (!userId) {
      throw new Error('User ID is required');
    }
    const user = await this.userService.updateUser(userId, dto, req.user!.id, req.user!.role);
    
    const responseData = this.userPresenter.presentUser(user);
    
    res.json(
      createSuccessResponse(responseData, 'User updated successfully')
    );
  }

  /**
   * @swagger
   * /api/v1/users/{userId}:
   *   delete:
   *     tags:
   *       - Users
   *     summary: Delete user
   *     description: Delete user account (own account or admin)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: User deleted successfully
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
   *                         message:
   *                           type: string
   *                         deletedAt:
   *                           type: string
   *                           format: date-time
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       404:
   *         $ref: '#/components/responses/NotFoundError'
   */
  public async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.params.userId;
    if (!userId) {
      throw new Error('User ID is required');
    }
    const result = await this.userService.deleteUser(userId, req.user!.id, req.user!.role);
    
    res.json(
      createSuccessResponse(result, 'User deleted successfully')
    );
  }

  /**
   * @swagger
   * /api/v1/users/{userId}/social:
   *   post:
   *     tags:
   *       - Users
   *     summary: Link social account
   *     description: Link a social media account to user profile
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - provider
   *               - providerId
   *               - providerEmail
   *             properties:
   *               provider:
   *                 type: string
   *                 enum: [google, facebook, github]
   *               providerId:
   *                 type: string
   *               providerEmail:
   *                 type: string
   *                 format: email
   *               providerData:
   *                 type: object
   *     responses:
   *       200:
   *         description: Social account linked successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/User'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       403:
   *         $ref: '#/components/responses/ForbiddenError'
   *       409:
   *         $ref: '#/components/responses/ConflictError'
   */
  public async linkSocialAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.params.userId;
    const dto = req.body as LinkSocialAccountDto;
    if (!userId) {
      throw new Error('User ID is required');
    }
    const user = await this.userService.linkSocialAccount(userId, dto, req.user!.id, req.user!.role);
    
    const responseData = this.userPresenter.presentUser(user);
    
    res.json(
      createSuccessResponse(responseData, 'Social account linked successfully')
    );
  }

  /**
   * @swagger
   * /api/v1/users/search:
   *   get:
   *     tags:
   *       - Users
   *     summary: Search users
   *     description: Search users by username, name, or email
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *           minLength: 2
   *         description: Search query
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 20
   *       - in: query
   *         name: skip
   *         schema:
   *           type: integer
   *           minimum: 0
   *           default: 0
   *       - in: query
   *         name: includeInactive
   *         schema:
   *           type: boolean
   *           default: false
   *     responses:
   *       200:
   *         description: Search results retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/User'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   */
  public async searchUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    const queryDto = req.query as unknown as SearchQueryDto;
    const users = await this.userService.searchUsers(req.user!.role, queryDto);
    
    const responseData = this.userPresenter.presentSearchResults(users, req.user!.role);
    
    res.json(
      createSuccessResponse(responseData, 'Search results retrieved successfully')
    );
  }
}