import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export interface BlogCategory {
    id: number;
    company_id: number;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    sort_order: number;
    is_active: boolean | number;
    created_at?: string;
    updated_at?: string;
}

export type CreateBlogCategoryDto = Omit<BlogCategory, 'id' | 'company_id' | 'created_at' | 'updated_at'>;
export type UpdateBlogCategoryDto = Partial<CreateBlogCategoryDto>;

const blogCategoriesApi = {
    getAll: async (): Promise<BlogCategory[]> => {
        const response = await apiClient.get('/blog-categories', { params: { limit: 500 } });
        return response.data.data || [];
    },
    getById: async (id: number): Promise<BlogCategory> => {
        const response = await apiClient.get(`/blog-categories/${id}`);
        return response.data.data?.blogCategory || response.data.blogCategory;
    },
    create: async (data: CreateBlogCategoryDto): Promise<BlogCategory> => {
        const response = await apiClient.post('/blog-categories', data);
        return response.data.data?.blogCategory || response.data.blogCategory;
    },
    update: async ({ id, data }: { id: number; data: UpdateBlogCategoryDto }): Promise<BlogCategory> => {
        const response = await apiClient.put(`/blog-categories/${id}`, data);
        return response.data.data?.blogCategory || response.data.blogCategory;
    },
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/blog-categories/${id}`);
    },
};

const QUERY_KEY = ['blog-categories'];

export function useBlogCategories() {
    return useQuery({
        queryKey: QUERY_KEY,
        queryFn: blogCategoriesApi.getAll,
        staleTime: 2 * 60 * 1000,
    });
}

export function useBlogCategory(id: number) {
    return useQuery({
        queryKey: [...QUERY_KEY, id],
        queryFn: () => blogCategoriesApi.getById(id),
        enabled: !!id,
    });
}

export function useCreateBlogCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: blogCategoriesApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Blog category created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create blog category');
        },
    });
}

export function useUpdateBlogCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: blogCategoriesApi.update,
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, vars.id] });
            toast.success('Blog category updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update blog category');
        },
    });
}

export function useDeleteBlogCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: blogCategoriesApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Blog category deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete blog category');
        },
    });
}
