# Blog Module

## Purpose
Full blog CMS: posts with rich content, SEO fields, categories (M:M), tags (M:M), author assignment, featured image, and active/featured status.

---

## Blog Posts

### Frontend
- **Routes:**
  - `/admin/blog` — list page
  - `/admin/blog/create` — create form (full page)
  - `/admin/blog/[id]` — edit form (full page)
- **Hook:** `src/hooks/use-blog-posts.ts`
  - `useBlogPosts({ page, limit, search, category_id, tag_id, is_active })` — paginated list
  - `useBlogPost(id)` — single post
  - `useCreateBlogPost()` — POST
  - `useUpdateBlogPost()` — PUT
  - `useDeleteBlogPost()` — DELETE
- **Form component:** `src/app/admin/blog/_components/blog-post-form.tsx`
  - Uses `CommonForm` with React Hook Form + Zod
  - `content` field: `RichTextEditor` (react-quill-new), required, uses HTML-stripping refine validation
  - `is_active` defaultValues: `Number(defaultValues.is_active) === 1` (NOT Boolean)
  - `is_featured`: `Boolean(defaultValues?.is_featured)` — safe (no approval on featured)

### Backend
- **Route prefix:** `/api/v1/blog-posts`
- **File:** `src/routes/blogPost.routes.js`

| Method | Path | Notes |
|--------|------|-------|
| GET | / | paginated, filterable |
| GET | /:id | includes categories + tags |
| POST | / | creates post + category/tag associations |
| PUT | /:id | updates post + reassigns categories/tags |
| DELETE | /:id | soft-delete |

### DB Tables
| Table | Notes |
|-------|-------|
| `blog_posts` | Main table. Fields: id, company_id, author_id (FK→users), title, slug (unique, stamped on delete), description, content (LONGTEXT), image, is_featured (TINYINT), is_active (TINYINT 0/1/2), seo_title, seo_description |
| `blog_post_categories` | Junction: blog_post_id + blog_category_id |
| `blog_post_tags` | Junction: blog_post_id + blog_tag_id |

---

## Blog Categories

### Frontend
- **Route:** `/admin/blog-categories`
- **Hook:** `src/hooks/use-blog-categories.ts`
  - `useBlogCategories()`, `useCreateBlogCategory()`, `useUpdateBlogCategory()`, `useDeleteBlogCategory()`
  - `useUpdateBlogCategoryStatus()` — PATCH /status (NO approval)
- **Component:** `src/app/admin/blog-categories/_components/blog-categories-content.tsx`
  - `openEdit`: guard `if (Number(item.is_active) === 2) return` + `is_active: Number(item.is_active) === 1`

### Backend
- **Route prefix:** `/api/v1/blog-categories`

| Method | Path | Notes |
|--------|------|-------|
| GET | / | list with pagination |
| GET | /:id | |
| POST | / | |
| PUT | /:id | |
| DELETE | /:id | |
| PATCH | /:id/status | NO approval |

### DB Table: `blog_categories`
Fields: id, company_id, name, slug (unique, stamped on delete), description, image, sort_order, is_active (0/1/2), created_by, updated_by

---

## Blog Tags

### Frontend
- **Route:** `/admin/blog-tags`
- **Hook:** `src/hooks/use-blog-tags.ts`
  - `useBlogTags()`, `useCreateBlogTag()`, `useUpdateBlogTag()`, `useDeleteBlogTag()`
  - `useUpdateBlogTagStatus()` — PATCH /status (NO approval)
- **Component:** `src/app/admin/blog-tags/_components/blog-tags-content.tsx`
  - `openEdit`: guard `if (Number(item.is_active) === 2) return` + `is_active: Number(item.is_active) === 1`

### Backend
- **Route prefix:** `/api/v1/blog-tags`

| Method | Path | Notes |
|--------|------|-------|
| GET | / | list |
| GET | /:id | |
| POST | / | |
| PUT | /:id | |
| DELETE | /:id | |
| PATCH | /:id/status | NO approval |

### DB Table: `blog_tags`
Fields: id, company_id, name, slug (unique, stamped on delete), is_active (0/1/2), created_by, updated_by

---

## Approval Workflow
- Blog Posts: no approval workflow (standard CRUD)
- Blog Categories: no approval — status toggle via PATCH /status
- Blog Tags: no approval — status toggle via PATCH /status

## Special Behaviors
- `content` field in blog-post-form: MUST use HTML-stripping refine — Quill's empty state is `<p><br></p>` which bypasses `min(1)`
- Slug auto-generated from title on create, can be manually edited
- Author assigned from current user or selectable from users list
- Categories and tags are M:M via junction tables; sent as arrays of IDs on create/update
