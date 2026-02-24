import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, isApprovalRequired } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import { toast } from 'sonner';
import type { Country, State, City, Pincode, Locality, CreateLocalityDto, UpdateLocalityDto } from '@/types';

// API functions
const locationsApi = {
  // Countries
  getCountries: async (): Promise<Country[]> => {
    try {
      const response = await apiClient.get('/locations/countries', { params: { limit: 1000 } });
      const countries = response.data.data || [];
      return countries;
    } catch (error) {
      console.error('Failed to fetch countries:', error);
      throw new Error('Failed to fetch countries');
    }
  },

  createCountry: async (data: Partial<Country>): Promise<Country> => {
    const response = await apiClient.post('/locations/countries', data);
    return response.data.data?.country || response.data.country;
  },

  updateCountry: async ({ id, data }: { id: number; data: Partial<Country> }): Promise<Country> => {
    const response = await apiClient.put(`/locations/countries/${id}`, data);
    return response.data.data?.country || response.data.country;
  },

  deleteCountry: async (id: number): Promise<void> => {
    await apiClient.delete(`/locations/countries/${id}`);
  },

  // States
  getStates: async (countryId?: number): Promise<State[]> => {
    try {
      const url = countryId ? `/locations/states/${countryId}` : '/locations/states';
      const response = await apiClient.get(url, { params: { limit: 1000 } });
      const states = response.data.data || [];
      return states;
    } catch (error) {
      console.error('Failed to fetch states:', error);
      throw new Error('Failed to fetch states');
    }
  },

  createState: async (data: Partial<State>): Promise<State> => {
    const response = await apiClient.post('/locations/states', data);
    return response.data.data?.state || response.data.state;
  },

  updateState: async ({ id, data }: { id: number; data: Partial<State> }): Promise<State> => {
    const response = await apiClient.put(`/locations/states/${id}`, data);
    return response.data.data?.state || response.data.state;
  },

  deleteState: async (id: number): Promise<void> => {
    await apiClient.delete(`/locations/states/${id}`);
  },

  // Cities
  getCities: async (stateId?: number): Promise<City[]> => {
    try {
      const url = stateId ? `/locations/cities/${stateId}` : '/locations/cities';
      const response = await apiClient.get(url, { params: { limit: 1000 } });
      const cities = response.data.data || [];
      return cities;
    } catch (error) {
      console.error('Failed to fetch cities:', error);
      throw new Error('Failed to fetch cities');
    }
  },

  createCity: async (data: Partial<City>): Promise<City> => {
    const response = await apiClient.post('/locations/cities', data);
    return response.data.data?.city || response.data.city;
  },

  updateCity: async ({ id, data }: { id: number; data: Partial<City> }): Promise<City> => {
    const response = await apiClient.put(`/locations/cities/${id}`, data);
    return response.data.data?.city || response.data.city;
  },

  deleteCity: async (id: number): Promise<void> => {
    await apiClient.delete(`/locations/cities/${id}`);
  },

  // Pincodes
  getPincodes: async (cityId: number): Promise<Pincode[]> => {
    try {
      const response = await apiClient.get(`/locations/pincodes/${cityId}`, { params: { limit: 1000 } });
      const pincodes = response.data.data || [];
      return pincodes;
    } catch (error) {
      console.error('Failed to fetch pincodes:', error);
      throw new Error('Failed to fetch pincodes');
    }
  },

  createPincode: async (data: Partial<Pincode>): Promise<Pincode> => {
    const response = await apiClient.post('/locations/pincodes', data);
    return response.data.data?.pincode || response.data.pincode;
  },

  updatePincode: async ({ id, data }: { id: number; data: Partial<Pincode> }): Promise<Pincode> => {
    const response = await apiClient.put(`/locations/pincodes/${id}`, data);
    return response.data.data?.pincode || response.data.pincode;
  },

  deletePincode: async (id: number): Promise<void> => {
    await apiClient.delete(`/locations/pincodes/${id}`);
  },

  // Localities
  getLocalities: async (cityId: number): Promise<Locality[]> => {
    try {
      const response = await apiClient.get(`/locations/localities/${cityId}`, { params: { limit: 1000 } });
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch localities:', error);
      throw new Error('Failed to fetch localities');
    }
  },

  createLocality: async (data: CreateLocalityDto): Promise<Locality> => {
    const response = await apiClient.post('/locations/localities', data);
    return response.data.data?.locality || response.data.locality;
  },

  updateLocality: async ({ id, data }: { id: number; data: UpdateLocalityDto }): Promise<Locality> => {
    const response = await apiClient.put(`/locations/localities/${id}`, data);
    return response.data.data?.locality || response.data.locality;
  },

  deleteLocality: async (id: number): Promise<void> => {
    await apiClient.delete(`/locations/localities/${id}`);
  },
};

// Countries hooks
export function useCountries() {
  return useQuery({
    queryKey: queryKeys.locations.countries(),
    queryFn: locationsApi.getCountries,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateCountry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: locationsApi.createCountry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.countries() });
      toast.success('Country created successfully');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      if (isApprovalRequired(error)) return;
      toast.error(error.response?.data?.message || 'Failed to create country');
    },
  });
}

export function useUpdateCountry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: locationsApi.updateCountry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.countries() });
      toast.success('Country updated successfully');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      if (isApprovalRequired(error)) return;
      toast.error(error.response?.data?.message || 'Failed to update country');
    },
  });
}

export function useDeleteCountry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: locationsApi.deleteCountry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.countries() });
      toast.success('Country deleted successfully');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      if (isApprovalRequired(error)) return;
      toast.error(error.response?.data?.message || 'Failed to delete country');
    },
  });
}

// States hooks
export function useStates(countryId?: number) {
  return useQuery({
    queryKey: queryKeys.locations.states(countryId),
    queryFn: () => locationsApi.getStates(countryId),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: locationsApi.createState,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.all });
      toast.success('State created successfully');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      if (isApprovalRequired(error)) return;
      toast.error(error.response?.data?.message || 'Failed to create state');
    },
  });
}

export function useUpdateState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: locationsApi.updateState,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.all });
      toast.success('State updated successfully');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      if (isApprovalRequired(error)) return;
      toast.error(error.response?.data?.message || 'Failed to update state');
    },
  });
}

export function useDeleteState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: locationsApi.deleteState,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.all });
      toast.success('State deleted successfully');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      if (isApprovalRequired(error)) return;
      toast.error(error.response?.data?.message || 'Failed to delete state');
    },
  });
}

// Cities hooks
export function useCities(stateId?: number) {
  return useQuery({
    queryKey: queryKeys.locations.cities(stateId),
    queryFn: () => locationsApi.getCities(stateId || undefined),
    enabled: stateId !== 0,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: locationsApi.createCity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.all });
      toast.success('City created successfully');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      if (isApprovalRequired(error)) return;
      toast.error(error.response?.data?.message || 'Failed to create city');
    },
  });
}

export function useUpdateCity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: locationsApi.updateCity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.all });
      toast.success('City updated successfully');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      if (isApprovalRequired(error)) return;
      toast.error(error.response?.data?.message || 'Failed to update city');
    },
  });
}

export function useDeleteCity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: locationsApi.deleteCity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.all });
      toast.success('City deleted successfully');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      if (isApprovalRequired(error)) return;
      toast.error(error.response?.data?.message || 'Failed to delete city');
    },
  });
}

// Pincodes hooks
export function usePincodes(cityId: number) {
  return useQuery({
    queryKey: queryKeys.locations.pincodes(cityId),
    queryFn: () => locationsApi.getPincodes(cityId),
    enabled: !!cityId,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePincode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: locationsApi.createPincode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.all });
      toast.success('Pincode created successfully');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      if (isApprovalRequired(error)) return;
      toast.error(error.response?.data?.message || 'Failed to create pincode');
    },
  });
}

export function useUpdatePincode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: locationsApi.updatePincode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.all });
      toast.success('Pincode updated successfully');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      if (isApprovalRequired(error)) return;
      toast.error(error.response?.data?.message || 'Failed to update pincode');
    },
  });
}

export function useDeletePincode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: locationsApi.deletePincode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.all });
      toast.success('Pincode deleted successfully');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      if (isApprovalRequired(error)) return;
      toast.error(error.response?.data?.message || 'Failed to delete pincode');
    },
  });
}

// Localities hooks
export function useLocalities(cityId: number) {
  return useQuery({
    queryKey: queryKeys.locations.localities(cityId),
    queryFn: () => locationsApi.getLocalities(cityId),
    enabled: !!cityId,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateLocality() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: locationsApi.createLocality,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.all });
      toast.success('Locality created successfully');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      if (isApprovalRequired(error)) return;
      toast.error(error.response?.data?.message || 'Failed to create locality');
    },
  });
}

export function useUpdateLocality() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: locationsApi.updateLocality,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.all });
      toast.success('Locality updated successfully');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      if (isApprovalRequired(error)) return;
      toast.error(error.response?.data?.message || 'Failed to update locality');
    },
  });
}

export function useDeleteLocality() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: locationsApi.deleteLocality,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.all });
      toast.success('Locality deleted successfully');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      if (isApprovalRequired(error)) return;
      toast.error(error.response?.data?.message || 'Failed to delete locality');
    },
  });
}