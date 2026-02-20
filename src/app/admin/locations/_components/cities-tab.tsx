'use client';

import { useState, useMemo, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Search, Pencil, Trash2, ArrowUp, ArrowDown, ArrowUpDown,
  Upload, Download, MapPin,
} from 'lucide-react';
import {
  useCities, useCreateCity, useUpdateCity, useDeleteCity,
  useStates, useCountries,
  usePincodes, useCreatePincode, useUpdatePincode, useDeletePincode,
} from '@/hooks/use-locations';
import { apiClient, isApprovalRequired } from '@/lib/api-client';
import { queryClient, queryKeys } from '@/lib/query-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { City, Pincode } from '@/types';
import { toast } from 'sonner';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const citySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  state_id: z.number().optional(),
  country_id: z.number({ required_error: 'Country is required' }),
  slug: z.string().optional(),
  pincode: z.string().optional(),
  sort_order: z.number().default(0),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
});

type CityForm = z.infer<typeof citySchema>;

// ─── Sort types ───────────────────────────────────────────────────────────────

type CitySortKey =
  | keyof Pick<City, 'name' | 'sort_order' | 'is_active' | 'created_at'>
  | 'state_name'
  | 'country_name';
type PincodeSortKey = keyof Pick<Pincode, 'pincode' | 'area_name' | 'is_active' | 'created_at'>;
type SortDirection = 'asc' | 'desc';
interface CitySortConfig { key: CitySortKey; direction: SortDirection }
interface PincodeSortConfig { key: PincodeSortKey; direction: SortDirection }

// ─── Shared SortableHeader ────────────────────────────────────────────────────

function SortableHeader<T extends string>({
  children, sortKey, sortConfig, onSort,
}: {
  children: React.ReactNode;
  sortKey: T;
  sortConfig: { key: T; direction: SortDirection } | null;
  onSort: (key: T) => void;
}) {
  const direction = sortConfig?.key === sortKey ? sortConfig.direction : null;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-left hover:text-foreground transition-colors font-medium"
    >
      {children}
      {direction === 'asc' ? (
        <ArrowUp className="h-3.5 w-3.5" />
      ) : direction === 'desc' ? (
        <ArrowDown className="h-3.5 w-3.5" />
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
      )}
    </button>
  );
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function downloadSampleCSV() {
  const a = document.createElement('a');
  a.href = '/samples/sample_cities.csv';
  a.download = 'sample_cities.csv';
  a.click();
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n').map(l => l.replace(/\r/g, ''));
  const headers = lines[0].split(',').map(h => h.trim());
  return lines
    .slice(1)
    .filter(line => line.trim() !== '')
    .map(line => {
      const vals = line.split(',').map(v => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
      return obj;
    });
}

// ─── Pincode Management Dialog ────────────────────────────────────────────────

interface PincodeForm {
  pincode: string;
  area_name: string;
  is_active: boolean;
}

function PincodeManageDialog({ city, open, onOpenChange }: {
  city: City;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [editPincode, setEditPincode] = useState<Pincode | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ label: string; onConfirm: () => void } | null>(null);
  const [pincodeSortConfig, setPincodeSortConfig] = useState<PincodeSortConfig | null>(null);
  const [pincodeSearch, setPincodeSearch] = useState('');

  const { data: pincodes = [], isLoading } = usePincodes(city.id);
  const createPincode = useCreatePincode();
  const updatePincode = useUpdatePincode();
  const deletePincode = useDeletePincode();

  const form = useForm<PincodeForm>({
    defaultValues: { pincode: '', area_name: '', is_active: true },
  });

  const handlePincodeSort = (key: PincodeSortKey) => {
    setPincodeSortConfig(prev => {
      if (prev?.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  };

  const filteredPincodes = useMemo(() => {
    const q = pincodeSearch.toLowerCase();
    let items = pincodes.filter(
      p => p.pincode.toLowerCase().includes(q) || (p.area_name ?? '').toLowerCase().includes(q)
    );
    if (pincodeSortConfig) {
      items = [...items].sort((a, b) => {
        const av = (a[pincodeSortConfig.key] ?? '') as string | boolean;
        const bv = (b[pincodeSortConfig.key] ?? '') as string | boolean;
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return pincodeSortConfig.direction === 'asc' ? cmp : -cmp;
      });
    }
    return items;
  }, [pincodes, pincodeSearch, pincodeSortConfig]);

  const openAddPincode = () => {
    setEditPincode(null);
    form.reset({ pincode: '', area_name: '', is_active: true });
    setAddMode(true);
  };

  const openEditPincode = (p: Pincode) => {
    setEditPincode(p);
    form.reset({ pincode: p.pincode, area_name: p.area_name ?? '', is_active: Boolean(p.is_active) });
    setAddMode(true);
  };

  const onSubmit = async (data: PincodeForm) => {
    if (editPincode) {
      await updatePincode.mutateAsync({ id: editPincode.id, data });
    } else {
      await createPincode.mutateAsync({ ...data, city_id: city.id });
    }
    setAddMode(false);
    setEditPincode(null);
  };

  const isPending = createPincode.isPending || updatePincode.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Pincodes — {city.name}
            </DialogTitle>
            <DialogDescription>Manage postal codes for this city.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search pincodes..."
                  value={pincodeSearch}
                  onChange={e => setPincodeSearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              <Button size="sm" onClick={openAddPincode}>
                <Plus className="mr-1 h-4 w-4" /> Add Pincode
              </Button>
            </div>

            {/* Inline add/edit form */}
            {addMode && (
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="border rounded-md p-4 space-y-3 bg-muted/30"
              >
                <p className="text-sm font-medium">{editPincode ? 'Edit Pincode' : 'New Pincode'}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Pincode *</Label>
                    <Input placeholder="400001" {...form.register('pincode', { required: true })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Area Name</Label>
                    <Input placeholder="Fort" {...form.register('area_name')} />
                  </div>
                  <div className="space-y-1">
                    <Label>Is Active?</Label>
                    <div className="flex items-center h-9">
                      <Controller
                        control={form.control}
                        name="is_active"
                        render={({ field }) => (
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        )}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => { setAddMode(false); setEditPincode(null); }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isPending}>
                    {editPincode ? 'Update' : 'Add'}
                  </Button>
                </div>
              </form>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortableHeader sortKey="pincode" sortConfig={pincodeSortConfig} onSort={handlePincodeSort}>
                        Pincode
                      </SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader sortKey="area_name" sortConfig={pincodeSortConfig} onSort={handlePincodeSort}>
                        Area Name
                      </SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader sortKey="is_active" sortConfig={pincodeSortConfig} onSort={handlePincodeSort}>
                        Status
                      </SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader sortKey="created_at" sortConfig={pincodeSortConfig} onSort={handlePincodeSort}>
                        Created
                      </SortableHeader>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Loading pincodes...</TableCell>
                    </TableRow>
                  ) : filteredPincodes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No pincodes found</TableCell>
                    </TableRow>
                  ) : (
                    filteredPincodes.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.pincode}</TableCell>
                        <TableCell>{p.area_name ?? '–'}</TableCell>
                        <TableCell>
                          <Switch
                            checked={Boolean(p.is_active)}
                            onCheckedChange={checked =>
                              updatePincode.mutate({ id: p.id, data: { is_active: checked } })
                            }
                            disabled={updatePincode.isPending}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {(() => {
                            const d = (p as unknown as { createdAt?: string }).createdAt ?? p.created_at;
                            return d && !isNaN(new Date(d).getTime()) ? new Date(d).toLocaleDateString() : '–';
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditPincode(p)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={deletePincode.isPending}
                              onClick={() =>
                                setDeleteConfirm({
                                  label: `Delete pincode "${p.pincode}"?`,
                                  onConfirm: () => deletePincode.mutate(p.id),
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredPincodes.length} of {pincodes.length} pincodes
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete pincode confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={open => { if (!open) setDeleteConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.label} This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { deleteConfirm?.onConfirm(); setDeleteConfirm(null); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Cities Tab ───────────────────────────────────────────────────────────────

export function CitiesTab() {
  const [search, setSearch] = useState('');
  const [filterCountryId, setFilterCountryId] = useState<string>('all');
  const [filterStateId, setFilterStateId] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<CitySortConfig | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<City | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ label: string; onConfirm: () => void } | null>(null);
  const [pincodeCity, setPincodeCity] = useState<City | null>(null);
  const [csvPreview, setCsvPreview] = useState<Record<string, string>[] | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  const { data: cities = [], isLoading } = useCities();
  const { data: countries = [] } = useCountries();
  const { data: allStates = [] } = useStates();
  const createCity = useCreateCity();
  const updateCity = useUpdateCity();
  const deleteCity = useDeleteCity();

  const form = useForm<CityForm>({
    resolver: zodResolver(citySchema),
    defaultValues: { name: '', slug: '', pincode: '', sort_order: 0, is_active: true, is_default: false },
  });

  const filterStates = useMemo(
    () => filterCountryId === 'all' ? allStates : allStates.filter(s => s.country_id === Number(filterCountryId)),
    [allStates, filterCountryId]
  );

  const dialogStates = useMemo(
    () => selectedCountryId ? allStates.filter(s => s.country_id === selectedCountryId) : allStates,
    [allStates, selectedCountryId]
  );

  // ── Sort ──

  const handleSort = (key: CitySortKey) => {
    setSortConfig(prev => {
      if (prev?.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  };

  // Derive country name: city.country (if API returns it) OR via city.state.country OR via allStates lookup
  const getCityCountryName = (city: City): string => {
    return (
      city.country?.name ??
      city.state?.country?.name ??
      allStates.find(s => s.id === city.state_id)?.country?.name ??
      countries.find(c => c.id === city.country_id)?.name ??
      '–'
    );
  };

  // Derive country_id for filter matching
  const getCityCountryId = (city: City): number | null => {
    return (
      city.country_id ??
      city.state?.country_id ??
      allStates.find(s => s.id === city.state_id)?.country_id ??
      null
    );
  };

  const filteredAndSorted = useMemo(() => {
    const q = search.toLowerCase();
    let items = cities.filter(c => {
      const countryName = getCityCountryName(c);
      const matchSearch =
        c.name.toLowerCase().includes(q) ||
        (c.state?.name ?? '').toLowerCase().includes(q) ||
        countryName.toLowerCase().includes(q);
      const cityCountryId = getCityCountryId(c);
      const matchCountry = filterCountryId === 'all' || cityCountryId === Number(filterCountryId);
      const matchState = filterStateId === 'all' || c.state_id === Number(filterStateId);
      return matchSearch && matchCountry && matchState;
    });
    if (sortConfig) {
      items = [...items].sort((a, b) => {
        let av: string | number | boolean = '';
        let bv: string | number | boolean = '';
        if (sortConfig.key === 'state_name') { av = a.state?.name ?? ''; bv = b.state?.name ?? ''; }
        else if (sortConfig.key === 'country_name') { av = getCityCountryName(a); bv = getCityCountryName(b); }
        else {
          const aAny = a as unknown as Record<string, unknown>;
          const bAny = b as unknown as Record<string, unknown>;
          const rawKey = sortConfig.key === 'created_at'
            ? (aAny['createdAt'] ? 'createdAt' : 'created_at')
            : sortConfig.key;
          av = (aAny[rawKey] as string | number | boolean) ?? '';
          bv = (bAny[rawKey] as string | number | boolean) ?? '';
        }
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortConfig.direction === 'asc' ? cmp : -cmp;
      });
    }
    return items;
  }, [cities, search, filterCountryId, filterStateId, sortConfig]);

  // ── Dialog ──

  const closeDialog = () => { setDialogOpen(false); setEditItem(null); form.reset(); setSelectedCountryId(null); };

  const openCreate = () => {
    setEditItem(null);
    form.reset({ name: '', slug: '', pincode: '', sort_order: 0, is_active: true, is_default: false });
    setSelectedCountryId(null);
    setDialogOpen(true);
  };

  const openEdit = (city: City) => {
    setEditItem(city);
    form.reset({
      name: city.name,
      state_id: city.state_id,
      country_id: city.country_id ?? undefined,
      slug: city.slug ?? '',
      pincode: city.pincode ?? '',
      sort_order: city.sort_order,
      is_active: Boolean(city.is_active),
      is_default: Boolean(city.is_default),
    });
    if (city.country_id) setSelectedCountryId(city.country_id);
    setDialogOpen(true);
  };

  const onSubmit = (data: CityForm) => {
    if (editItem) {
      updateCity.mutate({ id: editItem.id, data }, {
        onSuccess: closeDialog,
        onError: (e) => { if (isApprovalRequired(e)) closeDialog(); },
      });
    } else {
      createCity.mutate(data, {
        onSuccess: closeDialog,
        onError: (e) => { if (isApprovalRequired(e)) closeDialog(); },
      });
    }
  };

  // ── CSV ──

  const handleCSVFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const rows = parseCSV(await file.text());
    if (rows.length === 0) { toast.error('No valid rows found in CSV'); e.target.value = ''; return; }
    setCsvPreview(rows);
    e.target.value = '';
  };

  const executeImport = async () => {
    if (!csvPreview) return;
    setCsvImporting(true);
    let success = 0, pending = 0;
    const errors: string[] = [];
    for (const [index, row] of csvPreview.entries()) {
      if (!row.name) { errors.push(`Row ${index + 1}: name is required`); continue; }
      let stateId: number;
      let derivedCountryId: number | undefined;
      if (row.state_code) {
        const found = allStates.find(s => s.code?.toLowerCase() === row.state_code.toLowerCase());
        if (!found) { errors.push(`Row ${index + 1}: state_code "${row.state_code}" not found`); continue; }
        stateId = found.id;
        derivedCountryId = found.country_id;
      } else {
        stateId = parseInt(row.state_id);
        if (isNaN(stateId) || !stateId) { errors.push(`Row ${index + 1}: state_id or state_code required`); continue; }
        derivedCountryId = allStates.find(s => s.id === stateId)?.country_id;
      }
      try {
        await apiClient.post('/locations/cities', {
          name: row.name, slug: row.slug || undefined, pincode: row.pincode || row.zip_code || undefined,
          state_id: stateId,
          country_id: row.country_id ? parseInt(row.country_id) : derivedCountryId,
          sort_order: parseInt(row.sort_order) || 0,
          is_active: row.is_active !== '0',
          is_default: row.is_default === '1',
        });
        success++;
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        if (isApprovalRequired(error)) { pending++; }
        else { errors.push(`Row ${index + 1}: ${err.response?.data?.message || err.message}`); }
      }
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.locations.all });
    if (success > 0) toast.success(`Imported ${success} of ${csvPreview.length} cities`);
    if (pending > 0) toast.info(`${pending} cities pending approval`);
    if (errors.length > 0) toast.error(`Failed: ${errors.length} cities`, { description: errors.slice(0, 5).join('\n'), duration: 8000 });
    setCsvImporting(false);
    setCsvPreview(null);
  };

  const isPending = createCity.isPending || updateCity.isPending;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>Cities</CardTitle>
              <CardDescription>Manage city records</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCSVFile} />
              <Button size="sm" variant="outline" onClick={downloadSampleCSV}>
                <Download className="mr-2 h-4 w-4" /> Sample CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => csvRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Import CSV
              </Button>
              <Button size="sm" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" /> Add City
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, state or country..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterCountryId} onValueChange={v => { setFilterCountryId(v); setFilterStateId('all'); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {countries.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStateId} onValueChange={setFilterStateId}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {filterStates.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortableHeader sortKey="name" sortConfig={sortConfig} onSort={handleSort}>Name</SortableHeader>
                  </TableHead>
                  <TableHead>
                    <SortableHeader sortKey="state_name" sortConfig={sortConfig} onSort={handleSort}>State</SortableHeader>
                  </TableHead>
                  <TableHead>
                    <SortableHeader sortKey="country_name" sortConfig={sortConfig} onSort={handleSort}>Country</SortableHeader>
                  </TableHead>
                  <TableHead>
                    <SortableHeader sortKey="sort_order" sortConfig={sortConfig} onSort={handleSort}>Sort Order</SortableHeader>
                  </TableHead>
                  <TableHead>
                    <SortableHeader sortKey="is_active" sortConfig={sortConfig} onSort={handleSort}>Status</SortableHeader>
                  </TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>
                    <SortableHeader sortKey="created_at" sortConfig={sortConfig} onSort={handleSort}>Created</SortableHeader>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAndSorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No cities found</TableCell>
                  </TableRow>
                ) : (
                  filteredAndSorted.map(city => (
                    <TableRow key={city.id}>
                      <TableCell className="font-medium">{city.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{city.state?.name ?? '–'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{getCityCountryName(city)}</TableCell>
                      <TableCell>{city.sort_order}</TableCell>
                      <TableCell>
                        <Switch
                          checked={Boolean(city.is_active)}
                          onCheckedChange={checked =>
                            updateCity.mutate({ id: city.id, data: { is_active: checked } })
                          }
                          disabled={updateCity.isPending}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={Boolean(city.is_default)}
                          onCheckedChange={checked => {
                            if (checked) updateCity.mutate({ id: city.id, data: { is_default: true } });
                          }}
                          disabled={Boolean(city.is_default) || !city.is_active || updateCity.isPending}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {(() => {
                          const d = (city as unknown as { createdAt?: string }).createdAt ?? city.created_at;
                          return d && !isNaN(new Date(d).getTime()) ? new Date(d).toLocaleDateString() : '–';
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Manage Pincodes"
                            onClick={() => setPincodeCity(city)}
                          >
                            <MapPin className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(city)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deleteCity.isPending}
                            onClick={() =>
                              setDeleteConfirm({
                                label: `Delete "${city.name}"?`,
                                onConfirm: () => deleteCity.mutate(city.id),
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <p className="text-sm text-muted-foreground mt-2">
            {filteredAndSorted.length} of {cities.length} cities
          </p>
        </CardContent>
      </Card>

      {/* City Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={open => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit City' : 'Add City'}</DialogTitle>
            <DialogDescription>
              {editItem ? 'Update city details.' : 'Fill in details to create a new city.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ci-name">Name *</Label>
              <Input id="ci-name" placeholder="Chennai" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ci-slug">Slug</Label>
              <Input id="ci-slug" placeholder="chennai" {...form.register('slug')} />
            </div>
            <div className="space-y-2">
              <Label>Country *</Label>
              <Controller
                control={form.control}
                name="country_id"
                render={({ field }) => (
                  <Select
                    value={field.value?.toString() || selectedCountryId?.toString()}
                    onValueChange={v => {
                      field.onChange(parseInt(v));
                      setSelectedCountryId(parseInt(v));
                      form.setValue('state_id', undefined);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country..." />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.country_id && (
                <p className="text-sm text-destructive">{form.formState.errors.country_id.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Controller
                control={form.control}
                name="state_id"
                render={({ field }) => (
                  <Select
                    value={field.value?.toString()}
                    onValueChange={v => field.onChange(parseInt(v))}
                    disabled={!selectedCountryId && !form.getValues('country_id')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state..." />
                    </SelectTrigger>
                    <SelectContent>
                      {dialogStates.map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ci-pincode">Pincode</Label>
              <Input id="ci-pincode" placeholder="600001" {...form.register('pincode')} />
              <p className="text-xs text-muted-foreground">Primary postal code for this city (e.g. 600001).</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ci-sort">Sort Order</Label>
              <Input id="ci-sort" type="number" {...form.register('sort_order', { valueAsNumber: true })} />
            </div>
            <div className="flex items-center justify-between border rounded-lg p-3">
              <Label htmlFor="ci-active">Is Active?</Label>
              <Controller
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <Switch id="ci-active" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
            <div className="flex items-center justify-between border rounded-lg p-3">
              <Label htmlFor="ci-default">Is Default?</Label>
              <Controller
                control={form.control}
                name="is_default"
                render={({ field }) => (
                  <Switch id="ci-default" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Saving...' : editItem ? 'Update City' : 'Create City'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* CSV Preview Dialog */}
      {csvPreview && (
        <Dialog open={!!csvPreview} onOpenChange={open => { if (!open && !csvImporting) setCsvPreview(null); }}>
          <DialogContent className="max-w-4xl flex flex-col" style={{ maxHeight: '85vh' }}>
            <DialogHeader>
              <DialogTitle>Preview Import — {csvPreview.length} cities</DialogTitle>
              <DialogDescription>
                Review the data below before importing.
                {csvPreview.length > 50 && ` Showing first 50 of ${csvPreview.length} rows.`}
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-auto flex-1 border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 text-muted-foreground">#</TableHead>
                    {Object.keys(csvPreview[0] || {}).map(col => (
                      <TableHead key={col} className="whitespace-nowrap font-medium">{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvPreview.slice(0, 50).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground text-xs tabular-nums">{i + 1}</TableCell>
                      {Object.entries(row).map(([col, val], j) => (
                        <TableCell key={j} className="whitespace-nowrap text-sm">
                          {col === 'is_active' ? (
                            <Badge className={val === '1' ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-100' : 'bg-muted text-muted-foreground border'}>
                              {val === '1' ? 'Active' : 'Inactive'}
                            </Badge>
                          ) : col === 'is_default' ? (
                            val === '1'
                              ? <Badge className="bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-100">Default</Badge>
                              : <span className="text-muted-foreground text-xs">—</span>
                          ) : col === 'sort_order' ? (
                            <span className="tabular-nums font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{val || '0'}</span>
                          ) : (val || <span className="text-muted-foreground">–</span>)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {csvPreview.length > 50 && (
                    <TableRow>
                      <TableCell colSpan={Object.keys(csvPreview[0]).length + 1} className="text-center text-muted-foreground text-sm py-3">
                        … and {csvPreview.length - 50} more rows
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm text-muted-foreground">{csvPreview.length} rows ready to import</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCsvPreview(null)} disabled={csvImporting}>Cancel</Button>
                <Button onClick={executeImport} disabled={csvImporting}>
                  {csvImporting ? 'Importing...' : `Import ${csvPreview.length} rows`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* City Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={open => { if (!open) setDeleteConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.label} This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { deleteConfirm?.onConfirm(); setDeleteConfirm(null); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pincode Management Dialog */}
      {pincodeCity && (
        <PincodeManageDialog
          city={pincodeCity}
          open={!!pincodeCity}
          onOpenChange={v => !v && setPincodeCity(null)}
        />
      )}
    </>
  );
}
