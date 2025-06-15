#!/bin/bash
import { User } from '@/domain/entities/User';
import { UserResponseDto, toUserResponseDto, toPublicUserResponseDto } from '@/application/dto/UserResponseDto';

export interface PublicUserData {
  id: string;
  username: string;
  profile: {
    firstName: string;
    lastName: string;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
  };
  emailVerified: boolean;
  createdAt: Date;
}

export interface AdminUserData extends UserResponseDto {
  // Admin gets full data
}

export interface SearchResultData {
  id: string;
  username: string;
  profile: {
    firstName: string;
    lastName: string;
    displayName?: string;
    avatarUrl?: string;
  };
  emailVerified: boolean;
  email?: string; // Only for admins
  role?: string; // Only for admins
  isActive?: boolean; // Only for admins
  createdAt: Date;
}

export class UserPresenter {
  /**
   * Present user data for API responses
   * Removes sensitive information like password hash
   */
  public presentUser(user: User): UserResponseDto {
    return toUserResponseDto(user);
  }

  /**
   * Present user list for admin endpoints
   */
  public presentUserList(users: User[]): UserResponseDto[] {
    return users.map(user => this.presentUser(user));
  }

  /**
   * Present public user profile (limited information)
   * Used when non-admin users view other users' profiles
   */
  public presentPublicProfile(user: User): PublicUserData {
    return {
      id: user.id!,
      username: user.username.getValue(),
      profile: {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        displayName: user.profile.displayName,
        avatarUrl: user.profile.avatarUrl,
        bio: user.profile.bio
      },
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    };
  }

  /**
   * Present search results with role-appropriate data
   */
  public presentSearchResults(users: User[], requestingUserRole: string): SearchResultData[] {
    return users.map(user => {
      const baseData: SearchResultData = {
        id: user.id!,
        username: user.username.getValue(),
        profile: {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          displayName: user.profile.displayName,
          avatarUrl: user.profile.avatarUrl
        },
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      };

      // Add additional fields for admins
      if (requestingUserRole === 'admin') {
        baseData.email = user.email.getValue();
        baseData.role = user.role;
        baseData.isActive = user.isActive;
      }

      return baseData;
    });
  }

  /**
   * Present user statistics for admin dashboard
   */
  public presentUserStats(stats: {
    totalUsers: number;
    activeUsers: number;
    verifiedUsers: number;
    adminUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
  }): Record<string, unknown> {
    return {
      overview: {
        total: stats.totalUsers,
        active: stats.activeUsers,
        verified: stats.verifiedUsers,
        admins: stats.adminUsers
      },
      growth: {
        today: stats.newUsersToday,
        thisWeek: stats.newUsersThisWeek,
        thisMonth: stats.newUsersThisMonth
      },
      ratios: {
        activeRatio: stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers * 100).toFixed(1) : 0,
        verifiedRatio: stats.totalUsers > 0 ? (stats.verifiedUsers / stats.totalUsers * 100).toFixed(1) : 0
      }
    };
  }

  /**
   * Present user activity data
   */
  public presentUserActivity(user: User): Record<string, unknown> {
    return {
      loginHistory: {
        lastLogin: user.lastLoginAt,
        loginCount: user.loginCount
      },
      accountStatus: {
        isActive: user.isActive,
        isSuspended: user.isSuspended,
        emailVerified: user.emailVerified,
        // phoneVerified: user.phoneVerified
      },
      socialAccounts: user.socialAccounts.map(account => ({
        provider: account.provider,
        linkedAt: account.linkedAt,
        isActive: account.isActive
      })),
      preferences: user.preferences
    };
  }

  /**
   * Present minimal user info for listings and autocomplete
   */
  public presentMinimalUser(user: User): {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    isActive: boolean;
  } {
    return {
      id: user.id!,
      username: user.username.getValue(),
      displayName: user.profile.displayName || user.getFullName(),
      avatarUrl: user.profile.avatarUrl,
      isActive: user.isActive
    };
  }

  /**
   * Present authentication response
   */
  public presentAuthResponse(user: User, tokens: { accessToken: string; refreshToken: string }): {
    user: UserResponseDto;
    tokens: { accessToken: string; refreshToken: string };
    expiresIn: string;
  } {
    return {
      user: this.presentUser(user),
      tokens,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    };
  }

  /**
   * Present error details for development
   */
  public presentValidationErrors(errors: Array<{ field: string; message: string }>): {
    count: number;
    fields: string[];
    details: Array<{ field: string; message: string }>;
  } {
    return {
      count: errors.length,
      fields: errors.map(err => err.field),
      details: errors
    };
  }

  /**
   * Present pagination metadata
   */
  public presentPaginationMeta(pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  }): Record<string, unknown> {
    return {
      pagination: {
        current: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        pages: pagination.pages,
        hasNext: pagination.page < pagination.pages,
        hasPrev: pagination.page > 1
      }
    };
  }

  /**
   * Present user with privacy filters based on requesting user
   */
  public presentUserWithPrivacy(user: User, requestingUserId?: string, requestingUserRole?: string): UserResponseDto | PublicUserData {
    // Admin can see everything
    if (requestingUserRole === 'admin') {
      return this.presentUser(user);
    }

    // User can see their own full profile
    if (requestingUserId === user.id) {
      return this.presentUser(user);
    }

    // Check privacy settings for other users
    if (user.preferences.privacy.profileVisibility === 'private') {
      // Very limited info for private profiles
      return {
        id: user.id!,
        username: user.username.getValue(),
        profile: {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          displayName: user.profile.displayName
        },
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      } as PublicUserData;
    }

    // Public profile view
    return this.presentPublicProfile(user);
  }

  /**
   * Present user addresses with privacy considerations
   */
  public presentUserAddresses(user: User, requestingUserId?: string, requestingUserRole?: string) {
    // Only the user themselves or admin can see addresses
    if (requestingUserRole === 'admin' || requestingUserId === user.id) {
      return user.addresses.map(address => ({
        id: address.id,
        type: address.type,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        stateProvince: address.stateProvince,
        postalCode: address.postalCode,
        country: address.country,
        isDefault: address.isDefault,
        createdAt: address.createdAt,
        updatedAt: address.updatedAt
      }));
    }

    return []; // No addresses for unauthorized users
  }

  /**
   * Present social accounts with privacy considerations
   */
  public presentSocialAccounts(user: User, requestingUserId?: string, requestingUserRole?: string) {
    // Only the user themselves or admin can see social accounts
    if (requestingUserRole === 'admin' || requestingUserId === user.id) {
      return user.socialAccounts.map(account => ({
        id: account.id,
        provider: account.provider,
        providerEmail: account.providerEmail,
        linkedAt: account.linkedAt,
        isActive: account.isActive
      }));
    }

    // Public view shows only linked providers (not details)
    return user.socialAccounts
      .filter(account => account.isActive)
      .map(account => ({
        provider: account.provider,
        linkedAt: account.linkedAt
      }));
  }
}