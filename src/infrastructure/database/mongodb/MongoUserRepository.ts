import { User } from '@/domain/entities/User';
import { Email } from '@/domain/value-objects/Email';
import { Username } from '@/domain/value-objects/Username';
import { UserRepository, UserFilters, PaginationOptions, PaginationResult, SearchOptions } from '@/domain/repositories/UserRepository';
import { UserModel, UserDocument } from './UserSchema';

export class MongoUserRepository implements UserRepository {
  public async create(user: User): Promise<User> {
    try {
      const userProps = user.toPlainObject();
      const userDoc = new UserModel({
        ...userProps,
        username: userProps.username.getValue(),
        email: userProps.email.getValue()
      });
      
      const savedUser = await userDoc.save();
      return this.toDomainEntity(savedUser);
    } catch (error: any) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new Error(`${field} already exists`);
      }
      throw error;
    }
  }

  public async findById(id: string): Promise<User | null> {
    try {
      const userDoc = await UserModel.findById(id).select('+passwordHash');
      return userDoc ? this.toDomainEntity(userDoc) : null;
    } catch (error) {
      throw new Error(`Error finding user by ID: ${error}`);
    }
  }

  public async findByEmail(email: Email): Promise<User | null> {
    try {
      const userDoc = await UserModel.findOne({ email: email.getValue() }).select('+passwordHash');
      return userDoc ? this.toDomainEntity(userDoc) : null;
    } catch (error) {
      throw new Error(`Error finding user by email: ${error}`);
    }
  }

  public async findByUsername(username: Username): Promise<User | null> {
    try {
      const userDoc = await UserModel.findOne({ username: username.getValue() }).select('+passwordHash');
      return userDoc ? this.toDomainEntity(userDoc) : null;
    } catch (error) {
      throw new Error(`Error finding user by username: ${error}`);
    }
  }

  public async findBySocialAccount(provider: string, providerId: string): Promise<User | null> {
    try {
      const userDoc = await UserModel.findOne({
        'socialAccounts.provider': provider,
        'socialAccounts.providerId': providerId,
        'socialAccounts.isActive': true
      }).select('+passwordHash');
      
      return userDoc ? this.toDomainEntity(userDoc) : null;
    } catch (error) {
      throw new Error(`Error finding user by social account: ${error}`);
    }
  }

  public async update(user: User): Promise<User> {
    try {
      const userProps = user.toPlainObject();
      const userDoc = await UserModel.findByIdAndUpdate(
        user.id,
        {
          ...userProps,
          username: userProps.username.getValue(),
          email: userProps.email.getValue(),
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).select('+passwordHash');

      if (!userDoc) {
        throw new Error('User not found');
      }

      return this.toDomainEntity(userDoc);
    } catch (error: any) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new Error(`${field} already exists`);
      }
      throw new Error(`Error updating user: ${error}`);
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      const result = await UserModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Error deleting user: ${error}`);
    }
  }

  public async findAll(filters: UserFilters = {}, options: PaginationOptions = { page: 1, limit: 20 }): Promise<PaginationResult<User>> {
    try {
      const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      const skip = (page - 1) * limit;
      
      const query = this.buildQuery(filters);
      const sort = options.sortBy ? { [options.sortBy]: options.sortOrder === 'desc' ? -1 : 1 } as const : undefined;

      const [users, total] = await Promise.all([
        UserModel.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit),
        UserModel.countDocuments(query)
      ]);

      return {
        data: users.map(user => this.toDomainEntity(user)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Error finding users: ${error}`);
    }
  }

  public async search(query: string, options: SearchOptions = { page: 1, limit: 20 }): Promise<User[]> {
    try {
      const { limit = 20, skip = 0, includeInactive = false } = options;
      
      const searchCriteria: any = {
        $text: { $search: query }
      };

      if (!includeInactive) {
        searchCriteria.isActive = true;
      }

      const users = await UserModel.find(searchCriteria)
        .select('username profile.firstName profile.lastName profile.avatarUrl emailVerified role')
        .limit(limit)
        .skip(skip)
        .sort({ score: { $meta: 'textScore' } });

      return users.map(user => this.toDomainEntity(user));
    } catch (error) {
      throw new Error(`Error searching users: ${error}`);
    }
  }

  public async exists(email: Email, username: Username): Promise<{ exists: boolean; conflicts?: { email: boolean; username: boolean } }> {
    try {
      const existingUser = await UserModel.findOne({
        $or: [
          { email: email.getValue() },
          { username: username.getValue() }
        ]
      }).select('email username');

      if (!existingUser) {
        return { exists: false };
      }

      return {
        exists: true,
        conflicts: {
          email: existingUser.email === email.getValue(),
          username: existingUser.username === username.getValue()
        }
      };
    } catch (error) {
      throw new Error(`Error checking user existence: ${error}`);
    }
  }

  private toDomainEntity(userDoc: UserDocument): User {
    const userProps = {
      id: userDoc._id,
      username: new Username(userDoc.username),
      email: new Email(userDoc.email),
      passwordHash: userDoc.passwordHash,
      role: userDoc.role,
      profile: userDoc.profile,
      addresses: userDoc.addresses,
      socialAccounts: userDoc.socialAccounts,
      emailVerified: userDoc.emailVerified,
      phoneVerified: userDoc.phoneVerified,
      isActive: userDoc.isActive,
      isSuspended: userDoc.isSuspended,
      suspendedReason: userDoc.suspendedReason,
      suspendedAt: userDoc.suspendedAt,
      preferences: userDoc.preferences,
      lastLoginAt: userDoc.lastLoginAt,
      lastActiveAt: userDoc.lastActiveAt,
      loginCount: userDoc.loginCount,
      customFields: userDoc.customFields,
      createdAt: userDoc.createdAt,
      updatedAt: userDoc.updatedAt,
      createdBy: userDoc.createdBy,
      updatedBy: userDoc.updatedBy
    };

    return User.reconstitute(userProps);
  }

  private buildQuery(filters: UserFilters): any {
    const query: any = {};

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters.emailVerified !== undefined) {
      query.emailVerified = filters.emailVerified;
    }

    if (filters.role) {
      query.role = filters.role;
    }

    if (filters.isSuspended !== undefined) {
      query.isSuspended = filters.isSuspended;
    }

    if (filters.createdAfter) {
      query.createdAt = { ...query.createdAt, $gte: filters.createdAfter };
    }

    if (filters.createdBefore) {
      query.createdAt = { ...query.createdAt, $lte: filters.createdBefore };
    }

    return query;
  }
}
