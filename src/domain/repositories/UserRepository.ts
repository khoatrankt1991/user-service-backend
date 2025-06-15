import { User } from '@/domain/entities/User';
import { Email } from '@/domain/value-objects/Email';
import { Username } from '@/domain/value-objects/Username';

export interface UserFilters {
  isActive?: boolean;
  emailVerified?: boolean;
  role?: string;
  isSuspended?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SearchOptions extends PaginationOptions {
  includeInactive?: boolean;
}

export interface UserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findByUsername(username: Username): Promise<User | null>;
  findBySocialAccount(provider: string, providerId: string): Promise<User | null>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<boolean>;
  findAll(filters?: UserFilters, options?: PaginationOptions): Promise<PaginationResult<User>>;
  search(query: string, options?: SearchOptions): Promise<User[]>;
  exists(email: Email, username: Username): Promise<{ 
    exists: boolean; 
    conflicts?: { email: boolean; username: boolean } 
  }>;
}
