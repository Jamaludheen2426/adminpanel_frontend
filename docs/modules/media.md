# Media Library Module

## Purpose
File/folder management for uploaded assets. Supports image upload, folder creation, rename, copy, move, delete. 10 MB per file limit.

## Frontend
- **Route:** `/admin/media`
- **Hooks:**
  - `src/hooks/use-media-files.ts` — main CRUD hook
    - `useMediaFiles({ folder, page, limit })` — list files in folder
    - `useUploadMedia()` — POST /upload (approval-aware)
    - `useDeleteMedia()` — DELETE (approval-aware)
    - `useCreateFolder()` — POST /folder
    - `useRenameMedia()` — POST /rename
    - `useCopyMedia()` — POST /copy
    - `useMoveMedia()` — POST /move
  - `src/hooks/use-media.ts` — utility hook for media picker in other modules
- **Component:** `src/app/admin/media/_components/media-library-content.tsx`

### Upload Constraints
- Max **10 MB per file** — enforced in `handleUpload` before calling API
- Files over limit: show toast error, skip the file
- UI hint: "Max 10 MB per file" shown next to Upload button

### Image Crop (Two Modes)
1. **Upload-time crop** (`ImageCropper` — `src/components/common/image-cropper.tsx`):
   - New file input → crop → `onImageCropped(file)` callback
   - Fixed aspect ratio, 90×90 preview, zoom + reset
   - Used in: Blog, Ads, Blog Categories, Settings branding, Testimonials, Install wizard

2. **Existing file crop** (`MediaCropDialog` — `src/components/common/media-crop-dialog.tsx`):
   - Server-side image URL → crop → `onCropped(file, dataUrl)` callback
   - Free-form aspect ratio, returns cropped `File` + data URL
   - Used in: Media Library (replaces original file on save)

## Backend
- **Route prefix:** `/api/v1/media`
- **File:** `src/routes/media.routes.js`

| Method | Path | Permission | Approval |
|--------|------|------------|----------|
| GET | /files | media.view | No |
| POST | /folder | media.upload | No |
| POST | /upload | media.upload | Yes |
| POST | /upload-multiple | media.upload | Yes |
| POST | /rename | media.edit | No |
| POST | /copy | media.edit | No |
| POST | /move | media.edit | No |
| DELETE | / | media.delete | Yes |

## Storage
- Files stored in `uploads/` directory on backend server
- Backend images served via Next.js rewrite: `/uploads/*` → `backend:5000/uploads/*` (configured in `next.config.ts`)
- Image proxy API route: `/api/proxy-image`

## Approval Workflow
Upload and delete go through approval (`isApprovalRequired` check in `use-media-files.ts`).

## Permissions
- `media.view`, `media.upload`, `media.edit`, `media.delete`
