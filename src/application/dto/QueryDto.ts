import { z } from 'zod';

export const PaginationQueryDtoSchema = z.object({
  page: z.string()
    .transform(val => parseInt(val))
    .refine(val => val >= 1, 'Page must be greater than 0')
    .default('1'),
  
  limit: z.string()
    .transform(val => parseInt(val))
    .refine(val => val >= 1 && val <= 100, 'Limit must be between 1 and 100')
    .default('20'),
  
  sortBy: z.enum(['createdAt', 'updatedAt', 'username', 'email', 'lastLoginAt'])
    .optional()
    .default('createdAt'),
  
  sortOrder: z.enum(['asc', 'desc'])
    .optional()
    .default('desc')
});

export type PaginationQueryDto = z.infer<typeof PaginationQueryDtoSchema>;

export const UserFilterQueryDtoSchema = PaginationQueryDtoSchema.extend({
  role: z.enum(['user', 'admin']).optional(),
  isActive: z.string()
    .transform(val => val === 'true')
    .optional(),
  emailVerified: z.string()
    .transform(val => val === 'true')
    .optional(),
  isSuspended: z.string()
    .transform(val => val === 'true')
    .optional(),
  createdAfter: z.string()
    .datetime({ message: 'Invalid date format' })
    .transform(str => new Date(str))
    .optional(),
  createdBefore: z.string()
    .datetime({ message: 'Invalid date format' })
    .transform(str => new Date(str))
    .optional()
});

export type UserFilterQueryDto = z.infer<typeof UserFilterQueryDtoSchema>;

export const SearchQueryDtoSchema = z.object({
  q: z.string()
    .min(2, 'Search query must be at least 2 characters long')
    .max(100, 'Search query must be less than 100 characters'),
  
  limit: z.string()
    .transform(val => parseInt(val))
    .refine(val => val >= 1 && val <= 50, 'Limit must be between 1 and 50')
    .default('20'),
  
  skip: z.string()
    .transform(val => parseInt(val))
    .refine(val => val >= 0, 'Skip must be 0 or greater')
    .default('0'),
  
  includeInactive: z.string()
    .transform(val => val === 'true')
    .optional()
    .default('false')
});

export type SearchQueryDto = z.infer<typeof SearchQueryDtoSchema>;

export const UserParamsSchema = z.object({
  userId: z.string()
    .min(1, 'User ID is required')
    .regex(/^[a-f\d-]{36}$/i, 'Invalid user ID format')
});

export type UserParamsDto = z.infer<typeof UserParamsSchema>;
