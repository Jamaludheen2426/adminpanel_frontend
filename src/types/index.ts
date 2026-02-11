// Common types
export interface BaseEntity {
  id: number;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
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
  permissions?: Permission[];
}

export interface CreateRoleDto {
  name: string;
  slug?: string;
  description?: string;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
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
  has_api_key: boolean | null; // ✅ FIXED: Was EmailConfig, should be boolean
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
  is_active: boolean; // ✅ ADDED: Was missing
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
  encryption?: 'tls' | 'ssl' | 'none'; // ✅ CHANGED: More specific
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
  encryption?: 'tls' | 'ssl' | 'none'; // ✅ CHANGED: More specific
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
