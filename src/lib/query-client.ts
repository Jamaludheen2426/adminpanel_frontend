import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes (increased from 5)
      gcTime: 15 * 60 * 1000, // 15 minutes (increased from 10)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false, // Prevent refetch on reconnect
      refetchOnMount: false, // Only fetch if data is stale
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
    details: () => [...queryKeys.permissions.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.permissions.details(), id] as const,
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
    states: (countryId?: number) => [...queryKeys.locations.all, 'states', countryId] as const,
    cities: (stateId?: number) => [...queryKeys.locations.all, 'cities', stateId] as const,
    pincodes: (cityId: number) => [...queryKeys.locations.all, 'pincodes', cityId] as const,
    localities: (cityId: number) => [...queryKeys.locations.all, 'localities', cityId] as const,
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

  // Plugins
  plugins: {
    all: ['plugins'] as const,
    list: () => [...queryKeys.plugins.all, 'list'] as const,
    detail: (slug: string) => [...queryKeys.plugins.all, 'detail', slug] as const,
  },

  // Payments
  payments: {
    all: ['payments'] as const,
    list: () => [...queryKeys.payments.all, 'list'] as const,
    stats: () => [...queryKeys.payments.all, 'stats'] as const,
    detail: (id: number) => [...queryKeys.payments.all, 'detail', id] as const,
  },

  faqs: {
    all: ['faqs'] as const,
    categories: () => [...queryKeys.faqs.all, 'categories'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.faqs.all, 'list', params] as const,
    detail: (id: number) => [...queryKeys.faqs.all, 'detail', id] as const,
  },

  announcements: {
    all: ['announcements'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.announcements.all, 'list', params] as const,
    detail: (id: number | string) => [...queryKeys.announcements.all, 'detail', id] as const,
  },

  testimonials: {
    all: ['testimonials'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.testimonials.all, 'list', params] as const,
    detail: (id: number | string) => [...queryKeys.testimonials.all, 'detail', id] as const,
  },

  pages: {
    all: ['pages'] as const,
    lists: () => [...queryKeys.pages.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.pages.lists(), params] as const,
    details: () => [...queryKeys.pages.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.pages.details(), id] as const,
    translations: (id: number | string) => [...queryKeys.pages.all, 'translations', id] as const,
  },

  setup: {
    all: ['setup'] as const,
    status: () => [...queryKeys.setup.all, 'status'] as const,
    preflight: () => [...queryKeys.setup.all, 'preflight'] as const,
  },

  simpleSliders: {
    all: ['simpleSliders'] as const,
    lists: () => [...queryKeys.simpleSliders.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.simpleSliders.lists(), params] as const,
    details: () => [...queryKeys.simpleSliders.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.simpleSliders.details(), id] as const,
  },

  // Ads
  ads: {
    all: ['ads'] as const,
    lists: () => [...queryKeys.ads.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.ads.lists(), params] as const,
    details: () => [...queryKeys.ads.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.ads.details(), id] as const,
  },

  // Ad Banners
  adBanners: {
    all: ['adBanners'] as const,
    lists: () => [...queryKeys.adBanners.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.adBanners.lists(), params] as const,
    details: () => [...queryKeys.adBanners.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.adBanners.details(), id] as const,
  },

  // Blog Posts
  blogPosts: {
    all: ['blogPosts'] as const,
    lists: () => [...queryKeys.blogPosts.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.blogPosts.lists(), params] as const,
    details: () => [...queryKeys.blogPosts.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.blogPosts.details(), id] as const,
  },

  // Blog Categories
  blogCategories: {
    all: ['blogCategories'] as const,
    lists: () => [...queryKeys.blogCategories.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.blogCategories.lists(), params] as const,
    details: () => [...queryKeys.blogCategories.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.blogCategories.details(), id] as const,
  },

  // Blog Tags
  blogTags: {
    all: ['blogTags'] as const,
    lists: () => [...queryKeys.blogTags.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.blogTags.lists(), params] as const,
    details: () => [...queryKeys.blogTags.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.blogTags.details(), id] as const,
  },

  // Contacts
  contacts: {
    all: ['contacts'] as const,
    lists: () => [...queryKeys.contacts.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.contacts.lists(), params] as const,
    details: () => [...queryKeys.contacts.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.contacts.details(), id] as const,
  },

  // FAQ Categories
  faqCategories: {
    all: ['faqCategories'] as const,
    lists: () => [...queryKeys.faqCategories.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.faqCategories.lists(), params] as const,
    details: () => [...queryKeys.faqCategories.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.faqCategories.details(), id] as const,
  },
};