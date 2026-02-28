import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export interface FaqCategory {
    id: number;
    company_id: number;
    name: string;
    description: string | null;
    sort_order: number;
    is_active: boolean | number;
    created_at?: string;
    updated_at?: string;
}

export type CreateFaqCategoryDto = Omit<FaqCategory, 'id' | 'company_id' | 'created_at' | 'updated_at'>;
export type UpdateFaqCategoryDto = Partial<CreateFaqCategoryDto>;

const faqCategoriesApi = {
    getAll: async (): Promise<FaqCategory[]> => {
        const response = await apiClient.get('/faq-categories', { params: { limit: 200 } });
        return response.data.data || [];
    },
    getById: async (id: number): Promise<FaqCategory> => {
        const response = await apiClient.get(`/faq-categories/${id}`);
        return response.data.data?.faqCategory || response.data.faqCategory;
    },
    create: async (data: CreateFaqCategoryDto): Promise<FaqCategory> => {
        const response = await apiClient.post('/faq-categories', data);
        return response.data.data?.faqCategory || response.data.faqCategory;
    },
    update: async ({ id, data }: { id: number; data: UpdateFaqCategoryDto }): Promise<FaqCategory> => {
        const response = await apiClient.put(`/faq-categories/${id}`, data);
        return response.data.data?.faqCategory || response.data.faqCategory;
    },
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/faq-categories/${id}`);
    },
};

const QUERY_KEY = ['faq-categories'];

export function useFaqCategories() {
    return useQuery({
        queryKey: QUERY_KEY,
        queryFn: faqCategoriesApi.getAll,
    });
}

export function useFaqCategory(id: number) {
    return useQuery({
        queryKey: [...QUERY_KEY, id],
        queryFn: () => faqCategoriesApi.getById(id),
        enabled: !!id,
    });
}

export function useCreateFaqCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: faqCategoriesApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('FAQ Category created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create FAQ Category');
        },
    });
}

export function useUpdateFaqCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: faqCategoriesApi.update,
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, vars.id] });
            toast.success('FAQ Category updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update FAQ Category');
        },
    });
}

export function useDeleteFaqCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: faqCategoriesApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('FAQ Category deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete FAQ Category');
        },
    });
}
