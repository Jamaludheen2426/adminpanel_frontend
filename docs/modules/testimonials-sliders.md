# Testimonials & Simple Sliders Module

---

## Testimonials

### Purpose
Manage customer/client testimonials with name, designation, image, content, sort order, and active status.

### Frontend
- **Route:** `/admin/testimonials`
- **Hook:** `src/hooks/use-testimonials.ts`
  - `useTestimonials({ page, limit })`, `useCreateTestimonial()`, `useUpdateTestimonial()`, `useDeleteTestimonial()`
- **Component:** `src/app/admin/testimonials/_components/testimonials-content.tsx`
  - `openEdit` guard: `if (Number(item.is_active) === 2) return;` + `is_active: Number(item.is_active) === 1`
  - Image upload uses `ImageCropper` component

### Backend
- **Route prefix:** `/api/v1/testimonials`
- **File:** `src/routes/testimonial.routes.js`

| Method | Path | Approval |
|--------|------|----------|
| GET | / | No |
| GET | /:id | No |
| POST | / | Yes |
| PUT | /:id | Yes |
| DELETE | /:id | Yes |

### DB Table: `testimonials`
Fields: id, company_id, name (VARCHAR 255), designation (VARCHAR 255), content (LONGTEXT), image (VARCHAR 255), sort_order (INTEGER), is_active (TINYINT 0/1/2)
Soft-delete: `paranoid: true`

### Approval Workflow
All create, update, delete go through approval. `isApprovalRequired(error)` check required in hook `onError`.

### Permissions
`testimonials.view`, `testimonials.create`, `testimonials.edit`, `testimonials.delete`

---

## Simple Sliders

### Purpose
Configurable content sliders identified by a unique `key`. Each slider stores its slides as a JSON array (`slider_items`). Unique fields: `key` + `name` (both validated simultaneously on create/update).

### Frontend
- **Route:** `/admin/simple-sliders`
- **Hook:** `src/hooks/use-simple-sliders.ts`
  - `useSimpleSliders({ page, limit })`, `useSimpleSlider(id)`, `useCreateSimpleSlider()`, `useUpdateSimpleSlider()`, `useDeleteSimpleSlider()`
- **Component:** `src/app/admin/simple-sliders/_components/simple-sliders-content.tsx`
  - Date normalization: `created_at: item.created_at || (item as any).createdAt || ''` (model returns camelCase)

### Backend
- **Route prefix:** `/api/v1/simple-sliders`
- **File:** `src/routes/simpleSlider.routes.js`

| Method | Path | Approval |
|--------|------|----------|
| GET | / | No |
| GET | /:id | No |
| POST | / | Yes |
| PUT | /:id | Yes |
| DELETE | /:id | Yes |

### DB Table: `simple_sliders`
Fields: id, company_id, name (VARCHAR 255), key (VARCHAR 255, unique), description (TEXT), is_active (TINYINT 0/1/2), slider_items (JSON default [])
Soft-delete: `paranoid: true`
Unique fields stamped on soft-delete: `key` and `name` (both via `uniqueFields: ['key', 'name']` in `deleteById`)

### Backend Special Behavior
- `simpleSlider.service.js` `create`/`update`: checks uniqueness of BOTH `key` AND `name` simultaneously via `Promise.all` — throws combined error if both conflict
- Delete mutation: on approval, calls `queryClient.invalidateQueries(queryKeys.simpleSliders.all)` even when `isApprovalRequired` — ensures list refreshes after pending approval

### Approval Workflow
All create, update, delete go through approval.
Delete mutation `onError`: must call `invalidateQueries` before checking `isApprovalRequired` — list must refresh to show pending state.

### Permissions
`simple_sliders.view`, `simple_sliders.create`, `simple_sliders.edit`, `simple_sliders.delete`
