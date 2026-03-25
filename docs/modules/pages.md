# Pages Module (CMS)

## Purpose
CMS-style static page management. Pages have JSON block-based content, SEO fields, featured image, translations per language, and status (active/inactive/pending). SuperAdmin+ required for status changes.

## Frontend
- **Routes:**
  - `/admin/pages` — list
  - `/admin/pages/create` — create form (full page)
  - `/admin/pages/[id]` — edit form (full page)
- **Hook:** `src/hooks/use-pages.ts`
  - `usePages({ page, limit, search, status })` — paginated list
  - `usePage(id)` — single page
  - `useCreatePage()` — POST
  - `useUpdatePage()` — PUT
  - `useDeletePage()` — DELETE
  - `useUpdatePageStatus()` — PATCH /:id/status (minLevel: 100 — SuperAdmin+)
  - `useGetPageTranslations(id)` — GET /:id/translations
  - `useUpdatePageTranslation()` — PUT /:id/translations/:lang

## Backend
- **Route prefix:** `/api/v1/pages`
- **File:** `src/routes/page.routes.js`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /public | public (extractCompanyContext) | Active pages only |
| GET | /public/slug/:slug | public | Single page by slug |
| GET | / | isAuthenticated | Admin list |
| GET | /:id | isAuthenticated | Single page |
| POST | / | isAuthenticated | |
| PUT | /:id | isAuthenticated | |
| DELETE | /:id | isAuthenticated | |
| PATCH | /:id/status | minLevel: 100 | SuperAdmin+ only |
| GET | /:id/translations | isAuthenticated | |
| PUT | /:id/translations/:lang | isAuthenticated | |

## DB Tables
### `pages`
Fields: id, company_id, name (VARCHAR 255), slug (VARCHAR 255, unique, stamped on delete), template (VARCHAR 100), content (LONGTEXT — JSON blocks), description (TEXT), featured_image (VARCHAR 500), status (TINYINT: 0=inactive, 1=active, 2=pending), is_featured (TINYINT), sort_order (INTEGER), seo_title (VARCHAR 255), seo_description (TEXT), seo_keywords (VARCHAR 500), og_image (VARCHAR 500)
Soft-delete: `paranoid: true`

### `page_translations`
Fields: id, page_id (FK→pages), language_id (FK→languages), title, content (LONGTEXT), description, seo fields...

## Public Endpoints
- `GET /public` — used by frontend website to list active pages for navigation
- `GET /public/slug/:slug` — used by frontend to render a specific page

## Approval Workflow
No approval workflow. Status change requires `minLevel: 100` (SuperAdmin+) on backend.

## Permissions
No explicit permission slugs documented — uses `isAuthenticated` + level check for status.
