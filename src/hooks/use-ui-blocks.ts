import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export interface UiBlockField {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'image' | 'url' | 'number' | 'select' | 'richtext' | 'color';
    placeholder?: string;
    hint?: string;
    defaultValue?: string | number;
    required?: boolean;
    options?: { value: string; label: string }[];
}

export interface UiBlock {
    id: number;
    type: string;
    label: string;
    description?: string;
    color?: string;
    preview_image?: string;
    html_template?: string;
    fields: UiBlockField[];
    is_active: number;
    created_at?: string;
    updated_at?: string;
}

interface UiBlocksResponse {
    data: UiBlock[];
    pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

interface UiBlocksParams {
    page?: number;
    limit?: number;
    search?: string;
    active_only?: string;
}

// ─── List ─────────────────────────────────────────────────────────────────────

export function useUiBlocks(params: UiBlocksParams = {}) {
    return useQuery<UiBlocksResponse>({
        queryKey: ['ui-blocks', params],
        queryFn: async () => {
            const response = await apiClient.get('/ui-blocks', { params });
            return { data: response.data.data || [], pagination: response.data.pagination };
        },
    });
}

// Fetch only active blocks (for page builder picker)
export function useActiveUiBlocks() {
    return useQuery<UiBlocksResponse>({
        queryKey: ['ui-blocks', { active_only: '1', limit: 100 }],
        queryFn: async () => {
            const response = await apiClient.get('/ui-blocks', {
                params: { active_only: '1', limit: 100 },
            });
            return { data: response.data.data || [], pagination: response.data.pagination };
        },
        staleTime: 5 * 60 * 1000,
    });
}

// ─── Single ───────────────────────────────────────────────────────────────────

export function useUiBlock(id: number | null) {
    return useQuery<{ block: UiBlock }>({
        queryKey: ['ui-blocks', id],
        queryFn: async () => {
            const response = await apiClient.get(`/ui-blocks/${id}`);
            return response.data.data?.block || response.data.block || response.data.data;
        },
        enabled: !!id,
    });
}

// ─── Create ───────────────────────────────────────────────────────────────────

export function useCreateUiBlock() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: Partial<UiBlock>) => {
            const response = await apiClient.post('/ui-blocks', payload);
            return response.data.data?.block || response.data.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['ui-blocks'] });
            toast.success('UI Block created');
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to create UI Block');
        },
    });
}

// ─── Update ───────────────────────────────────────────────────────────────────

export function useUpdateUiBlock() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<UiBlock> }) => {
            const response = await apiClient.put(`/ui-blocks/${id}`, data);
            return response.data.data?.block || response.data.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['ui-blocks'] });
            toast.success('UI Block updated');
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to update UI Block');
        },
    });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export function useDeleteUiBlock() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const response = await apiClient.delete(`/ui-blocks/${id}`);
            return response.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['ui-blocks'] });
            toast.success('UI Block deleted');
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to delete UI Block');
        },
    });
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

export function useToggleUiBlock() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const response = await apiClient.patch(`/ui-blocks/${id}/toggle`);
            return response.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['ui-blocks'] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to update status');
        },
    });
}
