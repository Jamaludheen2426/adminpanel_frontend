# Auth Module

## Purpose
Handles admin authentication: login, logout, password reset, profile update, session management via JWT HttpOnly cookies.

## Frontend
- **Routes:** `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`
- **Hook:** `src/hooks/use-auth.ts`
  - `useLogin()` — POST /auth/login → sets cookies → redirect `/admin`
  - `useLogout()` — POST /auth/logout → clears cookies → redirect `/auth/login`
  - `useMe()` — GET /auth/me → returns current user + permissions
  - `useForgotPassword()` — POST /auth/forgot-password
  - `useVerifyResetOtp()` — POST /auth/verify-reset-otp
  - `useResetPassword()` — POST /auth/reset-password
  - `useChangePassword()` — PUT /auth/change-password
  - `useUpdateProfile()` — PUT /auth/update-profile
- **Proxy login route:** `src/app/api/proxy/v1/auth/login/route.ts` — sets HttpOnly cookies from backend Set-Cookie header
- **Middleware:** `src/middleware.ts` — checks `access_token` or `refresh_token` cookies; unauthenticated → `/auth/login`
- **Auth pending cookie:** Frontend sets temporary `auth_pending` cookie (15s) after login for middleware during redirect

## Backend
- **Route prefix:** `/api/v1/auth`
- **File:** `src/routes/auth.routes.js`

### Endpoints
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | /login | public | Returns access+refresh tokens as HttpOnly cookies |
| POST | /forgot-password | public | Sends OTP to email |
| POST | /verify-reset-otp | public | Validates OTP |
| POST | /reset-password | public | Resets password with valid OTP |
| POST | /logout | isAuthenticated | Clears cookies, invalidates refresh token |
| GET | /me | isAuthenticated | Returns user + role + permissions |
| PUT | /change-password | isAuthenticated | |
| PUT | /update-profile | isAuthenticated | |

## DB Tables Affected
| Table | Operation |
|-------|-----------|
| `users` | read (login, me), update (profile, password, last_login_at) |
| `refresh_tokens` | create on login, delete on logout |
| `sessions` | activity tracking |
| `roles` | read (join for permissions) |
| `role_permissions` | read (join for permissions) |
| `permissions` | read (join) |

## JWT Structure
```json
{ "userId": 1, "email": "...", "role": "superadmin", "companyId": 1, "roleLevel": 100 }
```
- `access_token`: short-lived (15min)
- `refresh_token`: long-lived (7d), stored in `refresh_tokens` table

## Permissions
No permission check on auth routes — uses `isAuthenticated` middleware only.

## Special Behaviors
- Google OAuth flow available (`/auth/google`, `/auth/google/callback`)
- `auth_pending` cookie: set by frontend proxy, expires in 15s, tells middleware login is in progress
- 401 response → `api-client.ts` axios interceptor auto-redirects to `/auth/login`
- Password reset uses OTP (not magic link)
- `useMe()` query is the source of truth for logged-in user; cached in TanStack Query under `queryKeys.auth.me()`
