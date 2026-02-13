// Common types
export interface BaseEntity {
  id: number;
  company_id: number | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
}

// Company types
export interface Company extends BaseEntity {
  name: string;
  slug: string;
  domain: string | null;
  logo: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: 'active' | 'inactive' | 'suspended';
  settings: Record<string, unknown> | null;
  max_users: number | null;
}

export interface CreateCompanyDto {
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: 'active' | 'inactive' | 'suspended';
  settings?: Record<string, unknown>;
  max_users?: number;
  // Initial super admin details
  admin_full_name: string;
  admin_email: string;
  admin_password: string;
}

export interface UpdateCompanyDto {
  name?: string;
  slug?: string;
  domain?: string;
  logo?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: 'active' | 'inactive' | 'suspended';
  settings?: Record<string, unknown>;
  max_users?: number;
  is_active?: boolean;
}

// User types
export interface User extends BaseEntity {
  full_name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  email_verified_at: string | null;
  last_login_at: string | null;
  role_id: number;
  status: 'active' | 'inactive' | 'pending' | 'blocked';
  role?: Role;
  company?: Company | null;
}

export interface CreateUserDto {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  role_id: number;
}

export interface UpdateUserDto {
  full_name?: string;
  email?: string;
  phone?: string;
  role_id?: number;
  is_active?: boolean;
  status?: string;
}

// Role types
export interface Role extends BaseEntity {
  name: string;
  slug: string;
  description: string | null;
  level: number;
  permissions?: Permission[];
}

export interface CreateRoleDto {
  name: string;
  slug?: string;
  description?: string;
  level?: number;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  level?: number;
  is_active?: boolean;
}

// Permission types
export interface Permission extends BaseEntity {
  name: string;
  slug: string;
  module: string;
  module_id: number | null;
  description: string | null;
}

export interface CreatePermissionDto {
  name: string;
  slug?: string;
  module: string;
  description?: string;
}

// Module types
export interface Module extends BaseEntity {
  name: string;
  slug: string;
  description: string | null;
  requires_approval: boolean;
  permissions?: Permission[];
}

// Setting types
export interface Setting extends BaseEntity {
  key: string;
  value: string | null;
  type: 'string' | 'number' | 'boolean' | 'json' | 'text';
  group: string;
  label: string;
  description: string | null;
  is_public: boolean;
  is_system: boolean;
}

export interface UpdateSettingDto {
  value: string;
}

export interface BulkUpdateSettingsDto {
  group?: string;
  [key: string]: string | undefined;
}

// Language types
export interface Language extends BaseEntity {
  name: string;
  code: string;
  native_name: string | null;
  direction: 'ltr' | 'rtl';
  is_default: boolean;
}

export interface CreateLanguageDto {
  name: string;
  code: string;
  native_name?: string;
  direction?: 'ltr' | 'rtl';
  is_default?: boolean;
}

export interface UpdateLanguageDto {
  name?: string;
  native_name?: string;
  direction?: 'ltr' | 'rtl';
  is_active?: boolean;
}

// Currency types
export interface Currency extends BaseEntity {
  name: string;
  code: string;
  symbol: string;
  symbol_position: 'before' | 'after';
  decimal_places: number;
  decimal_separator: string;
  thousand_separator: string;
  exchange_rate: number;
  is_default: boolean;
}

export interface CreateCurrencyDto {
  name: string;
  code: string;
  symbol: string;
  symbol_position?: 'before' | 'after';
  decimal_places?: number;
  decimal_separator?: string;
  thousand_separator?: string;
  exchange_rate?: number;
  is_default?: boolean;
}

export interface UpdateCurrencyDto {
  name?: string;
  symbol?: string;
  symbol_position?: 'before' | 'after';
  decimal_places?: number;
  decimal_separator?: string;
  thousand_separator?: string;
  exchange_rate?: number;
  is_active?: boolean;
}

// Location types
export interface Country extends BaseEntity {
  name: string;
  code: string;
  phone_code: string | null;
  currency_code: string | null;
}

export interface State extends BaseEntity {
  name: string;
  code: string | null;
  country_id: number;
  country?: Country;
}

export interface City extends BaseEntity {
  name: string;
  state_id: number;
  state?: State;
}

export interface Pincode extends BaseEntity {
  pincode: string;
  area_name: string | null;
  city_id: number;
  city?: City;
}

// Activity Log types
export interface ActivityLog {
  id: number;
  user_id: number | null;
  action: string;
  module: string;
  module_id: number | null;
  description: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  createdAt: string;
  user?: User;
}

// Email Config types
export interface EmailConfig extends BaseEntity {
  has_api_key: boolean | null;
  name: string;
  from_email: string;
  from_name: string;
  driver: 'smtp' | 'brevo'  | 'sendmail';
  host: string | null;
  port: number | null;
  username: string | null;
  password: string | null;
  encryption: 'tls' | 'ssl' | 'none' | null;
  api_key: string | null;
  domain: string | null;
  region: string | null;
  is_default: boolean;
  is_active: boolean;
}

export interface CreateEmailConfigDto {
  name: string;
  from_email: string;
  from_name: string;
  driver: 'smtp' | 'brevo' | 'sendmail';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  encryption?: 'tls' | 'ssl' | 'none';
  api_key?: string;
  domain?: string;
  region?: string;
  is_default?: boolean;
}

export interface UpdateEmailConfigDto {
  name?: string;
  from_email?: string;
  from_name?: string;
  driver?: 'smtp' | 'brevo' | 'sendmail';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  encryption?: 'tls' | 'ssl' | 'none';
  api_key?: string;
  domain?: string;
  region?: string;
  is_default?: boolean;
  is_active?: boolean;
}

// Email Template types
export interface EmailTemplate extends BaseEntity {
  name: string;
  slug: string;
  type: 'header' | 'footer' | 'template';
  subject: string | null;
  body: string;
  variables: string[] | null;
  description: string | null;
  header_id: number | null;
  footer_id: number | null;
  email_config_id: number | null;
  is_predefined: boolean;
  email_config?: EmailConfig;
  header?: { id: number; name: string };
  footer?: { id: number; name: string };
}

export interface CreateEmailTemplateDto {
  name: string;
  slug?: string;
  type?: 'header' | 'footer' | 'template';
  subject?: string;
  body: string;
  variables?: string[];
  description?: string;
  header_id?: number;
  footer_id?: number;
  email_config_id?: number;
}

export interface UpdateEmailTemplateDto {
  name?: string;
  type?: 'header' | 'footer' | 'template';
  subject?: string;
  body?: string;
  variables?: string[];
  description?: string;
  header_id?: number | null;
  footer_id?: number | null;
  email_config_id?: number;
  is_active?: boolean;
}

// Approval types
export interface ApprovalRequest {
  id: number;
  company_id: number | null;
  requester_id: number;
  approver_id: number | null;
  module_slug: string;
  permission_slug: string;
  action: string;
  resource_type: string;
  resource_id: number | null;
  request_data: unknown;
  old_data: unknown | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_at: string | null;
  reviewedAt?: string | null;
  review_notes: string | null;
  created_at: string;
  createdAt?: string;
  updated_at: string;
  requester?: {
    id: number;
    full_name: string;
    email: string;
  };
  approver?: {
    id: number;
    full_name: string;
    email: string;
  };
}

export interface ApprovalFilters {
  status?: 'pending' | 'approved' | 'rejected';
  module_slug?: string;
  page?: number;
  limit?: number;
}

export interface CreateApprovalDto {
  module_slug: string;
  permission_slug: string;
  action: string;
  resource_type: string;
  resource_id?: number;
  request_data: unknown;
  old_data?: unknown;
}

// Auth types
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface ChangePasswordDto {
  current_password: string;
  new_password: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface VerifyOTPDto {
  email: string;
  otp: string;
}

export interface ResetPasswordDto {
  email: string;
  otp: string;
  password: string;
}

export interface UpdateProfileDto {
  full_name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface AuthUser extends User {
  permissions?: string[];
  company?: Company | null;
}

// Email Campaign types
export interface Holiday {
  key: string;
  month: number;
  day: number;
  name: string;
}

export interface VariableMapping {
  source: 'user' | 'setting' | 'computed' | 'static';
  field?: string;
  key?: string;
  default?: string;
  compute?: string;
  value?: string;
}

export interface EmailCampaign extends BaseEntity {
  name: string;
  slug: string;
  description: string | null;
  email_template_id: number;
  email_config_id: number | null;
  campaign_type: 'holiday' | 'scheduled' | 'recurring';
  holiday_name: string | null;
  holiday_month: number | null;
  holiday_day: number | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  recurring_pattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  recurring_day: number | null;
  target_audience: 'all_users' | 'active_users' | 'verified_users' | 'custom';
  target_roles: number[] | null;
  variable_mappings: Record<string, VariableMapping> | null;
  status: 'draft' | 'active' | 'paused' | 'completed';
  total_recipients: number;
  total_sent: number;
  total_failed: number;
  last_run_at: string | null;
  next_run_at: string | null;
  template?: EmailTemplate;
  email_config?: EmailConfig;
}

export interface CreateEmailCampaignDto {
  name: string;
  slug?: string;
  description?: string;
  email_template_id: number;
  email_config_id?: number;
  campaign_type: 'holiday' | 'scheduled' | 'recurring';
  holiday_name?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  recurring_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurring_day?: number;
  target_audience: 'all_users' | 'active_users' | 'verified_users' | 'custom';
  target_roles?: number[];
  variable_mappings?: Record<string, VariableMapping>;
  status?: 'draft' | 'active';
}

export interface UpdateEmailCampaignDto {
  name?: string;
  description?: string;
  email_template_id?: number;
  email_config_id?: number;
  campaign_type?: 'holiday' | 'scheduled' | 'recurring';
  holiday_name?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  recurring_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurring_day?: number;
  target_audience?: 'all_users' | 'active_users' | 'verified_users' | 'custom';
  target_roles?: number[];
  variable_mappings?: Record<string, VariableMapping>;
  status?: 'draft' | 'active' | 'paused';
  is_active?: boolean;
}

export interface QueueStats {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
}

export interface CampaignStatistics {
  campaign: {
    id: number;
    name: string;
    total_recipients: number;
    total_sent: number;
    total_failed: number;
    last_run_at: string | null;
    next_run_at: string | null;
  };
  queue: Record<string, number>;
  sent: Record<string, number>;
}

// Translation types
export interface TranslationKey extends BaseEntity {
  key: string;
  default_value: string;
  description: string | null;
  group: string;
  translations?: Translation[];
}

export interface Translation extends BaseEntity {
  translation_key_id: number;
  language_id: number;
  value: string;
  status: 'auto' | 'reviewed';
  language?: Language;
  translation_key?: TranslationKey;
}

export interface CreateTranslationKeyDto {
  key: string;
  default_value: string;
  description?: string;
  group: string;
  auto_translate?: boolean;
}

export interface UpdateTranslationKeyDto {
  key?: string;
  default_value?: string;
  description?: string;
  group?: string;
}

export interface UpdateTranslationDto {
  language_id: number;
  value: string;
}

export interface TranslationMap {
  [key: string]: string;
}

export interface TranslationStats {
  total_keys: number;
  languages: {
    id: number;
    code: string;
    name: string;
    total: number;
    auto: number;
    reviewed: number;
    missing: number;
    completion: number;
  }[];
}

export interface BulkImportResult {
  created: number;
  skipped: number;
  errors: { key: string; error: string }[];
}