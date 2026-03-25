# Companies Module

## Purpose
Multi-tenant company management. Each company is an isolated tenant with its own users, settings, and data. Only Developers (level 1000) can manage companies directly.

## Frontend
- **Route:** `/admin/companies`
- **Hook:** `src/hooks/use-companies.ts`
  - `useCompanies({ page, limit })` — paginated list
  - `useCompany(id)` — single company
  - `useCreateCompany()` — POST
  - `useUpdateCompany()` — PUT
  - `useDeleteCompany()` — DELETE
  - `useUpdateCompanyStatus()` — PATCH /:id/status
  - `useCompanyDashboard()` — GET /dashboard (stats)

## Backend
- **Route prefix:** `/api/v1/companies`
- **File:** `src/routes/company.routes.js`

| Method | Path | Notes |
|--------|------|-------|
| GET | /dashboard | Stats (total, active, pending) |
| GET | / | List all companies |
| GET | /:id | Single company |
| POST | / | Create company |
| PUT | /:id | Update company |
| DELETE | /:id | Soft-delete |
| PATCH | /:id/status | Toggle status |

**Access:** Companies route is typically guarded by Developer-level access (level 1000). Returns 403 for non-Developer roles — this is expected behavior, not a bug.

## DB Table: `companies`
Fields: id, name (VARCHAR 200), slug (VARCHAR 200, unique), domain (VARCHAR 255), logo (VARCHAR 500), email (VARCHAR 255), phone (VARCHAR 50), address (TEXT), timezone (VARCHAR 100, default UTC), settings (JSON), max_users (INTEGER), is_active (TINYINT: 0=suspended, 1=active, 2=pending), created_by, updated_by
Soft-delete: `paranoid: true`

## Multi-Tenant Pattern
- Every resource in the DB has a `company_id` column
- All API requests include `X-Company-Id` header (auto-added by `api-client.ts` from localStorage)
- Backend middleware extracts `company_id` from header and scopes all queries
- `CompanyContext` in frontend: `currentCompanyId`, `isDeveloper`, `userRoleLevel`

## Approval Workflow
No approval workflow documented for companies.

## Permissions
Companies module is typically restricted to Developer role (level 1000).
