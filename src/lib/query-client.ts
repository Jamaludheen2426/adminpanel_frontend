import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },

  // Companies
  companies: {
    all: ['companies'] as const,
    lists: () => [...queryKeys.companies.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.companies.lists(), params] as const,
    details: () => [...queryKeys.companies.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.companies.details(), id] as const,
    dashboard: () => [...queryKeys.companies.all, 'dashboard'] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.users.details(), id] as const,
  },

  // Roles
  roles: {
    all: ['roles'] as const,
    lists: () => [...queryKeys.roles.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.roles.lists(), params] as const,
    details: () => [...queryKeys.roles.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.roles.details(), id] as const,
  },

  // Permissions
  permissions: {
    all: ['permissions'] as const,
    lists: () => [...queryKeys.permissions.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.permissions.lists(), params] as const,
    details: () =>
    [...queryKeys.permissions.all, 'detail'] as const,
    detail: (id: number) =>
    [...queryKeys.permissions.details(), id] as const,
  },

  // Modules
  modules: {
    all: ['modules'] as const,
    lists: () => [...queryKeys.modules.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.modules.lists(), params] as const,
    details: () => [...queryKeys.modules.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.modules.details(), id] as const,
  },

  // Settings
  settings: {
    all: ['settings'] as const,
    public: () => [...queryKeys.settings.all, 'public'] as const,
    lists: () => [...queryKeys.settings.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.settings.lists(), params] as const,
    group: (group: string) => [...queryKeys.settings.all, 'group', group] as const,
    detail: (key: string) => [...queryKeys.settings.all, 'detail', key] as const,
  },

  // Languages
  languages: {
    all: ['languages'] as const,
    active: () => [...queryKeys.languages.all, 'active'] as const,
    lists: () => [...queryKeys.languages.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.languages.lists(), params] as const,
    detail: (id: number) => [...queryKeys.languages.all, 'detail', id] as const,
  },

  // Currencies
  currencies: {
    all: ['currencies'] as const,
    active: () => [...queryKeys.currencies.all, 'active'] as const,
    lists: () => [...queryKeys.currencies.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.currencies.lists(), params] as const,
    detail: (id: number) => [...queryKeys.currencies.all, 'detail', id] as const,
  },

  // Locations
  locations: {
    all: ['locations'] as const,
    countries: () => [...queryKeys.locations.all, 'countries'] as const,
    states: (countryId: number) => [...queryKeys.locations.all, 'states', countryId] as const,
    cities: (stateId: number) => [...queryKeys.locations.all, 'cities', stateId] as const,
    pincodes: (cityId: number) => [...queryKeys.locations.all, 'pincodes', cityId] as const,
  },

  // Activity Logs
  activityLogs: {
    all: ['activityLogs'] as const,
    lists: () => [...queryKeys.activityLogs.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.activityLogs.lists(), params] as const,
    detail: (id: number) => [...queryKeys.activityLogs.all, 'detail', id] as const,
  },

  // Email Configs
  emailConfigs: {
    all: ['emailConfigs'] as const,
    lists: () => [...queryKeys.emailConfigs.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.emailConfigs.lists(), params] as const,
    detail: (id: number) => [...queryKeys.emailConfigs.all, 'detail', id] as const,
  },

  // Email Templates
  emailTemplates: {
    all: ['emailTemplates'] as const,
    lists: () => [...queryKeys.emailTemplates.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.emailTemplates.lists(), params] as const,
    detail: (id: number) => [...queryKeys.emailTemplates.all, 'detail', id] as const,
  },

  // Email Campaigns
  emailCampaigns: {
    all: ['emailCampaigns'] as const,
    lists: () => [...queryKeys.emailCampaigns.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.emailCampaigns.lists(), params] as const,
    detail: (id: number) => [...queryKeys.emailCampaigns.all, 'detail', id] as const,
    holidays: () => [...queryKeys.emailCampaigns.all, 'holidays'] as const,
    queueStats: () => [...queryKeys.emailCampaigns.all, 'queueStats'] as const,
    statistics: (id: number) => [...queryKeys.emailCampaigns.all, 'statistics', id] as const,
    variableMappings: () => [...queryKeys.emailCampaigns.all, 'variableMappings'] as const,
  },

  // Translations
  translations: {
    all: ['translations'] as const,
    forLanguage: (langCode: string) => [...queryKeys.translations.all, 'lang', langCode] as const,
    forLanguageGroup: (langCode: string, group: string) => [...queryKeys.translations.all, 'lang', langCode, group] as const,
    stats: () => [...queryKeys.translations.all, 'stats'] as const,
    groups: () => [...queryKeys.translations.all, 'groups'] as const,
    export: () => [...queryKeys.translations.all, 'export'] as const,
  },

  // Translation Keys
  translationKeys: {
    all: ['translationKeys'] as const,
    lists: () => [...queryKeys.translationKeys.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.translationKeys.lists(), params] as const,
    detail: (id: number) => [...queryKeys.translationKeys.all, 'detail', id] as const,
  },

  // Approvals
  approvals: {
    all: ['approvals'] as const,
    lists: () => [...queryKeys.approvals.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.approvals.lists(), params] as const,
    details: () => [...queryKeys.approvals.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.approvals.details(), id] as const,
    pending: () => [...queryKeys.approvals.all, 'pending'] as const,
  },

  // Missing Translation Keys
  missingTranslationKeys: {
    all: ['missingTranslationKeys'] as const,
    lists: () => [...queryKeys.missingTranslationKeys.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.missingTranslationKeys.lists(), params] as const,
    count: () => [...queryKeys.missingTranslationKeys.all, 'count'] as const,
  },
};