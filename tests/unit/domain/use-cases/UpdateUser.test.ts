// tests/unit/domain/use-cases/UpdateUser.test.ts
import { UpdateUser, UpdateUserRequest } from '@/domain/use-cases/UpdateUser';
import { User, UserProfile, UserPreferences } from '@/domain/entities/User';
import { UserRepository } from '@/domain/repositories/UserRepository';

describe('UpdateUser', () => {
  let updateUser: UpdateUser;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockUser: User;

  beforeEach(() => {
    mockUserRepository = {
        findById: jest.fn(),
        findByEmail: jest.fn(),
        findByUsername: jest.fn(),
        findBySocialAccount: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findAll: jest.fn(),
        search: jest.fn(),
        exists: jest.fn()
      } as jest.Mocked<UserRepository>;

    mockUser = {
      id: 'user-123',
      updateProfile: jest.fn(),
      updatePreferences: jest.fn(),
      // Add other required properties
    } as unknown as User;

    updateUser = new UpdateUser(mockUserRepository);
  });

  describe('Success Cases', () => {
    it('should allow user to update their own profile', async () => {
      const request: UpdateUserRequest = {
        userId: 'user-123',
        requestingUserId: 'user-123',
        requestingUserRole: 'user',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '1234567890'
        }
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(mockUser);

      const result = await updateUser.execute(request);

      expect(mockUser.updateProfile).toHaveBeenCalledWith(request.profile);
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser);
      expect(result).toBe(mockUser);
    });

    it('should allow admin to update any user profile', async () => {
      const request: UpdateUserRequest = {
        userId: 'user-123',
        requestingUserId: 'admin-456',
        requestingUserRole: 'admin',
        profile: {
          firstName: 'Jane',
          lastName: 'Smith'
        }
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(mockUser);

      const result = await updateUser.execute(request);

      expect(mockUser.updateProfile).toHaveBeenCalledWith(request.profile);
      expect(result).toBe(mockUser);
    });

    it('should allow updating user preferences', async () => {
      const request: UpdateUserRequest = {
        userId: 'user-123',
        requestingUserId: 'user-123',
        requestingUserRole: 'user',
        preferences: {
          language: 'vi',
          timezone: 'Asia/Ho_Chi_Minh',
          notifications: {
            email: false,
            push: true,
            sms: false
          }
        }
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(mockUser);

      const result = await updateUser.execute(request);

      expect(mockUser.updatePreferences).toHaveBeenCalledWith(request.preferences);
      expect(result).toBe(mockUser);
    });

    it('should allow updating both profile and preferences', async () => {
      const request: UpdateUserRequest = {
        userId: 'user-123',
        requestingUserId: 'user-123',
        requestingUserRole: 'user',
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        },
        preferences: {
          language: 'en',
          privacy: {
            profileVisibility: 'private',
            showEmail: true,
            showPhone: true
          }
        }
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(mockUser);

      const result = await updateUser.execute(request);

      expect(mockUser.updateProfile).toHaveBeenCalledWith(request.profile);
      expect(mockUser.updatePreferences).toHaveBeenCalledWith(request.preferences);
      expect(result).toBe(mockUser);
    });
  });

  describe('Error Cases', () => {
    it('should throw error if user not found', async () => {
      const request: UpdateUserRequest = {
        userId: 'non-existent',
        requestingUserId: 'admin-123',
        requestingUserRole: 'admin',
        profile: {
          firstName: 'John'
        }
      };

      mockUserRepository.findById.mockResolvedValue(null);

      await expect(updateUser.execute(request))
        .rejects
        .toThrow('User not found');
    });

    it('should throw error if regular user tries to update another user profile', async () => {
      const request: UpdateUserRequest = {
        userId: 'user-123',
        requestingUserId: 'other-user',
        requestingUserRole: 'user',
        profile: {
          firstName: 'John'
        }
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);

      await expect(updateUser.execute(request))
        .rejects
        .toThrow('You can only update your own profile or you must be an admin');
    });
  });
});