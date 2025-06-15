// tests/unit/domain/use-cases/SearchUsers.test.ts
import { SearchUsers } from '@/domain/use-cases/SearchUsers';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { User } from '@/domain/entities/User';
import { Email } from '@/domain/value-objects/Email';
import { Username } from '@/domain/value-objects/Username';

describe('SearchUsers Use Case', () => {
  let searchUsers: SearchUsers;
  let mockUserRepository: jest.Mocked<UserRepository>;

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

    searchUsers = new SearchUsers(mockUserRepository);
  });

  describe('execute', () => {
    const createMockUser = (id: string) => {
      return User.create({
        username: new Username(`user${id}`),
        email: new Email(`user${id}@example.com`),
        role: 'user',
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

    it('should search users with valid query', async () => {
      // Arrange
      const mockUsers = [createMockUser('1'), createMockUser('2')];
      mockUserRepository.search.mockResolvedValue(mockUsers);

      const request = {
        query: 'test',
        requestingUserRole: 'user'
      };

      // Act
      const result = await searchUsers.execute(request);

      // Assert
      expect(result).toBe(mockUsers);
      expect(mockUserRepository.search).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          page: 1,
          limit: 20,
          skip: 0,
          includeInactive: false
        })
      );
    });

    it('should throw error when query is too short', async () => {
      // Arrange
      const request = {
        query: 'a',
        requestingUserRole: 'user'
      };

      // Act & Assert
      await expect(searchUsers.execute(request))
        .rejects
        .toThrow('Search query must be at least 2 characters long');
    });

    it('should throw error when query is empty', async () => {
      // Arrange
      const request = {
        query: '',
        requestingUserRole: 'user'
      };

      // Act & Assert
      await expect(searchUsers.execute(request))
        .rejects
        .toThrow('Search query must be at least 2 characters long');
    });

    it('should apply custom search options', async () => {
      // Arrange
      const mockUsers = [createMockUser('1'), createMockUser('2')];
      mockUserRepository.search.mockResolvedValue(mockUsers);

      const request = {
        query: 'test',
        requestingUserRole: 'user',
        options: {
          limit: 10,
          skip: 5
        }
      };

      // Act
      const result = await searchUsers.execute(request);

      // Assert
      expect(result).toBe(mockUsers);
      expect(mockUserRepository.search).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          page: 1,
          limit: 10,
          skip: 5,
          includeInactive: false
        })
      );
    });

    it('should limit maximum results to 50', async () => {
      // Arrange
      const mockUsers = [createMockUser('1'), createMockUser('2')];
      mockUserRepository.search.mockResolvedValue(mockUsers);

      const request = {
        query: 'test',
        requestingUserRole: 'user',
        options: {
          limit: 100 // Try to request more than max
        }
      };

      // Act
      const result = await searchUsers.execute(request);

      // Assert
      expect(result).toBe(mockUsers);
      expect(mockUserRepository.search).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          limit: 50 // Should be capped at 50
        })
      );
    });

    it('should allow admin to include inactive users', async () => {
      // Arrange
      const mockUsers = [createMockUser('1'), createMockUser('2')];
      mockUserRepository.search.mockResolvedValue(mockUsers);

      const request = {
        query: 'test',
        requestingUserRole: 'admin',
        options: {
          includeInactive: true
        }
      };

      // Act
      const result = await searchUsers.execute(request);

      // Assert
      expect(result).toBe(mockUsers);
      expect(mockUserRepository.search).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          includeInactive: true
        })
      );
    });

    it('should not allow non-admin to include inactive users', async () => {
      // Arrange
      const mockUsers = [createMockUser('1'), createMockUser('2')];
      mockUserRepository.search.mockResolvedValue(mockUsers);

      const request = {
        query: 'test',
        requestingUserRole: 'user',
        options: {
          includeInactive: true
        }
      };

      // Act
      const result = await searchUsers.execute(request);

      // Assert
      expect(result).toBe(mockUsers);
      expect(mockUserRepository.search).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          includeInactive: false // Should be false for non-admin
        })
      );
    });

    it('should trim search query', async () => {
      // Arrange
      const mockUsers = [createMockUser('1'), createMockUser('2')];
      mockUserRepository.search.mockResolvedValue(mockUsers);

      const request = {
        query: '  test  ',
        requestingUserRole: 'user'
      };

      // Act
      const result = await searchUsers.execute(request);

      // Assert
      expect(result).toBe(mockUsers);
      expect(mockUserRepository.search).toHaveBeenCalledWith(
        'test', // Should be trimmed
        expect.any(Object)
      );
    });
  });
});