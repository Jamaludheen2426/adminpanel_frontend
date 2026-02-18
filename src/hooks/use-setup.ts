import { useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import type { DatabaseStepData, CompanyStepData, AdminStepData } from '@/lib/setup-validation';

// Use the Next.js proxy route for same-domain cookie handling
const API_URL = '/api/proxy/v1';

// ─── API helpers ──────────────────────────────────────────────────────────────

const apiPost = async <T>(endpoint: string, body: Record<string, unknown>): Promise<T> => {
  const res = await fetch(`${API_URL}/setup${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // send/receive HttpOnly cookies
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

const apiPostMultipart = async <T>(
  endpoint: string,
  formData: FormData
): Promise<T> => {
  const res = await fetch(`${API_URL}/setup${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    body: formData, // no Content-Type header — browser sets multipart boundary
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

const apiGet = async <T>(endpoint: string): Promise<T> => {
  const res = await fetch(`${API_URL}/setup${endpoint}`, {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

// ─── Response types ───────────────────────────────────────────────────────────

interface SetupStatusResponse {
  success: boolean;
  data: { installed: boolean };
}

interface PreflightCheck {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
}

interface PreflightResponse {
  success: boolean;
  data: { checks: PreflightCheck[]; allPassed: boolean };
  message: string;
}

interface TestDbResponse {
  success: boolean;
  data: { success: boolean; message: string };
  message: string;
}

interface ConfigureResponse {
  success: boolean;
  data: { configured: boolean };
  message: string;
}

interface CreateCompanyResponse {
  success: boolean;
  data: {
    company_id: number;
    name: string;
    slug: string;
    logo: string | null;
    favicon: string | null;
  };
  message: string;
}

interface CreateAdminResponse {
  success: boolean;
  data: {
    user: {
      id: number;
      full_name: string;
      email: string;
      role_id: number;
      company_id: number;
    };
  };
  message: string;
}

interface FinalizeResponse {
  success: boolean;
  data: {
    installed: boolean;
    user: { id: number; full_name: string; email: string };
  };
  message: string;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Check if the app is installed.
 * Called by frontend middleware (Next.js) on cold start.
 * Cached for 60 seconds — no need to re-check frequently.
 */
export const useSetupStatus = () =>
  useQuery({
    queryKey: queryKeys.setup.status(),
    queryFn: () => apiGet<SetupStatusResponse>('/status'),
    staleTime: 60 * 1000,
    retry: false,
  });

/**
 * Run pre-flight checks (Step 1 — Welcome).
 * Called on mount of the welcome step.
 */
export const usePreflightCheck = () =>
  useMutation({
    mutationFn: () => apiPost<PreflightResponse>('/check', {}),
  });

/**
 * Test database connection (Step 2 — Database).
 * Called when user clicks "Test Connection".
 */
export const useTestDatabase = () =>
  useMutation({
    mutationFn: (data: Pick<DatabaseStepData, 'db_host' | 'db_port' | 'db_name' | 'db_user' | 'db_password'>) =>
      apiPost<TestDbResponse>('/test-db', data as unknown as Record<string, unknown>),
  });

/**
 * Write .env + create DB + run schema (Step 2 — Database).
 * Called when user clicks "Create & Setup".
 */
export const useConfigure = () =>
  useMutation({
    mutationFn: (data: DatabaseStepData) =>
      apiPost<ConfigureResponse>('/configure', data as unknown as Record<string, unknown>),
  });

/**
 * Create company with optional logo/favicon uploads (Step 3 — Company).
 * Uses multipart/form-data.
 */
export const useCreateSetupCompany = () =>
  useMutation({
    mutationFn: ({
      companyData,
      dbConfig,
      logoFile,
      faviconFile,
    }: {
      companyData: CompanyStepData;
      dbConfig: DatabaseStepData;
      logoFile?: File | null;
      faviconFile?: File | null;
    }) => {
      const formData = new FormData();

      // Company fields
      Object.entries(companyData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'logo' && key !== 'favicon') {
          formData.append(key, String(value));
        }
      });

      // DB config (needed by controller to connect before .env is loaded into process.env)
      Object.entries(dbConfig).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      // Files
      if (logoFile) formData.append('logo', logoFile);
      if (faviconFile) formData.append('favicon', faviconFile);

      return apiPostMultipart<CreateCompanyResponse>('/company', formData);
    },
  });

/**
 * Create super admin user with optional avatar (Step 4 — Admin).
 * Uses multipart/form-data.
 */
export const useCreateSetupAdmin = () =>
  useMutation({
    mutationFn: ({
      adminData,
      companyId,
      dbConfig,
      avatarFile,
    }: {
      adminData: AdminStepData;
      companyId: number;
      dbConfig: DatabaseStepData;
      avatarFile?: File | null;
    }) => {
      const formData = new FormData();

      // Admin fields (exclude confirm_password — backend doesn't need it)
      formData.append('full_name', adminData.full_name);
      formData.append('email', adminData.email);
      formData.append('password', adminData.password);
      formData.append('company_id', String(companyId));

      // DB config
      Object.entries(dbConfig).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      // Avatar
      if (avatarFile) formData.append('avatar', avatarFile);

      return apiPostMultipart<CreateAdminResponse>('/admin', formData);
    },
  });

/**
 * Finalize setup: seed translations + mark installed + auto-login (Step 5 — Review).
 * After success, JWT cookies are set → frontend can redirect to /admin.
 */
export const useFinalize = () =>
  useMutation({
    mutationFn: ({
      userId,
      companyId,
      email,
      fullName,
      roleId,
      dbConfig,
    }: {
      userId: number;
      companyId: number;
      email: string;
      fullName: string;
      roleId: number;
      dbConfig: DatabaseStepData;
    }) =>
      apiPost<FinalizeResponse>('/finalize', {
        user_id: userId,
        company_id: companyId,
        email,
        full_name: fullName,
        role_id: roleId,
        db_host: dbConfig.db_host,
        db_port: dbConfig.db_port,
        db_name: dbConfig.db_name,
        db_user: dbConfig.db_user,
        db_password: dbConfig.db_password,
      }),
  });