# Plugins Module

## Purpose
Manage installable feature plugins (Stripe, Twilio, Google Maps, reCAPTCHA, etc.). Each plugin has a config page, can be enabled/disabled, and stores its config in the `settings` table under a `config_group`.

## Frontend
- **Route:** `/admin/plugins`
- **Sub-routes (plugin config pages):**
  - `/admin/plugins/stripe`
  - `/admin/plugins/twilio`
  - `/admin/plugins/google-maps`
  - `/admin/plugins/recaptcha`
- **Hook:** `src/hooks/use-plugins.ts`
  - `usePlugins({ page, limit, category })` — list, supports tab filtering (Active/Explore)
  - `usePlugin(slug)` — single plugin
  - `useTogglePlugin()` — PUT /:slug/toggle (enable/disable)
- **Component:** `src/app/admin/plugins/_components/plugins-content.tsx`

### Responsive Tab Fix
TabsList: `w-full sm:w-auto`
TabsTrigger: `flex-1 sm:flex-none`
Text: `<span className="hidden sm:inline">Active Plugins</span><span className="sm:hidden">Active</span>`

## Backend
- **Route prefix:** `/api/v1/plugins`
- **File:** `src/routes/plugin.routes.js`

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| GET | / | plugins.view | List all plugins |
| GET | /:slug | plugins.view | Single plugin by slug |
| PUT | /:slug/toggle | plugins.manage | Enable/disable |

## DB Table: `plugins`
Fields: id, slug (VARCHAR 100, unique per company), name (VARCHAR 150), description (TEXT), category (VARCHAR 50), icon (VARCHAR 100), is_active (TINYINT: 0=disabled, 1=enabled), config_group (VARCHAR 100 — references setting group), config_route (VARCHAR 255 — frontend route to config page), company_id
Soft-delete: `paranoid: true`
Unique index: `(slug, company_id)`

## Plugin Config Storage
Each plugin's configuration is stored in the `settings` table using the plugin's `config_group` as the group key.
Example: Stripe plugin → `config_group: 'stripe'` → settings rows with `group: 'stripe'`.

## Approval Workflow
No approval workflow on plugins.

## Permissions
`plugins.view`, `plugins.manage`
