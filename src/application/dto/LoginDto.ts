import { z } from 'zod';

export const LoginDtoSchema = z.object({
  email: z.string()
    .email('Invalid email format'),
  
  password: z.string()
    .min(1, 'Password is required')
});

export type LoginDto = z.infer<typeof LoginDtoSchema>;

export const LinkSocialAccountDtoSchema = z.object({
  provider: z.enum(['google', 'facebook', 'github'], {
    errorMap: () => ({ message: 'Provider must be google, facebook, or github' })
  }),
  
  providerId: z.string()
    .min(1, 'Provider ID is required'),
  
  providerEmail: z.string()
    .email('Invalid provider email format'),
  
  providerData: z.record(z.unknown())
    .optional()
    .default({})
});

export type LinkSocialAccountDto = z.infer<typeof LinkSocialAccountDtoSchema>;
