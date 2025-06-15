import { UserService, IAuthService } from '@/application/services/UserService';
import { UserRepository, PaginationResult } from '@/domain/repositories/UserRepository';
import { User } from '@/domain/entities/User';
import { Email } from '@/domain/value-objects/Email';
import { Username } from '@/domain/value-objects/Username';
import { CreateUserDto } from '@/application/dto/CreateUserDto';
import { LoginDto } from '@/application/dto/LoginDto';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockAuthService: jest.Mocked<IAuthService>;

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

    mockAuthService = {
      hashPassword: jest.fn(),
      comparePassword: jest.fn(),
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyToken: jest.fn()
    };

    userService = new UserService(mockUserRepository, mockAuthService);
  });

  describe('createUser', () => {
    const validCreateUserDto: CreateUserDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    };

    it('should create user successfully', async () => {
      // Arrange
      mockUserRepository.exists.mockResolvedValue({ exists: false });
      mockAuthService.hashPassword.mockResolvedValue('hashed_password');
      
      const createdUser = User.create({
        username: new Username('testuser'),
        email: new Email('test@example.com'),
        passwordHash: 'hashed_password',
        role: 'user',
        profile: { firstName: 'Test', lastName: 'User' },
        addresses: [],
        socialAccounts: [],
        emailVerified: false,
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
      
      mockUserRepository.create.mockResolvedValue(createdUser);

      // Act
      const result = await userService.createUser(validCreateUserDto);

      // Assert
      expect(result.user.username.getValue()).toBe('testuser');
      expect(result.user.email.getValue()).toBe('test@example.com');
      expect(result.requiresEmailVerification).toBe(true);
      expect(mockAuthService.hashPassword).toHaveBeenCalledWith('password123');
    });

    it('should throw error when user already exists', async () => {
      // Arrange
      mockUserRepository.exists.mockResolvedValue({ 
        exists: true, 
        conflicts: { email: true, username: false } 
      });

      // Act & Assert
      await expect(userService.createUser(validCreateUserDto))
        .rejects.toThrow('Email already registered');
    });
  });

  describe('loginUser', () => {
    const validLoginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('should login user successfully', async () => {
      // Arrange
      const user = User.create({
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

      mockUserRepository.findByEmail.mockResolvedValue(user);
      mockAuthService.comparePassword.mockResolvedValue(true);
      mockAuthService.generateAccessToken.mockReturnValue('access_token');
      mockAuthService.generateRefreshToken.mockReturnValue('refresh_token');
      mockUserRepository.update.mockResolvedValue(user);

      // Act
      const result = await userService.loginUser(validLoginDto);

      // Assert
      expect(result.user).toBe(user);
      expect(result.tokens.accessToken).toBe('access_token');
      expect(result.tokens.refreshToken).toBe('refresh_token');
    });

    it('should throw error for invalid credentials', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.loginUser(validLoginDto))
        .rejects.toThrow('Invalid email or password');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'user'
      };
      mockAuthService.verifyToken.mockReturnValue(payload);
  
      const result = await userService.verifyToken('valid-token');
  
      expect(result).toEqual(payload);
      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('valid-token');
    });
  
    it('should throw error for invalid token', async () => {
      mockAuthService.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });
  
      await expect(userService.verifyToken('invalid-token'))
        .rejects
        .toThrow('Invalid or expired token');
    });
  });

  describe('searchUsers', () => {
    it('should allow admin to include inactive users', async () => {
      const queryDto = {
        q: 'test',
        limit: 10,
        skip: 0,
        includeInactive: true
      };

      const mockUsers: User[] = [
        User.create({
          username: new Username('testuser1'),
          email: new Email('test1@example.com'),
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
        })
      ];
      mockUserRepository.search.mockResolvedValue(mockUsers);

      const result = await userService.searchUsers('admin', queryDto);

      expect(result).toBe(mockUsers);
      expect(mockUserRepository.search).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({
          includeInactive: true
        })
      );
    });
  });

  describe('listUsers', () => {
    it('should apply all filters correctly', async () => {
      const queryDto = {
        role: 'user' as const,
        isActive: true,
        emailVerified: true,
        isSuspended: false,
        createdAfter: new Date('2023-01-01'),
        createdBefore: new Date('2023-12-31'),
        page: 1,
        limit: 20,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const
      };
  
      const mockUser = User.create({
        username: new Username('testuser1'),
        email: new Email('test1@example.com'),
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
      
      const mockResult: PaginationResult<User> = {
        data: [mockUser],
        pagination: {
          total: 1,
          page: 1,
          limit: 20,
          pages: 1
        }
      };
      mockUserRepository.findAll.mockResolvedValue(mockResult);
  
      const result = await userService.listUsers('admin', queryDto);
  
      expect(result).toBe(mockResult);
      expect(mockUserRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
          isActive: true,
          emailVerified: true,
          isSuspended: false,
          createdAfter: queryDto.createdAfter,
          createdBefore: queryDto.createdBefore
        }),
        expect.objectContaining({
          page: 1,
          limit: 20,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        })
      );
    });
  });
})
