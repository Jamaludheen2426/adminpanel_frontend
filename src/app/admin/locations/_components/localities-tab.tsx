"use client";

import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Search, Pencil, Trash2,
  ArrowUp, ArrowDown, ArrowUpDown,
} from "lucide-react";
import {
  useLocalities, useCreateLocality, useUpdateLocality, useDeleteLocality,
  useCountries, useStates, useCities,
} from "@/hooks/use-locations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageLoader } from "@/components/common/page-loader";
import { useTranslation } from "@/hooks/use-translation";
import type { Locality } from "@/types";
import { isApprovalRequired } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

// Extended Locality type with nested district/state/country from API
type LocalityWithNested = Locality & {
  district?: {
    id: number;
    name: string;
    state_id?: number;
    country_id?: number;
    state?: {
      id: number;
      name: string;
      country_id?: number;
      country?: { id: number; name: string };
    };
  };
};

// ─── Schema ───────────────────────────────────────────────────────────────────

const localitySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  pincode: z.string().min(1, "Pincode is required"),
  city_id: z.number({ required_error: "District is required" }),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
});

type LocalityForm = z.infer<typeof localitySchema>;

// ─── Sort ─────────────────────────────────────────────────────────────────────

type SortKey = "name" | "pincode" | "is_active" | "created_at" | "district_name" | "state_name" | "country_name";
type SortDirection = "asc" | "desc";
interface SortConfig { key: SortKey; direction: SortDirection }

function SortableHeader<T extends string>({
  children, sortKey, sortConfig, onSort,
}: {
  children: React.ReactNode;
  sortKey: T;
  sortConfig: { key: T; direction: SortDirection } | null;
  onSort: (key: T) => void;
}) {
  const dir = sortConfig?.key === sortKey ? sortConfig.direction : null;
  return (
    <button onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-left hover:text-foreground transition-colors font-medium">
      {children}
      {dir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> :
        dir === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> :
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />}
    </button>
  );
}

// Helper to extract nested fields from a row
function getDistrictName(loc: LocalityWithNested) {
  return loc.district?.name ?? "";
}
function getStateName(loc: LocalityWithNested) {
  return loc.district?.state?.name ?? "";
}
function getCountryName(loc: LocalityWithNested) {
  return loc.district?.state?.country?.name ?? "";
}
function getCountryId(loc: LocalityWithNested): number | null {
  return loc.district?.state?.country?.id ?? loc.district?.country_id ?? null;
}
function getStateId(loc: LocalityWithNested): number | null {
  return loc.district?.state?.id ?? loc.district?.state_id ?? null;
}

// ─── LocalitiesTab ────────────────────────────────────────────────────────────

export function LocalitiesTab() {
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [filterCountryId, setFilterCountryId] = useState<string>("all");
  const [filterStateId, setFilterStateId] = useState<string>("all");
  const [filterDistrictId, setFilterDistrictId] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<LocalityWithNested | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ label: string; onConfirm: () => void } | null>(null);

  // Dialog cascade state
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);

  // Always fetch ALL cities (districtId=0 → no filter)
  const activeCityId = filterDistrictId !== "all" ? Number(filterDistrictId) : 0;
  const { data: rawLocalities = [], isLoading } = useLocalities(activeCityId);
  const localities = rawLocalities as LocalityWithNested[];

  const { data: countries = [] } = useCountries();
  const { data: allStates = [] } = useStates();
  const { data: allDistricts = [] } = useCities(); // districts list

  const createLocality = useCreateLocality();
  const updateLocality = useUpdateLocality();
  const deleteLocality = useDeleteLocality();

  const form = useForm<LocalityForm>({
    resolver: zodResolver(localitySchema),
    defaultValues: { name: "", pincode: "", is_active: true, is_default: false },
  });

  // ── Filter dropdown cascading options ──────────────────────────────────────

  const filterStates = useMemo(
    () => filterCountryId === "all"
      ? allStates
      : allStates.filter((s) => s.country_id === Number(filterCountryId)),
    [allStates, filterCountryId],
  );

  const filterDistricts = useMemo(() => {
    if (filterStateId !== "all") return allDistricts.filter((d) => d.state_id === Number(filterStateId));
    if (filterCountryId !== "all") {
      const stateIds = allStates.filter((s) => s.country_id === Number(filterCountryId)).map((s) => s.id);
      return allDistricts.filter((d) => stateIds.includes(d.state_id));
    }
    return allDistricts;
  }, [allDistricts, allStates, filterCountryId, filterStateId]);

  // Dialog cascading
  const dialogStates = useMemo(
    () => selectedCountryId ? allStates.filter((s) => s.country_id === selectedCountryId) : allStates,
    [allStates, selectedCountryId],
  );
  const dialogDistricts = useMemo(
    () => selectedStateId
      ? allDistricts.filter((d) => d.state_id === selectedStateId)
      : selectedCountryId
        ? allDistricts.filter((d) => allStates.find((s) => s.id === d.state_id)?.country_id === selectedCountryId)
        : allDistricts,
    [allDistricts, allStates, selectedCountryId, selectedStateId],
  );

  // ── Sort helper ──────────────────────────────────────────────────────────────

  const onSort = (key: SortKey) => {
    setSortConfig((prev) => {
      if (prev?.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  // ── Filtered + sorted list ───────────────────────────────────────────────────

  const filteredAndSorted = useMemo(() => {
    const q = search.toLowerCase();

    let items = localities.filter((loc) => {
      // Text search across all visible columns
      const matchSearch =
        loc.name.toLowerCase().includes(q) ||
        loc.pincode.toLowerCase().includes(q) ||
        getDistrictName(loc).toLowerCase().includes(q) ||
        getStateName(loc).toLowerCase().includes(q) ||
        getCountryName(loc).toLowerCase().includes(q);

      // Country filter
      const matchCountry =
        filterCountryId === "all" || getCountryId(loc) === Number(filterCountryId);

      // State filter
      const matchState =
        filterStateId === "all" || getStateId(loc) === Number(filterStateId);

      // District filter
      const matchDistrict =
        filterDistrictId === "all" || loc.city_id === Number(filterDistrictId);

      return matchSearch && matchCountry && matchState && matchDistrict;
    });

    if (sortConfig) {
      items = [...items].sort((a, b) => {
        let av = "";
        let bv = "";
        switch (sortConfig.key) {
          case "district_name": av = getDistrictName(a); bv = getDistrictName(b); break;
          case "state_name": av = getStateName(a); bv = getStateName(b); break;
          case "country_name": av = getCountryName(a); bv = getCountryName(b); break;
          default:
            av = String((a as unknown as Record<string, unknown>)[sortConfig.key] ?? "");
            bv = String((b as unknown as Record<string, unknown>)[sortConfig.key] ?? "");
        }
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortConfig.direction === "asc" ? cmp : -cmp;
      });
    }
    return items;
  }, [localities, search, filterCountryId, filterStateId, filterDistrictId, sortConfig]);

  // ── Dialog helpers ───────────────────────────────────────────────────────────

  const closeDialog = () => {
    setDialogOpen(false); setEditItem(null); form.reset();
    setSelectedCountryId(null); setSelectedStateId(null);
  };

  const openCreate = () => {
    setEditItem(null);
    form.reset({ name: "", pincode: "", is_active: true, is_default: false });
    setSelectedCountryId(null); setSelectedStateId(null);
    setDialogOpen(true);
  };

  const openEdit = (loc: LocalityWithNested) => {
    setEditItem(loc);
    form.reset({
      name: loc.name, pincode: loc.pincode, city_id: loc.city_id,
      is_active: Boolean(loc.is_active), is_default: Boolean(loc.is_default),
    });
    const countryId = getCountryId(loc);
    const stateId = getStateId(loc);
    if (countryId) setSelectedCountryId(countryId);
    if (stateId) setSelectedStateId(stateId);
    setDialogOpen(true);
  };

  const onSubmit = (data: LocalityForm) => {
    if (editItem) {
      updateLocality.mutate({ id: editItem.id, data }, {
        onSuccess: closeDialog, onError: (e) => { if (isApprovalRequired(e)) closeDialog(); },
      });
    } else {
      createLocality.mutate(data, {
        onSuccess: closeDialog, onError: (e) => { if (isApprovalRequired(e)) closeDialog(); },
      });
    }
  };

  const isPending = createLocality.isPending || updateLocality.isPending;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>{t("locations.cities", "Cities")}</CardTitle>
              <CardDescription>{t("locations.cities_desc", "Manage cities linked to districts")}</CardDescription>
            </div>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> {t("locations.add_city", "Add City")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* ── Filters ── */}
          <div className="mb-4 flex gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("locations.search_city", "Search city, district, state or country...")}
                value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8"
              />
            </div>

            {/* Country filter */}
            <Select value={filterCountryId} onValueChange={(v) => {
              setFilterCountryId(v); setFilterStateId("all"); setFilterDistrictId("all");
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("locations.all_countries", "All Countries")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("locations.all_countries", "All Countries")}</SelectItem>
                {countries.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* State filter */}
            <Select value={filterStateId} onValueChange={(v) => {
              setFilterStateId(v); setFilterDistrictId("all");
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("locations.all_states", "All States")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("locations.all_states", "All States")}</SelectItem>
                {filterStates.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* District filter */}
            <Select value={filterDistrictId} onValueChange={setFilterDistrictId}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("locations.all_districts", "All Districts")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("locations.all_districts", "All Districts")}</SelectItem>
                {filterDistricts.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* ── Table ── */}
          <div className="rounded-md border">
            <PageLoader open={isLoading} />
            {!isLoading && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortableHeader sortKey="country_name" sortConfig={sortConfig} onSort={onSort}>
                        {t("locations.country", "Country")}
                      </SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader sortKey="state_name" sortConfig={sortConfig} onSort={onSort}>
                        {t("locations.state", "State")}
                      </SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader sortKey="district_name" sortConfig={sortConfig} onSort={onSort}>
                        {t("locations.district", "District")}
                      </SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader sortKey="name" sortConfig={sortConfig} onSort={onSort}>
                        {t("locations.city_name", "City Name")}
                      </SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader sortKey="pincode" sortConfig={sortConfig} onSort={onSort}>
                        {t("locations.pincode", "Pincode")}
                      </SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader sortKey="is_active" sortConfig={sortConfig} onSort={onSort}>
                        {t("common.status", "Active")}
                      </SortableHeader>
                    </TableHead>
                    <TableHead>{t("locations.default", "Default")}</TableHead>
                    <TableHead className="text-right">{t("common.actions", "Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSorted.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {t("locations.no_cities_found", "No cities found")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSorted.map((loc) => (
                      <TableRow key={loc.id}>
                        {/* Country */}
                        <TableCell className="text-muted-foreground text-sm">
                          {getCountryName(loc) || "–"}
                        </TableCell>
                        {/* State */}
                        <TableCell className="text-muted-foreground text-sm">
                          {getStateName(loc) || "–"}
                        </TableCell>
                        {/* District */}
                        <TableCell className="text-muted-foreground text-sm">
                          {getDistrictName(loc) || "–"}
                        </TableCell>
                        {/* City Name */}
                        <TableCell className="font-medium">{loc.name}</TableCell>
                        {/* Pincode */}
                        <TableCell>{loc.pincode}</TableCell>
                        {/* Active */}
                        <TableCell>
                          <Switch
                            checked={Boolean(loc.is_active)}
                            onCheckedChange={(checked) =>
                              updateLocality.mutate({ id: loc.id, data: { is_active: checked } })
                            }
                            disabled={updateLocality.isPending}
                          />
                        </TableCell>
                        {/* Default */}
                        <TableCell>
                          <Switch
                            checked={Boolean(loc.is_default)}
                            onCheckedChange={(checked) => {
                              if (checked) updateLocality.mutate({ id: loc.id, data: { is_default: true } });
                            }}
                            disabled={Boolean(loc.is_default) || !loc.is_active || updateLocality.isPending}
                          />
                        </TableCell>
                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(loc)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive-outline" size="icon" disabled={deleteLocality.isPending}
                              onClick={() => setDeleteConfirm({
                                label: `${t("common.delete", "Delete")} "${loc.name}"?`,
                                onConfirm: () => deleteLocality.mutate(loc.id),
                              })}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-2">
              {filteredAndSorted.length} {t("common.of", "of")} {localities.length} {t("locations.cities", "cities")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editItem ? t("locations.edit_city", "Edit City") : t("locations.add_city", "Add City")}
            </DialogTitle>
            <DialogDescription>
              {editItem
                ? t("locations.edit_city_desc", "Update city details.")
                : t("locations.add_city_desc", "Fill in details to create a new city.")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Country */}
            <div className="space-y-2">
              <Label>{t("locations.country", "Country")}</Label>
              <Select value={selectedCountryId?.toString() ?? ""}
                onValueChange={(v) => {
                  setSelectedCountryId(parseInt(v));
                  setSelectedStateId(null);
                  form.setValue("city_id", undefined as unknown as number);
                }}>
                <SelectTrigger><SelectValue placeholder={t("locations.select_country", "Select country...")} /></SelectTrigger>
                <SelectContent>
                  {countries.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* State */}
            <div className="space-y-2">
              <Label>{t("locations.state", "State")}</Label>
              <Select value={selectedStateId?.toString() ?? ""}
                onValueChange={(v) => {
                  setSelectedStateId(parseInt(v));
                  form.setValue("city_id", undefined as unknown as number);
                }}
                disabled={!selectedCountryId}>
                <SelectTrigger><SelectValue placeholder={t("locations.select_state", "Select state...")} /></SelectTrigger>
                <SelectContent>
                  {dialogStates.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* District */}
            <div className="space-y-2">
              <Label>{t("locations.district", "District")} *</Label>
              <Controller control={form.control} name="city_id" render={({ field }) => (
                <Select value={field.value?.toString() ?? ""}
                  onValueChange={(v) => field.onChange(parseInt(v))}
                  disabled={!selectedStateId && !selectedCountryId}>
                  <SelectTrigger><SelectValue placeholder={t("locations.select_district", "Select district...")} /></SelectTrigger>
                  <SelectContent>
                    {dialogDistricts.map((d) => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
              {form.formState.errors.city_id && (
                <p className="text-sm text-destructive">{form.formState.errors.city_id.message}</p>
              )}
            </div>

            {/* City Name */}
            <div className="space-y-2">
              <Label htmlFor="loc-name">{t("locations.city_name", "City Name")} *</Label>
              <Input id="loc-name" placeholder={t("locations.city_name_placeholder", "e.g. Andheri West")}
                {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Pincode */}
            <div className="space-y-2">
              <Label htmlFor="loc-pincode">{t("locations.pincode", "Pincode")} *</Label>
              <Input id="loc-pincode" placeholder="400053" {...form.register("pincode")} />
              {form.formState.errors.pincode && (
                <p className="text-sm text-destructive">{form.formState.errors.pincode.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between border rounded-lg p-3">
              <Label htmlFor="loc-active">{t("locations.is_active", "Is Active?")}</Label>
              <Controller control={form.control} name="is_active" render={({ field }) => (
                <Switch id="loc-active" checked={field.value} onCheckedChange={field.onChange} />
              )} />
            </div>

            <div className="flex items-center justify-between border rounded-lg p-3">
              <Label htmlFor="loc-default">{t("locations.is_default", "Is Default?")}</Label>
              <Controller control={form.control} name="is_default" render={({ field }) => (
                <Switch id="loc-default" checked={field.value} onCheckedChange={field.onChange} />
              )} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? t("common.saving", "Saving...")
                  : editItem
                    ? t("locations.update_city", "Update City")
                    : t("locations.create_city", "Create City")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.are_you_sure", "Are you sure?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.label} {t("common.cannot_undo", "This action cannot be undone.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteConfirm?.onConfirm(); setDeleteConfirm(null); }}>
              {t("common.delete", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
