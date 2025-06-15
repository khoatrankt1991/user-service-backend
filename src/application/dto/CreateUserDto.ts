import { z } from 'zod';

export const CreateUserDtoSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  
  email: z.string()
    .email('Invalid email format'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters long'),
  
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters')
    .trim(),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters')
    .trim(),
  
  role: z.enum(['user', 'admin']).optional().default('user'),
  
  gender: z.enum(['male', 'female', 'other']).optional(),
  
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
});

export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>;
