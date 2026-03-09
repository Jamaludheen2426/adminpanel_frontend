import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

const VENDOR_KEYS = {
    all: ['vendors'] as const,
    lists: () => [...VENDOR_KEYS.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...VENDOR_KEYS.lists(), params] as const,
    details: () => [...VENDOR_KEYS.all, 'detail'] as const,
    detail: (id: number | string) => [...VENDOR_KEYS.details(), id] as const,
};

export interface Vendor {
    id: number;
    // Company Info
    company_name: string;
    reg_no: string | null;
    gst_no: string | null;
    company_address: string | null;
    company_contact: string | null;
    landline: string | null;
    company_email: string | null;
    website: string | null;
    youtube: string | null;
    facebook: string | null;
    instagram: string | null;
    // Vendor Info
    name: string;
    profile: string | null;
    address: string | null;
    contact: string | null;
    email: string;
    membership: 'basic' | 'silver' | 'gold' | 'platinum';
    // Bank Info
    bank_name: string | null;
    acc_no: string | null;
    ifsc_code: string | null;
    acc_type: 'savings' | 'current' | 'overdraft' | null;
    branch: string | null;
    bank_logo: string | null;
    // Meta
    status: 'active' | 'inactive';
    company_id: number | null;
    created_at: string;
}

const VENDOR_ME_KEY = ['vendor-me'] as const;

// Get current logged-in vendor profile
export const useVendorMe = () => {
    return useQuery({
        queryKey: VENDOR_ME_KEY,
        queryFn: async () => {
            const res = await apiClient.get('/vendors/auth/me');
            return res.data.data.vendor as Vendor;
        },
        retry: false,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

// Vendor logout
export const useVendorLogout = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: async () => {
            await apiClient.post('/vendors/auth/logout');
        },
        onSuccess: () => {
            queryClient.clear();
            if (typeof window !== 'undefined') {
                document.cookie = 'vendor_auth_pending=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
            }
            toast.success('Logged out successfully');
            router.push('/auth/login');
        },
        onError: () => {
            queryClient.clear();
            if (typeof window !== 'undefined') {
                document.cookie = 'vendor_auth_pending=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
            }
            router.push('/auth/login');
        },
    });
};

export const useVendors = (params?: any) => {
    return useQuery({
        queryKey: VENDOR_KEYS.list(params ?? {}),
        queryFn: async () => {
            const res = await apiClient.get('/vendors', { params });
            return res.data.data;
        },
    });
};

export const useVendor = (id: number) => {
    return useQuery({
        queryKey: VENDOR_KEYS.detail(id),
        queryFn: async () => {
            const res = await apiClient.get(`/vendors/${id}`);
            return res.data.data as Vendor;
        },
        enabled: !!id,
    });
};

export const useCreateVendor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<Vendor> & { password: string }) => {
            const res = await apiClient.post('/vendors', data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.all });
            toast.success('Vendor created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create vendor');
        },
    });
};

export const useUpdateVendor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Vendor> & { password?: string } }) => {
            const res = await apiClient.put(`/vendors/${id}`, data);
            return res.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.all });
            queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.detail(variables.id) });
            toast.success('Vendor updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update vendor');
        },
    });
};

export const useUpdateVendorStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: number; status: 'active' | 'inactive' }) => {
            const res = await apiClient.patch(`/vendors/${id}/status`, { status });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.all });
            toast.success('Vendor status updated');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update status');
        },
    });
};

export const useUpdateVendorProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<Vendor>) => {
            const res = await apiClient.put('/vendors/auth/profile', data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: VENDOR_ME_KEY });
            toast.success('Profile updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        },
    });
};

export const useChangeVendorPassword = () => {
    return useMutation({
        mutationFn: async (data: { current_password: string; new_password: string }) => {
            const res = await apiClient.post('/vendors/auth/change-password', data);
            return res.data;
        },
        onSuccess: () => {
            toast.success('Password changed successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to change password');
        },
    });
};

export const useDeleteVendor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await apiClient.delete(`/vendors/${id}`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.all });
            toast.success('Vendor deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete vendor');
        },
    });
};
