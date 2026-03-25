# Vendors Module

## Purpose
Manage vendor accounts (companies/businesses) in the admin panel. Vendors also have a separate self-service portal (`D:\Jamal\vendor_portal`). The admin panel handles CRUD only — vendor portal handles vendor login/session separately.

## ⚠️ Critical Architecture Note
The vendor portal is a **completely separate Next.js app** at `D:\Jamal\vendor_portal` (port 3001).
- AdminPanel `use-vendors.ts` has admin CRUD hooks ONLY — no `useVendorMe`, `useVendorLogout`, `useUpdateVendorProfile`, etc.
- AdminPanel middleware does NOT handle vendor cookies
- Vendor auth uses: `vendor_access_token`, `vendor_refresh_token`, `vendor_auth_pending` cookies
- Admin auth uses: `access_token`, `refresh_token`, `auth_pending` cookies

## Frontend (AdminPanel)
- **Routes:**
  - `/admin/vendors` — list
  - `/admin/vendors/new` — create form (full page)
  - `/admin/vendors/[id]/edit` — edit form (full page)
- **Hook:** `src/hooks/use-vendors.ts`
  - `useVendors({ page, limit, search, status })` — paginated list
  - `useVendor(id)` — single vendor
  - `useCreateVendor()` — POST
  - `useUpdateVendor()` — PUT
  - `useUpdateVendorStatus()` — PATCH /:id/status (NO approval)
  - `useDeleteVendor()` — DELETE
- **Form:** `src/app/admin/vendors/_components/vendor-form.tsx` — uses `CommonForm` with 3 sections

### Form Sections
1. **Company Info**: company_name, company_logo (300×100px preview), location, country/state/city/pincode, latitude, longitude, reg_no, gst_no, company_address, company_contact, landline, company_email, website, social links (youtube, facebook, instagram, twitter, linkedin, tiktok, telegram, pinterest, whatsapp)
2. **Vendor Info**: name, profile image, address, contact, email, password (optional on edit), membership
3. **Bank Info**: bank_name, acc_no, ifsc_code, acc_type, branch, bank_logo

### Date Normalization
Vendor model uses `timestamps: true` WITHOUT `createdAt: 'created_at'` override → API returns `createdAt` (camelCase).
Normalize in list component: `created_at: v.created_at || v.createdAt || ''`

## Backend
- **Route prefix:** `/api/v1/vendors`
- **File:** `src/routes/vendor.routes.js`

| Method | Path | Auth | Permission | Notes |
|--------|------|------|------------|-------|
| POST | /auth/login | public | — | Vendor login → sets vendor cookies |
| POST | /auth/logout | isVendorAuthenticated | — | Clears vendor cookies |
| GET | /auth/me | isVendorAuthenticated | — | Current vendor profile |
| PUT | /auth/profile | isVendorAuthenticated | — | Update vendor profile |
| POST | /auth/change-password | isVendorAuthenticated | — | |
| GET | /auth/activity | isVendorAuthenticated | — | Activity log |
| GET | / | isAuthenticated | vendors.view | Admin list |
| GET | /:id | isAuthenticated | vendors.view | Admin single |
| POST | / | isAuthenticated | vendors.create | Admin create |
| PUT | /:id | isAuthenticated | vendors.edit | Admin update |
| PATCH | /:id/status | isAuthenticated | vendors.edit | **NO approval** |
| DELETE | /:id | isAuthenticated | vendors.delete | |

## DB Table: `vendors`
Soft-delete: `paranoid: true` → **table MUST have `deleted_at` column**

**Company Info:** company_name (VARCHAR 255), company_logo (VARCHAR 500), country_id/state_id/city_id/pincode_id (INTEGER), latitude/longitude (DECIMAL 10,7), reg_no/gst_no (VARCHAR 100), company_address (TEXT), company_contact/landline (VARCHAR 20), company_email (VARCHAR 255), website/youtube/facebook/instagram/twitter/linkedin/tiktok/telegram/pinterest (VARCHAR 500), whatsapp (VARCHAR 100)

**Vendor Info:** name (VARCHAR 200), profile (VARCHAR 500), address (TEXT), contact (VARCHAR 20), email (VARCHAR 255, unique), password (VARCHAR 255 — bcrypt), membership (ENUM: basic/silver/gold/platinum)

**Bank Info:** bank_name (VARCHAR 200), acc_no (VARCHAR 100), ifsc_code (VARCHAR 50), acc_type (ENUM: savings/current/overdraft), branch (VARCHAR 200), bank_logo (VARCHAR 500)

**Meta:** status (ENUM: active/inactive), company_id

Password: bcrypt hooks on create/update. `toJSON()` strips password from responses.

## Vendor Portal (Separate App)
- **Location:** `D:\Jamal\vendor_portal`
- **Port:** 3001
- **Auth cookies:** `vendor_access_token`, `vendor_refresh_token`, `vendor_auth_pending`
- **JWT payload:** `{ id, email, type: 'vendor' }` — uses `type` field, NOT `role`
- **Backend middleware:** `vendorAuth.js` checks `decoded.type === 'vendor'`
- **Login route:** `src/app/api/vendors/auth/login/route.ts` (dedicated, uses `cookies()` from `next/headers`)

## Approval Workflow
No approval workflow on vendor CRUD.
Status toggle (`PATCH /:id/status`) excluded from approval by design.

## Permissions
`vendors.view`, `vendors.create`, `vendors.edit`, `vendors.delete`
