"use client";

import { useState, useMemo, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Search, Pencil, Trash2,
  ArrowUp, ArrowDown, ArrowUpDown, Upload, Download,
} from "lucide-react";
import {
  useCities, useCreateCity, useUpdateCity, useDeleteCity,
  useStates, useCountries,
} from "@/hooks/use-locations";
import { apiClient, isApprovalRequired } from "@/lib/api-client";
import { queryClient, queryKeys } from "@/lib/query-client";
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
import type { City } from "@/types";
import { toast } from "sonner";

// ─── Schema ───────────────────────────────────────────────────────────────────

const citySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  state_id: z.number().optional(),
  country_id: z.number({ required_error: "Country is required" }),
  slug: z.string().optional(),
  sort_order: z.number().default(0),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
});

type CityForm = z.infer<typeof citySchema>;

// ─── Sort types ───────────────────────────────────────────────────────────────

type CitySortKey =
  | keyof Pick<City, "name" | "sort_order" | "is_active" | "created_at">
  | "state_name"
  | "country_name";
type SortDirection = "asc" | "desc";
interface CitySortConfig { key: CitySortKey; direction: SortDirection }

// ─── SortableHeader ───────────────────────────────────────────────────────────

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
      {direction === "asc" ? (
        <ArrowUp className="h-3.5 w-3.5" />
      ) : direction === "desc" ? (
        <ArrowDown className="h-3.5 w-3.5" />
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
      )}
    </button>
  );
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function downloadSampleCSV() {
  const a = document.createElement("a");
  a.href = "/samples/sample_cities.csv";
  a.download = "sample_cities.csv";
  a.click();
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n").map((l) => l.replace(/\r/g, ""));
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).filter((l) => l.trim() !== "").map((line) => {
    const vals = line.split(",").map((v) => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
    return obj;
  });
}

// ─── CitiesTab ────────────────────────────────────────────────────────────────

export function CitiesTab() {
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [filterCountryId, setFilterCountryId] = useState<string>("all");
  const [filterStateId, setFilterStateId] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<CitySortConfig | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<City | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ label: string; onConfirm: () => void } | null>(null);
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
    defaultValues: { name: "", slug: "", sort_order: 0, is_active: true, is_default: false },
  });

  const filterStates = useMemo(
    () => filterCountryId === "all"
      ? allStates
      : allStates.filter((s) => s.country_id === Number(filterCountryId)),
    [allStates, filterCountryId],
  );

  const dialogStates = useMemo(
    () => selectedCountryId ? allStates.filter((s) => s.country_id === selectedCountryId) : allStates,
    [allStates, selectedCountryId],
  );

  const getCityCountryName = (city: City): string =>
    city.country?.name ?? city.state?.country?.name ??
    allStates.find((s) => s.id === city.state_id)?.country?.name ??
    countries.find((c) => c.id === city.country_id)?.name ?? "–";

  const getCityCountryId = (city: City): number | null =>
    city.country_id ?? city.state?.country_id ??
    allStates.find((s) => s.id === city.state_id)?.country_id ?? null;

  const filteredAndSorted = useMemo(() => {
    const q = search.toLowerCase();
    let items = cities.filter((c) => {
      const countryName = getCityCountryName(c);
      const matchSearch =
        c.name.toLowerCase().includes(q) ||
        (c.state?.name ?? "").toLowerCase().includes(q) ||
        countryName.toLowerCase().includes(q);
      const cityCountryId = getCityCountryId(c);
      const matchCountry = filterCountryId === "all" || cityCountryId === Number(filterCountryId);
      const matchState = filterStateId === "all" || c.state_id === Number(filterStateId);
      return matchSearch && matchCountry && matchState;
    });
    if (sortConfig) {
      items = [...items].sort((a, b) => {
        let av: string | number | boolean = "";
        let bv: string | number | boolean = "";
        if (sortConfig.key === "state_name") { av = a.state?.name ?? ""; bv = b.state?.name ?? ""; }
        else if (sortConfig.key === "country_name") { av = getCityCountryName(a); bv = getCityCountryName(b); }
        else {
          const aAny = a as unknown as Record<string, unknown>;
          const bAny = b as unknown as Record<string, unknown>;
          const rawKey = sortConfig.key === "created_at" ? (aAny["createdAt"] ? "createdAt" : "created_at") : sortConfig.key;
          av = (aAny[rawKey] as string | number | boolean) ?? "";
          bv = (bAny[rawKey] as string | number | boolean) ?? "";
        }
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortConfig.direction === "asc" ? cmp : -cmp;
      });
    }
    return items;
  }, [cities, search, filterCountryId, filterStateId, sortConfig]);

  const closeDialog = () => {
    setDialogOpen(false); setEditItem(null); form.reset(); setSelectedCountryId(null);
  };

  const openCreate = () => {
    setEditItem(null);
    form.reset({ name: "", slug: "", sort_order: 0, is_active: true, is_default: false });
    setSelectedCountryId(null);
    setDialogOpen(true);
  };

  const openEdit = (city: City) => {
    setEditItem(city);
    form.reset({
      name: city.name, state_id: city.state_id,
      country_id: city.country_id ?? undefined,
      slug: city.slug ?? "", sort_order: city.sort_order,
      is_active: Boolean(city.is_active), is_default: Boolean(city.is_default),
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

  const handleCSVFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const rows = parseCSV(await file.text());
    if (rows.length === 0) { toast.error(t("locations.no_valid_csv_rows", "No valid rows found in CSV")); e.target.value = ""; return; }
    setCsvPreview(rows); e.target.value = "";
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
        const found = allStates.find((s) => s.code?.toLowerCase() === row.state_code.toLowerCase());
        if (!found) { errors.push(`Row ${index + 1}: state_code "${row.state_code}" not found`); continue; }
        stateId = found.id; derivedCountryId = found.country_id;
      } else {
        stateId = parseInt(row.state_id);
        if (isNaN(stateId) || !stateId) { errors.push(`Row ${index + 1}: state_id or state_code required`); continue; }
        derivedCountryId = allStates.find((s) => s.id === stateId)?.country_id;
      }
      try {
        await apiClient.post("/locations/cities", {
          name: row.name, slug: row.slug || undefined, state_id: stateId,
          country_id: row.country_id ? parseInt(row.country_id) : derivedCountryId,
          sort_order: parseInt(row.sort_order) || 0,
          is_active: row.is_active !== "0", is_default: row.is_default === "1",
        });
        success++;
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        if (isApprovalRequired(error)) { pending++; }
        else { errors.push(`Row ${index + 1}: ${err.response?.data?.message || err.message}`); }
      }
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.locations.all });
    if (success > 0) toast.success(t("locations.imported_districts", `Imported ${success} of ${csvPreview.length} districts`).replace("{n}", String(success)).replace("{total}", String(csvPreview.length)));
    if (pending > 0) toast.info(t("locations.pending_approval", `${pending} districts pending approval`));
    if (errors.length > 0) toast.error(t("locations.import_failed", `Failed: ${errors.length} districts`), { description: errors.slice(0, 5).join("\n"), duration: 8000 });
    setCsvImporting(false); setCsvPreview(null);
  };

  const isPending = createCity.isPending || updateCity.isPending;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>{t("locations.districts", "Districts")}</CardTitle>
              <CardDescription>{t("locations.districts_desc", "Manage district records")}</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCSVFile} />
              <Button size="sm" variant="outline" onClick={downloadSampleCSV}>
                <Download className="mr-2 h-4 w-4" /> {t("locations.sample_csv", "Sample CSV")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => csvRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> {t("locations.import_csv", "Import CSV")}
              </Button>
              <Button size="sm" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" /> {t("locations.add_district", "Add District")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("locations.search_district", "Search by name, state or country...")}
                value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8"
              />
            </div>
            <Select value={filterCountryId} onValueChange={(v) => { setFilterCountryId(v); setFilterStateId("all"); }}>
              <SelectTrigger className="w-44"><SelectValue placeholder={t("locations.all_countries", "All Countries")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("locations.all_countries", "All Countries")}</SelectItem>
                {countries.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStateId} onValueChange={setFilterStateId}>
              <SelectTrigger className="w-44"><SelectValue placeholder={t("locations.all_states", "All States")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("locations.all_states", "All States")}</SelectItem>
                {filterStates.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <PageLoader open={isLoading} />
          <div className="rounded-md border">
            {!isLoading && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><SortableHeader sortKey="name" sortConfig={sortConfig} onSort={(k) => setSortConfig((p) => p?.key !== k ? { key: k, direction: "asc" } : p.direction === "asc" ? { key: k, direction: "desc" } : null)}>{t("common.name", "Name")}</SortableHeader></TableHead>
                    <TableHead><SortableHeader sortKey="state_name" sortConfig={sortConfig} onSort={(k) => setSortConfig((p) => p?.key !== k ? { key: k, direction: "asc" } : p.direction === "asc" ? { key: k, direction: "desc" } : null)}>{t("locations.state", "State")}</SortableHeader></TableHead>
                    <TableHead><SortableHeader sortKey="country_name" sortConfig={sortConfig} onSort={(k) => setSortConfig((p) => p?.key !== k ? { key: k, direction: "asc" } : p.direction === "asc" ? { key: k, direction: "desc" } : null)}>{t("locations.country", "Country")}</SortableHeader></TableHead>
                    <TableHead><SortableHeader sortKey="sort_order" sortConfig={sortConfig} onSort={(k) => setSortConfig((p) => p?.key !== k ? { key: k, direction: "asc" } : p.direction === "asc" ? { key: k, direction: "desc" } : null)}>{t("locations.sort_order", "Sort Order")}</SortableHeader></TableHead>
                    <TableHead><SortableHeader sortKey="is_active" sortConfig={sortConfig} onSort={(k) => setSortConfig((p) => p?.key !== k ? { key: k, direction: "asc" } : p.direction === "asc" ? { key: k, direction: "desc" } : null)}>{t("common.status", "Status")}</SortableHeader></TableHead>
                    <TableHead>{t("locations.default", "Default")}</TableHead>
                    <TableHead><SortableHeader sortKey="created_at" sortConfig={sortConfig} onSort={(k) => setSortConfig((p) => p?.key !== k ? { key: k, direction: "asc" } : p.direction === "asc" ? { key: k, direction: "desc" } : null)}>{t("common.date", "Created")}</SortableHeader></TableHead>
                    <TableHead className="text-right">{t("common.actions", "Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSorted.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {t("locations.no_districts_found", "No districts found")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSorted.map((city) => (
                      <TableRow key={city.id}>
                        <TableCell className="font-medium">{city.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{city.state?.name ?? "–"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{getCityCountryName(city)}</TableCell>
                        <TableCell>{city.sort_order}</TableCell>
                        <TableCell>
                          <Switch
                            checked={Boolean(city.is_active)}
                            onCheckedChange={(checked) => updateCity.mutate({ id: city.id, data: { is_active: checked } })}
                            disabled={updateCity.isPending}
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={Boolean(city.is_default)}
                            onCheckedChange={(checked) => { if (checked) updateCity.mutate({ id: city.id, data: { is_default: true } }); }}
                            disabled={Boolean(city.is_default) || !city.is_active || updateCity.isPending}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {(() => {
                            const d = (city as unknown as { createdAt?: string }).createdAt ?? city.created_at;
                            return d && !isNaN(new Date(d).getTime()) ? new Date(d).toLocaleDateString() : "–";
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(city)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="destructive-outline" size="icon" disabled={deleteCity.isPending}
                              onClick={() => setDeleteConfirm({ label: `${t("common.delete", "Delete")} "${city.name}"?`, onConfirm: () => deleteCity.mutate(city.id) })}>
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

          <p className="text-sm text-muted-foreground mt-2">
            {filteredAndSorted.length} {t("common.of", "of")} {cities.length} {t("locations.districts", "districts")}
          </p>
        </CardContent>
      </Card>

      {/* CSV Preview Dialog */}
      {csvPreview && (
        <Dialog open={!!csvPreview} onOpenChange={() => setCsvPreview(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("locations.csv_preview", "CSV Preview")}</DialogTitle>
              <DialogDescription>
                {t("locations.csv_preview_desc", "Review the rows below before importing.")}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-72 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(csvPreview[0] ?? {}).map((k) => <TableHead key={k}>{k}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvPreview.map((row, i) => (
                    <TableRow key={i}>{Object.values(row).map((v, j) => <TableCell key={j}>{v}</TableCell>)}</TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCsvPreview(null)}>{t("common.cancel", "Cancel")}</Button>
              <Button onClick={executeImport} disabled={csvImporting}>
                {csvImporting ? t("common.loading", "Importing...") : t("locations.confirm_import", "Import")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? t("locations.edit_district", "Edit District") : t("locations.add_district", "Add District")}</DialogTitle>
            <DialogDescription>
              {editItem ? t("locations.edit_district_desc", "Update district details.") : t("locations.add_district_desc", "Fill in details to create a new district.")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("locations.country", "Country")} *</Label>
              <Controller control={form.control} name="country_id" render={({ field }) => (
                <Select value={field.value?.toString() || selectedCountryId?.toString()}
                  onValueChange={(v) => { const id = parseInt(v); field.onChange(id); setSelectedCountryId(id); form.setValue("state_id", undefined); }}>
                  <SelectTrigger><SelectValue placeholder={t("locations.select_country", "Select country...")} /></SelectTrigger>
                  <SelectContent>{countries.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              )} />
              {form.formState.errors.country_id && <p className="text-sm text-destructive">{form.formState.errors.country_id.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>{t("locations.state", "State")} *</Label>
              <Controller control={form.control} name="state_id" render={({ field }) => (
                <Select value={field.value?.toString()} onValueChange={(v) => field.onChange(parseInt(v))}
                  disabled={!selectedCountryId && !form.getValues("country_id")}>
                  <SelectTrigger><SelectValue placeholder={t("locations.select_state", "Select state...")} /></SelectTrigger>
                  <SelectContent>{dialogStates.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ci-name">{t("common.name", "Name")} *</Label>
              <Input id="ci-name" placeholder={t("locations.district_placeholder", "e.g. Chennai North")} {...form.register("name")} />
              {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ci-slug">{t("locations.slug", "Slug")}</Label>
              <Input id="ci-slug" placeholder="chennai-north" {...form.register("slug")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ci-sort">{t("locations.sort_order", "Sort Order")}</Label>
              <Input id="ci-sort" type="number" {...form.register("sort_order", { valueAsNumber: true })} />
            </div>

            <div className="flex items-center justify-between border rounded-lg p-3">
              <Label htmlFor="ci-active">{t("locations.is_active", "Is Active?")}</Label>
              <Controller control={form.control} name="is_active" render={({ field }) => (
                <Switch id="ci-active" checked={field.value} onCheckedChange={field.onChange} />
              )} />
            </div>

            <div className="flex items-center justify-between border rounded-lg p-3">
              <Label htmlFor="ci-default">{t("locations.is_default", "Is Default?")}</Label>
              <Controller control={form.control} name="is_default" render={({ field }) => (
                <Switch id="ci-default" checked={field.value} onCheckedChange={field.onChange} />
              )} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>{t("common.cancel", "Cancel")}</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? t("common.saving", "Saving...") : editItem ? t("locations.update_district", "Update District") : t("locations.create_district", "Create District")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.are_you_sure", "Are you sure?")}</AlertDialogTitle>
            <AlertDialogDescription>{deleteConfirm?.label} {t("common.cannot_undo", "This action cannot be undone.")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteConfirm?.onConfirm(); setDeleteConfirm(null); }}>{t("common.delete", "Delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
