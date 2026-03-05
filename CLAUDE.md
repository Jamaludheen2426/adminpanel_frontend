# AdminPanel Frontend — CLAUDE.md

## Project Overview
Next.js 15.1 admin dashboard with TypeScript. Multi-tenant, role-based access control (RBAC), approval workflows, and extensive content management. Built with React 19, Shadcn/ui, TanStack Query, and Tailwind CSS.

## Tech Stack
- **Framework:** Next.js 15.1 (App Router) + React 19 + TypeScript 5.7
- **UI:** Shadcn/ui (new-york style) + Radix UI + Tailwind CSS 3.4 + Lucide icons
- **State/Data:** TanStack React Query v5 (server state) + React Context (app state)
- **HTTP:** Axios via `/api/proxy/v1/*` (Next.js proxy route)
- **Forms:** React Hook Form + Zod validation
- **Auth:** JWT via HttpOnly cookies + Google OAuth
- **Notifications:** Sonner (toast)
- **Tables:** TanStack Table v8
- **Editor:** React Quill New

## Project Structure
```
src/
├── app/
│   ├── admin/         # 25+ dashboard routes
│   ├── auth/          # login, register, forgot-password, reset, verify-email
│   └── api/
│       └── proxy/     # Backend proxy (cookie handling)
├── components/
│   ├── ui/            # Shadcn primitives
│   ├── admin/         # Admin-specific components + app-sidebar
│   ├── common/        # Shared: table, editor, image-cropper, delete-dialog
│   ├── layout/        # navbar, sidebar, breadcrumb, footer
│   ├── guards/        # permission-guard, Can component
│   └── providers/     # theme, analytics, appearance
├── hooks/             # 40+ custom data hooks (one per resource)
├── lib/
│   ├── api-client.ts  # Axios instance + response handling
│   ├── query-client.ts # TanStack Query config + queryKeys factory
│   ├── auth-utils.ts  # Permission helpers
│   ├── helpers.ts     # Date formatting
│   └── validation.ts  # Zod schemas
├── contexts/          # CompanyContext, TranslationContext
├── providers/         # QueryProvider, TranslationProvider
├── types/             # TypeScript interfaces
└── middleware.ts      # Auth route protection
```

## Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_APP_NAME=Admin Dashboard
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Dev Commands
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

## API Integration Pattern
All backend calls go through the Next.js proxy:
```
Browser → /api/proxy/v1/* → Next.js Route Handler → Backend (localhost:5000/api/v1/*)
```
- Proxy handles cross-domain cookie setting
- Axios baseURL is `/api/proxy/v1` (not backend URL directly)
- `X-Company-Id` header auto-added from localStorage on every request
- 401 responses auto-redirect to `/auth/login`
- HTTP 202 or `approval_required: true` = `ApprovalRequiredError`

## API Response Format
```typescript
// Success
{ success: true, data: T, message?: string }

// Paginated
{ success: true, data: T[], pagination: { page, limit, totalItems, totalPages, hasNextPage, hasPrevPage } }

// Error
{ success: false, message: string, errors?: string[] }

// Approval required (HTTP 202)
{ approval_required: true, message: string, data: {...} }
```

## Authentication Flow
1. Login → POST `/api/proxy/v1/auth/login`
2. Backend sets `access_token` + `refresh_token` HttpOnly cookies
3. Frontend sets temporary `auth_pending` cookie (15s) for middleware
4. Redirect to `/admin`
5. Middleware checks cookies; unauthenticated → `/auth/login`

## State Management
- **Server state:** TanStack Query (staleTime: 10min, cacheTime: 15min)
- **Company context:** `CompanyContext` — `currentCompanyId`, `isDeveloper`, `userRoleLevel`
- **Translations:** `TranslationContext` — `t()`, `language`, `setLanguage`
- **No Redux/Zustand** — React Query + Context is the pattern

## Permission System
```typescript
// In components
import { Can } from '@/components/guards/permission-guard'
<Can permission="users.create">...</Can>

// In hooks/utils
import { hasPermission, hasAnyPermission } from '@/lib/auth-utils'
hasPermission(user, 'posts.create')

// Role hierarchy levels
Developer=1000, SuperAdmin=100, Admin=50, SubAdmin=25, Custom=10
```

## Data Hooks Pattern
Every resource has a hook in `src/hooks/`. Pattern:
```typescript
// List with pagination
const { data, isLoading } = useUsers({ page: 1, limit: 10 })

// Single item
const { data } = useUser(id)

// Mutations
const { mutate: createUser } = useCreateUser()
const { mutate: updateUser } = useUpdateUser()
const { mutate: deleteUser } = useDeleteUser()
```

## Query Keys (Cache Invalidation)
All keys are in `lib/query-client.ts` → `queryKeys` factory:
```typescript
queryKeys.users.list()
queryKeys.users.detail(id)
queryKeys.auth.me()
queryKeys.settings.group('general')
// etc.
```

## Key Admin Modules
| Module | Route | Hook |
|--------|-------|------|
| Users | `/admin/platform/users` | `use-users.ts` |
| Roles | `/admin/platform/roles` | `use-roles.ts` |
| Blog | `/admin/blog` | `use-blog-posts.ts` |
| Media | `/admin/media` | `use-media-files.ts` |
| Settings | `/admin/settings/*` | `use-settings.ts` |
| Companies | `/admin/companies` | `use-companies.ts` |
| Approvals | `/admin/approvals` | `use-approvals.ts` |
| Plugins | `/admin/plugins` | `use-plugins.ts` |
| Payments | `/admin/payments` | `use-payments.ts` |
| Ads | `/admin/ads` | `use-ads.ts` |
| Ad Banners | `/admin/banners` | `use-ad-banners.ts` |
| Translations | `/admin/settings/translations` | `use-translations.ts` |
| Email | `/admin/settings/email` | `use-email-configs.ts` |
| Contact | `/admin/contacts` | `use-contacts.ts` |

## Contact Module Design
- **Flow:** User submits public contact form → Admin reads → Admin sends ONE reply email → Done
- **Single reply only:** Admin can reply once per contact. After reply is sent, the reply form is hidden and the sent reply is displayed.
- **Status:** `unread` (new) → `read` (admin replied or manually marked)
- **Reply:** Uses `RichEditor` (WYSIWYG). Sends via selected email config (`sendDirect`, no template). Marks contact as `read` after sending.
- **No conversation threading** — no inbound/outbound reply chain.

## Approval Workflow
- Some mutations return HTTP 202 with `approval_required: true`
- This throws `ApprovalRequiredError` (in `api-client.ts`)
- Show toast: "Your request has been submitted for approval"
- Hooks auto-invalidate `queryKeys.approvals` on this error

## Routing Conventions
- Dynamic routes: `[id]` for resources, `[...path]` for catch-all, `[gateway]` for payment gateways
- Protected routes via `src/middleware.ts` (checks `access_token` / `refresh_token` cookies)
- Public routes: `/auth/*`, `/coming-soon`
- `/install` is disabled (hardcoded redirect to `/admin`)

## Component Conventions
- Use `shadcn/ui` components from `@/components/ui/`
- Forms: always use `react-hook-form` + Zod schema + `@hookform/resolvers/zod`
- Tables: use `CommonTable` or `DataTable` from `@/components/common/`
- Delete actions: use `DeleteDialog` from `@/components/common/delete-dialog.tsx`
- Rich text: `HtmlEditor` or `RichEditor` from `@/components/common/`
- Toast notifications: `import { toast } from 'sonner'`

## Image / File Handling
- Backend images served via `/uploads/*` (rewritten to backend in `next.config.ts`)
- Image proxy API route: `/api/proxy-image`
- Upload via `useUploadMedia()` or form with `multipart/form-data`
- **Crop (upload-time):** `ImageCropper` from `@/components/common/image-cropper.tsx`
  - For new file uploads (file input → crop → `onImageCropped(file)` callback)
  - Fixed aspect ratio, 90×90 preview thumbnail, zoom + reset
  - Used in: Blog, Ads, Blog Categories, Settings branding, Testimonials, Install wizard
- **Crop (existing file):** `MediaCropDialog` from `@/components/common/media-crop-dialog.tsx`
  - For cropping server-side image URLs (URL → crop → `onCropped(file, dataUrl)` callback)
  - Free-form aspect ratio, returns cropped `File` + data URL for immediate local preview
  - Used in: Media Library module (replaces original file on save)

## Dark Mode
- Provider: `next-themes` with class strategy
- Tailwind dark mode: `dark:` prefix
- Colors defined as CSS variables in `tailwind.config.ts`

## Common Issues & Patterns
- **CORS/Cookie issues:** All API calls must go through `/api/proxy/` — never call backend directly from browser
- **Company isolation:** Always pass `X-Company-Id` (handled automatically by `api-client.ts`)
- **Permission check before render:** Wrap restricted UI with `<Can permission="...">` or check `hasPermission(user, '...')`
- **Approval-aware mutations:** Catch `ApprovalRequiredError` and show appropriate feedback
