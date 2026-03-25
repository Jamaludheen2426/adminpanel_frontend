# Users, Roles & Permissions Module

## Purpose
Manage admin users (employees), role-based access control (RBAC), and permission assignment. Multi-tenant: each resource scoped by `company_id`.

---

## Users / Employees

### Frontend
- **Route:** `/admin/platform/users`
- **Hook:** `src/hooks/use-users.ts`
  - `useUsers({ page, limit, search, role_id, is_active })` — paginated list
  - `useUser(id)` — single user
  - `useCreateUser()` — POST (approval-aware)
  - `useUpdateUser()` — PUT (approval-aware)
  - `useDeleteUser()` — DELETE (approval-aware)
  - `useUpdateUserStatus()` — PATCH /status (NO approval)

### Backend
- **Route prefix:** `/api/v1/users`
- **File:** `src/routes/user.routes.js`

| Method | Path | Permission | Approval |
|--------|------|------------|----------|
| GET | / | employees.view | No |
| GET | /:id | employees.view | No |
| POST | / | employees.create | Yes |
| PUT | /:id | employees.edit | Yes |
| DELETE | /:id | employees.delete | Yes |
| PATCH | /:id/status | employees.edit | **No** |

### DB Table: `users`
Key fields: `id`, `full_name`, `email`, `password` (bcrypt), `phone`, `avatar`, `role_id`, `company_id`, `username`, `dob`, `gender`, `department`, `designation`, `doj` (date of joining), `dor` (date of resignation), `login_access` (TINYINT 0/1), `is_active` (0=inactive, 1=active, 2=pending), `email_verified_at`, `last_login_at`
- Soft-delete: `paranoid: true` → `deleted_at` column required
- Unique fields stamped on soft-delete: `email`, `username`

---

## Roles

### Frontend
- **Route:** `/admin/platform/roles`
- **Hook:** `src/hooks/use-roles.ts`
  - `useRoles()`, `useRole(id)`, `useCreateRole()`, `useUpdateRole()`, `useDeleteRole()`
  - `useUpdateRolePermissions(id)` — POST /:id/permissions

### Backend
- **Route prefix:** `/api/v1/roles`

| Method | Path | Permission | Approval |
|--------|------|------------|----------|
| GET | / | roles.view | No |
| GET | /:id | roles.view | No |
| POST | / | roles.manage | Yes |
| PUT | /:id | roles.manage | Yes |
| DELETE | /:id | roles.manage | Yes |
| POST | /:id/permissions | roles.manage | No |

### DB Table: `roles`
Key fields: `id`, `name`, `slug`, `description`, `level` (dev=1000, superadmin=100, admin=50, subadmin=25, custom=10), `company_id`, `is_default` (BOOLEAN), `is_active` (0/1/2)

### Role Hierarchy
| Role | Level | Can manage roles up to |
|------|-------|----------------------|
| Developer | 1000 | All |
| SuperAdmin | 100 | Admin and below |
| Admin | 50 | SubAdmin and below |
| SubAdmin | 25 | Custom only |
| Custom | 10 | None |

---

## Permissions

### Frontend
- **Hook:** `src/hooks/use-permissions.ts`
  - `usePermissions()` — list all permissions
  - `usePermission(id)` — single

### Backend
- **Route prefix:** `/api/v1/permissions`
- All CRUD: `permissions.manage` permission required

### DB Table: `permissions`
Key fields: `id`, `name`, `slug` (e.g. `users.create`), `module` (e.g. `users`), `module_id`, `description`, `company_id`, `is_active`

### DB Table: `role_permissions`
Junction table: `role_id` + `permission_id` + `company_id` + `requires_approval` (BOOLEAN)
- When `requires_approval=true`, that role's use of that permission goes through the approval workflow

### DB Table: `modules`
`id`, `name`, `slug`, `description`, `company_id`, `is_active`
- Frontend route: `/admin/platform/modules`
- Hook: `src/hooks/use-modules.ts`

---

## Permission Check Patterns

### In Components
```tsx
import { Can } from '@/components/guards/permission-guard'
<Can permission="users.create">...</Can>
```

### In Hooks/Utils
```ts
import { hasPermission } from '@/lib/auth-utils'
hasPermission(user, 'users.create')
```

### Permission Slug Format
`{module}.{action}` — e.g. `users.view`, `roles.manage`, `employees.create`

---

## Approval Workflow
- `users`: create, update, delete go through approval
- `roles`: create, update, delete go through approval
- Status toggle (`PATCH /:id/status`) is **excluded** from approval on all user/role routes
- Frontend hooks must call `isApprovalRequired(error)` in `onError` for approval-aware mutations
