// tests/unit/domain/use-cases/LinkSocialAccount.test.ts
import { LinkSocialAccount, LinkSocialAccountRequest } from '@/domain/use-cases/LinkSocialAccount';
import { User, SocialProvider } from '@/domain/entities/User';
import { UserRepository } from '@/domain/repositories/UserRepository';

describe('LinkSocialAccount', () => {
  let linkSocialAccount: LinkSocialAccount;
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
      linkSocialAccount: jest.fn(),
      // Add other required properties
    } as unknown as User;

    linkSocialAccount = new LinkSocialAccount(mockUserRepository);
  });

  describe('Success Cases', () => {
    it('should link social account to user profile', async () => {
      const request: LinkSocialAccountRequest = {
        userId: 'user-123',
        requestingUserId: 'user-123',
        requestingUserRole: 'user',
        provider: 'google' as SocialProvider,
        providerId: 'google-123',
        providerEmail: 'user@gmail.com',
        providerData: { name: 'Test User' }
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.findBySocialAccount.mockResolvedValue(null);
      mockUserRepository.update.mockResolvedValue(mockUser);

      const result = await linkSocialAccount.execute(request);

      expect(mockUser.linkSocialAccount).toHaveBeenCalledWith(
        'google',
        'google-123',
        'user@gmail.com',
        { name: 'Test User' }
      );
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser);
      expect(result).toBe(mockUser);
    });

    it('should allow admin to link social account to any user', async () => {
      const request: LinkSocialAccountRequest = {
        userId: 'user-123',
        requestingUserId: 'admin-456',
        requestingUserRole: 'admin',
        provider: 'facebook' as SocialProvider,
        providerId: 'fb-123',
        providerEmail: 'user@facebook.com'
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.findBySocialAccount.mockResolvedValue(null);
      mockUserRepository.update.mockResolvedValue(mockUser);

      const result = await linkSocialAccount.execute(request);

      expect(mockUser.linkSocialAccount).toHaveBeenCalled();
      expect(result).toBe(mockUser);
    });
  });

  describe('Error Cases', () => {
    it('should throw error if user not found', async () => {
      const request: LinkSocialAccountRequest = {
        userId: 'non-existent',
        requestingUserId: 'user-123',
        requestingUserRole: 'admin',
        provider: 'google' as SocialProvider,
        providerId: 'google-123',
        providerEmail: 'user@gmail.com'
      };

      mockUserRepository.findById.mockResolvedValue(null);

      await expect(linkSocialAccount.execute(request))
        .rejects
        .toThrow('User not found');
    });

    it('should throw error if unauthorized to link account', async () => {
      const request: LinkSocialAccountRequest = {
        userId: 'user-123',
        requestingUserId: 'other-user',
        requestingUserRole: 'user',
        provider: 'google' as SocialProvider,
        providerId: 'google-123',
        providerEmail: 'user@gmail.com'
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);

      await expect(linkSocialAccount.execute(request))
        .rejects
        .toThrow('You can only link social accounts to your own profile');
    });

    it('should throw error if social account already linked to another user', async () => {
      const request: LinkSocialAccountRequest = {
        userId: 'user-123',
        requestingUserId: 'user-123',
        requestingUserRole: 'user',
        provider: 'google' as SocialProvider,
        providerId: 'google-123',
        providerEmail: 'user@gmail.com'
      };

      const otherUser = { id: 'other-user' } as User;
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.findBySocialAccount.mockResolvedValue(otherUser);

      await expect(linkSocialAccount.execute(request))
        .rejects
        .toThrow('This google account is already linked to another user');
    });
  });
});