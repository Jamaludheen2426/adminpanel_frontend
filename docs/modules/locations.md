# Locations Module

## Purpose
Hierarchical geographic data management: Countries → States → Cities → Localities (with Districts and Pincodes as intermediate models). Supports CSV bulk import. All sub-entities support `is_active` with approval workflow.

## Frontend
- **Route:** `/admin/locations` (single page with 4 tabs)
- **Hook:** `src/hooks/use-locations.ts`
- **Components (tabs):**
  - `src/app/admin/locations/_components/countries-tab.tsx`
  - `src/app/admin/locations/_components/states-tab.tsx`
  - `src/app/admin/locations/_components/cities-tab.tsx`
  - `src/app/admin/locations/_components/localities-tab.tsx`

### Hook Functions
```
useCountries({ page, limit })           useCreateCountry()    useUpdateCountry()    useDeleteCountry()
useStates({ page, limit, country_id })  useCreateState()      useUpdateState()      useDeleteState()
useCities({ page, limit, state_id })    useCreateCity()       useUpdateCity()       useDeleteCity()
useLocalities({ page, limit, city_id }) useCreateLocality()   useUpdateLocality()   useDeleteLocality()
```

### Dialog Type (all 4 tabs)
- Each tab has a create/edit **Dialog** (not page-level form)
- Dialogs use `flex flex-col overflow-y-hidden` with `maxHeight: '85vh'` for scroll
- CSV bulk import dialogs: same `flex flex-col overflow-y-hidden` pattern

### is_active Pending State Fix (all 4 tabs)
- `normalise()`: keeps raw `is_active` value (NOT `Boolean(item.is_active)`)
- `openEdit()`: guard `if (Number(x.is_active) === 2) return;` + `is_active: Number(x.is_active) === 1`
- Uses `CommonTable` → pending state handled via raw number

## Backend
- **Route prefix:** `/api/v1/locations`
- **File:** `src/routes/location.routes.js`

### Endpoints
| Method | Path | Notes |
|--------|------|-------|
| GET | /countries | public list |
| GET | /states | list, optionally filtered by country_id |
| GET | /states/:countryId | states for a country |
| GET | /districts | list |
| GET | /districts/:stateId | |
| GET | /cities | list, optionally filtered |
| GET | /cities/:districtId | |
| GET | /pincodes/:districtId | |
| POST | /countries | + approval |
| PUT | /countries/:id | + approval |
| DELETE | /countries/:id | + approval |
| POST | /states | + approval |
| PUT | /states/:id | + approval |
| DELETE | /states/:id | + approval |
| POST | /districts | + approval |
| PUT | /districts/:id | + approval |
| DELETE | /districts/:id | + approval |
| POST | /cities | + approval |
| PUT | /cities/:id | + approval |
| DELETE | /cities/:id | + approval |
| POST | /pincodes | + approval |
| PUT | /pincodes/:id | + approval |
| DELETE | /pincodes/:id | + approval |
| POST | /countries/bulk | CSV bulk import |
| POST | /states/bulk | CSV bulk import |
| POST | /districts/bulk | CSV bulk import |
| POST | /cities/bulk | CSV bulk import |

## DB Tables
| Table | Fields |
|-------|--------|
| `countries` | id, company_id, name, code (VARCHAR 3), phone_code, currency_id, is_default (TINYINT), is_active (TINYINT 0/1/2), flag |
| `states` | id, company_id, country_id (FK), name, code, is_default (TINYINT), is_active (TINYINT 0/1/2) |
| `districts` | id, company_id, state_id (FK), name, is_active |
| `cities` | id, company_id, district_id (FK, nullable), state_id (FK), name, is_default (TINYINT), is_active (TINYINT 0/1/2) |
| `localities` | id, company_id, city_id (FK), name, pincode, is_default (TINYINT), is_active (TINYINT 0/1/2) |
| `pincodes` | id, company_id, district_id (FK), pincode (VARCHAR), is_active |

All tables: soft-delete (`paranoid: true`)

## Approval Workflow
All create/update/delete operations for countries, states, cities, localities go through the approval workflow.
Frontend hooks must use `isApprovalRequired(error)` in `onError` for all three mutations on each entity.

## Permissions
- `locations.view`, `locations.create`, `locations.edit`, `locations.delete`

## Special Behaviors
- CSV bulk import available for countries, states, districts, cities
- `is_default` flag on countries/states/cities — used for default selection in dropdowns (e.g., vendor address forms)
- States tab filters its country dropdown to only show `is_active = 1` countries
- `disabled={Boolean(row.is_default) || !row.is_active || mutation.isPending}` — default rows cannot have status toggled
