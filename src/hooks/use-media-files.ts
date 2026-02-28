import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export interface MediaFile {
    name: string;
    path: string;
    url: string;
    size: number;
    mimetype: string;
    type: 'file';
    created_at?: string;
}

export interface MediaFolder {
    name: string;
    path: string;
    type: 'folder';
}

export interface MediaListResult {
    folders: MediaFolder[];
    files: MediaFile[];
    path: string;
    driver: string;
}

// ─── List files ───────────────────────────────────────────────────────────────
export const useMediaFiles = (folder: string = '') => {
    return useQuery<MediaListResult>({
        queryKey: ['media-files', folder],
        queryFn: async () => {
            const res = await apiClient.get('/media/files', { params: { folder } });
            return res.data.data;
        },
    });
};

// ─── Upload file ──────────────────────────────────────────────────────────────
export const useUploadMediaFile = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ file, folder }: { file: File; folder: string }) => {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('folder', folder);
            const res = await apiClient.post('/media/upload', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data.data.file;
        },
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['media-files', vars.folder] });
            toast.success('File uploaded');
        },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Upload failed'),
    });
};

// ─── Delete file ──────────────────────────────────────────────────────────────
export const useDeleteMediaFile = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ path, folder }: { path: string; folder: string }) => {
            await apiClient.delete('/media', { data: { path } });
            return folder;
        },
        onSuccess: (folder) => {
            qc.invalidateQueries({ queryKey: ['media-files', folder] });
            toast.success('File deleted');
        },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Delete failed'),
    });
};

// ─── Create folder ────────────────────────────────────────────────────────────
export const useCreateMediaFolder = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ name, parent }: { name: string; parent: string }) => {
            const folder = parent ? `${parent}/${name}` : name;
            const res = await apiClient.post('/media/folder', { folder });
            return { result: res.data.data, parent };
        },
        onSuccess: ({ parent }) => {
            qc.invalidateQueries({ queryKey: ['media-files', parent] });
            toast.success('Folder created');
        },
        onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create folder'),
    });
};
