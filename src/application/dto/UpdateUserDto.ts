import { z } from 'zod';

export const UpdateUserDtoSchema = z.object({
  profile: z.object({
    firstName: z.string()
      .min(1, 'First name is required')
      .max(100, 'First name must be less than 100 characters')
      .trim()
      .optional(),
    
    lastName: z.string()
      .min(1, 'Last name is required')
      .max(100, 'Last name must be less than 100 characters')
      .trim()
      .optional(),
    
    displayName: z.string()
      .max(100, 'Display name must be less than 100 characters')
      .trim()
      .optional(),
    
    gender: z.enum(['male', 'female', 'other']).optional(),
    
    avatarUrl: z.string()
      .url('Avatar URL must be a valid URL')
      .optional(),
    
    phone: z.string()
      .max(20, 'Phone number must be less than 20 characters')
      .optional(),
    
    dateOfBirth: z.string()
      .datetime({ message: 'Invalid date format' })
      .transform(str => new Date(str))
      .optional(),
    
    bio: z.string()
      .max(500, 'Bio must be less than 500 characters')
      .optional()
  }).optional(),
  
  preferences: z.object({
    language: z.string()
      .length(2, 'Language must be 2 characters')
      .optional(),
    
    timezone: z.string().optional(),
    
    notifications: z.object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      sms: z.boolean().optional()
    }).optional(),
    
    privacy: z.object({
      profileVisibility: z.enum(['public', 'friends', 'private']).optional(),
      showEmail: z.boolean().optional(),
      showPhone: z.boolean().optional()
    }).optional()
  }).optional()
});

export type UpdateUserDto = z.infer<typeof UpdateUserDtoSchema>;
