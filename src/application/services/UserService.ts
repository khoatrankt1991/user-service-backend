import { User } from '@/domain/entities/User';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { CreateUser } from '@/domain/use-cases/CreateUser';
import { GetUser } from '@/domain/use-cases/GetUser';
import { UpdateUser } from '@/domain/use-cases/UpdateUser';
import { DeleteUser } from '@/domain/use-cases/DeleteUser';
import { ListUsers } from '@/domain/use-cases/ListUsers';
import { LoginUser } from '@/domain/use-cases/LoginUser';
import { SearchUsers } from '@/domain/use-cases/SearchUsers';
import { LinkSocialAccount } from '@/domain/use-cases/LinkSocialAccount';
import { CreateUserDto } from '@/application/dto/CreateUserDto';
import { UpdateUserDto } from '@/application/dto/UpdateUserDto';
import { LoginDto, LinkSocialAccountDto } from '@/application/dto/LoginDto';
import { UserFilterQueryDto, SearchQueryDto } from '@/application/dto/QueryDto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult {
  user: User;
  tokens: AuthTokens;
}

export interface IAuthService {
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
  generateAccessToken(payload: Record<string, unknown>): string;
  generateRefreshToken(payload: Record<string, unknown>): string;
  verifyToken(token: string): Record<string, unknown>;
}

export class UserService {
  private createUserUseCase: CreateUser;
  private getUserUseCase: GetUser;
  private updateUserUseCase: UpdateUser;
  private deleteUserUseCase: DeleteUser;
  private listUsersUseCase: ListUsers;
  private loginUserUseCase: LoginUser;
  private searchUsersUseCase: SearchUsers;
  private linkSocialAccountUseCase: LinkSocialAccount;

  constructor(
    private userRepository: UserRepository,
    private authService: IAuthService
  ) {
    // Initialize use cases with dependencies
    this.createUserUseCase = new CreateUser(
      userRepository,
      this.authService.hashPassword.bind(this.authService)
    );
    
    this.getUserUseCase = new GetUser(userRepository);
    this.updateUserUseCase = new UpdateUser(userRepository);
    this.deleteUserUseCase = new DeleteUser(userRepository);
    this.listUsersUseCase = new ListUsers(userRepository);
    this.searchUsersUseCase = new SearchUsers(userRepository);
    this.linkSocialAccountUseCase = new LinkSocialAccount(userRepository);
    
    this.loginUserUseCase = new LoginUser(
      userRepository,
      this.authService.comparePassword.bind(this.authService),
      (payload: Record<string, unknown>) => ({
        accessToken: this.authService.generateAccessToken(payload),
        refreshToken: this.authService.generateRefreshToken(payload)
      })
    );
  }

  public async createUser(dto: CreateUserDto): Promise<{ user: User; requiresEmailVerification: boolean }> {
    return await this.createUserUseCase.execute({
      username: dto.username,
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      gender: dto.gender,
      phone: dto.phone,
      dateOfBirth: dto.dateOfBirth,
      bio: dto.bio
    });
  }

  public async loginUser(dto: LoginDto): Promise<LoginResult> {
    return await this.loginUserUseCase.execute({
      email: dto.email,
      password: dto.password
    });
  }

  public async getUserById(
    userId: string, 
    requestingUserId: string, 
    requestingUserRole: string
  ): Promise<User> {
    return await this.getUserUseCase.execute({
      userId,
      requestingUserId,
      requestingUserRole
    });
  }

  public async updateUser(
    userId: string,
    dto: UpdateUserDto,
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<User> {
    return await this.updateUserUseCase.execute({
      userId,
      requestingUserId,
      requestingUserRole,
      profile: dto.profile,
      preferences: dto.preferences
    });
  }

  public async deleteUser(
    userId: string,
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<{ message: string; deletedAt: Date }> {
    return await this.deleteUserUseCase.execute({
      userId,
      requestingUserId,
      requestingUserRole
    });
  }

  public async listUsers(
    requestingUserRole: string,
    queryDto: UserFilterQueryDto
  ): Promise<ReturnType<typeof this.listUsersUseCase.execute>> {
    const filters = {
      role: queryDto.role,
      isActive: queryDto.isActive,
      emailVerified: queryDto.emailVerified,
      isSuspended: queryDto.isSuspended,
      createdAfter: queryDto.createdAfter,
      createdBefore: queryDto.createdBefore
    };

    const options = {
      page: queryDto.page,
      limit: queryDto.limit,
      sortBy: queryDto.sortBy,
      sortOrder: queryDto.sortOrder
    };

    return await this.listUsersUseCase.execute({
      requestingUserRole,
      filters,
      options
    });
  }

  public async searchUsers(
    requestingUserRole: string,
    queryDto: SearchQueryDto
  ): Promise<User[]> {
    return await this.searchUsersUseCase.execute({
      query: queryDto.q,
      requestingUserRole,
      options: {
        limit: queryDto.limit,
        skip: queryDto.skip,
        includeInactive: queryDto.includeInactive
      }
    });
  }

  public async linkSocialAccount(
    userId: string,
    dto: LinkSocialAccountDto,
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<User> {
    return await this.linkSocialAccountUseCase.execute({
      userId,
      requestingUserId,
      requestingUserRole,
      provider: dto.provider,
      providerId: dto.providerId,
      providerEmail: dto.providerEmail,
      providerData: dto.providerData
    });
  }

  public async verifyToken(token: string): Promise<{
    userId: string;
    email: string;
    role: string;
  }> {
    try {
      const payload = this.authService.verifyToken(token);
      return {
        userId: payload.userId as string,
        email: payload.email as string,
        role: payload.role as string
      };
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}
