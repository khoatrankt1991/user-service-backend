import { User, UserProfile, UserPreferences } from '@/domain/entities/User';
import { UserRepository } from '@/domain/repositories/UserRepository';

export interface UpdateUserRequest {
  userId: string;
  requestingUserId: string;
  requestingUserRole: string;
  profile?: Partial<UserProfile>;
  preferences?: Partial<UserPreferences>;
}

export class UpdateUser {
  constructor(private userRepository: UserRepository) {}

  public async execute(request: UpdateUserRequest): Promise<User> {
    const { userId, requestingUserId, requestingUserRole, profile, preferences } = request;

    // Find the user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check permissions
    const canModify = 
      requestingUserRole === 'admin' || 
      requestingUserId === userId;

    if (!canModify) {
      throw new Error('You can only update your own profile or you must be an admin');
    }

    // Update profile if provided
    if (profile) {
      user.updateProfile(profile);
    }

    // Update preferences if provided
    if (preferences) {
      user.updatePreferences(preferences);
    }

    // Save changes
    const updatedUser = await this.userRepository.update(user);
    return updatedUser;
  }
}
