import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import { toast } from 'sonner';
import type { Module } from '@/types';
import type { PaginatedResponse, PaginationParams } from '@/lib/api-client';

// API functions
const modulesApi = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Module>> => {
    const response = await apiClient.get('/modules', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Module> => {
    const response = await apiClient.get(`/modules/${id}`);
    return response.data.data.module;
  },

  toggleStatus: async ({ id, is_active }: { id: number; is_active: boolean }): Promise<Module> => {
    const response = await apiClient.put(`/modules/${id}`, { is_active });
    return response.data.data.module;
  },
};

// Get all modules with pagination
export function useModules(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.modules.list((params || {}) as Record<string, unknown>),
    queryFn: () => modulesApi.getAll(params),
  });
}

// Get single module with permissions
export function useModule(id: number) {
  return useQuery({
    queryKey: queryKeys.modules.detail(id),
    queryFn: () => modulesApi.getById(id),
    enabled: !!id,
  });
}

// Toggle module status
export function useToggleModuleStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: modulesApi.toggleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.all });
      toast.success('Module status updated');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to update module status');
    },
  });
}
