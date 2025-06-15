import { LoginUser, LoginUserRequest } from '@/domain/use-cases/LoginUser';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { User } from '@/domain/entities/User';
import { Email } from '@/domain/value-objects/Email';
import { Username } from '@/domain/value-objects/Username';

describe('LoginUser Use Case', () => {
  let loginUser: LoginUser;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockComparePassword: jest.MockedFunction<(password: string, hash: string) => Promise<boolean>>;
  let mockGenerateTokens: jest.MockedFunction<(payload: Record<string, unknown>) => { accessToken: string; refreshToken: string }>;

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

    mockComparePassword = jest.fn();
    mockGenerateTokens = jest.fn().mockReturnValue({
      accessToken: 'access_token',
      refreshToken: 'refresh_token'
    });

    loginUser = new LoginUser(mockUserRepository, mockComparePassword, mockGenerateTokens);
  });

  const validRequest: LoginUserRequest = {
    email: 'test@example.com',
    password: 'password123'
  };

  const createMockUser = (overrides = {}) => {
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
      customFields: {},
      ...overrides
    });
  };

  describe('Successful login', () => {
    it('should login user with valid credentials', async () => {
      // Arrange
      const mockUser = createMockUser();
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockComparePassword.mockResolvedValue(true);
      mockUserRepository.update.mockResolvedValue(mockUser);

      // Act
      const result = await loginUser.execute(validRequest);

      // Assert
      expect(result.user).toBe(mockUser);
      expect(result.tokens.accessToken).toBe('access_token');
      expect(result.tokens.refreshToken).toBe('refresh_token');
      expect(mockComparePassword).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('Login failures', () => {
    it('should throw error for missing email', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, email: '' };

      // Act & Assert
      await expect(loginUser.execute(invalidRequest)).rejects.toThrow('Email and password are required');
    });

    it('should throw error for missing password', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, password: '' };

      // Act & Assert
      await expect(loginUser.execute(invalidRequest)).rejects.toThrow('Email and password are required');
    });

    it('should throw error when user not found', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(loginUser.execute(validRequest)).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for inactive user', async () => {
      // Arrange
      const mockUser = createMockUser({ isActive: false });
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(loginUser.execute(validRequest)).rejects.toThrow('Cannot login: account is inactive');
    });

    it('should throw error for suspended user', async () => {
      // Arrange
      const mockUser = createMockUser({ isSuspended: true });
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(loginUser.execute(validRequest)).rejects.toThrow('Cannot login: account is suspended');
    });

    it('should throw error for unverified email', async () => {
      // Arrange
      const mockUser = createMockUser({ emailVerified: false });
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(loginUser.execute(validRequest)).rejects.toThrow('Cannot login: email is not verified');
    });

    it('should throw error for invalid password', async () => {
      // Arrange
      const mockUser = createMockUser();
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockComparePassword.mockResolvedValue(false);

      // Act & Assert
      await expect(loginUser.execute(validRequest)).rejects.toThrow('Invalid email or password');
    });

    it('should throw error when password hash is missing', async () => {
      // Arrange
      const mockUser = createMockUser({ passwordHash: undefined });
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(loginUser.execute(validRequest)).rejects.toThrow('Password not set for this account');
    });
  });
});
