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
  useCountries,
  useCreateCountry,
  useUpdateCountry,
  useDeleteCountry,
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
import type { Country } from "@/types";
import { toast } from "sonner";
import { PageLoader } from "@/components/common/page-loader";

// ─── Schema ──────────────────────────────────────────────────────────────────

const countrySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(3, "Code must be at most 3 characters"),
  nationality: z.string().optional(),
  sort_order: z.number().default(0),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
});

type CountryForm = z.infer<typeof countrySchema>;

// ─── Sort ─────────────────────────────────────────────────────────────────────

type SortKey = keyof Pick<
  Country,
  "name" | "code" | "nationality" | "sort_order" | "is_active" | "created_at"
>;
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
  a.href = "/samples/sample_countries.csv";
  a.download = "sample_countries.csv";
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

export function CountriesTab() {
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Country | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    label: string;
    onConfirm: () => void;
  } | null>(null);
  const [csvPreview, setCsvPreview] = useState<Record<string, string>[] | null>(
    null,
  );
  const [csvImporting, setCsvImporting] = useState(false);
  const csvRef = useRef<HTMLInputElement>(null);

  const { data: countries = [], isLoading } = useCountries();
  const createCountry = useCreateCountry();
  const updateCountry = useUpdateCountry();
  const deleteCountry = useDeleteCountry();

  const form = useForm<CountryForm>({
    resolver: zodResolver(countrySchema),
    defaultValues: {
      name: "",
      code: "",
      nationality: "",
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
    let items = countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.nationality ?? "").toLowerCase().includes(q),
    );
    if (sortConfig) {
      items = [...items].sort((a, b) => {
        const av = (a[sortConfig.key] ?? "") as string | number | boolean;
        const bv = (b[sortConfig.key] ?? "") as string | number | boolean;
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortConfig.direction === "asc" ? cmp : -cmp;
      });
    }
    return items;
  }, [countries, search, sortConfig]);

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
      nationality: "",
      sort_order: 0,
      is_active: true,
      is_default: false,
    });
    setDialogOpen(true);
  };

  const openEdit = (country: Country) => {
    setEditItem(country);
    form.reset({
      name: country.name,
      code: country.code,
      nationality: country.nationality ?? "",
      sort_order: country.sort_order,
      is_active: Boolean(country.is_active),
      is_default: Boolean(country.is_default),
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: CountryForm) => {
    if (editItem) {
      updateCountry.mutate(
        { id: editItem.id, data },
        {
          onSuccess: closeDialog,
          onError: (e) => {
            if (isApprovalRequired(e)) closeDialog();
          },
        },
      );
    } else {
      createCountry.mutate(data, {
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
    toast.info(`Processing ${csvPreview.length} rows...`, { duration: 2000 });
    let success = 0,
      pending = 0;
    const errors: string[] = [];
    for (const [index, row] of csvPreview.entries()) {
      if (!row.name || !row.code) {
        errors.push(
          `Row ${index + 1} (${row.name || "?"}): name and code required`,
        );
        continue;
      }
      try {
        await apiClient.post("/locations/countries", {
          name: row.name,
          code: row.code,
          nationality: row.nationality || undefined,
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
            `Row ${index + 1} (${row.name}): ${err.response?.data?.message || err.message}`,
          );
        }
      }
    }
    await queryClient.refetchQueries({
      queryKey: queryKeys.locations.countries(),
    });
    if (success > 0)
      toast.success(`Imported ${success} of ${csvPreview.length} countries`);
    if (pending > 0) toast.info(`${pending} countries pending approval`);
    if (errors.length > 0)
      toast.error(`Failed: ${errors.length} countries`, {
        description: errors.join("\n"),
        duration: 8000,
      });
    setCsvImporting(false);
    setCsvPreview(null);
  };

  const isPending = createCountry.isPending || updateCountry.isPending;

  return (
    <>
      <PageLoader open={isLoading} />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>Countries</CardTitle>
              <CardDescription>Manage country records</CardDescription>
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
                <Plus className="mr-2 h-4 w-4" /> Add Country
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, code or nationality..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
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
                      ISO Code
                    </SortableHeader>
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      sortKey="nationality"
                      sortConfig={sortConfig}
                      onSort={handleSort}
                    >
                      Nationality
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
                      No countries found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSorted.map((country) => (
                    <TableRow key={country.id}>
                      <TableCell className="font-medium">
                        {country.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{country.code}</Badge>
                      </TableCell>
                      <TableCell>{country.nationality ?? "–"}</TableCell>
                      <TableCell>{country.sort_order}</TableCell>
                      <TableCell>
                        <Switch
                          checked={Boolean(country.is_active)}
                          onCheckedChange={(checked) =>
                            updateCountry.mutate({
                              id: country.id,
                              data: { is_active: checked },
                            })
                          }
                          disabled={updateCountry.isPending}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={Boolean(country.is_default)}
                          onCheckedChange={(checked) => {
                            if (checked)
                              updateCountry.mutate({
                                id: country.id,
                                data: { is_default: true },
                              });
                          }}
                          disabled={
                            Boolean(country.is_default) ||
                            !country.is_active ||
                            updateCountry.isPending
                          }
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {(() => {
                          const d =
                            (country as unknown as { createdAt?: string })
                              .createdAt ?? country.created_at;
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
                            onClick={() => openEdit(country)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive-outline"
                            size="icon"
                            disabled={deleteCountry.isPending}
                            onClick={() =>
                              setDeleteConfirm({
                                label: `Delete "${country.name}"?`,
                                onConfirm: () =>
                                  deleteCountry.mutate(country.id),
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
            {filteredAndSorted.length} of {countries.length} countries
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
            <DialogTitle>
              {editItem ? "Edit Country" : "Add Country"}
            </DialogTitle>
            <DialogDescription>
              {editItem
                ? "Update country details."
                : "Fill in the details to create a new country."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="c-name">Name *</Label>
              <Input
                id="c-name"
                placeholder="India"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-code">
                Country ISO Code *{" "}
                <a
                  href="https://www.iso.org/iso-3166-country-codes.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline"
                >
                  (ISO 3166)
                </a>
              </Label>
              <Input id="c-code" placeholder="IN" {...form.register("code")} />
              {form.formState.errors.code && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.code.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-nationality">Nationality</Label>
              <Input
                id="c-nationality"
                placeholder="Indian"
                {...form.register("nationality")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-sort">Sort Order</Label>
              <Input
                id="c-sort"
                type="number"
                {...form.register("sort_order", { valueAsNumber: true })}
              />
            </div>
            <div className="flex items-center justify-between border rounded-lg p-3">
              <Label htmlFor="c-active">Is Active?</Label>
              <Controller
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <Switch
                    id="c-active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
            <div className="flex items-center justify-between border rounded-lg p-3">
              <Label htmlFor="c-default">Is Default?</Label>
              <Controller
                control={form.control}
                name="is_default"
                render={({ field }) => (
                  <Switch
                    id="c-default"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending
                ? "Saving..."
                : editItem
                  ? "Update Country"
                  : "Create Country"}
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
                Preview Import — {csvPreview.length} countries
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
