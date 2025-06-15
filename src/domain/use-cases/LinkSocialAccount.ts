import { User, SocialProvider } from '@/domain/entities/User';
import { UserRepository } from '@/domain/repositories/UserRepository';

export interface LinkSocialAccountRequest {
  userId: string;
  requestingUserId: string;
  requestingUserRole: string;
  provider: SocialProvider;
  providerId: string;
  providerEmail: string;
  providerData?: Record<string, unknown>;
}

export class LinkSocialAccount {
  constructor(private userRepository: UserRepository) {}

  public async execute(request: LinkSocialAccountRequest): Promise<User> {
    const { 
      userId, 
      requestingUserId, 
      requestingUserRole, 
      provider, 
      providerId, 
      providerEmail, 
      providerData = {} 
    } = request;

    // Check authorization
    const canModify = requestingUserRole === 'admin' || requestingUserId === userId;
    if (!canModify) {
      throw new Error('You can only link social accounts to your own profile');
    }

    // Find the target user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if this social account is already linked to another user
    const existingUser = await this.userRepository.findBySocialAccount(provider, providerId);
    if (existingUser && existingUser.id !== userId) {
      throw new Error(`This ${provider} account is already linked to another user`);
    }

    // Link the social account
    user.linkSocialAccount(provider, providerId, providerEmail, providerData);

    // Save changes
    const updatedUser = await this.userRepository.update(user);
    return updatedUser;
  }
}
