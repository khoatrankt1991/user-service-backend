import { MongoUserRepository } from '@/infrastructure/database/mongodb/MongoUserRepository';
import { UserModel } from '@/infrastructure/database/mongodb/UserSchema';
import { User } from '@/domain/entities/User';
import { Email } from '@/domain/value-objects/Email';
import { Username } from '@/domain/value-objects/Username';

// Mock the UserModel
jest.mock('@/infrastructure/database/mongodb/UserSchema');

const MockUserModel = UserModel as jest.MockedClass<typeof UserModel>;

describe('MongoUserRepository', () => {
  let repository: MongoUserRepository;

  beforeEach(() => {
    repository = new MongoUserRepository();
    jest.clearAllMocks();
  });

  const createMockUser = () => {
    return User.create({
      username: new Username('test_user_123'),
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

  const createMockUserDoc = () => {
    const doc = {
      _id: 'user123',
      username: 'test_user_123',
      email: 'test@example.com',
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
      lastLoginAt: undefined,
      lastActiveAt: undefined,
      loginCount: 0,
      customFields: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      save: jest.fn()
    };
    doc.save.mockResolvedValue(doc);
    return doc;
  };

  describe('create', () => {
    it('should create user successfully', async () => {
      // Arrange
      const user = createMockUser();
      const mockUserDoc = createMockUserDoc();
      
      MockUserModel.prototype.save = jest.fn().mockResolvedValue(mockUserDoc);
      MockUserModel.mockImplementation(() => mockUserDoc as any);
      // Act
      const result = await repository.create(user);
      // Assert
      expect(result).toBeInstanceOf(User);
      expect(result.username.getValue()).toBe('test_user_123');
      expect(result.email.getValue()).toBe('test@example.com');
    });

    it('should throw error for duplicate email', async () => {
      // Arrange
      const user = createMockUser();
      const duplicateError = new Error('Duplicate key error');
      (duplicateError as any).code = 11000;
      (duplicateError as any).keyPattern = { email: 1 };

      MockUserModel.prototype.save = jest.fn().mockRejectedValue(duplicateError);
      MockUserModel.mockImplementation(() => ({ save: MockUserModel.prototype.save } as any));

      // Act & Assert
      await expect(repository.create(user)).rejects.toThrow('email already exists');
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      // Arrange
      const email = new Email('test@example.com');
      const mockUserDoc = createMockUserDoc();
      
      MockUserModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserDoc)
      });

      // Act
      const result = await repository.findByEmail(email);

      // Assert
      expect(result).toBeInstanceOf(User);
      expect(MockUserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should return null when user not found', async () => {
      // Arrange
      const email = new Email('notfound@example.com');
      
      MockUserModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Act
      const result = await repository.findByEmail(email);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return false when user does not exist', async () => {
      // Arrange
      const email = new Email('test@example.com');
      const username = new Username('testuser');
      
      MockUserModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Act
      const result = await repository.exists(email, username);

      // Assert
      expect(result.exists).toBe(false);
    });

    it('should return conflicts when user exists', async () => {
      // Arrange
      const email = new Email('test@example.com');
      const username = new Username('testuser');
      const mockUserDoc = {
        email: 'test@example.com',
        username: 'testuser'
      };
      
      MockUserModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserDoc)
      });

      // Act
      const result = await repository.exists(email, username);

      // Assert
      expect(result.exists).toBe(true);
      expect(result.conflicts?.email).toBe(true);
      expect(result.conflicts?.username).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      // Arrange
      const mockUserDocs = [createMockUserDoc(), createMockUserDoc()];
      
      MockUserModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockUserDocs)
          })
        })
      });
      
      MockUserModel.countDocuments = jest.fn().mockResolvedValue(2);

      // Act
      const result = await repository.findAll({}, { page: 1, limit: 10, sortBy: 'createdAt' as const, sortOrder: 'desc' as const });

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });
  });
});