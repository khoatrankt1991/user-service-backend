// tests/unit/domain/use-cases/ListUsers.test.ts
import { ListUsers } from '@/domain/use-cases/ListUsers';
import { UserRepository, UserFilters, PaginationOptions, PaginationResult } from '@/domain/repositories/UserRepository';
import { User } from '@/domain/entities/User';
import { Email } from '@/domain/value-objects/Email';
import { Username } from '@/domain/value-objects/Username';

describe('ListUsers Use Case', () => {
  let listUsers: ListUsers;
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

    listUsers = new ListUsers(mockUserRepository);
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

    const createMockPaginationResult = (users: User[]): PaginationResult<User> => ({
      data: users,
      pagination: {
        page: 1,
        limit: 20,
        total: users.length,
        pages: Math.ceil(users.length / 20)
      }
    });

    it('should list users when requested by admin', async () => {
      // Arrange
      const mockUsers = [createMockUser('1'), createMockUser('2')];
      const mockResult = createMockPaginationResult(mockUsers);
      mockUserRepository.findAll.mockResolvedValue(mockResult);

      const request = {
        requestingUserRole: 'admin'
      };

      // Act
      const result = await listUsers.execute(request);

      // Assert
      expect(result).toBe(mockResult);
      expect(mockUserRepository.findAll).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          page: 1,
          limit: 20,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        })
      );
    });

    it('should throw error when non-admin tries to list users', async () => {
      // Arrange
      const request = {
        requestingUserRole: 'user'
      };

      // Act & Assert
      await expect(listUsers.execute(request))
        .rejects
        .toThrow('Only administrators can view all users');
    });

    it('should apply custom pagination options', async () => {
      // Arrange
      const mockUsers = [createMockUser('1'), createMockUser('2')];
      const mockResult = createMockPaginationResult(mockUsers);
      mockUserRepository.findAll.mockResolvedValue(mockResult);

      const request = {
        requestingUserRole: 'admin',
        options: {
          page: 2,
          limit: 10,
          sortBy: 'username',
          sortOrder: 'asc' as const
        }
      };

      // Act
      const result = await listUsers.execute(request);

      // Assert
      expect(result).toBe(mockResult);
      expect(mockUserRepository.findAll).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          page: 2,
          limit: 10,
          sortBy: 'username',
          sortOrder: 'asc'
        })
      );
    });

    it('should limit maximum page size to 100', async () => {
      // Arrange
      const mockUsers = [createMockUser('1'), createMockUser('2')];
      const mockResult = createMockPaginationResult(mockUsers);
      mockUserRepository.findAll.mockResolvedValue(mockResult);

      const request = {
        requestingUserRole: 'admin',
        options: {
          page: 1,
          limit: 150 // Try to request more than max
        }
      };

      // Act
      const result = await listUsers.execute(request);

      // Assert
      expect(result).toBe(mockResult);
      expect(mockUserRepository.findAll).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          limit: 100 // Should be capped at 100
        })
      );
    });

    it('should apply filters when provided', async () => {
      // Arrange
      const mockUsers = [createMockUser('1'), createMockUser('2')];
      const mockResult = createMockPaginationResult(mockUsers);
      mockUserRepository.findAll.mockResolvedValue(mockResult);

      const filters: UserFilters = {
        isActive: true,
        role: 'user'
      };

      const request = {
        requestingUserRole: 'admin',
        filters
      };

      // Act
      const result = await listUsers.execute(request);

      // Assert
      expect(result).toBe(mockResult);
      expect(mockUserRepository.findAll).toHaveBeenCalledWith(
        filters,
        expect.any(Object)
      );
    });
  });
});