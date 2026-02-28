import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export interface BlogTag {
    id: number;
    company_id: number;
    name: string;
    slug: string;
    is_active: boolean | number;
    created_at?: string;
    updated_at?: string;
}

export type CreateBlogTagDto = Omit<BlogTag, 'id' | 'company_id' | 'created_at' | 'updated_at'>;
export type UpdateBlogTagDto = Partial<CreateBlogTagDto>;

const blogTagsApi = {
    getAll: async (): Promise<BlogTag[]> => {
        const response = await apiClient.get('/blog-tags', { params: { limit: 500 } });
        return response.data.data || [];
    },
    getById: async (id: number): Promise<BlogTag> => {
        const response = await apiClient.get(`/blog-tags/${id}`);
        return response.data.data?.blogTag || response.data.blogTag;
    },
    create: async (data: CreateBlogTagDto): Promise<BlogTag> => {
        const response = await apiClient.post('/blog-tags', data);
        return response.data.data?.blogTag || response.data.blogTag;
    },
    update: async ({ id, data }: { id: number; data: UpdateBlogTagDto }): Promise<BlogTag> => {
        const response = await apiClient.put(`/blog-tags/${id}`, data);
        return response.data.data?.blogTag || response.data.blogTag;
    },
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/blog-tags/${id}`);
    },
};

const QUERY_KEY = ['blog-tags'];

export function useBlogTags() {
    return useQuery({
        queryKey: QUERY_KEY,
        queryFn: blogTagsApi.getAll,
        staleTime: 2 * 60 * 1000,
    });
}

export function useBlogTag(id: number) {
    return useQuery({
        queryKey: [...QUERY_KEY, id],
        queryFn: () => blogTagsApi.getById(id),
        enabled: !!id,
    });
}

export function useCreateBlogTag() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: blogTagsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Blog tag created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create blog tag');
        },
    });
}

export function useUpdateBlogTag() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: blogTagsApi.update,
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, vars.id] });
            toast.success('Blog tag updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update blog tag');
        },
    });
}

export function useDeleteBlogTag() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: blogTagsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Blog tag deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete blog tag');
        },
    });
}
