import { z } from 'zod';

// ─── Step 2: Database & Environment ──────────────────────────────────────────

export const databaseStepSchema = z.object({
  db_host: z.string().min(1, 'Database host is required'),
  db_port: z
    .string()
    .regex(/^\d+$/, 'Port must be a number')
    .refine((v) => parseInt(v, 10) > 0 && parseInt(v, 10) <= 65535, {
      message: 'Port must be between 1 and 65535',
    }),
  db_name: z
    .string()
    .min(1, 'Database name is required')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed'),
  db_user: z.string().min(1, 'Database user is required'),
  db_password: z.string(), // can be empty (e.g. local root with no password)
  domain: z
    .string()
    .min(1, 'Domain / frontend URL is required')
    .url('Must be a valid URL (e.g. http://localhost:3000)'),
  upload_path: z.string().min(1, 'Upload path is required'),
  max_file_size: z
    .string()
    .regex(/^\d+$/, 'Must be a number')
    .refine((v) => parseInt(v, 10) > 0, { message: 'Must be greater than 0' }),
});

export type DatabaseStepData = z.infer<typeof databaseStepSchema>;

export const databaseStepDefaults: DatabaseStepData = {
  db_host: 'localhost',
  db_port: '3306',
  db_name: 'admin_dashboard',
  db_user: 'root',
  db_password: '',
  domain: 'http://localhost:3000',
  upload_path: 'uploads',
  max_file_size: '10485760', // 10 MB in bytes
};

// ─── Step 3: Company ──────────────────────────────────────────────────────────

export const companyStepSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  copyright: z.string().min(1, 'Copyright name is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  language: z.string().min(1, 'Default language is required'),
  currency: z.string().min(1, 'Default currency is required'),
  email: z
    .string()
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, {
      message: 'Must be a valid email address',
    }),
  phone: z.string().optional(),
  // File fields — optional, validated as File on client
  logo: z.any().optional(),
  favicon: z.any().optional(),
});

export type CompanyStepData = z.infer<typeof companyStepSchema>;

export const companyStepDefaults: Omit<CompanyStepData, 'logo' | 'favicon'> = {
  name: '',
  slug: '',
  copyright: '',
  timezone: 'UTC',
  language: 'en',
  currency: 'USD',
  email: '',
  phone: '',
};

// ─── Step 4: Super Admin ──────────────────────────────────────────────────────

export const adminStepSchema = z
  .object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Must be a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
    avatar: z.any().optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export type AdminStepData = z.infer<typeof adminStepSchema>;

export const adminStepDefaults: Omit<AdminStepData, 'avatar'> = {
  full_name: '',
  email: '',
  password: '',
  confirm_password: '',
};

// ─── Combined wizard state (all steps together) ───────────────────────────────

export interface WizardState {
  db: DatabaseStepData;
  company: CompanyStepData;
  admin: AdminStepData;
  // Set after POST /setup/company succeeds
  companyId: number | null;
  // Set after POST /setup/admin succeeds
  userId: number | null;
  roleId: number | null;
}

export const wizardStateDefaults: WizardState = {
  db: databaseStepDefaults,
  company: { ...companyStepDefaults },
  admin: { ...adminStepDefaults },
  companyId: null,
  userId: null,
  roleId: null,
};

// ─── Utility: auto-generate slug from company name ───────────────────────────

export const nameToSlug = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

// ─── Password strength helper ─────────────────────────────────────────────────

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export const getPasswordStrength = (password: string): PasswordStrength => {
  if (!password) return 'weak';
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return 'weak';
  if (score === 2) return 'fair';
  if (score === 3) return 'good';
  return 'strong';
};

export const passwordStrengthColor: Record<PasswordStrength, string> = {
  weak: 'bg-red-500',
  fair: 'bg-yellow-500',
  good: 'bg-blue-500',
  strong: 'bg-green-500',
};

export const passwordStrengthLabel: Record<PasswordStrength, string> = {
  weak: 'Weak',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
};