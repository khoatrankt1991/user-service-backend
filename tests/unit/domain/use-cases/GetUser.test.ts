// tests/unit/domain/use-cases/GetUser.test.ts
import { GetUser } from '@/domain/use-cases/GetUser';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { User } from '@/domain/entities/User';
import { Email } from '@/domain/value-objects/Email';
import { Username } from '@/domain/value-objects/Username';

describe('GetUser Use Case', () => {
  let getUser: GetUser;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = {
        create: jest.fn(),
        findById: jest.fn(),
        findByEmail: jest.fn(),
        findByUsername: jest.fn(),
        findBySocialAccount: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findAll: jest.fn(),
        search: jest.fn(),
        exists: jest.fn()
      };

    getUser = new GetUser(mockUserRepository);
  });

  describe('execute', () => {
    const createMockUser = (role: 'user' | 'admin' = 'user', privacy: 'public' | 'private' | 'friends' = 'public') => {
      return User.create({
        username: new Username('testuser'),
        email: new Email('test@example.com'),
        role,
        profile: {
          firstName: 'Test',
          lastName: 'User'
        },
        addresses: [],
        socialAccounts: [],
        emailVerified: true,
        phoneVerified: false,
        isActive: true,
        isSuspended: false,
        preferences: {
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            push: true,
            sms: false
          },
          privacy: {
            profileVisibility: privacy,
            showEmail: false,
            showPhone: false
          }
        },
        loginCount: 0,
        customFields: {}
      });
    };

    it('should allow user to get their own profile', async () => {
      // Arrange
      const userId = 'user-123';
      const mockUser = createMockUser();
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const request = {
        userId,
        requestingUserId: userId,
        requestingUserRole: 'user'
      };

      // Act
      const result = await getUser.execute(request);

      // Assert
      expect(result).toBe(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should allow admin to get any user profile', async () => {
      // Arrange
      const userId = 'user-123';
      const adminId = 'admin-456';
      const mockUser = createMockUser();
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const request = {
        userId,
        requestingUserId: adminId,
        requestingUserRole: 'admin'
      };

      // Act
      const result = await getUser.execute(request);

      // Assert
      expect(result).toBe(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw error when user not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      const request = {
        userId: 'non-existent',
        requestingUserId: 'user-123',
        requestingUserRole: 'user'
      };

      // Act & Assert
      await expect(getUser.execute(request))
        .rejects
        .toThrow('User not found');
    });

    it('should allow access to public profile for any user', async () => {
      // Arrange
      const userId = 'user-123';
      const otherUserId = 'other-456';
      const mockUser = createMockUser('user', 'public');
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const request = {
        userId,
        requestingUserId: otherUserId,
        requestingUserRole: 'user'
      };

      // Act
      const result = await getUser.execute(request);

      // Assert
      expect(result).toBe(mockUser);
    });

    it('should throw error when accessing private profile without permission', async () => {
      // Arrange
      const userId = 'user-123';
      const otherUserId = 'other-456';
      const mockUser = createMockUser('user', 'private');
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const request = {
        userId,
        requestingUserId: otherUserId,
        requestingUserRole: 'user'
      };

      // Act & Assert
      await expect(getUser.execute(request))
        .rejects
        .toThrow('This profile is private');
    });

    it('should allow access to private profile for admin', async () => {
      // Arrange
      const userId = 'user-123';
      const adminId = 'admin-456';
      const mockUser = createMockUser('user', 'private');
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const request = {
        userId,
        requestingUserId: adminId,
        requestingUserRole: 'admin'
      };

      // Act
      const result = await getUser.execute(request);

      // Assert
      expect(result).toBe(mockUser);
    });
  });
});