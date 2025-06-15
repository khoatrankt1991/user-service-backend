import { User } from '@/domain/entities/User';
import { UserRepository } from '@/domain/repositories/UserRepository';

export interface GetUserRequest {
  userId: string;
  requestingUserId: string;
  requestingUserRole: string;
}

export class GetUser {
  constructor(private userRepository: UserRepository) {}

  public async execute(request: GetUserRequest): Promise<User> {
    const { userId, requestingUserId, requestingUserRole } = request;

    // Find the target user
    const targetUser = await this.userRepository.findById(userId);
    if (!targetUser) {
      throw new Error('User not found');
    }

    // Check permissions
    const canAccessFullProfile = 
      requestingUserRole === 'admin' || 
      requestingUserId === userId;

    if (!canAccessFullProfile) {
      // Check privacy settings for non-admin, non-self access
      if (targetUser.preferences.privacy.profileVisibility === 'private') {
        throw new Error('This profile is private');
      }
    }

    return targetUser;
  }
}
