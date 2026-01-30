import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import { toast } from 'sonner';
import type { Permission, CreatePermissionDto } from '@/types';
import type { PaginatedResponse, PaginationParams } from '@/lib/api-client';

// API functions
const permissionsApi = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Permission>> => {
    const response = await apiClient.get('/permissions', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Permission> => {
    const response = await apiClient.get(`/permissions/${id}`);
    return response.data.data.permission;
  },

  create: async (data: CreatePermissionDto): Promise<Permission> => {
    const response = await apiClient.post('/permissions', data);
    return response.data.data.permission;
  },

  update: async ({ id, data }: { id: number; data: Partial<CreatePermissionDto> }): Promise<Permission> => {
    const response = await apiClient.put(`/permissions/${id}`, data);
    return response.data.data.permission;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/permissions/${id}`);
  },
};

// Get all permissions with pagination
export function usePermissions(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.permissions.list((params || {}) as Record<string, unknown>),
    queryFn: () => permissionsApi.getAll(params),
  });
}

// Get single permission
export function usePermission(id: string | number) {
  return useQuery({
    queryKey: queryKeys.permissions.detail(Number(id)),
    queryFn: () => permissionsApi.getById(Number(id)),
    enabled: !!id,
  });
}

// Create permission mutation
export function useCreatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: permissionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.lists() });
      toast.success('Permission created successfully');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to create permission');
    },
  });
}

// Update permission mutation
export function useUpdatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: permissionsApi.update,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.detail(variables.id) });
      toast.success('Permission updated successfully');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to update permission');
    },
  });
}

// Delete permission mutation
export function useDeletePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: permissionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.lists() });
      toast.success('Permission deleted successfully');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to delete permission');
    },
  });
}
