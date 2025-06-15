import { UserRepository } from '@/domain/repositories/UserRepository';

export interface DeleteUserRequest {
  userId: string;
  requestingUserId: string;
  requestingUserRole: string;
}

export interface DeleteUserResponse {
  message: string;
  deletedAt: Date;
}

export class DeleteUser {
  constructor(private userRepository: UserRepository) {}

  public async execute(request: DeleteUserRequest): Promise<DeleteUserResponse> {
    const { userId, requestingUserId, requestingUserRole } = request;

    // Find the user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check permissions
    const canDelete = 
      requestingUserRole === 'admin' || 
      requestingUserId === userId;

    if (!canDelete) {
      throw new Error('You can only delete your own account or you must be an admin');
    }

    // Prevent admin from deleting themselves (business rule)
    if (requestingUserId === userId && requestingUserRole === 'admin') {
      throw new Error('Administrators cannot delete their own account');
    }

    // Soft delete by deactivating the user
    user.deactivate();
    user.suspend('Account deleted by user');
    
    await this.userRepository.update(user);

    return {
      message: 'User account has been successfully deleted',
      deletedAt: new Date()
    };
  }
}
