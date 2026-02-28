import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export interface Announcement {
    id: number;
    company_id: number;
    name: string;
    content: string;
    start_date: string | null;
    end_date: string | null;
    has_action: boolean | number;
    action_label: string | null;
    action_url: string | null;
    open_in_new_tab: boolean | number;
    bg_color: string | null;
    text_color: string | null;
    is_active: boolean | number;
    created_at?: string;
    updated_at?: string;
}

export type CreateAnnouncementDto = Omit<Announcement, 'id' | 'company_id' | 'created_at' | 'updated_at'>;
export type UpdateAnnouncementDto = Partial<CreateAnnouncementDto>;

const announcementsApi = {
    getAll: async (): Promise<Announcement[]> => {
        const response = await apiClient.get('/announcements', { params: { limit: 200 } });
        return response.data.data || [];
    },
    getById: async (id: number): Promise<Announcement> => {
        const response = await apiClient.get(`/announcements/${id}`);
        return response.data.data?.announcement || response.data.announcement;
    },
    create: async (data: CreateAnnouncementDto): Promise<Announcement> => {
        const response = await apiClient.post('/announcements', data);
        return response.data.data?.announcement || response.data.announcement;
    },
    update: async ({ id, data }: { id: number; data: UpdateAnnouncementDto }): Promise<Announcement> => {
        const response = await apiClient.put(`/announcements/${id}`, data);
        return response.data.data?.announcement || response.data.announcement;
    },
    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/announcements/${id}`);
    },
};

const QUERY_KEY = ['announcements'];

export function useAnnouncements() {
    return useQuery({
        queryKey: QUERY_KEY,
        queryFn: announcementsApi.getAll,
        staleTime: 2 * 60 * 1000,
    });
}

export function useAnnouncement(id: number) {
    return useQuery({
        queryKey: [...QUERY_KEY, id],
        queryFn: () => announcementsApi.getById(id),
        enabled: !!id,
        staleTime: 2 * 60 * 1000,
    });
}

export function useCreateAnnouncement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: announcementsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Announcement created successfully');
        },
        onError: (error: Error & { response?: { data?: { message?: string } } }) => {
            toast.error(error.response?.data?.message || 'Failed to create announcement');
        },
    });
}

export function useUpdateAnnouncement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: announcementsApi.update,
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, vars.id] });
            toast.success('Announcement updated successfully');
        },
        onError: (error: Error & { response?: { data?: { message?: string } } }) => {
            toast.error(error.response?.data?.message || 'Failed to update announcement');
        },
    });
}

export function useDeleteAnnouncement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: announcementsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Announcement deleted successfully');
        },
        onError: (error: Error & { response?: { data?: { message?: string } } }) => {
            toast.error(error.response?.data?.message || 'Failed to delete announcement');
        },
    });
}
