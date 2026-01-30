import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-client';
import { toast } from 'sonner';
import type { User, CreateUserDto, UpdateUserDto } from '@/types';
import type { PaginatedResponse, PaginationParams } from '@/lib/api-client';

// API functions
const usersApi = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data.data.user;
  },

  create: async (data: CreateUserDto): Promise<User> => {
    const response = await apiClient.post('/users', data);
    return response.data.data.user;
  },

  update: async ({ id, data }: { id: number; data: UpdateUserDto }): Promise<User> => {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data.data.user;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};

// Get all users with pagination
export function useUsers(params?: PaginationParams) {
  return useQuery({
    queryKey: queryKeys.users.list((params || {}) as Record<string, unknown>),
    queryFn: () => usersApi.getAll(params),
  });
}

// Get single user
export function useUser(id: number) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  });
}

// Create user mutation
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      toast.success('User created successfully');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to create user');
    },
  });
}

// Update user mutation
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.update,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.id) });
      toast.success('User updated successfully');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    },
  });
}

// Delete user mutation
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      toast.success('User deleted successfully');
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    },
  });
}
