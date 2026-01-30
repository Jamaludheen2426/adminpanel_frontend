"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  useCountries,
  useStates,
  useCities,
  usePincodes,
  useCreateCountry,
  useUpdateCountry,
  useDeleteCountry,
  useCreateState,
  useUpdateState,
  useDeleteState,
  useCreateCity,
  useUpdateCity,
  useDeleteCity,
  useCreatePincode,
  useUpdatePincode,
  useDeletePincode,
} from "@/hooks";
import { Country, State, City, Pincode } from "@/types";

// Schemas
const countrySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters").max(3, "Code must be at most 3 characters"),
  phone_code: z.string().optional(),
  currency_code: z.string().optional(),
});

const stateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().optional(),
  country_id: z.number({ required_error: "Country is required" }),
});

const citySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  state_id: z.number({ required_error: "State is required" }),
});

const pincodeSchema = z.object({
  pincode: z.string().min(3, "Code must be at least 3 characters"),
  area_name: z.string().optional(),
  city_id: z.number({ required_error: "City is required" }),
});

type CountryFormData = z.infer<typeof countrySchema>;
type StateFormData = z.infer<typeof stateSchema>;
type CityFormData = z.infer<typeof citySchema>;
type PincodeFormData = z.infer<typeof pincodeSchema>;

export default function LocationsPage() {
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);

  // Dialog states
  const [countryDialogOpen, setCountryDialogOpen] = useState(false);
  const [stateDialogOpen, setStateDialogOpen] = useState(false);
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [pincodeDialogOpen, setPincodeDialogOpen] = useState(false);

  // Edit states
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [editingState, setEditingState] = useState<State | null>(null);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [editingPincode, setEditingPincode] = useState<Pincode | null>(null);

  // Queries
  const { data: countriesData, isLoading: countriesLoading } = useCountries();
  const { data: statesData, isLoading: statesLoading } = useStates(selectedCountryId || 0);
  const { data: citiesData, isLoading: citiesLoading } = useCities(selectedStateId || 0);
  const { data: pincodesData, isLoading: pincodesLoading } = usePincodes(selectedCityId || 0);
  
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

  const createPincodeMutation = useCreatePincode();
  const updatePincodeMutation = useUpdatePincode();
  const deletePincodeMutation = useDeletePincode();

  // Forms
  const countryForm = useForm<CountryFormData>({
    resolver: zodResolver(countrySchema),
    defaultValues: {
      name: "",
      code: "",
      phone_code: "",
      currency_code: "",
    },
  });

  const stateForm = useForm<StateFormData>({
    resolver: zodResolver(stateSchema),
    defaultValues: {
      name: "",
      code: "",
    },
  });

  const cityForm = useForm<CityFormData>({
    resolver: zodResolver(citySchema),
    defaultValues: {
      name: "",
    },
  });

  const pincodeForm = useForm<PincodeFormData>({
    resolver: zodResolver(pincodeSchema),
    defaultValues: {
      pincode: "",
      area_name: "",
    },
  });

  // Handlers
  const handleCountrySubmit = (data: CountryFormData) => {
    if (editingCountry) {
      updateCountryMutation.mutate(
        { id: editingCountry.id, data },
        {
          onSuccess: () => {
            setCountryDialogOpen(false);
            setEditingCountry(null);
            countryForm.reset();
          },
        }
      );
    } else {
      createCountryMutation.mutate(data, {
        onSuccess: () => {
          setCountryDialogOpen(false);
          countryForm.reset();
        },
      });
    }
  };

  const handleStateSubmit = (data: StateFormData) => {
    if (editingState) {
      updateStateMutation.mutate(
        { id: editingState.id, data },
        {
          onSuccess: () => {
            setStateDialogOpen(false);
            setEditingState(null);
            stateForm.reset();
          },
        }
      );
    } else {
      createStateMutation.mutate(data, {
        onSuccess: () => {
          setStateDialogOpen(false);
          stateForm.reset();
        },
      });
    }
  };

  const handleCitySubmit = (data: CityFormData) => {
    if (editingCity) {
      updateCityMutation.mutate(
        { id: editingCity.id, data },
        {
          onSuccess: () => {
            setCityDialogOpen(false);
            setEditingCity(null);
            cityForm.reset();
          },
        }
      );
    } else {
      createCityMutation.mutate(data, {
        onSuccess: () => {
          setCityDialogOpen(false);
          cityForm.reset();
        },
      });
    }
  };

  const handlePincodeSubmit = (data: PincodeFormData) => {
    if (editingPincode) {
      updatePincodeMutation.mutate(
        { id: editingPincode.id, data },
        {
          onSuccess: () => {
            setPincodeDialogOpen(false);
            setEditingPincode(null);
            pincodeForm.reset();
          },
        }
      );
    } else {
      createPincodeMutation.mutate(data, {
        onSuccess: () => {
          setPincodeDialogOpen(false);
          pincodeForm.reset();
        },
      });
    }
  };

  const openEditCountry = (country: Country) => {
    setEditingCountry(country);
    countryForm.reset({
      name: country.name,
      code: country.code,
      phone_code: country.phone_code || "",
      currency_code: country.currency_code || "",
    });
    setCountryDialogOpen(true);
  };

  const openEditState = (state: State) => {
    setEditingState(state);
    stateForm.reset({
      name: state.name,
      code: state.code || "",
      country_id: state.country_id,
    });
    setStateDialogOpen(true);
  };

  const openEditCity = (city: City) => {
    setEditingCity(city);
    cityForm.reset({
      name: city.name,
      state_id: city.state_id,
    });
    setCityDialogOpen(true);
  };

  const openEditPincode = (pincode: Pincode) => {
    setEditingPincode(pincode);
    pincodeForm.reset({
      pincode: pincode.pincode,
      area_name: pincode.area_name || "",
      city_id: pincode.city_id,
    });
    setPincodeDialogOpen(true);
  };

  const openAddState = () => {
    setEditingState(null);
    stateForm.reset({
      name: "",
      code: "",
      country_id: selectedCountryId || undefined,
    });
    setStateDialogOpen(true);
  };

  const openAddCity = () => {
    setEditingCity(null);
    cityForm.reset({
      name: "",
      state_id: selectedStateId || undefined,
    });
    setCityDialogOpen(true);
  };

  const openAddPincode = () => {
    setEditingPincode(null);
    pincodeForm.reset({
      pincode: "",
      area_name: "",
      city_id: selectedCityId || undefined,
    });
    setPincodeDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Locations</h1>
        <p className="text-muted-foreground mt-1">
          Manage countries, states, cities, and pincodes
        </p>
      </div>

      <Tabs defaultValue="countries" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="countries">Countries</TabsTrigger>
          <TabsTrigger value="states">States</TabsTrigger>
          <TabsTrigger value="cities">Cities</TabsTrigger>
          <TabsTrigger value="pincodes">Pincodes</TabsTrigger>
        </TabsList>

        {/* Countries Tab */}
        <TabsContent value="countries" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Countries</CardTitle>
                  <CardDescription>Manage country records</CardDescription>
                </div>
                <Dialog open={countryDialogOpen} onOpenChange={(open) => {
                  setCountryDialogOpen(open);
                  if (!open) {
                    setEditingCountry(null);
                    countryForm.reset();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Country
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingCountry ? "Edit Country" : "Add Country"}</DialogTitle>
                      <DialogDescription>
                        {editingCountry ? "Update the country details below." : "Fill in the details to create a new country."}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={countryForm.handleSubmit(handleCountrySubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="country-name">Name</Label>
                        <Input id="country-name" placeholder="United States" {...countryForm.register("name")} />
                        {countryForm.formState.errors.name && (
                          <p className="text-sm text-destructive">{countryForm.formState.errors.name.message}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="country-code">Code</Label>
                          <Input id="country-code" placeholder="US" {...countryForm.register("code")} />
                          {countryForm.formState.errors.code && (
                            <p className="text-sm text-destructive">{countryForm.formState.errors.code.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone-code">Phone Code</Label>
                          <Input id="phone-code" placeholder="+1" {...countryForm.register("phone_code")} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency-code">Currency Code</Label>
                        <Input id="currency-code" placeholder="USD" {...countryForm.register("currency_code")} />
                      </div>
                      <Button type="submit" className="w-full" disabled={createCountryMutation.isPending || updateCountryMutation.isPending}>
                        {createCountryMutation.isPending || updateCountryMutation.isPending ? "Saving..." : editingCountry ? "Update Country" : "Create Country"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {countriesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Phone Code</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {countriesData?.map((country) => (
                      <TableRow key={country.id}>
                        <TableCell className="font-medium">{country.name}</TableCell>
                        <TableCell>{country.code}</TableCell>
                        <TableCell>{country.phone_code || "-"}</TableCell>
                        <TableCell>{country.currency_code || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditCountry(country)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Delete this country?")) {
                                  deleteCountryMutation.mutate(country.id);
                                }
                              }}
                              disabled={deleteCountryMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!countriesData || countriesData.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No countries found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* States Tab */}
        <TabsContent value="states" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <CardTitle>States</CardTitle>
                    <CardDescription>Manage state records</CardDescription>
                  </div>
                  <Select
                    value={selectedCountryId?.toString() || ""}
                    onValueChange={(val) => setSelectedCountryId(parseInt(val))}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countriesData?.map((country) => (
                        <SelectItem key={country.id} value={country.id.toString()}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Dialog open={stateDialogOpen} onOpenChange={(open) => {
                  setStateDialogOpen(open);
                  if (!open) {
                    setEditingState(null);
                    stateForm.reset();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" disabled={!selectedCountryId} onClick={openAddState}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add State
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingState ? "Edit State" : "Add State"}</DialogTitle>
                      <DialogDescription>
                        {editingState ? "Update the state details below." : "Fill in the details to create a new state."}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={stateForm.handleSubmit(handleStateSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="state-name">Name</Label>
                        <Input id="state-name" placeholder="California" {...stateForm.register("name")} />
                        {stateForm.formState.errors.name && (
                          <p className="text-sm text-destructive">{stateForm.formState.errors.name.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state-code">Code</Label>
                        <Input id="state-code" placeholder="CA" {...stateForm.register("code")} />
                      </div>
                      <input type="hidden" {...stateForm.register("country_id", { valueAsNumber: true })} />
                      <Button type="submit" className="w-full" disabled={createStateMutation.isPending || updateStateMutation.isPending}>
                        {createStateMutation.isPending || updateStateMutation.isPending ? "Saving..." : editingState ? "Update State" : "Create State"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedCountryId ? (
                <div className="text-center py-8 text-muted-foreground">
                  Select a country to view states
                </div>
              ) : statesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statesData?.map((state) => (
                      <TableRow key={state.id}>
                        <TableCell className="font-medium">{state.name}</TableCell>
                        <TableCell>{state.code || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditState(state)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Delete this state?")) {
                                  deleteStateMutation.mutate(state.id);
                                }
                              }}
                              disabled={deleteStateMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!statesData || statesData.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          No states found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cities Tab */}
        <TabsContent value="cities" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <CardTitle>Cities</CardTitle>
                    <CardDescription>Manage city records</CardDescription>
                  </div>
                  <Select
                    value={selectedCountryId?.toString() || ""}
                    onValueChange={(val) => {
                      setSelectedCountryId(parseInt(val));
                      setSelectedStateId(null);
                    }}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countriesData?.map((country) => (
                        <SelectItem key={country.id} value={country.id.toString()}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedStateId?.toString() || ""}
                    onValueChange={(val) => setSelectedStateId(parseInt(val))}
                    disabled={!selectedCountryId}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      {statesData?.map((state) => (
                        <SelectItem key={state.id} value={state.id.toString()}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Dialog open={cityDialogOpen} onOpenChange={(open) => {
                  setCityDialogOpen(open);
                  if (!open) {
                    setEditingCity(null);
                    cityForm.reset();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" disabled={!selectedStateId} onClick={openAddCity}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add City
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingCity ? "Edit City" : "Add City"}</DialogTitle>
                      <DialogDescription>
                        {editingCity ? "Update the city details below." : "Fill in the details to create a new city."}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={cityForm.handleSubmit(handleCitySubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="city-name">Name</Label>
                        <Input id="city-name" placeholder="Los Angeles" {...cityForm.register("name")} />
                        {cityForm.formState.errors.name && (
                          <p className="text-sm text-destructive">{cityForm.formState.errors.name.message}</p>
                        )}
                      </div>
                      <input type="hidden" {...cityForm.register("state_id", { valueAsNumber: true })} />
                      <Button type="submit" className="w-full" disabled={createCityMutation.isPending || updateCityMutation.isPending}>
                        {createCityMutation.isPending || updateCityMutation.isPending ? "Saving..." : editingCity ? "Update City" : "Create City"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedStateId ? (
                <div className="text-center py-8 text-muted-foreground">
                  Select a country and state to view cities
                </div>
              ) : citiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {citiesData?.map((city) => (
                      <TableRow key={city.id}>
                        <TableCell className="font-medium">{city.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditCity(city)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Delete this city?")) {
                                  deleteCityMutation.mutate(city.id);
                                }
                              }}
                              disabled={deleteCityMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!citiesData || citiesData.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                          No cities found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pincodes Tab */}
        <TabsContent value="pincodes" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <CardTitle>Pincodes</CardTitle>
                    <CardDescription>Manage pincode records</CardDescription>
                  </div>
                  <Select
                    value={selectedCountryId?.toString() || ""}
                    onValueChange={(val) => {
                      setSelectedCountryId(parseInt(val));
                      setSelectedStateId(null);
                      setSelectedCityId(null);
                    }}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countriesData?.map((country) => (
                        <SelectItem key={country.id} value={country.id.toString()}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedStateId?.toString() || ""}
                    onValueChange={(val) => {
                      setSelectedStateId(parseInt(val));
                      setSelectedCityId(null);
                    }}
                    disabled={!selectedCountryId}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      {statesData?.map((state) => (
                        <SelectItem key={state.id} value={state.id.toString()}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedCityId?.toString() || ""}
                    onValueChange={(val) => setSelectedCityId(parseInt(val))}
                    disabled={!selectedStateId}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="City" />
                    </SelectTrigger>
                    <SelectContent>
                      {citiesData?.map((city) => (
                        <SelectItem key={city.id} value={city.id.toString()}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Dialog open={pincodeDialogOpen} onOpenChange={(open) => {
                  setPincodeDialogOpen(open);
                  if (!open) {
                    setEditingPincode(null);
                    pincodeForm.reset();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" disabled={!selectedCityId} onClick={openAddPincode}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Pincode
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingPincode ? "Edit Pincode" : "Add Pincode"}</DialogTitle>
                      <DialogDescription>
                        {editingPincode ? "Update the pincode details below." : "Fill in the details to create a new pincode."}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={pincodeForm.handleSubmit(handlePincodeSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="pincode-code">Pincode</Label>
                        <Input id="pincode-code" placeholder="90001" {...pincodeForm.register("pincode")} />
                        {pincodeForm.formState.errors.pincode && (
                          <p className="text-sm text-destructive">{pincodeForm.formState.errors.pincode.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pincode-area">Area</Label>
                        <Input id="pincode-area" placeholder="Downtown" {...pincodeForm.register("area_name")} />
                      </div>
                      <input type="hidden" {...pincodeForm.register("city_id", { valueAsNumber: true })} />
                      <Button type="submit" className="w-full" disabled={createPincodeMutation.isPending || updatePincodeMutation.isPending}>
                        {createPincodeMutation.isPending || updatePincodeMutation.isPending ? "Saving..." : editingPincode ? "Update Pincode" : "Create Pincode"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedCityId ? (
                <div className="text-center py-8 text-muted-foreground">
                  Select country, state, and city to view pincodes
                </div>
              ) : pincodesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pincode</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pincodesData?.map((pincode) => (
                      <TableRow key={pincode.id}>
                        <TableCell className="font-medium">{pincode.pincode}</TableCell>
                        <TableCell>{pincode.area_name || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditPincode(pincode)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Delete this pincode?")) {
                                  deletePincodeMutation.mutate(pincode.id);
                                }
                              }}
                              disabled={deletePincodeMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!pincodesData || pincodesData.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          No pincodes found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
