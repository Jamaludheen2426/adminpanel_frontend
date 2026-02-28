import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export interface Ad {
    id: number;
    name: string;
    title: string | null;
    subtitle: string | null;
    button_label: string | null;
    key: string;
    sort_order: number;
    ads_type: 'custom' | 'google_adsense';
    url: string | null;
    target: string;
    image: string | null;
    tablet_image: string | null;
    mobile_image: string | null;
    google_adsense_slot_id: string | null;
    location: string;
    expired_at: string | null;
    clicked: number;
    is_active: number;
    created_at: string;
    updated_at: string;
}

export const useAds = (params?: any) => {
    return useQuery({
        queryKey: ['ads', params],
        queryFn: async () => {
            const res = await apiClient.get('/ads', { params });
            return res.data.data;
        },
    });
};

export const useCreateAd = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<Ad>) => {
            const res = await apiClient.post('/ads', data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ads'] });
            toast.success('Ad created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create ad');
        },
    });
};

export const useUpdateAd = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Ad> }) => {
            const res = await apiClient.put(`/ads/${id}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ads'] });
            toast.success('Ad updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update ad');
        },
    });
};

export const useDeleteAd = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await apiClient.delete(`/ads/${id}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ads'] });
            toast.success('Ad deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete ad');
        },
    });
};
