import { UserPresenter } from '@/interfaces/presenters/UserPresenter';
import { User } from '@/domain/entities/User';
import { Username } from '@/domain/value-objects/Username';
import { Email } from '@/domain/value-objects/Email';

describe('UserPresenter', () => {
  let userPresenter: UserPresenter;
  let mockUser: User;

  beforeEach(() => {
    userPresenter = new UserPresenter();
    mockUser = User.create({
      username: new Username('testuser'),
      email: new Email('test@example.com'),
      passwordHash: 'hashed_password',
      role: 'user',
      profile: { 
        firstName: 'Test', 
        lastName: 'User',
        displayName: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        bio: 'Test bio'
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
        notifications: { email: true, push: true, sms: false },
        privacy: { profileVisibility: 'public', showEmail: false, showPhone: false }
      },
      loginCount: 0,
      customFields: {}
    });
  });

  describe('presentUser', () => {
    it('should present user data correctly', () => {
      const result = userPresenter.presentUser(mockUser);

      expect(result).toEqual({
        id: mockUser.id,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        profile: {
          firstName: 'Test',
          lastName: 'User',
          displayName: 'Test User',
          avatarUrl: 'https://example.com/avatar.jpg',
          bio: 'Test bio'
        },
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
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });
  });

  describe('presentPublicProfile', () => {
    it('should present public profile data correctly', () => {
      const result = userPresenter.presentPublicProfile(mockUser);

      expect(result).toEqual({
        id: mockUser.id,
        username: 'testuser',
        profile: {
          firstName: 'Test',
          lastName: 'User',
          displayName: 'Test User',
          avatarUrl: 'https://example.com/avatar.jpg',
          bio: 'Test bio'
        },
        emailVerified: true,
        createdAt: expect.any(Date)
      });
    });
  });

  describe('presentUserList', () => {
    it('should present list of users correctly', () => {
      const users = [mockUser, mockUser];
      const result = userPresenter.presentUserList(users);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        id: mockUser.id,
        username: 'testuser',
        email: 'test@example.com'
      }));
    });
  });

  describe('presentSearchResults', () => {
    it('should present search results for admin correctly', () => {
      const users = [mockUser];
      const result = userPresenter.presentSearchResults(users, 'admin');

      expect(result[0]).toEqual(expect.objectContaining({
        id: mockUser.id,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        isActive: true
      }));
    });

    it('should present search results for regular user correctly', () => {
      const users = [mockUser];
      const result = userPresenter.presentSearchResults(users, 'user');

      expect(result[0]).toEqual(expect.objectContaining({
        id: mockUser.id,
        username: 'testuser',
        profile: expect.objectContaining({
          firstName: 'Test',
          lastName: 'User'
        }),
        emailVerified: true
      }));
      expect(result[0]).not.toHaveProperty('email');
      expect(result[0]).not.toHaveProperty('role');
    });
  });

  describe('presentUserActivity', () => {
    it('should present user activity data correctly', () => {
      const result = userPresenter.presentUserActivity(mockUser);

      expect(result).toEqual({
        loginHistory: {
          lastLogin: mockUser.lastLoginAt,
          loginCount: 0
        },
        accountStatus: {
          isActive: true,
          isSuspended: false,
          emailVerified: true
        },
        socialAccounts: [],
        preferences: mockUser.preferences
      });
    });
  });

  describe('presentUserWithPrivacy', () => {
    it('should present full data for admin', () => {
      const result = userPresenter.presentUserWithPrivacy(mockUser, 'otherId', 'admin');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('role');
    });

    it('should present full data for own profile', () => {
      const result = userPresenter.presentUserWithPrivacy(mockUser, mockUser.id, 'user');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('role');
    });

    it('should present limited data for private profile', () => {
      mockUser.preferences.privacy.profileVisibility = 'private';
      const result = userPresenter.presentUserWithPrivacy(mockUser, 'otherId', 'user');
      expect(result).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('role');
    });
  });
});