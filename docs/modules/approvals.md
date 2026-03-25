# Approval Workflow Module

## Purpose
When a role has `requires_approval: true` on a permission, mutations for that action don't take effect immediately — they create an `approval_request` record. A SuperAdmin+ reviews and approves/rejects the request.

## How It Works

### Flow
1. User performs an action (e.g., creates a user)
2. Backend middleware `checkApprovalRequired` checks `role_permissions.requires_approval` for that role+permission
3. If required → creates `approval_requests` record, returns **HTTP 202** with `{ approval_required: true, message: '...' }`
4. Frontend axios interceptor catches HTTP 202 → shows toast "Approval Required" → invalidates approval queries
5. The resource enters `is_active = 2` (pending) state in the DB
6. SuperAdmin reviews at `/admin/approvals` → approves or rejects
7. On approve: resource is created/updated/deleted as originally requested
8. On reject: resource stays unchanged (or is removed if it was a create)

### is_active = 2 Means Pending
| Value | Meaning |
|-------|---------|
| 0 | Inactive |
| 1 | Active |
| 2 | Pending approval |

**`Boolean(2) = true`** — NEVER use Boolean to read `is_active`. Always use `Number(x.is_active) === 1` for active, `Number(x.is_active) === 2` for pending.

## Frontend
- **Route:** `/admin/approvals`
- **Hook:** `src/hooks/use-approvals.ts`
  - `useApprovals({ page, limit, status, module })` — paginated list
  - `usePendingApprovalCount()` — GET /pending (sidebar badge)
  - `useApproval(id)` — single approval
  - `useApproveRequest()` — PATCH /:id/approve
  - `useRejectRequest()` — PATCH /:id/reject
  - `useCancelApprovalRequest()` — DELETE /:id (requester cancels)

## Backend
- **Route prefix:** `/api/v1/approvals`
- **File:** `src/routes/approval.routes.js`

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| GET | / | isAuthenticated | List all requests |
| GET | /pending | isAuthenticated | Count badge |
| GET | /:id | isAuthenticated | Single request |
| POST | / | isAuthenticated | Create request (auto-called by backend) |
| PATCH | /:id/approve | minLevel: 100 (SuperAdmin+) | |
| PATCH | /:id/reject | minLevel: 100 | |
| DELETE | /:id | isAuthenticated | Cancel own request |

## DB Table: `approval_requests`
Fields: id, company_id, requester_id (FK→users), approver_id (FK→users, nullable), module_slug (VARCHAR 100), permission_slug (VARCHAR 100), action (VARCHAR 50 — create/update/delete), resource_type (VARCHAR 50), resource_id (INTEGER), request_data (JSON — payload that will be applied on approve), old_data (JSON — snapshot before change), reviewed_at (DATE), review_notes (TEXT), is_active (TINYINT: 0=rejected, 1=approved, 2=pending)

## Frontend Approval Pattern (per hook)

### onError Handler (approval-aware mutations)
```ts
const onError = (error: any) => {
  if (isApprovalRequired(error)) {
    closeDialog();   // close the form
    return;          // suppress the error toast
  }
  // show error toast for real errors
};
mutation.mutate(payload, { onSuccess: closeDialog, onError });
```

### isApprovalRequired Check
```ts
import { isApprovalRequired } from '@/lib/api-client';
// Returns true when error is ApprovalRequiredError (HTTP 202)
```

## Hooks WITH Approval (must use isApprovalRequired check)
| Hook | Mutations |
|------|-----------|
| `use-users.ts` | create, update, delete |
| `use-roles.ts` | create, update, delete |
| `use-settings.ts` | update, bulkUpdate |
| `use-currencies.ts` | create, update, delete |
| `use-languages.ts` | create, update, delete |
| `use-email-configs.ts` | create, update, delete |
| `use-email-campaigns.ts` | create, update, delete |
| `use-email-templates.ts` | create, update, delete |
| `use-translations.ts` | create, update, delete, bulkImport |
| `use-testimonials.ts` | create, update, delete |
| `use-media-files.ts` | upload, delete |
| `use-simple-sliders.ts` | create, update, delete |
| `use-faq-categories.ts` | create, update, delete |
| `use-faqs.ts` | create, update, delete |
| `use-announcements.ts` | create, update, delete |
| `use-menus.ts` | create, update, delete |
| `use-subscriptions.ts` | create, update, delete |
| `use-locations.ts` | create, update, delete (all entities) |

## Routes EXCLUDED from Approval (status toggles)
- `PATCH /:id/status` — all modules
- `PATCH /:id/toggle` — email configs
- `PATCH /:id/toggle-active` — email templates
- `PATCH /:id/default` — currencies, languages
- `PATCH /:id/display-status` — menus

**Backend:** these routes must NOT use `checkApprovalRequired()` middleware.

## CommonTable Pending State Display
`CommonTable` automatically shows pending state when raw `is_active === 2`:
- Switch renders with pending indicator (amber/warning style)
- Edit button is blocked when pending
- The `normalise()` function in each component MUST keep raw `is_active` value — never convert to Boolean
