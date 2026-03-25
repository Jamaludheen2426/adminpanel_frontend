# Ads & Ad Banners Module

## Purpose
Manage display advertisements (image/google adsense) and the banner containers they belong to. Ads can be scheduled, targeted by device, and tracked by click count.

---

## Ad Banners

### Frontend
- **Route:** `/admin/banners`
- **Hook:** `src/hooks/use-ad-banners.ts`
  - `useAdBanners({ page, limit })`, `useCreateAdBanner()`, `useUpdateAdBanner()`, `useDeleteAdBanner()`
- **Sidebar permission:** `banners.view`

### Backend
- **Route prefix:** `/api/v1/banners`
- **File:** `src/routes/adBanner.routes.js`

| Method | Path | Permission |
|--------|------|------------|
| GET | / | banners.view |
| GET | /:id | banners.view |
| POST | / | banners.create |
| PUT | /:id | banners.edit |
| DELETE | /:id | banners.delete |

### DB Table: `ad_banners`
Fields: id, company_id, name (VARCHAR 255), description (TEXT), type (JSON — device targets), desktop_width/height (INTEGER), tablet_width/height (INTEGER), mobile_width/height (INTEGER), is_active (TINYINT 0/1/2), created_by, updated_by
Soft-delete: `paranoid: true`

---

## Ads

### Frontend
- **Route:** `/admin/ads`
- **Hook:** `src/hooks/use-ads.ts`
  - `useAds({ page, limit })`, `useCreateAd()`, `useUpdateAd()`, `useDeleteAd()`
- **Component:** `src/app/admin/ads/_components/ads-content.tsx`
  - `normalise()`: keeps raw `is_active` value (no Boolean conversion)
  - `onEdit` guard: `(row) => Number(row.is_active) !== 2 && setEditAd(row)` — blocks editing pending items
- **Sidebar permission:** `ads.view`

### Backend
- **Route prefix:** `/api/v1/ads`
- **File:** `src/routes/ad.routes.js`

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| GET | /public/active | public | extractCompanyContext only |
| GET | / | ads.view | |
| GET | /:id | ads.view | |
| POST | / | ads.create | |
| PUT | /:id | ads.edit | |
| DELETE | /:id | ads.delete | |

### DB Table: `ads`
Fields: id, company_id, name (VARCHAR 255), title (TEXT), subtitle (TEXT), button_label (VARCHAR 255), key (VARCHAR 100, unique per company), sort_order (INTEGER), ads_type (ENUM: custom/google_adsense), url (VARCHAR 500), target (VARCHAR 20 — _blank/_self), image/tablet_image/mobile_image (VARCHAR 500), google_adsense_slot_id (VARCHAR 100), banner_id (INTEGER FK→ad_banners), location (VARCHAR 100 default 'not_set'), is_scheduled (TINYINT), started_at/expired_at (DATE), clicked (INTEGER — click counter), is_active (TINYINT 0/1/2)
Soft-delete: `paranoid: true`
Association: `Ad.belongsTo(AdBanner)` via `banner_id`

---

## Approval Workflow
- Ad Banners: no approval workflow documented (standard CRUD)
- Ads: no approval workflow (standard CRUD)
- `is_active` field supports 0/1/2 (pending) — normalise must keep raw value

## is_active Pending State
- Ads `normalise()`: `is_active: item.is_active` (raw, NOT Boolean)
- `onEdit` guard prevents editing pending ads

## Special Behaviors
- `ads_type: 'google_adsense'` uses `google_adsense_slot_id` instead of image
- `ads_type: 'custom'` uses image/tablet_image/mobile_image + url + target
- `location` field maps ads to page positions (e.g., 'sidebar', 'header', 'not_set')
- `is_scheduled`: when enabled, ad only shows between `started_at` and `expired_at`
- `clicked` counter incremented by public endpoint when user clicks ad
- Public endpoint `GET /public/active` used by frontend client to display active ads
