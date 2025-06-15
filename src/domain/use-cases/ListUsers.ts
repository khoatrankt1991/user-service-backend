import { User } from '@/domain/entities/User';
import { UserRepository, UserFilters, PaginationOptions, PaginationResult } from '@/domain/repositories/UserRepository';

export interface ListUsersRequest {
  requestingUserRole: string;
  filters?: UserFilters;
  options?: PaginationOptions;
}

export class ListUsers {
  constructor(private userRepository: UserRepository) {}

  public async execute(request: ListUsersRequest): Promise<PaginationResult<User>> {
    const { requestingUserRole, filters, options } = request;

    // Authorization check - only admins can list all users
    if (requestingUserRole !== 'admin') {
      throw new Error('Only administrators can view all users');
    }

    // Set default options
    const queryOptions: PaginationOptions = {
      page: options?.page || 1,
      limit: Math.min(options?.limit || 20, 100), // Max 100 users per page
      sortBy: options?.sortBy || 'createdAt',
      sortOrder: options?.sortOrder || 'desc'
    };

    // Get users with pagination
    const result = await this.userRepository.findAll(filters, queryOptions);
    return result;
  }
}
