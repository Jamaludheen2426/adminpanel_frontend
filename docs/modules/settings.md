# Settings Module

## Purpose
All site configuration: general settings, branding, currencies, languages, translations, email configs/templates/campaigns, appearance, SEO, social login, timezones, cache, and more. Settings are key-value pairs grouped by category.

## Frontend
- **Route base:** `/admin/settings`
- **Main settings page:** `/admin/settings` → `src/app/admin/settings/_components/settings-content.tsx`
- **Sub-routes:**

| Route | Description |
|-------|-------------|
| `/admin/settings/general` | Site name, logo, favicon, contact info |
| `/admin/settings/admin-settings` | Admin panel configuration |
| `/admin/settings/admin-appearance` | Theme / branding |
| `/admin/settings/currencies` | Currency management |
| `/admin/settings/languages` | Language management |
| `/admin/settings/translations` | Translation keys + values |
| `/admin/settings/email` | Email configs |
| `/admin/settings/email/campaigns` | Email campaigns |
| `/admin/settings/templates` | Email templates |
| `/admin/settings/social-login` | Google/OAuth settings |
| `/admin/settings/website-tracking` | Analytics tracking codes |
| `/admin/settings/timezone` | Timezone settings |
| `/admin/settings/phone` | Phone/SMS settings |
| `/admin/settings/optimize` | Performance / cache |
| `/admin/settings/media` | Media/upload settings |

**All settings pages guard with:** `settings.view` permission (NOT `admin_settings.view` or `admin_appearance.view` — those are fake slugs; the real guard is always `settings.view`).

---

## General Settings

### Hook: `use-settings.ts`
- `useSettings(group?)` — GET /settings or /settings/group/:group
- `usePublicSettings()` — GET /settings/public (no auth)
- `useSetting(key)` — GET /settings/:key
- `useUpdateSetting()` — PUT /settings/:key (approval-aware)
- `useBulkUpdateSettings()` — POST /settings/bulk (approval-aware)
- `useOptimizeSettings()` (in `use-optimize-settings.ts`) — optimize/cache

### Backend
- **Route prefix:** `/api/v1/settings`
- **File:** `src/routes/setting.routes.js`

| Method | Path | Permission | Approval |
|--------|------|------------|----------|
| GET | /public | public | No |
| GET | / | settings.view | No |
| GET | /group/:group | settings.view | No |
| GET | /:key | settings.view | No |
| PUT | /:key | settings.edit | Yes |
| POST | /bulk | settings.edit | Yes |

### DB Table: `settings`
Fields: id, key (VARCHAR 100, unique), value (TEXT), group (VARCHAR 50), type (ENUM: text/textarea/number/boolean/json/file), description (TEXT), company_id, is_active (TINYINT)
Soft-delete: `paranoid: true`

---

## Currencies

### Frontend
- **Route:** `/admin/settings/currencies`
- **Hook:** `src/hooks/use-currencies.ts`
  - `useCurrencies()`, `useCreateCurrency()`, `useUpdateCurrency()`, `useDeleteCurrency()` — approval-aware
  - `useSetDefaultCurrency()` — PATCH /:id/default (NO approval)
  - `useToggleCurrencyStatus()` — PATCH toggle (NO approval but has `pending` prop on Switch)

### Backend: `/api/v1/currencies`
| Method | Path | Approval |
|--------|------|----------|
| GET | /active | No (public) |
| GET,GET/:id | | No |
| POST,PUT,DELETE | | Yes |
| PATCH | /:id/default | **No** |

### DB Table: `currencies`
Fields: id, name (VARCHAR 100), code (VARCHAR **3** — ISO 4217, e.g. USD), symbol (VARCHAR 10), exchange_rate (DECIMAL 10,4), decimal_places (INTEGER), decimal_separator/thousand_separator (VARCHAR 5), symbol_position (ENUM: before/after), space_between (TINYINT), is_default (BOOLEAN), is_active (TINYINT 0/1/2)
**Validation:** `z.string().trim().length(3)` — EXACTLY 3 chars (NOT min/max)

### is_active Pending State Fix
- Table Switch: `checked={Number(currency.is_active) === 1}` (NOT Boolean)

---

## Languages

### Frontend
- **Route:** `/admin/settings/languages`
- **Hook:** `src/hooks/use-languages.ts`
  - `useLanguages()`, `useCreateLanguage()`, `useUpdateLanguage()`, `useDeleteLanguage()` — approval-aware
  - `useSetDefaultLanguage()` — PATCH /:id/default (NO approval)

### Backend: `/api/v1/languages`
All CRUD + approval (except GET and PATCH /default)

### DB Table: `languages`
Fields: id, name (VARCHAR 100), code (VARCHAR 10, unique), native_name (VARCHAR 100), direction (ENUM: ltr/rtl), is_default (BOOLEAN), is_active (TINYINT 0/1/2)

---

## Translations

### Frontend
- **Route:** `/admin/settings/translations`
- **Hook:** `src/hooks/use-translations.ts`
  - `useTranslationKeys({ page, limit, group, search })` — paginated
  - `useCreateTranslationKey()`, `useUpdateTranslationKey()`, `useDeleteTranslationKey()` — approval-aware
  - `useBulkImportTranslations()` — approval-aware
  - `useTranslations(langCode, group)` — GET translations by lang
  - `useMissingTranslations()` — track missing keys

### Backend
- **Translation keys:** `/api/v1/translation-keys`
- **Translations:** `/api/v1/translations`

### DB Tables
- `translation_keys`: id, key (VARCHAR 255, unique), company_id, default_value (TEXT), description (VARCHAR 500), group (VARCHAR 50)
- `translations`: id, company_id, translation_key_id (FK), language_id (FK), value (TEXT), status (ENUM: auto/reviewed), is_active (TINYINT)
- `missing_translation_keys`: tracks keys used in frontend but not defined

---

## Email Configs

### Frontend
- **Route:** `/admin/settings/email`
- **Hook:** `src/hooks/use-email-configs.ts`
  - `useEmailConfigs()`, `useCreateEmailConfig()`, `useUpdateEmailConfig()`, `useDeleteEmailConfig()` — approval-aware
  - `useToggleEmailConfig()` — PATCH /:id/toggle (NO approval)
  - `useTestEmailConfig()` — POST /:id/test

### Backend: `/api/v1/email-configs`
| Method | Path | Approval |
|--------|------|----------|
| POST, PUT, DELETE | | Yes |
| PATCH | /:id/toggle | **No** |
| POST | /:id/test | No |

### DB Table: `email_configs`
Fields: id, name, from_email, from_name, driver (ENUM: smtp/brevo/elasticemail/sendmail), host, port, username, password, encryption (ENUM: tls/ssl/none), api_key, domain, region, company_id, is_default (BOOLEAN), is_active (TINYINT)

---

## Email Templates

### Frontend
- **Route:** `/admin/email-templates` (NOT under /settings)
- **Hook:** `src/hooks/use-email-templates.ts`
  - `useEmailTemplates()`, `useCreateEmailTemplate()`, `useUpdateEmailTemplate()`, `useDeleteEmailTemplate()` — approval-aware
  - `useToggleEmailTemplateActive()` — PATCH /:id/toggle-active (NO approval)

### DB Table: `email_templates`
Fields: id, name, slug (unique), company_id, type (ENUM: header/footer/template), subject, body (LONGTEXT), variables (JSON), description, header_id/footer_id (FK→self), email_config_id (FK), is_active (TINYINT), is_predefined (BOOLEAN)

---

## Email Campaigns

### Frontend
- **Route:** `/admin/settings/email/campaigns`
- **Hook:** `src/hooks/use-email-campaigns.ts`
  - CRUD — approval-aware
  - `useActivateCampaign()`, `usePauseCampaign()`, `useTriggerCampaign()`

### DB Table: `email_campaigns`
Fields: id, name, slug, company_id, description, email_template_id, email_config_id, campaign_type (ENUM: holiday/scheduled/recurring), holiday_name/month/day, scheduled_date, scheduled_time, recurring_pattern (ENUM: daily/weekly/monthly/yearly)

---

## Approval Workflow
- Settings (update, bulk): approval-aware
- Currencies (create, update, delete): approval-aware; default + toggle: NO approval
- Languages (create, update, delete): approval-aware; default: NO approval
- Translation keys (create, update, delete, bulkImport): approval-aware
- Email configs (create, update, delete): approval-aware; toggle: NO approval
- Email templates (create, update, delete): approval-aware; toggle-active: NO approval
- Email campaigns (create, update, delete): approval-aware
