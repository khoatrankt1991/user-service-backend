import { z } from 'zod';
import { User } from '@/domain/entities/User';

export const UserResponseDtoSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  role: z.enum(['user', 'admin']),
  profile: z.object({
    firstName: z.string(),
    lastName: z.string(),
    displayName: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    avatarUrl: z.string().url().optional(),
    phone: z.string().optional(),
    dateOfBirth: z.date().optional(),
    bio: z.string().optional()
  }),
  emailVerified: z.boolean(),
  isActive: z.boolean(),
  isSuspended: z.boolean(),
  preferences: z.object({
    language: z.string(),
    timezone: z.string(),
    notifications: z.object({
      email: z.boolean(),
      push: z.boolean(),
      sms: z.boolean()
    }),
    privacy: z.object({
      profileVisibility: z.enum(['public', 'friends', 'private']),
      showEmail: z.boolean(),
      showPhone: z.boolean()
    })
  }),
  loginCount: z.number(),
  lastLoginAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type UserResponseDto = z.infer<typeof UserResponseDtoSchema>;

export const UserListResponseDtoSchema = z.object({
  users: z.array(UserResponseDtoSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    pages: z.number()
  })
});

export type UserListResponseDto = z.infer<typeof UserListResponseDtoSchema>;

// Helper function to convert User entity to DTO
export function toUserResponseDto(user: User): UserResponseDto {
  return {
    id: user.id!,
    username: user.username.getValue(),
    email: user.email.getValue(),
    role: user.role,
    profile: user.profile,
    emailVerified: user.emailVerified,
    isActive: user.isActive,
    isSuspended: user.isSuspended,
    preferences: user.preferences,
    loginCount: user.loginCount,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

// Helper function for public profile (limited data)
export function toPublicUserResponseDto(user: User): Partial<UserResponseDto> {
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
