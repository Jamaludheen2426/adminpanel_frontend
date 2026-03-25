# Platform Module

## Purpose
Developer/admin tools: Activity Logs (audit trail), Cache management, Module management. These are infrastructure-level features accessible primarily to Developer and SuperAdmin roles.

---

## Activity Logs

### Purpose
Audit trail of all user actions (create, update, delete, login, etc.) per module.

### Frontend
- **Route:** `/admin/platform/activity-logs`
- **Hook:** `src/hooks/use-activity-logs.ts`
  - `useActivityLogs({ page, limit, user_id, module, action })` — paginated + filterable
  - `useUserActivityLogs(userId)` — logs for specific user
  - `useModuleActivityLogs(module)` — logs for specific module
  - `useClearActivityLogs()` — DELETE /clear

### Backend
- **Route prefix:** `/api/v1/activity-logs`
- **File:** `src/routes/activityLog.routes.js`

| Method | Path | Permission |
|--------|------|------------|
| GET | / | activity_logs.view |
| GET | /user/:userId | activity_logs.view |
| GET | /module/:module | activity_logs.view |
| DELETE | /clear | activity_logs.delete |

### DB Table: `activity_logs`
Fields: id, user_id (INTEGER — not FK, keeps log even if user deleted), action (VARCHAR 50), module (VARCHAR 100), description (TEXT), old_values (JSON), new_values (JSON), ip_address (VARCHAR 45), user_agent (TEXT), url (VARCHAR 500), method (VARCHAR 10), company_id, vendor_id (INTEGER — for vendor portal actions)
No soft-delete, no `updated_at` (insert-only)

---

## Cache Management

### Frontend
- **Route:** `/admin/platform/cache` (also accessible via `/admin/settings/cache`, `/admin/settings/optimize`)
- **Hook:** `src/hooks/use-optimize-settings.ts`
  - `useClearCache()` — clears server-side cache
  - `useClearQueryCache()` — clears TanStack Query client cache

### Backend
- Cache clearing handled via settings/optimize routes

---

## Modules

### Purpose
Define application modules that permissions are grouped under (e.g., 'users', 'blog', 'settings').

### Frontend
- **Route:** `/admin/platform/modules`
- **Hook:** `src/hooks/use-modules.ts`
  - `useModules()`, `useModule(id)`, `useCreateModule()`, `useUpdateModule()`, `useDeleteModule()`
  - `useAddPermissionToModule(id)` — POST /:id/permissions

### Backend
- **Route prefix:** `/api/v1/modules`

| Method | Path | Permission |
|--------|------|------------|
| GET | / | modules.manage |
| GET | /:id | modules.manage |
| POST | / | modules.manage |
| PUT | /:id | modules.manage |
| DELETE | /:id | modules.manage |
| POST | /:id/permissions | modules.manage |

### DB Table: `modules`
Fields: id, name (VARCHAR 100, unique), slug (VARCHAR 100, unique), description (TEXT), company_id, is_active (TINYINT)
Soft-delete: `paranoid: true`
Association: `Module.hasMany(Permission)` via `module_id`

---

## Timezones

### Frontend
- Used in settings timezone page and user/vendor forms
- **Hook:** `src/hooks/use-timezones.ts`
  - `useTimezones()` — GET /timezones (returns static list)

### Backend
- **Route:** `/api/v1/timezones` — returns inline static array (no DB table, no controller)

---

## Profile

### Frontend
- **Route:** `/admin/profile` — current user's own profile edit
- Uses `useMe()` + `useUpdateProfile()` + `useChangePassword()` from `use-auth.ts`
