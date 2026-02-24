"use client";

import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import {
  useLocalities,
  useCreateLocality,
  useUpdateLocality,
  useDeleteLocality,
  useCountries,
  useStates,
  useCities,
} from "@/hooks/use-locations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLoader } from "@/components/common/page-loader";
import type { Locality } from "@/types";
import { isApprovalRequired } from "@/lib/api-client";

// ─── Schema ───────────────────────────────────────────────────────────────────

const localitySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  pincode: z.string().min(1, "Pincode is required"),
  city_id: z.number({ required_error: "City is required" }),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
});

type LocalityForm = z.infer<typeof localitySchema>;

// ─── Sort types ───────────────────────────────────────────────────────────────

type LocalitySortKey =
  | keyof Pick<Locality, "name" | "pincode" | "is_active" | "created_at">
  | "city_name";
type SortDirection = "asc" | "desc";
interface LocalitySortConfig {
  key: LocalitySortKey;
  direction: SortDirection;
}

// ─── SortableHeader ───────────────────────────────────────────────────────────

function SortableHeader<T extends string>({
  children,
  sortKey,
  sortConfig,
  onSort,
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

// ─── LocalitiesTab ────────────────────────────────────────────────────────────

export function LocalitiesTab() {
  const [search, setSearch] = useState("");
  const [filterCountryId, setFilterCountryId] = useState<string>("all");
  const [filterStateId, setFilterStateId] = useState<string>("all");
  const [filterCityId, setFilterCityId] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<LocalitySortConfig | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Locality | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    label: string;
    onConfirm: () => void;
  } | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);

  // For the table we load localities by the selected city filter; if no city selected, load all by passing 0 (disabled)
  const activeCityId = filterCityId !== "all" ? Number(filterCityId) : 0;
  const { data: localities = [], isLoading } = useLocalities(activeCityId);
  const { data: countries = [] } = useCountries();
  const { data: allStates = [] } = useStates();
  const { data: allCities = [] } = useCities();

  const createLocality = useCreateLocality();
  const updateLocality = useUpdateLocality();
  const deleteLocality = useDeleteLocality();

  const form = useForm<LocalityForm>({
    resolver: zodResolver(localitySchema),
    defaultValues: {
      name: "",
      pincode: "",
      is_active: true,
      is_default: false,
    },
  });

  // ── Cascading filter helpers ──

  const filterStates = useMemo(
    () =>
      filterCountryId === "all"
        ? allStates
        : allStates.filter((s) => s.country_id === Number(filterCountryId)),
    [allStates, filterCountryId],
  );

  const filterCities = useMemo(
    () =>
      filterStateId === "all"
        ? filterCountryId === "all"
          ? allCities
          : allCities.filter((c) => {
              const state = allStates.find((s) => s.id === c.state_id);
              return state?.country_id === Number(filterCountryId);
            })
        : allCities.filter((c) => c.state_id === Number(filterStateId)),
    [allCities, allStates, filterCountryId, filterStateId],
  );

  // ── Dialog cascading selects ──

  const dialogStates = useMemo(
    () =>
      selectedCountryId
        ? allStates.filter((s) => s.country_id === selectedCountryId)
        : allStates,
    [allStates, selectedCountryId],
  );

  const dialogCities = useMemo(
    () =>
      selectedStateId
        ? allCities.filter((c) => c.state_id === selectedStateId)
        : selectedCountryId
        ? allCities.filter((c) => {
            const state = allStates.find((s) => s.id === c.state_id);
            return state?.country_id === selectedCountryId;
          })
        : allCities,
    [allCities, allStates, selectedCountryId, selectedStateId],
  );

  // ── Sort ──

  const handleSort = (key: LocalitySortKey) => {
    setSortConfig((prev) => {
      if (prev?.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  const filteredAndSorted = useMemo(() => {
    const q = search.toLowerCase();
    let items = localities.filter((loc) => {
      const matchSearch =
        loc.name.toLowerCase().includes(q) ||
        loc.pincode.toLowerCase().includes(q) ||
        (loc.city?.name ?? "").toLowerCase().includes(q);
      return matchSearch;
    });
    if (sortConfig) {
      items = [...items].sort((a, b) => {
        let av: string | boolean = "";
        let bv: string | boolean = "";
        if (sortConfig.key === "city_name") {
          av = a.city?.name ?? "";
          bv = b.city?.name ?? "";
        } else {
          av = (a[sortConfig.key] ?? "") as string | boolean;
          bv = (b[sortConfig.key] ?? "") as string | boolean;
        }
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortConfig.direction === "asc" ? cmp : -cmp;
      });
    }
    return items;
  }, [localities, search, sortConfig]);

  // ── Dialog ──

  const closeDialog = () => {
    setDialogOpen(false);
    setEditItem(null);
    form.reset();
    setSelectedCountryId(null);
    setSelectedStateId(null);
  };

  const openCreate = () => {
    setEditItem(null);
    form.reset({ name: "", pincode: "", is_active: true, is_default: false });
    setSelectedCountryId(null);
    setSelectedStateId(null);
    setDialogOpen(true);
  };

  const openEdit = (locality: Locality) => {
    setEditItem(locality);
    form.reset({
      name: locality.name,
      pincode: locality.pincode,
      city_id: locality.city_id,
      is_active: Boolean(locality.is_active),
      is_default: Boolean(locality.is_default),
    });
    const city = allCities.find((c) => c.id === locality.city_id);
    if (city) {
      const state = allStates.find((s) => s.id === city.state_id);
      if (state) {
        setSelectedCountryId(state.country_id);
        setSelectedStateId(state.id);
      }
    }
    setDialogOpen(true);
  };

  const onSubmit = (data: LocalityForm) => {
    if (editItem) {
      updateLocality.mutate(
        { id: editItem.id, data },
        {
          onSuccess: closeDialog,
          onError: (e) => {
            if (isApprovalRequired(e)) closeDialog();
          },
        },
      );
    } else {
      createLocality.mutate(data, {
        onSuccess: closeDialog,
        onError: (e) => {
          if (isApprovalRequired(e)) closeDialog();
        },
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
              <CardTitle>Localities</CardTitle>
              <CardDescription>
                Manage locality records linked to cities
              </CardDescription>
            </div>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Add Locality
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by locality name or pincode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select
              value={filterCountryId}
              onValueChange={(v) => {
                setFilterCountryId(v);
                setFilterStateId("all");
                setFilterCityId("all");
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterStateId}
              onValueChange={(v) => {
                setFilterStateId(v);
                setFilterCityId("all");
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {filterStates.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCityId} onValueChange={setFilterCityId}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {filterCities.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filterCityId === "all" ? (
            <div className="text-center py-12 text-muted-foreground border rounded-md">
              <p className="text-sm">
                Please select a city to view its localities.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <PageLoader open={isLoading} />
              {!isLoading && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>City</TableHead>
                      <TableHead>
                        <SortableHeader
                          sortKey="name"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        >
                          Locality Name
                        </SortableHeader>
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          sortKey="pincode"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        >
                          Pincode
                        </SortableHeader>
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          sortKey="is_active"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        >
                          Status
                        </SortableHeader>
                      </TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead>
                        <SortableHeader
                          sortKey="created_at"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        >
                          Created
                        </SortableHeader>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSorted.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No localities found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAndSorted.map((loc) => (
                        <TableRow key={loc.id}>
                          <TableCell className="text-muted-foreground text-sm">
                            {loc.city?.name ??
                              allCities.find((c) => c.id === loc.city_id)?.name ??
                              "–"}
                          </TableCell>
                          <TableCell className="font-medium">{loc.name}</TableCell>
                          <TableCell>{loc.pincode}</TableCell>
                          <TableCell>
                            <Switch
                              checked={Boolean(loc.is_active)}
                              onCheckedChange={(checked) =>
                                updateLocality.mutate({
                                  id: loc.id,
                                  data: { is_active: checked },
                                })
                              }
                              disabled={updateLocality.isPending}
                            />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={Boolean(loc.is_default)}
                              onCheckedChange={(checked) => {
                                if (checked)
                                  updateLocality.mutate({
                                    id: loc.id,
                                    data: { is_default: true },
                                  });
                              }}
                              disabled={
                                Boolean(loc.is_default) ||
                                !loc.is_active ||
                                updateLocality.isPending
                              }
                            />
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {loc.created_at && !isNaN(new Date(loc.created_at).getTime())
                              ? new Date(loc.created_at).toLocaleDateString()
                              : "–"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(loc)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={deleteLocality.isPending}
                                onClick={() =>
                                  setDeleteConfirm({
                                    label: `Delete "${loc.name}"?`,
                                    onConfirm: () => deleteLocality.mutate(loc.id),
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
              )}
            </div>
          )}

          {filterCityId !== "all" && !isLoading && (
            <p className="text-sm text-muted-foreground mt-2">
              {filteredAndSorted.length} of {localities.length} localities
            </p>
          )}
        </CardContent>
      </Card>

      {/* Locality Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Edit Locality" : "Add Locality"}
            </DialogTitle>
            <DialogDescription>
              {editItem
                ? "Update locality details."
                : "Fill in details to create a new locality."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Country */}
            <div className="space-y-2">
              <Label>Country</Label>
              <Select
                value={selectedCountryId?.toString() ?? ""}
                onValueChange={(v) => {
                  const id = parseInt(v);
                  setSelectedCountryId(id);
                  setSelectedStateId(null);
                  form.setValue("city_id", undefined as unknown as number);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country..." />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* State */}
            <div className="space-y-2">
              <Label>State</Label>
              <Select
                value={selectedStateId?.toString() ?? ""}
                onValueChange={(v) => {
                  const id = parseInt(v);
                  setSelectedStateId(id);
                  form.setValue("city_id", undefined as unknown as number);
                }}
                disabled={!selectedCountryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state..." />
                </SelectTrigger>
                <SelectContent>
                  {dialogStates.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label>City *</Label>
              <Controller
                control={form.control}
                name="city_id"
                render={({ field }) => (
                  <Select
                    value={field.value?.toString() ?? ""}
                    onValueChange={(v) => field.onChange(parseInt(v))}
                    disabled={!selectedStateId && !selectedCountryId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select city..." />
                    </SelectTrigger>
                    <SelectContent>
                      {dialogCities.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.city_id && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.city_id.message}
                </p>
              )}
            </div>

            {/* Locality Name */}
            <div className="space-y-2">
              <Label htmlFor="loc-name">Locality Name *</Label>
              <Input
                id="loc-name"
                placeholder="Andheri West"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Pincode */}
            <div className="space-y-2">
              <Label htmlFor="loc-pincode">Pincode *</Label>
              <Input
                id="loc-pincode"
                placeholder="400053"
                {...form.register("pincode")}
              />
              {form.formState.errors.pincode && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.pincode.message}
                </p>
              )}
            </div>

            {/* Is Active */}
            <div className="flex items-center justify-between border rounded-lg p-3">
              <Label htmlFor="loc-active">Is Active?</Label>
              <Controller
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <Switch
                    id="loc-active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Is Default */}
            <div className="flex items-center justify-between border rounded-lg p-3">
              <Label htmlFor="loc-default">Is Default?</Label>
              <Controller
                control={form.control}
                name="is_default"
                render={({ field }) => (
                  <Switch
                    id="loc-default"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Saving..."
                  : editItem
                  ? "Update Locality"
                  : "Create Locality"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null);
        }}
      >
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
              onClick={() => {
                deleteConfirm?.onConfirm();
                setDeleteConfirm(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
