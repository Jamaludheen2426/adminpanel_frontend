# FAQs Module

## Purpose
Manage Frequently Asked Questions grouped into categories. Each FAQ belongs to one category. Both FAQs and categories support `is_active` with approval workflow.

---

## FAQ Categories

### Frontend
There are TWO separate FAQ category pages (different routes, both exist):
1. **`/admin/faq-categories`** — primary standalone route
   - Component: `src/app/admin/faq-categories/_components/faq-categories-content.tsx`
   - Hook: `src/hooks/use-faq-categories.ts`
2. **`/admin/faqs/categories`** — sub-route inside faqs section
   - Component: `src/app/admin/faqs/categories/_components/faq-categories-content.tsx`
   - Uses same hook: `src/hooks/use-faq-categories.ts`

### Hook: `use-faq-categories.ts`
- `useFaqCategories({ page, limit })` — paginated list
- `useCreateFaqCategory()` — POST (approval-aware)
- `useUpdateFaqCategory()` — PUT (approval-aware)
- `useDeleteFaqCategory()` — DELETE (approval-aware)

### Backend
- **Route prefix:** `/api/v1/faq-categories`
- **File:** `src/routes/faqCategory.routes.js`

| Method | Path | Approval |
|--------|------|----------|
| GET | / | No |
| GET | /:id | No |
| POST | / | Yes |
| PUT | /:id | Yes |
| DELETE | /:id | Yes |

### DB Table: `faq_categories`
Fields: id, company_id, name (VARCHAR 255), description (TEXT), sort_order (INTEGER default 0), is_active (TINYINT 0=inactive, 1=active, 2=pending)
Soft-delete: `paranoid: true`

### is_active Pending State Fix
Both category components:
- `openEdit`: `if (Number(item.is_active) === 2) return;` guard
- Form reset: `is_active: Number(item.is_active) === 1`
- Table Switch (inline, non-CommonTable): `checked={Number(row.original.is_active) === 1}`, `disabled={Number(row.original.is_active) === 2 || updateCategory.isPending}`

---

## FAQs

### Frontend
- **Route:** `/admin/faqs`
- **Component:** `src/app/admin/faqs/_components/faqs-content.tsx`
- **Hook:** `src/hooks/use-faqs.ts`
  - `useFaqs({ page, limit, faq_category_id })` — paginated list
  - `useCreateFaq()` — POST (approval-aware)
  - `useUpdateFaq()` — PUT (approval-aware)
  - `useDeleteFaq()` — DELETE (approval-aware)

### Backend
- **Route prefix:** `/api/v1/faqs`
- **File:** `src/routes/faq.routes.js`

| Method | Path | Approval |
|--------|------|----------|
| GET | / | No |
| GET | /:id | No |
| POST | / | Yes |
| PUT | /:id | Yes |
| DELETE | /:id | Yes |

### DB Table: `faqs`
Fields: id, company_id, faq_category_id (INTEGER NOT NULL FK→faq_categories), question (TEXT), answer (LONGTEXT), sort_order (INTEGER default 0), is_active (TINYINT 0/1/2)
Soft-delete: `paranoid: true`

### is_active Pending State Fix
- `openEdit`: `if (Number(item.is_active) === 2) return;` guard
- Form reset: `is_active: Number(item.is_active) === 1`
- Uses `CommonTable` → `pending={Number(row.is_active) === 2}` and `checked={Number(row.is_active) === 1}` handled internally

---

## Approval Workflow
Both FAQs and FAQ Categories go through approval for create, update, delete.
Frontend hooks must use `isApprovalRequired(error)` in `onError` for all three mutations.

## Permissions
- `faq_categories.view`, `faq_categories.create`, `faq_categories.edit`, `faq_categories.delete`
- `faqs.view`, `faqs.create`, `faqs.edit`, `faqs.delete`

## Sidebar
- FAQ Categories: sidebar permission `faq_categories.view`, href `/admin/faq-categories`
- FAQs: sidebar permission `faqs.view`, href `/admin/faqs`
