import { User } from '@/domain/entities/User';
import { Email } from '@/domain/value-objects/Email';
import { UserRepository } from '@/domain/repositories/UserRepository';

export interface LoginUserRequest {
  email: string;
  password: string;
}

export interface LoginUserResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export class LoginUser {
  constructor(
    private userRepository: UserRepository,
    private comparePassword: (password: string, hash: string) => Promise<boolean>,
    private generateTokens: (payload: Record<string, unknown>) => { accessToken: string; refreshToken: string }
  ) {}

  public async execute(request: LoginUserRequest): Promise<LoginUserResponse> {
    const { email, password } = request;

    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Find user by email
    const emailVO = new Email(email);
    const user = await this.userRepository.findByEmail(emailVO);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user can login
    if (!user.canLogin()) {
      const reasons: string[] = [];
      if (!user.isActive) reasons.push('account is inactive');
      if (user.isSuspended) reasons.push('account is suspended');
      if (!user.emailVerified) reasons.push('email is not verified');
      
      throw new Error(`Cannot login: ${reasons.join(', ')}`);
    }

    // Verify password
    if (!user.passwordHash) {
      throw new Error('Password not set for this account');
    }

    const isPasswordValid = await this.comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    user.recordLogin();
    await this.userRepository.update(user);

    // Generate tokens
    const payload = {
      userId: user.id,
      email: user.email.getValue(),
      role: user.role
    };

    const tokens = this.generateTokens(payload);

    return {
      user,
      tokens
    };
  }
}
