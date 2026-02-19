"use client";

import React, { useState, useRef } from "react";
import { apiClient, isApprovalRequired } from "@/lib/api-client";
import { queryClient, queryKeys } from "@/lib/query-client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Upload, Download } from "lucide-react";
import {
  useCountries,
  useStates,
  useCities,
  useCreateCountry,
  useUpdateCountry,
  useDeleteCountry,
  useCreateState,
  useUpdateState,
  useDeleteState,
  useCreateCity,
  useUpdateCity,
  useDeleteCity,
} from "@/hooks";
import { Country, State, City } from "@/types";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { toast } from "sonner";

// Schemas
const countrySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters").max(3, "Code must be at most 3 characters"),
  nationality: z.string().optional(),
  sort_order: z.number().default(0),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
});

const stateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().optional(),
  slug: z.string().optional(),
  country_id: z.number({ required_error: "Country is required" }),
  sort_order: z.number().default(0),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
});

const citySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  state_id: z.number().optional(),
  country_id: z.number({ required_error: "Country is required" }),
  slug: z.string().optional(),
  pincode: z.string().optional(),
  sort_order: z.number().default(0),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
});

type CountryFormData = z.infer<typeof countrySchema>;
type StateFormData = z.infer<typeof stateSchema>;
type CityFormData = z.infer<typeof citySchema>;

// ─── CSV helpers ────────────────────────────────────────────────────────────

function downloadSampleCSV(type: "countries" | "states" | "cities") {
  const a = document.createElement("a");
  a.href = `/samples/sample_${type}.csv`;
  a.download = `sample_${type}.csv`;
  a.click();
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n").map(l => l.replace(/\r/g, ""));
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1)
    .filter(line => line.trim() !== "")
    .map(line => {
      const vals = line.split(",").map(v => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
      return obj;
    });
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function LocationsContent() {
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);

  // Dialog states
  const [countryDialogOpen, setCountryDialogOpen] = useState(false);
  const [stateDialogOpen, setStateDialogOpen] = useState(false);
  const [cityDialogOpen, setCityDialogOpen] = useState(false);

  // Edit states
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [editingState, setEditingState] = useState<State | null>(null);
  const [editingCity, setEditingCity] = useState<City | null>(null);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    label: string;
    onConfirm: () => void;
  } | null>(null);

  // CSV preview state
  const [csvPreview, setCsvPreview] = useState<{
    type: "countries" | "states" | "cities";
    rows: Record<string, string>[];
  } | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);

  // CSV upload refs
  const countryCSVRef = useRef<HTMLInputElement>(null);
  const stateCSVRef = useRef<HTMLInputElement>(null);
  const cityCSVRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: countriesData, isLoading: countriesLoading } = useCountries();
  const { data: statesData, isLoading: statesLoading } = useStates();
  const { data: citiesData, isLoading: citiesLoading } = useCities();

  // Mutations
  const createCountryMutation = useCreateCountry();
  const updateCountryMutation = useUpdateCountry();
  const deleteCountryMutation = useDeleteCountry();

  const createStateMutation = useCreateState();
  const updateStateMutation = useUpdateState();
  const deleteStateMutation = useDeleteState();

  const createCityMutation = useCreateCity();
  const updateCityMutation = useUpdateCity();
  const deleteCityMutation = useDeleteCity();

  // Forms
  const countryForm = useForm<CountryFormData>({
    resolver: zodResolver(countrySchema),
    defaultValues: { name: "", code: "", nationality: "", sort_order: 0, is_active: true, is_default: false },
  });

  const stateForm = useForm<StateFormData>({
    resolver: zodResolver(stateSchema),
    defaultValues: { name: "", code: "", slug: "", sort_order: 0, is_active: true, is_default: false },
  });

  const cityForm = useForm<CityFormData>({
    resolver: zodResolver(citySchema),
    defaultValues: { name: "", slug: "", pincode: "", sort_order: 0, is_active: true, is_default: false },
  });

  // ── Handlers ──

  const handleCountrySubmit = (data: CountryFormData) => {
    const close = () => { setCountryDialogOpen(false); setEditingCountry(null); countryForm.reset(); };
    if (editingCountry) {
      updateCountryMutation.mutate({ id: editingCountry.id, data }, { onSuccess: close, onError: (e) => { if (isApprovalRequired(e)) close(); } });
    } else {
      createCountryMutation.mutate(data, { onSuccess: close, onError: (e) => { if (isApprovalRequired(e)) close(); } });
    }
  };

  const handleStateSubmit = (data: StateFormData) => {
    const close = () => { setStateDialogOpen(false); setEditingState(null); stateForm.reset(); };
    if (editingState) {
      updateStateMutation.mutate({ id: editingState.id, data }, { onSuccess: close, onError: (e) => { if (isApprovalRequired(e)) close(); } });
    } else {
      createStateMutation.mutate(data, { onSuccess: close, onError: (e) => { if (isApprovalRequired(e)) close(); } });
    }
  };

  const handleCitySubmit = (data: CityFormData) => {
    const close = () => { setCityDialogOpen(false); setEditingCity(null); cityForm.reset(); };
    if (editingCity) {
      updateCityMutation.mutate({ id: editingCity.id, data }, { onSuccess: close, onError: (e) => { if (isApprovalRequired(e)) close(); } });
    } else {
      createCityMutation.mutate(data, { onSuccess: close, onError: (e) => { if (isApprovalRequired(e)) close(); } });
    }
  };

  const openEditCountry = (country: Country) => {
    setEditingCountry(country);
    countryForm.reset({ name: country.name, code: country.code, nationality: country.nationality || "", sort_order: country.sort_order || 0, is_active: country.is_active !== false, is_default: country.is_default || false });
    setCountryDialogOpen(true);
  };

  const openEditState = (state: State) => {
    setEditingState(state);
    stateForm.reset({ name: state.name, code: state.code || "", slug: state.slug || "", country_id: state.country_id, sort_order: state.sort_order || 0, is_active: state.is_active !== false, is_default: state.is_default || false });
    setStateDialogOpen(true);
  };

  const openEditCity = (city: City) => {
    setEditingCity(city);
    cityForm.reset({ name: city.name, state_id: city.state_id, country_id: city.country_id || undefined, slug: city.slug || "", pincode: city.pincode || "", sort_order: city.sort_order || 0, is_active: city.is_active !== false, is_default: city.is_default || false });
    if (city.country_id) setSelectedCountryId(city.country_id);
    setCityDialogOpen(true);
  };

  // ── CSV Upload handlers — parse & preview only ──

  const handleCountryCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const rows = parseCSV(await file.text());
    if (rows.length === 0) { toast.error("No valid rows found in CSV"); e.target.value = ""; return; }
    setCsvPreview({ type: "countries", rows });
    e.target.value = "";
  };

  const handleStateCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const rows = parseCSV(await file.text());
    if (rows.length === 0) { toast.error("No valid rows found in CSV"); e.target.value = ""; return; }
    setCsvPreview({ type: "states", rows });
    e.target.value = "";
  };

  const handleCityCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const rows = parseCSV(await file.text());
    if (rows.length === 0) { toast.error("No valid rows found in CSV"); e.target.value = ""; return; }
    setCsvPreview({ type: "cities", rows });
    e.target.value = "";
  };

  // ── CSV Import executors ──

  const importCountries = async (rows: Record<string, string>[]) => {
    toast.info(`Processing ${rows.length} rows...`, { duration: 2000 });
    let success = 0, pending = 0;
    const errors: string[] = [];
    for (const [index, row] of rows.entries()) {
      if (!row.name || !row.code) { errors.push(`Row ${index + 1} (${row.name || "?"}): name and code required`); continue; }
      try {
        await apiClient.post('/locations/countries', {
          name: row.name, code: row.code,
          nationality: row.nationality || undefined,
          sort_order: parseInt(row.sort_order) || 0,
          is_active: row.is_active !== "0",
          is_default: row.is_default === "1",
        });
        success++;
      } catch (error: any) {
        if (isApprovalRequired(error)) { pending++; } else {
          errors.push(`Row ${index + 1} (${row.name}): ${error.response?.data?.message || error.message}`);
        }
      }
    }
    await queryClient.refetchQueries({ queryKey: queryKeys.locations.countries() });
    if (success > 0) toast.success(`Imported ${success} of ${rows.length} countries`);
    if (pending > 0) toast.info(`${pending} countries pending approval`);
    if (errors.length > 0) toast.error(`Failed: ${errors.length} of ${rows.length} countries`, { description: errors.join("\n"), duration: 8000 });
  };

  const importStates = async (rows: Record<string, string>[]) => {
    let success = 0, pending = 0;
    const errors: string[] = [];
    for (const [index, row] of rows.entries()) {
      if (!row.name) { errors.push(`Row ${index + 1}: name is required`); continue; }
      let countryId: number;
      if (row.country_code) {
        const found = countriesData?.find(c => c.code.toLowerCase() === row.country_code.toLowerCase());
        if (!found) { errors.push(`Row ${index + 1}: country_code "${row.country_code}" not found`); continue; }
        countryId = found.id;
      } else {
        countryId = parseInt(row.country_id);
        if (isNaN(countryId) || !countryId) { errors.push(`Row ${index + 1}: country_id or country_code required`); continue; }
      }
      try {
        await apiClient.post('/locations/states', {
          name: row.name, code: row.code || undefined, slug: row.slug || undefined,
          country_id: countryId,
          sort_order: parseInt(row.sort_order) || 0,
          is_active: row.is_active !== "0",
          is_default: row.is_default === "1",
        });
        success++;
      } catch (error: any) {
        if (isApprovalRequired(error)) { pending++; } else {
          errors.push(`Row ${index + 1}: ${error.response?.data?.message || error.message}`);
        }
      }
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.locations.all });
    if (success > 0) toast.success(`Imported ${success} of ${rows.length} states`);
    if (pending > 0) toast.info(`${pending} states pending approval`);
    if (errors.length > 0) toast.error(`Failed: ${errors.length} states`, { description: errors.slice(0, 5).join("\n"), duration: 8000 });
  };

  const importCities = async (rows: Record<string, string>[]) => {
    let success = 0, pending = 0;
    const errors: string[] = [];
    for (const [index, row] of rows.entries()) {
      if (!row.name) { errors.push(`Row ${index + 1}: name is required`); continue; }
      let stateId: number;
      if (row.state_code) {
        const found = statesData?.find(s => s.code?.toLowerCase() === row.state_code.toLowerCase());
        if (!found) { errors.push(`Row ${index + 1}: state_code "${row.state_code}" not found`); continue; }
        stateId = found.id;
      } else {
        stateId = parseInt(row.state_id);
        if (isNaN(stateId) || !stateId) { errors.push(`Row ${index + 1}: state_id or state_code required`); continue; }
      }
      try {
        await apiClient.post('/locations/cities', {
          name: row.name, slug: row.slug || undefined, pincode: row.pincode || row.zip_code || undefined,
          state_id: stateId,
          country_id: row.country_id ? parseInt(row.country_id) : undefined,
          sort_order: parseInt(row.sort_order) || 0,
          is_active: row.is_active !== "0",
          is_default: row.is_default === "1",
        });
        success++;
      } catch (error: any) {
        if (isApprovalRequired(error)) { pending++; } else {
          errors.push(`Row ${index + 1}: ${error.response?.data?.message || error.message}`);
        }
      }
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.locations.all });
    if (success > 0) toast.success(`Imported ${success} of ${rows.length} cities`);
    if (pending > 0) toast.info(`${pending} cities pending approval`);
    if (errors.length > 0) toast.error(`Failed: ${errors.length} cities`, { description: errors.slice(0, 5).join("\n"), duration: 8000 });
  };

  const executeCSVImport = async () => {
    if (!csvPreview) return;
    setCsvImporting(true);
    const { type, rows } = csvPreview;
    if (type === "countries") await importCountries(rows);
    else if (type === "states") await importStates(rows);
    else if (type === "cities") await importCities(rows);
    setCsvImporting(false);
    setCsvPreview(null);
  };

  return (
    <PermissionGuard permission="locations.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Locations</h1>
          <p className="text-muted-foreground mt-1">
            Manage countries, states, cities, and pincodes
          </p>
        </div>

        <Tabs defaultValue="countries" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="countries">Countries</TabsTrigger>
            <TabsTrigger value="states">States</TabsTrigger>
            <TabsTrigger value="cities">Cities</TabsTrigger>
          </TabsList>

          {/* ── Countries Tab ── */}
          <TabsContent value="countries" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle>Countries</CardTitle>
                    <CardDescription>Manage country records</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* CSV Controls */}
                    <input ref={countryCSVRef} type="file" accept=".csv" className="hidden" onChange={handleCountryCSV} />
                    <Button size="sm" variant="outline" onClick={() => downloadSampleCSV("countries")}>
                      <Download className="mr-2 h-4 w-4" /> Sample CSV
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => countryCSVRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" /> Import CSV
                    </Button>
                    {/* Add Dialog */}
                    <Dialog open={countryDialogOpen} onOpenChange={(open) => { setCountryDialogOpen(open); if (!open) { setEditingCountry(null); countryForm.reset(); } }}>
                      <DialogTrigger asChild>
                        <Button size="sm"><Plus className="mr-2 h-4 w-4" />Add Country</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{editingCountry ? "Edit Country" : "Add Country"}</DialogTitle>
                          <DialogDescription>{editingCountry ? "Update country details." : "Fill in the details to create a new country."}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={countryForm.handleSubmit(handleCountrySubmit)} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="country-name">Name *</Label>
                            <Input id="country-name" placeholder="India" {...countryForm.register("name")} />
                            {countryForm.formState.errors.name && <p className="text-sm text-destructive">{countryForm.formState.errors.name.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="country-code">Country ISO code * <a href="https://www.iso.org/iso-3166-country-codes.html" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">(ISO 3166)</a></Label>
                            <Input id="country-code" placeholder="IN" {...countryForm.register("code")} />
                            {countryForm.formState.errors.code && <p className="text-sm text-destructive">{countryForm.formState.errors.code.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="country-nationality">Nationality</Label>
                            <Input id="country-nationality" placeholder="Indian" {...countryForm.register("nationality")} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="country-sort">Sort Order</Label>
                            <Input id="country-sort" type="number" {...countryForm.register("sort_order", { valueAsNumber: true })} />
                          </div>
                          <div className="flex items-center justify-between border rounded-lg p-3">
                            <Label htmlFor="country-active">Is Active?</Label>
                            <Controller control={countryForm.control} name="is_active" render={({ field }) => (
                              <Switch id="country-active" checked={field.value} onCheckedChange={field.onChange} />
                            )} />
                          </div>
                          <div className="flex items-center justify-between border rounded-lg p-3">
                            <Label htmlFor="country-default">Is Default?</Label>
                            <Controller control={countryForm.control} name="is_default" render={({ field }) => (
                              <Switch id="country-default" checked={field.value} onCheckedChange={field.onChange} />
                            )} />
                          </div>
                          <Button type="submit" className="w-full" disabled={createCountryMutation.isPending || updateCountryMutation.isPending}>
                            {createCountryMutation.isPending || updateCountryMutation.isPending ? "Saving..." : editingCountry ? "Update Country" : "Create Country"}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {countriesLoading ? (
                  <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>ISO Code</TableHead>
                        <TableHead>Nationality</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Default</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {countriesData?.map((country) => (
                        <TableRow key={country.id}>
                          <TableCell className="font-medium">{country.name}</TableCell>
                          <TableCell><Badge variant="outline">{country.code}</Badge></TableCell>
                          <TableCell>{country.nationality || "–"}</TableCell>
                          <TableCell>
                            <Switch checked={!!country.is_active} onCheckedChange={(checked) => updateCountryMutation.mutate({ id: country.id, data: { is_active: checked } })} disabled={updateCountryMutation.isPending} />
                          </TableCell>
                          <TableCell>
                            <Switch checked={!!country.is_default} onCheckedChange={(checked) => { if (checked) updateCountryMutation.mutate({ id: country.id, data: { is_default: true } }); }} disabled={!!country.is_default || !country.is_active || updateCountryMutation.isPending} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openEditCountry(country)}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" disabled={deleteCountryMutation.isPending} onClick={() => setDeleteConfirm({ label: `Delete "${country.name}"?`, onConfirm: () => deleteCountryMutation.mutate(country.id) })}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!countriesData || countriesData.length === 0) && (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No countries found</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── States Tab ── */}
          <TabsContent value="states" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle>States</CardTitle>
                    <CardDescription>Manage state records</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input ref={stateCSVRef} type="file" accept=".csv" className="hidden" onChange={handleStateCSV} />
                    <Button size="sm" variant="outline" onClick={() => downloadSampleCSV("states")}>
                      <Download className="mr-2 h-4 w-4" /> Sample CSV
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => stateCSVRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" /> Import CSV
                    </Button>
                    <Dialog open={stateDialogOpen} onOpenChange={(open) => { setStateDialogOpen(open); if (!open) { setEditingState(null); stateForm.reset(); } }}>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => { setEditingState(null); stateForm.reset({ name: "", code: "", slug: "", country_id: selectedCountryId || undefined }); }}>
                          <Plus className="mr-2 h-4 w-4" />Add State
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{editingState ? "Edit State" : "Add State"}</DialogTitle>
                          <DialogDescription>{editingState ? "Update state details." : "Fill in details to create a new state."}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={stateForm.handleSubmit(handleStateSubmit)} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="state-name">Name *</Label>
                            <Input id="state-name" placeholder="Tamil Nadu" {...stateForm.register("name")} />
                            {stateForm.formState.errors.name && <p className="text-sm text-destructive">{stateForm.formState.errors.name.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state-slug">Slug</Label>
                            <Input id="state-slug" placeholder="tamil-nadu" {...stateForm.register("slug")} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state-code">Abbreviation</Label>
                            <Input id="state-code" placeholder="E.g: CA" {...stateForm.register("code")} />
                          </div>
                          <div className="space-y-2">
                            <Label>Country *</Label>
                            <Controller control={stateForm.control} name="country_id" render={({ field }) => (
                              <Select value={field.value?.toString()} onValueChange={(v) => { field.onChange(parseInt(v)); setSelectedCountryId(parseInt(v)); }}>
                                <SelectTrigger><SelectValue placeholder="Select country..." /></SelectTrigger>
                                <SelectContent>{countriesData?.map((c) => (<SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>))}</SelectContent>
                              </Select>
                            )} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state-sort">Sort Order</Label>
                            <Input id="state-sort" type="number" {...stateForm.register("sort_order", { valueAsNumber: true })} />
                          </div>
                          <div className="flex items-center justify-between border rounded-lg p-3">
                            <Label htmlFor="state-active">Is Active?</Label>
                            <Controller control={stateForm.control} name="is_active" render={({ field }) => (
                              <Switch id="state-active" checked={field.value} onCheckedChange={field.onChange} />
                            )} />
                          </div>
                          <div className="flex items-center justify-between border rounded-lg p-3">
                            <Label htmlFor="state-default">Is Default?</Label>
                            <Controller control={stateForm.control} name="is_default" render={({ field }) => (
                              <Switch id="state-default" checked={field.value} onCheckedChange={field.onChange} />
                            )} />
                          </div>
                          <Button type="submit" className="w-full" disabled={createStateMutation.isPending || updateStateMutation.isPending}>
                            {createStateMutation.isPending || updateStateMutation.isPending ? "Saving..." : editingState ? "Update State" : "Create State"}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {statesLoading ? (
                  <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Default</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statesData?.map((state) => (
                        <TableRow key={state.id}>
                          <TableCell className="font-medium">{state.name}</TableCell>
                          <TableCell>{state.code || "–"}</TableCell>
                          <TableCell>
                            <Switch checked={!!state.is_active} onCheckedChange={(checked) => updateStateMutation.mutate({ id: state.id, data: { is_active: checked } })} disabled={updateStateMutation.isPending} />
                          </TableCell>
                          <TableCell>
                            <Switch checked={!!state.is_default} onCheckedChange={(checked) => { if (checked) updateStateMutation.mutate({ id: state.id, data: { is_default: true } }); }} disabled={!!state.is_default || !state.is_active || updateStateMutation.isPending} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openEditState(state)}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" disabled={deleteStateMutation.isPending} onClick={() => setDeleteConfirm({ label: `Delete "${state.name}"?`, onConfirm: () => deleteStateMutation.mutate(state.id) })}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!statesData || statesData.length === 0) && (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No states found</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Cities Tab ── */}
          <TabsContent value="cities" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle>Cities</CardTitle>
                    <CardDescription>Manage city records</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input ref={cityCSVRef} type="file" accept=".csv" className="hidden" onChange={handleCityCSV} />
                    <Button size="sm" variant="outline" onClick={() => downloadSampleCSV("cities")}>
                      <Download className="mr-2 h-4 w-4" /> Sample CSV
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => cityCSVRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" /> Import CSV
                    </Button>
                    <Dialog open={cityDialogOpen} onOpenChange={(open) => { setCityDialogOpen(open); if (!open) { setEditingCity(null); cityForm.reset(); } }}>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => { setEditingCity(null); cityForm.reset({ name: "", state_id: selectedStateId || undefined, country_id: selectedCountryId || undefined }); }}>
                          <Plus className="mr-2 h-4 w-4" />Add City
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{editingCity ? "Edit City" : "Add City"}</DialogTitle>
                          <DialogDescription>{editingCity ? "Update city details." : "Fill in details to create a new city."}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={cityForm.handleSubmit(handleCitySubmit)} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="city-name">Name *</Label>
                            <Input id="city-name" placeholder="Chennai" {...cityForm.register("name")} />
                            {cityForm.formState.errors.name && <p className="text-sm text-destructive">{cityForm.formState.errors.name.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="city-slug">Slug</Label>
                            <Input id="city-slug" placeholder="chennai" {...cityForm.register("slug")} />
                          </div>
                          <div className="space-y-2">
                            <Label>Country *</Label>
                            <Controller control={cityForm.control} name="country_id" render={({ field }) => (
                              <Select value={field.value?.toString() || selectedCountryId?.toString()} onValueChange={(v) => { field.onChange(parseInt(v)); setSelectedCountryId(parseInt(v)); }}>
                                <SelectTrigger><SelectValue placeholder="Select country..." /></SelectTrigger>
                                <SelectContent>{countriesData?.map((c) => (<SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>))}</SelectContent>
                              </Select>
                            )} />
                            {cityForm.formState.errors.country_id && <p className="text-sm text-destructive">{cityForm.formState.errors.country_id.message}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label>State</Label>
                            <Controller control={cityForm.control} name="state_id" render={({ field }) => (
                              <Select value={field.value?.toString()} onValueChange={(v) => field.onChange(parseInt(v))} disabled={!selectedCountryId && !cityForm.getValues("country_id")}>
                                <SelectTrigger><SelectValue placeholder="Select state..." /></SelectTrigger>
                                <SelectContent>{statesData?.map((s) => (<SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>))}</SelectContent>
                              </Select>
                            )} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="city-zip">Pincode</Label>
                            <Input id="city-zip" placeholder="600001" {...cityForm.register("pincode")} />
                            <p className="text-xs text-muted-foreground">Primary postal code for this city (e.g. 600001).</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="city-sort">Sort Order</Label>
                            <Input id="city-sort" type="number" {...cityForm.register("sort_order", { valueAsNumber: true })} />
                          </div>
                          <div className="flex items-center justify-between border rounded-lg p-3">
                            <Label htmlFor="city-active">Is Active?</Label>
                            <Controller control={cityForm.control} name="is_active" render={({ field }) => (
                              <Switch id="city-active" checked={field.value} onCheckedChange={field.onChange} />
                            )} />
                          </div>
                          <div className="flex items-center justify-between border rounded-lg p-3">
                            <Label htmlFor="city-default">Is Default?</Label>
                            <Controller control={cityForm.control} name="is_default" render={({ field }) => (
                              <Switch id="city-default" checked={field.value} onCheckedChange={field.onChange} />
                            )} />
                          </div>
                          <Button type="submit" className="w-full" disabled={createCityMutation.isPending || updateCityMutation.isPending}>
                            {createCityMutation.isPending || updateCityMutation.isPending ? "Saving..." : editingCity ? "Update City" : "Create City"}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {citiesLoading ? (
                  <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Pincode</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Default</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {citiesData?.map((city) => (
                        <TableRow key={city.id}>
                          <TableCell className="font-medium">{city.name}</TableCell>
                          <TableCell>{city.pincode || "–"}</TableCell>
                          <TableCell>
                            <Switch checked={!!city.is_active} onCheckedChange={(checked) => updateCityMutation.mutate({ id: city.id, data: { is_active: checked } })} disabled={updateCityMutation.isPending} />
                          </TableCell>
                          <TableCell>
                            <Switch checked={!!city.is_default} onCheckedChange={(checked) => { if (checked) updateCityMutation.mutate({ id: city.id, data: { is_default: true } }); }} disabled={!!city.is_default || !city.is_active || updateCityMutation.isPending} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openEditCity(city)}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" disabled={deleteCityMutation.isPending} onClick={() => setDeleteConfirm({ label: `Delete "${city.name}"?`, onConfirm: () => deleteCityMutation.mutate(city.id) })}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!citiesData || citiesData.length === 0) && (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No cities found</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── CSV Preview Dialog ── */}
      {csvPreview && (
        <Dialog open={!!csvPreview} onOpenChange={(open) => { if (!open && !csvImporting) setCsvPreview(null); }}>
          <DialogContent className="max-w-4xl flex flex-col" style={{ maxHeight: "85vh" }}>
            <DialogHeader>
              <DialogTitle>
                Preview Import — {csvPreview.rows.length} {csvPreview.type}
              </DialogTitle>
              <DialogDescription>
                Review the data below before importing. {csvPreview.rows.length > 50 && `Showing first 50 of ${csvPreview.rows.length} rows.`}
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-auto flex-1 border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-muted-foreground w-10">#</TableHead>
                    {Object.keys(csvPreview.rows[0] || {}).map((col) => (
                      <TableHead key={col} className="whitespace-nowrap font-medium">{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvPreview.rows.slice(0, 50).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground text-xs tabular-nums">{i + 1}</TableCell>
                      {Object.entries(row).map(([col, val], j) => (
                        <TableCell key={j} className="whitespace-nowrap text-sm">
                          {col === 'is_active'
                            ? <Badge className={val === '1' ? "bg-green-100 text-green-700 border border-green-300 hover:bg-green-100" : "bg-muted text-muted-foreground border"}>{val === '1' ? 'Active' : 'Inactive'}</Badge>
                            : col === 'is_default'
                            ? val === '1'
                              ? <Badge className="bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-100">Default</Badge>
                              : <span className="text-muted-foreground text-xs">—</span>
                            : col === 'sort_order'
                            ? <span className="tabular-nums font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{val || '0'}</span>
                            : (val || <span className="text-muted-foreground">–</span>)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {csvPreview.rows.length > 50 && (
                    <TableRow>
                      <TableCell colSpan={Object.keys(csvPreview.rows[0]).length + 1} className="text-center text-muted-foreground text-sm py-3">
                        … and {csvPreview.rows.length - 50} more rows
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm text-muted-foreground">{csvPreview.rows.length} rows ready to import</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCsvPreview(null)} disabled={csvImporting}>
                  Cancel
                </Button>
                <Button onClick={executeCSVImport} disabled={csvImporting}>
                  {csvImporting ? "Importing..." : `Import ${csvPreview.rows.length} rows`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
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
    </PermissionGuard>
  );
}
