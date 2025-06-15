// tests/unit/domain/use-cases/DeleteUser.test.ts
import { DeleteUser } from '@/domain/use-cases/DeleteUser';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { User } from '@/domain/entities/User';
import { Email } from '@/domain/value-objects/Email';
import { Username } from '@/domain/value-objects/Username';

describe('DeleteUser Use Case', () => {
  let deleteUser: DeleteUser;
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

    deleteUser = new DeleteUser(mockUserRepository);
  });

  describe('execute', () => {
    const createMockUser = (role: 'user' | 'admin' = 'user') => {
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
            profileVisibility: 'public',
            showEmail: false,
            showPhone: false
          }
        },
        loginCount: 0,
        customFields: {}
      });
    };

    it('should allow user to delete their own account', async () => {
      // Arrange
      const userId = 'user-123';
      const mockUser = createMockUser();
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockImplementation(user => Promise.resolve(user));

      const request = {
        userId,
        requestingUserId: userId,
        requestingUserRole: 'user'
      };

      // Act
      const result = await deleteUser.execute(request);

      // Assert
      expect(result.message).toBe('User account has been successfully deleted');
      expect(result.deletedAt).toBeInstanceOf(Date);
      expect(mockUserRepository.update).toHaveBeenCalled();
      expect(mockUser.isActive).toBe(false);
      expect(mockUser.isSuspended).toBe(true);
    });

    it('should allow admin to delete any user account', async () => {
      // Arrange
      const userId = 'user-123';
      const adminId = 'admin-456';
      const mockUser = createMockUser();
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockImplementation(user => Promise.resolve(user));

      const request = {
        userId,
        requestingUserId: adminId,
        requestingUserRole: 'admin'
      };

      // Act
      const result = await deleteUser.execute(request);

      // Assert
      expect(result.message).toBe('User account has been successfully deleted');
      expect(mockUserRepository.update).toHaveBeenCalled();
      expect(mockUser.isActive).toBe(false);
      expect(mockUser.isSuspended).toBe(true);
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
      await expect(deleteUser.execute(request))
        .rejects
        .toThrow('User not found');
    });

    it('should throw error when non-admin tries to delete another user', async () => {
      // Arrange
      const userId = 'user-123';
      const otherUserId = 'other-456';
      const mockUser = createMockUser();
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const request = {
        userId,
        requestingUserId: otherUserId,
        requestingUserRole: 'user'
      };

      // Act & Assert
      await expect(deleteUser.execute(request))
        .rejects
        .toThrow('You can only delete your own account or you must be an admin');
    });

    it('should throw error when admin tries to delete their own account', async () => {
      // Arrange
      const adminId = 'admin-123';
      const mockAdmin = createMockUser('admin');
      mockUserRepository.findById.mockResolvedValue(mockAdmin);

      const request = {
        userId: adminId,
        requestingUserId: adminId,
        requestingUserRole: 'admin'
      };

      // Act & Assert
      await expect(deleteUser.execute(request))
        .rejects
        .toThrow('Administrators cannot delete their own account');
    });

    it('should soft delete by deactivating and suspending the user', async () => {
      // Arrange
      const userId = 'user-123';
      const mockUser = createMockUser();
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockImplementation(user => Promise.resolve(user));

      const request = {
        userId,
        requestingUserId: userId,
        requestingUserRole: 'user'
      };

      // Act
      await deleteUser.execute(request);

      // Assert
      expect(mockUser.isActive).toBe(false);
      expect(mockUser.isSuspended).toBe(true);
      expect(mockUser.suspendedReason).toBe('Account deleted by user');
    });
  });
});