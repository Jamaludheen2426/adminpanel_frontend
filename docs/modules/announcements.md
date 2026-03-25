# Announcements Module

## Purpose
Site-wide announcements/banners shown to users. Supports scheduling (start/end dates), call-to-action buttons, custom colors, and rich HTML content.

## Frontend
- **Routes:**
  - `/admin/announcements` — list page with inline dialog form
  - `/admin/announcements/create` — full-page create form
  - `/admin/announcements/[id]` — full-page edit form
- **Hook:** `src/hooks/use-announcements.ts`
  - `useAnnouncements({ page, limit })` — paginated list
  - `useAnnouncement(id)` — single item
  - `useCreateAnnouncement()` — POST (approval-aware)
  - `useUpdateAnnouncement()` — PUT (approval-aware)
  - `useDeleteAnnouncement()` — DELETE (approval-aware)
- **Components:**
  - `src/app/admin/announcements/_components/announcements-content.tsx` — list + inline dialog
  - `src/app/admin/announcements/_components/announcement-form.tsx` — full-page form (create/edit)

### Two Form Modes
1. **Inline dialog** (`announcements-content.tsx`): uses `DateTimePicker` + visual `RichTextEditor` (Quill)
2. **Full-page form** (`announcement-form.tsx`): uses `RichTextEditor` with `disableVisual={true}` (source/HTML mode)

### is_active Pending State Fix
- `announcements-content.tsx`: `normalise()` keeps raw `is_active` (no Boolean), `openEdit` guard + `Number === 1`
- `announcement-form.tsx`: `is_active: Number(defaultValues.is_active) === 1` (NOT Boolean)

## Backend
- **Route prefix:** `/api/v1/announcements`
- **File:** `src/routes/announcement.routes.js`

| Method | Path | Approval |
|--------|------|----------|
| GET | / | No |
| GET | /:id | No |
| POST | / | Yes |
| PUT | /:id | Yes |
| DELETE | /:id | Yes |

## DB Table: `announcements`
Fields: id, company_id, name (VARCHAR 255 — internal label), content (LONGTEXT — HTML), start_date/end_date (DATE — null = no limit), has_action (TINYINT 0/1), action_label (VARCHAR 255), action_url (VARCHAR 500), open_in_new_tab (TINYINT 0/1), bg_color (VARCHAR 50 default '#ffffff'), text_color (VARCHAR 50 default '#000000'), is_active (TINYINT 0/1/2), is_deleted (TINYINT)
Soft-delete: `paranoid: true` + `defaultScope: { where: { is_deleted: 0 } }`

## Approval Workflow
All create, update, delete go through approval. Frontend hook uses `isApprovalRequired(error)` in `onError`.

## Permissions
- `announcements.view`, `announcements.create`, `announcements.edit`, `announcements.delete`

## Content Validation (Critical)
`content` field MUST use HTML-stripping refine — Quill's empty state is `<p><br></p>`:
```ts
z.string().refine(
  val => val.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim().length > 0,
  'Content is required'
)
```
**Never use `z.string().min(1)` for RichTextEditor fields.**
