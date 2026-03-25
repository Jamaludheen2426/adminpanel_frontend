# Contacts Module

## Purpose
Public contact form submissions. Admin views messages, sends a single reply email per contact, and marks them read/unread.

## Frontend
- **Routes:**
  - `/admin/contacts` — list (read/unread filter)
  - `/admin/contacts/[id]` — detail page with reply form
- **Hook:** `src/hooks/use-contacts.ts`
  - `useContacts({ page, limit, status })` — paginated list
  - `useContact(id)` — single contact with reply
  - `useUnreadContactCount()` — GET /unread-count
  - `useUpdateContactStatus()` — PUT /:id/status
  - `useReplyContact()` — POST /:id/reply (sends email)
  - `useDeleteContact()` — DELETE /:id

## Backend
- **Route prefix:** `/api/v1/contacts`
- **File:** `src/routes/contact.routes.js`

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | /public | public (extractCompanyContext) | User submits contact form |
| GET | /unread-count | isAuthenticated | Badge count for sidebar |
| GET | / | isAuthenticated | List with status filter |
| GET | /:id | isAuthenticated | Single contact + replies |
| PUT | /:id/status | isAuthenticated | Mark read/unread |
| POST | /:id/reply | isAuthenticated | Send reply email + mark read |
| DELETE | /:id | isAuthenticated | Soft-delete |

## DB Tables
### `contacts`
Fields: id, company_id, name (VARCHAR 255), email (VARCHAR 255), phone (VARCHAR 50), address (VARCHAR 500), subject (VARCHAR 500), content (TEXT), status (ENUM: unread/read, default 'unread')
Soft-delete: `paranoid: true`

### `contact_replies`
Fields: id, contact_id (FK→contacts), message (TEXT), created_by (FK→users), company_id
No soft-delete (paranoid: false)

## Flow
1. User submits public form → creates `contacts` record with `status: 'unread'`
2. Admin views list → unread count shown in sidebar badge
3. Admin opens contact → reads message
4. Admin sends reply via `RichEditor` → selects email config → POST /:id/reply
   - Sends email directly (sendDirect, no template)
   - Creates `contact_replies` record
   - Updates contact `status` to `'read'`
5. After reply, reply form is **hidden** — only one reply per contact allowed
6. Admin can manually mark read/unread via PUT /:id/status

## Special Behaviors
- **Single reply only**: once a reply is sent, the reply form disappears and the sent reply is displayed
- No conversation threading — no back-and-forth email chain
- Reply uses selected email config (not a predefined template)
- Reply editor uses `RichEditor` (custom WYSIWYG, not react-quill)

## Permissions
- No explicit permission slugs — uses `isAuthenticated` only (all logged-in admins can view contacts)
