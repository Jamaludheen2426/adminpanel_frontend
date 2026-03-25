# Payments Module

## Purpose
Track payment transactions. Supports multiple payment gateways. Admin can view payment history, stats, and update payment status. Gateway-specific configuration handled via Plugins.

## Frontend
- **Routes:**
  - `/admin/payments` — list + stats
  - `/admin/payments/[gateway]` — gateway-specific configuration (e.g., stripe)
- **Hook:** `src/hooks/use-payments.ts`
  - `usePayments({ page, limit, status, gateway })` — paginated list with filter
  - `usePaymentStats()` — GET /stats (total, by status)
  - `usePayment(id)` — single payment detail
  - `useCreatePayment()` — POST (admin creates manual payment)
  - `useUpdatePaymentStatus()` — PATCH /:id/status

## Backend
- **Route prefix:** `/api/v1/payments`
- **File:** `src/routes/payment.routes.js`

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| GET | /stats | payments.view | Aggregate totals by status |
| GET | / | payments.view | Paginated list |
| GET | /:id | payments.view | Single payment |
| POST | / | payments.create | Manual payment entry |
| PATCH | /:id/status | payments.manage | Update status |

## DB Table: `payments`
Fields: id, company_id, user_id (FK→users), amount (DECIMAL 12,2), currency (VARCHAR 10), status (ENUM: pending/completed/failed/refunded/cancelled), gateway (VARCHAR 50 — e.g. 'stripe', 'paypal'), gateway_transaction_id (VARCHAR 255), description (TEXT), metadata (JSON)
Soft-delete: `paranoid: true`

## Payment Gateways
Gateway configuration is managed via the **Plugins** module:
- Stripe: `/admin/plugins/stripe` or `/admin/payments/stripe`
- Gateway config stored in `settings` table under the plugin's `config_group`

## Approval Workflow
No approval workflow on payments.

## Permissions
- `payments.view`, `payments.create`, `payments.manage`

## Status Flow
```
pending → completed
pending → failed
completed → refunded
any → cancelled
```
