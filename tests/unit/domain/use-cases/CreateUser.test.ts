import { CreateUser, CreateUserRequest } from '@/domain/use-cases/CreateUser';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { User } from '@/domain/entities/User';
import { Email } from '@/domain/value-objects/Email';
import { Username } from '@/domain/value-objects/Username';

describe('CreateUser Use Case', () => {
  let createUser: CreateUser;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockHashPassword: jest.MockedFunction<(password: string) => Promise<string>>;

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

    mockHashPassword = jest.fn().mockResolvedValue('hashed_password');

    createUser = new CreateUser(mockUserRepository, mockHashPassword);
  });

  const validRequest: CreateUserRequest = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User'
  };

  describe('Successful user creation', () => {
    it('should create user when all data is valid', async () => {
      // Arrange
      mockUserRepository.exists.mockResolvedValue({ exists: false });
      const mockCreatedUser = User.create({
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
      mockUserRepository.create.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await createUser.execute(validRequest);

      // Assert
      expect(result.user.username.getValue()).toBe('testuser');
      expect(result.user.email.getValue()).toBe('test@example.com');
      expect(result.requiresEmailVerification).toBe(true);
      expect(mockHashPassword).toHaveBeenCalledWith('password123');
      expect(mockUserRepository.exists).toHaveBeenCalled();
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should set admin role when specified', async () => {
      // Arrange
      mockUserRepository.exists.mockResolvedValue({ exists: false });
      const requestWithAdminRole = { ...validRequest, role: 'admin' as const };
      const mockCreatedUser = User.create({
        username: new Username('testuser'),
        email: new Email('test@example.com'),
        passwordHash: 'hashed_password',
        role: 'admin',
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
      mockUserRepository.create.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await createUser.execute(requestWithAdminRole);

      // Assert
      expect(result.user.role).toBe('admin');
    });
  });

  describe('Validation errors', () => {
    it('should throw error for invalid email', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, email: 'invalid-email' };

      // Act & Assert
      await expect(createUser.execute(invalidRequest)).rejects.toThrow('Invalid email format');
    });

    it('should throw error for invalid username', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, username: 'ab' };

      // Act & Assert
      await expect(createUser.execute(invalidRequest)).rejects.toThrow('Invalid username format');
    });

    it('should throw error for weak password', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, password: '123' };

      // Act & Assert
      await expect(createUser.execute(invalidRequest)).rejects.toThrow('Password must be at least 8 characters long');
    });
  });

  describe('Conflict handling', () => {
    it('should throw error when email already exists', async () => {
      // Arrange
      mockUserRepository.exists.mockResolvedValue({ 
        exists: true, 
        conflicts: { email: true, username: false } 
      });

      // Act & Assert
      await expect(createUser.execute(validRequest)).rejects.toThrow('Email already registered');
    });

    it('should throw error when username already exists', async () => {
      // Arrange
      mockUserRepository.exists.mockResolvedValue({ 
        exists: true, 
        conflicts: { email: false, username: true } 
      });

      // Act & Assert
      await expect(createUser.execute(validRequest)).rejects.toThrow('Username already taken');
    });

    it('should throw error when both email and username exist', async () => {
      // Arrange
      mockUserRepository.exists.mockResolvedValue({ 
        exists: true, 
        conflicts: { email: true, username: true } 
      });

      // Act & Assert
      await expect(createUser.execute(validRequest)).rejects.toThrow('Email already registered, Username already taken');
    });
  });
});
