import { Request, Response } from 'express';
import { UserController } from '@/interfaces/controllers/UserController';
import { UserService } from '@/application/services/UserService';
import { UserPresenter } from '@/interfaces/presenters/UserPresenter';
import { User } from '@/domain/entities/User';
import { Email } from '@/domain/value-objects/Email';
import { Username } from '@/domain/value-objects/Username';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

describe('UserController', () => {
  let userController: UserController;
  let mockUserService: jest.Mocked<UserService>;
  let mockUserPresenter: jest.Mocked<UserPresenter>;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockUserService = {
      createUser: jest.fn(),
      loginUser: jest.fn(),
      getUserById: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      listUsers: jest.fn(),
      searchUsers: jest.fn(),
      linkSocialAccount: jest.fn(),
      verifyToken: jest.fn()
    } as any;

    mockUserPresenter = {
      presentUser: jest.fn(),
      presentUserList: jest.fn(),
      presentPublicProfile: jest.fn(),
      presentSearchResults: jest.fn(),
      presentUserStats: jest.fn(),
      presentUserActivity: jest.fn(),
      presentMinimalUser: jest.fn(),
      presentAuthResponse: jest.fn(),
      presentValidationErrors: jest.fn(),
      presentPaginationMeta: jest.fn(),
      presentUserWithPrivacy: jest.fn(),
      presentUserAddresses: jest.fn(),
      presentSocialAccounts: jest.fn()
    };

    userController = new UserController(mockUserService, mockUserPresenter);

    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: {
        id: 'user123',
        email: 'test@example.com',
        role: 'user'
      }
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
  });

  const createMockUser = () => {
    return User.create({
      username: new Username('testuser'),
      email: new Email('test@example.com'),
      passwordHash: 'hashed_password',
      role: 'user',
      profile: { firstName: 'Test', lastName: 'User' },
      addresses: [],
      socialAccounts: [],
      emailVerified: true,
      phoneVerified: false,
      isActive: true,
      isSuspended: false,
      preferences: {
        language: 'en',
        timezone: 'UTC',
        notifications: { email: true, push: true, sms: false },
        privacy: { profileVisibility: 'public', showEmail: false, showPhone: false }
      },
      loginCount: 0,
      customFields: {}
    });
  };

  describe('register', () => {
    it('should register user successfully', async () => {
      // Arrange
      const mockUser = createMockUser();
      const registrationData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      mockRequest.body = registrationData;
      mockUserService.createUser.mockResolvedValue({
        user: mockUser,
        requiresEmailVerification: true
      });
      mockUserPresenter.presentUser.mockReturnValue({
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        profile: { firstName: 'Test', lastName: 'User' },
        emailVerified: true,
        isActive: true,
        isSuspended: false,
        preferences: {
          language: 'en',
          timezone: 'UTC',
          notifications: { email: true, push: true, sms: false },
          privacy: { profileVisibility: 'public', showEmail: false, showPhone: false }
        },
        loginCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      await userController.register(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.createUser).toHaveBeenCalledWith(registrationData);
      expect(mockUserPresenter.presentUser).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User registered successfully',
          meta: { requiresEmailVerification: true }
        })
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      // Arrange
      const mockUser = createMockUser();
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };
      const mockTokens = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token'
      };

      mockRequest.body = loginData;
      mockUserService.loginUser.mockResolvedValue({
        user: mockUser,
        tokens: mockTokens
      });
      mockUserPresenter.presentUser.mockReturnValue({
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        profile: { firstName: 'Test', lastName: 'User' },
        emailVerified: true,
        isActive: true,
        isSuspended: false,
        preferences: {
          language: 'en',
          timezone: 'UTC',
          notifications: { email: true, push: true, sms: false },
          privacy: { profileVisibility: 'public', showEmail: false, showPhone: false }
        },
        loginCount: 1,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      await userController.login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.loginUser).toHaveBeenCalledWith(loginData);
      expect(mockUserPresenter.presentUser).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Login successful',
          data: expect.objectContaining({
            tokens: mockTokens
          })
        })
      );
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      // Arrange
      const mockUser = createMockUser();
      mockUserService.getUserById.mockResolvedValue(mockUser);
      mockUserPresenter.presentUser.mockReturnValue({
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        profile: { firstName: 'Test', lastName: 'User' },
        emailVerified: true,
        isActive: true,
        isSuspended: false,
        preferences: {
          language: 'en',
          timezone: 'UTC',
          notifications: { email: true, push: true, sms: false },
          privacy: { profileVisibility: 'public', showEmail: false, showPhone: false }
        },
        loginCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      await userController.getProfile(mockRequest as any, mockResponse as Response);

      // Assert
      expect(mockUserService.getUserById).toHaveBeenCalledWith('user123', 'user123', 'user');
      expect(mockUserPresenter.presentUser).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Profile retrieved successfully'
        })
      );
    });
  });

  describe('getAllUsers', () => {
    it('should get all users for admin', async () => {
      // Arrange
      const mockUsers = [createMockUser(), createMockUser()];
      const adminRequest = {
        ...mockRequest,
        user: { id: 'admin123', email: 'admin@example.com', role: 'admin' },
        query: { page: '1', limit: '20' }
      };

      mockUserService.listUsers.mockResolvedValue(Promise.resolve({
        data: mockUsers,
        pagination: { page: 1, limit: 20, total: 2, pages: 1 }
      } as PaginationResult<User>));
      mockUserPresenter.presentUserList.mockReturnValue([
        {
          id: 'user123',
          username: 'testuser',
          email: 'test@example.com',
          role: 'user',
          profile: { firstName: 'Test', lastName: 'User' },
          emailVerified: true,
          isActive: true,
          isSuspended: false,
          preferences: {
            language: 'en',
            timezone: 'UTC',
            notifications: { email: true, push: true, sms: false },
            privacy: { profileVisibility: 'public', showEmail: false, showPhone: false }
          },
          loginCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);

      // Act
      await userController.getAllUsers(adminRequest as any, mockResponse as Response);

      // Assert
      expect(mockUserService.listUsers).toHaveBeenCalledWith('admin', expect.any(Object));
      expect(mockUserPresenter.presentUserList).toHaveBeenCalledWith(mockUsers);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Users retrieved successfully',
          meta: expect.objectContaining({
            pagination: { page: 1, limit: 20, total: 2, pages: 1 }
          })
        })
      );
    });
  });

  describe('searchUsers', () => {
    it('should search users successfully', async () => {
      // Arrange
      const mockUsers = [createMockUser()];
      const searchRequest = {
        ...mockRequest,
        query: { q: 'test', limit: '10' }
      };

      mockUserService.searchUsers.mockResolvedValue(mockUsers);
      mockUserPresenter.presentSearchResults.mockReturnValue([
        {
          id: 'user123',
          username: 'testuser',
          profile: {
            firstName: 'Test',
            lastName: 'User',
            avatarUrl: undefined
          },
          emailVerified: true,
          createdAt: new Date()
        }
      ]);

      // Act
      await userController.searchUsers(searchRequest as any, mockResponse as Response);

      // Assert
      expect(mockUserService.searchUsers).toHaveBeenCalledWith('user', expect.any(Object));
      expect(mockUserPresenter.presentSearchResults).toHaveBeenCalledWith(mockUsers, 'user');
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Search results retrieved successfully'
        })
      );
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      // Arrange
      const mockUser = createMockUser();
      const updateData = {
        profile: {
          firstName: 'Updated',
          lastName: 'Name'
        }
      };

      mockRequest.body = updateData;
      mockRequest.params = { userId: 'user123' };
      mockUserService.updateUser.mockResolvedValue(mockUser);
      mockUserPresenter.presentUser.mockReturnValue({
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        profile: { firstName: 'Updated', lastName: 'Name' },
        emailVerified: true,
        isActive: true,
        isSuspended: false,
        preferences: {
          language: 'en',
          timezone: 'UTC',
          notifications: { email: true, push: true, sms: false },
          privacy: { profileVisibility: 'public', showEmail: false, showPhone: false }
        },
        loginCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      await userController.updateUser(mockRequest as any, mockResponse as Response);

      // Assert
      expect(mockUserService.updateUser).toHaveBeenCalledWith('user123', updateData, 'user123', 'user');
      expect(mockUserPresenter.presentUser).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User updated successfully'
        })
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      // Arrange
      const deleteResult = {
        message: 'User account has been successfully deleted',
        deletedAt: new Date()
      };

      mockRequest.params = { userId: 'user123' };
      mockUserService.deleteUser.mockResolvedValue(deleteResult);

      // Act
      await userController.deleteUser(mockRequest as any, mockResponse as Response);

      // Assert
      expect(mockUserService.deleteUser).toHaveBeenCalledWith('user123', 'user123', 'user');
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User deleted successfully',
          data: deleteResult
        })
      );
    });
  });

  describe('linkSocialAccount', () => {
    it('should link social account successfully', async () => {
      // Arrange
      const mockUser = createMockUser();
      const socialData = {
        provider: 'google' as const,
        providerId: 'google123',
        providerEmail: 'test@gmail.com',
        providerData: {}
      };

      mockRequest.body = socialData;
      mockRequest.params = { userId: 'user123' };
      mockUserService.linkSocialAccount.mockResolvedValue(mockUser);
      mockUserPresenter.presentUser.mockReturnValue({
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        profile: { firstName: 'Test', lastName: 'User' },
        emailVerified: true,
        isActive: true,
        isSuspended: false,
        preferences: {
          language: 'en',
          timezone: 'UTC',
          notifications: { email: true, push: true, sms: false },
          privacy: { profileVisibility: 'public', showEmail: false, showPhone: false }
        },
        loginCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      await userController.linkSocialAccount(mockRequest as any, mockResponse as Response);

      // Assert
      expect(mockUserService.linkSocialAccount).toHaveBeenCalledWith('user123', socialData, 'user123', 'user');
      expect(mockUserPresenter.presentUser).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Social account linked successfully'
        })
      );
    });
  });
});