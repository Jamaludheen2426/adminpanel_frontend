"use client";

import { useState, useMemo, useRef } from "react";
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
  Upload,
  Download,
} from "lucide-react";
import {
  useStates,
  useCreateState,
  useUpdateState,
  useDeleteState,
  useCountries,
} from "@/hooks/use-locations";
import { apiClient, isApprovalRequired } from "@/lib/api-client";
import { queryClient, queryKeys } from "@/lib/query-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import type { State } from "@/types";
import { toast } from "sonner";
import { PageLoader } from "@/components/common/page-loader";

// ─── Schema ──────────────────────────────────────────────────────────────────

const stateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().optional(),
  slug: z.string().optional(),
  country_id: z.number({ required_error: "Country is required" }),
  sort_order: z.number().default(0),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
});

type StateForm = z.infer<typeof stateSchema>;

// ─── Sort ─────────────────────────────────────────────────────────────────────

type SortKey =
  | keyof Pick<
      State,
      "name" | "code" | "sort_order" | "is_active" | "created_at"
    >
  | "country_name";
type SortDirection = "asc" | "desc";
interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

function SortableHeader({
  children,
  sortKey,
  sortConfig,
  onSort,
}: {
  children: React.ReactNode;
  sortKey: SortKey;
  sortConfig: SortConfig | null;
  onSort: (key: SortKey) => void;
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
  a.href = "/samples/sample_states.csv";
  a.download = "sample_states.csv";
  a.click();
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text
    .trim()
    .split("\n")
    .map((l) => l.replace(/\r/g, ""));
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines
    .slice(1)
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const vals = line.split(",").map((v) => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = vals[i] ?? "";
      });
      return obj;
    });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StatesTab() {
  const [search, setSearch] = useState("");
  const [filterCountryId, setFilterCountryId] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<State | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    label: string;
    onConfirm: () => void;
  } | null>(null);
  const [csvPreview, setCsvPreview] = useState<Record<string, string>[] | null>(
    null,
  );
  const [csvImporting, setCsvImporting] = useState(false);
  const csvRef = useRef<HTMLInputElement>(null);

  const { data: states = [], isLoading } = useStates();
  const { data: countries = [] } = useCountries();
  const createState = useCreateState();
  const updateState = useUpdateState();
  const deleteState = useDeleteState();

  const form = useForm<StateForm>({
    resolver: zodResolver(stateSchema),
    defaultValues: {
      name: "",
      code: "",
      slug: "",
      sort_order: 0,
      is_active: true,
      is_default: false,
    },
  });

  // ── Sort ──

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => {
      if (prev?.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  const filteredAndSorted = useMemo(() => {
    const q = search.toLowerCase();
    let items = states.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(q) ||
        (s.code ?? "").toLowerCase().includes(q) ||
        (s.country?.name ?? "").toLowerCase().includes(q);
      const matchCountry =
        filterCountryId === "all" || s.country_id === Number(filterCountryId);
      return matchSearch && matchCountry;
    });
    if (sortConfig) {
      items = [...items].sort((a, b) => {
        let av: string | number | boolean = "";
        let bv: string | number | boolean = "";
        if (sortConfig.key === "country_name") {
          av = a.country?.name ?? "";
          bv = b.country?.name ?? "";
        } else {
          av =
            (a[sortConfig.key as keyof State] as string | number | boolean) ??
            "";
          bv =
            (b[sortConfig.key as keyof State] as string | number | boolean) ??
            "";
        }
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortConfig.direction === "asc" ? cmp : -cmp;
      });
    }
    return items;
  }, [states, search, filterCountryId, sortConfig]);

  // ── Dialog ──

  const closeDialog = () => {
    setDialogOpen(false);
    setEditItem(null);
    form.reset();
  };

  const openCreate = () => {
    setEditItem(null);
    form.reset({
      name: "",
      code: "",
      slug: "",
      sort_order: 0,
      is_active: true,
      is_default: false,
    });
    setDialogOpen(true);
  };

  const openEdit = (state: State) => {
    setEditItem(state);
    form.reset({
      name: state.name,
      code: state.code ?? "",
      slug: state.slug ?? "",
      country_id: state.country_id,
      sort_order: state.sort_order,
      is_active: Boolean(state.is_active),
      is_default: Boolean(state.is_default),
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: StateForm) => {
    if (editItem) {
      updateState.mutate(
        { id: editItem.id, data },
        {
          onSuccess: closeDialog,
          onError: (e) => {
            if (isApprovalRequired(e)) closeDialog();
          },
        },
      );
    } else {
      createState.mutate(data, {
        onSuccess: closeDialog,
        onError: (e) => {
          if (isApprovalRequired(e)) closeDialog();
        },
      });
    }
  };

  // ── CSV ──

  const handleCSVFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const rows = parseCSV(await file.text());
    if (rows.length === 0) {
      toast.error("No valid rows found in CSV");
      e.target.value = "";
      return;
    }
    setCsvPreview(rows);
    e.target.value = "";
  };

  const executeImport = async () => {
    if (!csvPreview) return;
    setCsvImporting(true);
    let success = 0,
      pending = 0;
    const errors: string[] = [];
    for (const [index, row] of csvPreview.entries()) {
      if (!row.name) {
        errors.push(`Row ${index + 1}: name is required`);
        continue;
      }
      let countryId: number;
      if (row.country_code) {
        const found = countries.find(
          (c) => c.code.toLowerCase() === row.country_code.toLowerCase(),
        );
        if (!found) {
          errors.push(
            `Row ${index + 1}: country_code "${row.country_code}" not found`,
          );
          continue;
        }
        countryId = found.id;
      } else {
        countryId = parseInt(row.country_id);
        if (isNaN(countryId) || !countryId) {
          errors.push(`Row ${index + 1}: country_id or country_code required`);
          continue;
        }
      }
      try {
        await apiClient.post("/locations/states", {
          name: row.name,
          code: row.code || undefined,
          slug: row.slug || undefined,
          country_id: countryId,
          sort_order: parseInt(row.sort_order) || 0,
          is_active: row.is_active !== "0",
          is_default: row.is_default === "1",
        });
        success++;
      } catch (error: unknown) {
        const err = error as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        if (isApprovalRequired(error)) {
          pending++;
        } else {
          errors.push(
            `Row ${index + 1}: ${err.response?.data?.message || err.message}`,
          );
        }
      }
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.locations.all });
    if (success > 0)
      toast.success(`Imported ${success} of ${csvPreview.length} states`);
    if (pending > 0) toast.info(`${pending} states pending approval`);
    if (errors.length > 0)
      toast.error(`Failed: ${errors.length} states`, {
        description: errors.slice(0, 5).join("\n"),
        duration: 8000,
      });
    setCsvImporting(false);
    setCsvPreview(null);
  };

  const isPending = createState.isPending || updateState.isPending;

  return (
    <>
      <PageLoader open={isLoading} />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>States</CardTitle>
              <CardDescription>Manage state records</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                ref={csvRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCSVFile}
              />
              <Button size="sm" variant="outline" onClick={downloadSampleCSV}>
                <Download className="mr-2 h-4 w-4" /> Sample CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => csvRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" /> Import CSV
              </Button>
              <Button size="sm" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" /> Add State
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, code or country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterCountryId} onValueChange={setFilterCountryId}>
              <SelectTrigger className="w-48">
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
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortableHeader
                      sortKey="name"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      Name
                    </SortableHeader>
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      sortKey="code"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      Code
                    </SortableHeader>
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      sortKey="country_name"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      Country
                    </SortableHeader>
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      sortKey="sort_order"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      Sort Order
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
                {filteredAndSorted.length === 0 && !isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No states found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSorted.map((state) => (
                    <TableRow key={state.id}>
                      <TableCell className="font-medium">
                        {state.name}
                      </TableCell>
                      <TableCell>
                        {state.code ? (
                          <Badge variant="outline">{state.code}</Badge>
                        ) : (
                          "–"
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {state.country?.name ?? "–"}
                      </TableCell>
                      <TableCell>{state.sort_order}</TableCell>
                      <TableCell>
                        <Switch
                          checked={Boolean(state.is_active)}
                          onCheckedChange={(checked) =>
                            updateState.mutate({
                              id: state.id,
                              data: { is_active: checked },
                            })
                          }
                          disabled={updateState.isPending}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={Boolean(state.is_default)}
                          onCheckedChange={(checked) => {
                            if (checked)
                              updateState.mutate({
                                id: state.id,
                                data: { is_default: true },
                              });
                          }}
                          disabled={
                            Boolean(state.is_default) ||
                            !state.is_active ||
                            updateState.isPending
                          }
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {(() => {
                          const d =
                            (state as unknown as { createdAt?: string })
                              .createdAt ?? state.created_at;
                          return d && !isNaN(new Date(d).getTime())
                            ? new Date(d).toLocaleDateString()
                            : "–";
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(state)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deleteState.isPending}
                            onClick={() =>
                              setDeleteConfirm({
                                label: `Delete "${state.name}"?`,
                                onConfirm: () => deleteState.mutate(state.id),
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
            {filteredAndSorted.length} of {states.length} states
          </p>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit State" : "Add State"}</DialogTitle>
            <DialogDescription>
              {editItem
                ? "Update state details."
                : "Fill in details to create a new state."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Country First */}
            <div className="space-y-2">
              <Label>Country *</Label>
              <Controller
                control={form.control}
                name="country_id"
                render={({ field }) => (
                  <Select
                    value={field.value?.toString()}
                    onValueChange={(v) => field.onChange(parseInt(v))}
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
                )}
              />
              {form.formState.errors.country_id && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.country_id.message}
                </p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="s-name">Name *</Label>
              <Input
                id="s-name"
                placeholder="Tamil Nadu"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="s-slug">Slug</Label>
              <Input
                id="s-slug"
                placeholder="tamil-nadu"
                {...form.register("slug")}
              />
            </div>

            {/* Abbreviation */}
            <div className="space-y-2">
              <Label htmlFor="s-code">Abbreviation</Label>
              <Input
                id="s-code"
                placeholder="E.g: TN"
                {...form.register("code")}
              />
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <Label htmlFor="s-sort">Sort Order</Label>
              <Input
                id="s-sort"
                type="number"
                {...form.register("sort_order", { valueAsNumber: true })}
              />
            </div>

            {/* Is Active */}
            <div className="flex items-center justify-between border rounded-lg p-3">
              <Label htmlFor="s-active">Is Active?</Label>
              <Controller
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <Switch
                    id="s-active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Is Default */}
            <div className="flex items-center justify-between border rounded-lg p-3">
              <Label htmlFor="s-default">Is Default?</Label>
              <Controller
                control={form.control}
                name="is_default"
                render={({ field }) => (
                  <Switch
                    id="s-default"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending
                ? "Saving..."
                : editItem
                  ? "Update State"
                  : "Create State"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* CSV Preview Dialog */}
      {csvPreview && (
        <Dialog
          open={!!csvPreview}
          onOpenChange={(open) => {
            if (!open && !csvImporting) setCsvPreview(null);
          }}
        >
          <DialogContent
            className="max-w-4xl flex flex-col"
            style={{ maxHeight: "85vh" }}
          >
            <DialogHeader>
              <DialogTitle>
                Preview Import — {csvPreview.length} states
              </DialogTitle>
              <DialogDescription>
                Review the data below before importing.
                {csvPreview.length > 50 &&
                  ` Showing first 50 of ${csvPreview.length} rows.`}
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-auto flex-1 border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 text-muted-foreground">
                      #
                    </TableHead>
                    {Object.keys(csvPreview[0] || {}).map((col) => (
                      <TableHead
                        key={col}
                        className="whitespace-nowrap font-medium"
                      >
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvPreview.slice(0, 50).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground text-xs tabular-nums">
                        {i + 1}
                      </TableCell>
                      {Object.entries(row).map(([col, val], j) => (
                        <TableCell
                          key={j}
                          className="whitespace-nowrap text-sm"
                        >
                          {col === "is_active" ? (
                            <Badge
                              className={
                                val === "1"
                                  ? "bg-green-100 text-green-700 border border-green-300 hover:bg-green-100"
                                  : "bg-muted text-muted-foreground border"
                              }
                            >
                              {val === "1" ? "Active" : "Inactive"}
                            </Badge>
                          ) : col === "is_default" ? (
                            val === "1" ? (
                              <Badge className="bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-100">
                                Default
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                —
                              </span>
                            )
                          ) : col === "sort_order" ? (
                            <span className="tabular-nums font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                              {val || "0"}
                            </span>
                          ) : (
                            val || (
                              <span className="text-muted-foreground">–</span>
                            )
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {csvPreview.length > 50 && (
                    <TableRow>
                      <TableCell
                        colSpan={Object.keys(csvPreview[0]).length + 1}
                        className="text-center text-muted-foreground text-sm py-3"
                      >
                        … and {csvPreview.length - 50} more rows
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                {csvPreview.length} rows ready to import
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCsvPreview(null)}
                  disabled={csvImporting}
                >
                  Cancel
                </Button>
                <Button onClick={executeImport} disabled={csvImporting}>
                  {csvImporting
                    ? "Importing..."
                    : `Import ${csvPreview.length} rows`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

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
