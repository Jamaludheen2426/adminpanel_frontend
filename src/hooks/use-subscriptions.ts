import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, isApprovalRequired } from '@/lib/api-client';
import { toast } from 'sonner';

export interface Subscription {
    id: number;
    name: string;
    description: string | null;
    menu_ids: number[];
    price: number;
    validity: number | null;
    features: string | null;
    sort_order: number;
    is_active: boolean | number;
    company_id: number | null;
    created_at?: string;
    updated_at?: string;
}

export type CreateSubscriptionDto = {
    name: string;
    description?: string;
    menu_ids?: number[];
    price: number;
    validity?: number;
    features?: string;
    sort_order?: number;
    is_active: boolean;
};
export type UpdateSubscriptionDto = Partial<CreateSubscriptionDto>;

const QUERY_KEY = ['subscriptions'];

const subscriptionsApi = {
    getAll: async (params?: Record<string, any>): Promise<{ data: Subscription[]; pagination: any }> => {
        const response = await apiClient.get('/subscriptions', { params: { page: 1, limit: 10, ...params } });
        return { data: Array.isArray(response.data.data) ? response.data.data : [], pagination: response.data.pagination };
    },
    getById: async (id: number | string): Promise<Subscription> => {
        const response = await apiClient.get(`/subscriptions/${id}`);
        return response.data.data?.subscription || response.data.data;
    },
    create: async (data: CreateSubscriptionDto): Promise<Subscription> => {
        const response = await apiClient.post('/subscriptions', data);
        return response.data.data?.subscription || response.data.data;
    },
    update: async ({ id, data }: { id: number; data: UpdateSubscriptionDto }): Promise<Subscription> => {
        const response = await apiClient.put(`/subscriptions/${id}`, data);
        return response.data.data?.subscription || response.data.data;
    },
    updateStatus: async ({ id, is_active }: { id: number; is_active: number }): Promise<Subscription> => {
        const response = await apiClient.patch(`/subscriptions/${id}/status`, { is_active });
        return response.data.data?.subscription || response.data.data;
    },
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/subscriptions/${id}`);
    },
};

export function useSubscriptions(params?: Record<string, any>) {
    return useQuery({
        queryKey: [...QUERY_KEY, params ?? {}],
        queryFn: () => subscriptionsApi.getAll(params),
    });
}

export function useCreateSubscription() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: subscriptionsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Subscription created successfully');
        },
        onError: (error: any) => {
            if (isApprovalRequired(error)) {
                queryClient.invalidateQueries({ queryKey: QUERY_KEY });
                return;
            }
            toast.error(error.response?.data?.message || 'Failed to create subscription');
        },
    });
}

export function useUpdateSubscription() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: subscriptionsApi.update,
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: ['subscriptions', 'detail', vars.id] });
            toast.success('Subscription updated successfully');
        },
        onError: (error: any) => {
            if (isApprovalRequired(error)) {
                queryClient.invalidateQueries({ queryKey: QUERY_KEY });
                return;
            }
            toast.error(error.response?.data?.message || 'Failed to update subscription');
        },
    });
}

export function useUpdateSubscriptionStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: subscriptionsApi.updateStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update status');
        },
    });
}

export function useDeleteSubscription() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: subscriptionsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Subscription deleted successfully');
        },
        onError: (error: any) => {
            if (isApprovalRequired(error)) {
                queryClient.invalidateQueries({ queryKey: QUERY_KEY });
                return;
            }
            toast.error(error.response?.data?.message || 'Failed to delete subscription');
        },
    });
}
