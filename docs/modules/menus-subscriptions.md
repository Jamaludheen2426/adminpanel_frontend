# Menus & Subscriptions Module

## Purpose
**Menus**: Define navigation menu items (with icons) that can be assigned to subscription plans.
**Subscriptions**: Pricing plans that grant access to specific menu items, with price, validity, and rich feature list.

---

## Menus

### Frontend
- **Route:** `/admin/menus` — list + inline dialog (no separate create/edit pages)
- **Hook:** `src/hooks/use-menus.ts`
  - `useMenus({ page, limit })`, `useCreateMenu()`, `useUpdateMenu()`, `useDeleteMenu()`
  - `useUpdateMenuStatus()` — PATCH /:id/status
  - `useUpdateMenuDisplayStatus()` — PATCH /:id/display-status
- **Component:** `src/app/admin/menus/_components/menus-content.tsx`
  - `normalise()`: keeps raw `is_active` (no Boolean)
  - `openEdit` guard: `if (Number(item.is_active) === 2) return;` + `is_active: Number(item.is_active) === 1`

### Backend
- **Route prefix:** `/api/v1/menus`
- **File:** `src/routes/menu.routes.js`

| Method | Path | Permission | Approval |
|--------|------|------------|----------|
| GET | / | menus.view | No |
| GET | /:id | menus.view | No |
| POST | / | menus.create | Yes |
| PUT | /:id | menus.edit | Yes |
| DELETE | /:id | menus.delete | Yes |
| PATCH | /:id/status | menus.edit | **No** |
| PATCH | /:id/display-status | menus.edit | **No** |

### DB Table: `menus`
Fields: id INTEGER.UNSIGNED, company_id, name (VARCHAR 255), icon (VARCHAR 100 — PascalCase for lucide e.g. `ArrowRight`, or `prefix:name` for iconify e.g. `mdi:star`), icon_fill_color_light (VARCHAR 20), icon_fill_color_dark (VARCHAR 20), sort_order (INTEGER), is_active (TINYINT 0/1/2), display_status (TINYINT)
Uses explicit `created_at`/`updated_at` (not Sequelize default `createdAt`)
Soft-delete: `paranoid: true`

### Permissions
`menus.view`, `menus.create`, `menus.edit`, `menus.delete`

### Sidebar
Standalone top-level item in the sidebar.

---

## Subscriptions

### Frontend
- **Route:** `/admin/subscriptions` — list + inline dialog (no separate create/edit pages)
- **Hook:** `src/hooks/use-subscriptions.ts`
  - `useSubscriptions({ page, limit })`, `useCreateSubscription()`, `useUpdateSubscription()`, `useDeleteSubscription()`
  - `useUpdateSubscriptionStatus()` — PATCH /:id/status
- **Component:** `src/app/admin/subscriptions/_components/subscriptions-content.tsx`
  - `normalise()`: keeps raw `is_active` (no Boolean)
  - `openEdit` guard: `if (Number(item.is_active) === 2) return;` + `is_active: Number(item.is_active) === 1`

### Backend
- **Route prefix:** `/api/v1/subscriptions`
- **File:** `src/routes/subscription.routes.js`

| Method | Path | Permission | Approval |
|--------|------|------------|----------|
| GET | / | subscriptions.view | No |
| GET | /:id | subscriptions.view | No |
| POST | / | subscriptions.create | Yes |
| PUT | /:id | subscriptions.edit | Yes |
| DELETE | /:id | subscriptions.delete | Yes |
| PATCH | /:id/status | subscriptions.edit | **No** |

### DB Table: `subscriptions`
Fields: id INTEGER.UNSIGNED, company_id, name (VARCHAR 255), description (TEXT), menu_ids (JSON default [] — array of menu IDs), price (DECIMAL 10,2), validity (INTEGER — days, 0 = no expiry), features (LONGTEXT — rich HTML), sort_order (INTEGER), is_active (TINYINT 0/1/2)
Uses explicit `created_at`/`updated_at`
Soft-delete: `paranoid: true`

### Form Fields
- `menu_ids`: custom multi-select dropdown (no external library), shows badges for selected menus
- `features`: uses `RichEditor` (custom WYSIWYG) via dynamic import with `{ ssr: false }`
- `description`: `<Textarea>` field

### Permissions
`subscriptions.view`, `subscriptions.create`, `subscriptions.edit`, `subscriptions.delete`

### Sidebar
Standalone top-level item, uses `Repeat` icon, translation key `nav.subscriptions`.

---

## Approval Workflow
Both menus and subscriptions: create, update, delete go through approval.
Status toggle (`PATCH /:id/status`) is **excluded** from approval on both.
Frontend hooks use `isApprovalRequired(error)` in `onError` for create/update/delete.
