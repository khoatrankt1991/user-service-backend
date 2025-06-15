import { User } from '@/domain/entities/User';
import { UserRepository, SearchOptions } from '@/domain/repositories/UserRepository';

export interface SearchUsersRequest {
  query: string;
  requestingUserRole: string;
  options?: {
    limit?: number;
    skip?: number;
    includeInactive?: boolean;
  };
}

export class SearchUsers {
  constructor(private userRepository: UserRepository) {}

  public async execute(request: SearchUsersRequest): Promise<User[]> {
    const { query, requestingUserRole, options } = request;

    // Validate input
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters long');
    }

    // Set search options
    const searchOptions: SearchOptions = {
      page: 1,
      limit: Math.min(options?.limit || 20, 50), // Max 50 results
      skip: options?.skip || 0,
      includeInactive: requestingUserRole === 'admin' && options?.includeInactive
    };

    // Perform search
    const users = await this.userRepository.search(query.trim(), searchOptions);
    return users;
  }
}
