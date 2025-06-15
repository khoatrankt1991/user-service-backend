import { User, UserProfile, UserRole } from '@/domain/entities/User';
import { Email } from '@/domain/value-objects/Email';
import { Username } from '@/domain/value-objects/Username';
import { Password } from '@/domain/value-objects/Password';
import { UserRepository } from '@/domain/repositories/UserRepository';

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  dateOfBirth?: Date;
  bio?: string;
}

export interface CreateUserResponse {
  user: User;
  requiresEmailVerification: boolean;
}

export class CreateUser {
  constructor(
    private userRepository: UserRepository,
    private hashPassword: (password: string) => Promise<string>
  ) {}

  public async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
    // Create value objects (this will validate automatically)
    const email = new Email(request.email);
    const username = new Username(request.username);
    const password = new Password(request.password);

    // Check if user already exists
    const existingUser = await this.userRepository.exists(email, username);
    if (existingUser.exists) {
      const conflicts: string[] = [];
      if (existingUser.conflicts?.email) conflicts.push('Email already registered');
      if (existingUser.conflicts?.username) conflicts.push('Username already taken');
      throw new Error(conflicts.join(', '));
    }

    // Hash password
    const passwordHash = await this.hashPassword(password.getValue());

    // Create user profile
    const profile: UserProfile = {
      firstName: request.firstName,
      lastName: request.lastName,
      ...(request.gender && { gender: request.gender }),
      ...(request.phone && { phone: request.phone }),
      ...(request.dateOfBirth && { dateOfBirth: request.dateOfBirth }),
      ...(request.bio && { bio: request.bio })
    };

    // Create user entity
    const user = User.create({
      username,
      email,
      passwordHash,
      role: request.role || 'user',
      profile,
      addresses: [],
      socialAccounts: [],
      emailVerified: false,
      phoneVerified: false,
      isActive: true,
      isSuspended: false,
      preferences: {
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false
        }
      },
      loginCount: 0,
      customFields: {}
    });

    // Save user
    const savedUser = await this.userRepository.create(user);

    return {
      user: savedUser,
      requiresEmailVerification: true
    };
  }
}
