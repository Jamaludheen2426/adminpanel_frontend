import * as z from 'zod';

// User validation schemas
export const createUserSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updateUserSchema = createUserSchema.partial();

// Role validation schemas
export const createRoleSchema = z.object({
  name: z.string().min(2, 'Role name required'),
  description: z.string().optional(),
});

export const updateRoleSchema = createRoleSchema.partial();

// Permission validation schemas
export const createPermissionSchema = z.object({
  name: z.string().min(2, 'Permission name required'),
  description: z.string().optional(),
});

export const updatePermissionSchema = createPermissionSchema.partial();

// Location validation schemas
export const createCountrySchema = z.object({
  name: z.string().min(2, 'Country name required'),
  code: z.string().length(2, 'Country code must be 2 characters'),
  nationality: z.string().optional(),
  sort_order: z.number().default(0),
  is_default: z.boolean().default(false),
});

export const createStateSchema = z.object({
  name: z.string().min(2, 'State name required'),
  code: z.string().optional(),
  slug: z.string().optional(),
  countryId: z.number(),
  sort_order: z.number().default(0),
  is_default: z.boolean().default(false),
});

export const createCitySchema = z.object({
  name: z.string().min(2, 'City name required'),
  stateId: z.number(),
  countryId: z.number().optional(),
  slug: z.string().optional(),
  pincode: z.string().optional(),
  sort_order: z.number().default(0),
  is_default: z.boolean().default(false),
});

export const createPincodeSchema = z.object({
  code: z.string().min(4, 'Pincode must be at least 4 characters'),
  cityId: z.string().uuid('Invalid city'),
});

// Language validation schemas
export const createLanguageSchema = z.object({
  name: z.string().min(2, 'Language name required'),
  code: z.string().length(2, 'Language code must be 2 characters'),
});

// Currency validation schemas
export const createCurrencySchema = z.object({
  name: z.string().min(2, 'Currency name required'),
  code: z.string().length(3, 'Currency code must be 3 characters'),
  symbol: z.string().min(1, 'Symbol required'),
});

// Email template validation schemas
export const createEmailTemplateSchema = z.object({
  name: z.string().min(2, 'Template name required'),
  subject: z.string().min(5, 'Subject required'),
  body: z.string().min(10, 'Body required'),
  category: z.enum(['welcome', 'password-reset', 'verification', 'notification']),
});

// Setting validation schemas
export const updateSettingSchema = z.object({
  key: z.string(),
  value: z.string(),
});

// Auth validation schemas
export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Invalid credentials'),
});

export const signUpSchema = z
  .object({
    fullName: z.string().min(2, 'Full name required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Type exports
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type CreateCountryInput = z.infer<typeof createCountrySchema>;
export type CreateStateInput = z.infer<typeof createStateSchema>;
export type CreateCityInput = z.infer<typeof createCitySchema>;
export type CreatePincodeInput = z.infer<typeof createPincodeSchema>;
export type CreateLanguageInput = z.infer<typeof createLanguageSchema>;
export type CreateCurrencyInput = z.infer<typeof createCurrencySchema>;
export type CreateEmailTemplateInput = z.infer<typeof createEmailTemplateSchema>;
