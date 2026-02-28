'use client';

import { useState, useRef, useCallback } from 'react';
import {
    Folder, FolderOpen, Upload, Grid3X3, List, RefreshCw, Trash2,
    Plus, ChevronRight, Home, File, Image, Video, FileText, Copy,
    Search, X, FolderPlus, Eye, Download
} from 'lucide-react';
import { useMediaFiles, useUploadMediaFile, useDeleteMediaFile, useCreateMediaFolder, MediaFile, MediaFolder } from '@/hooks/use-media-files';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileType(mime: string): 'image' | 'video' | 'document' | 'other' {
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/') || mime.startsWith('audio/')) return 'video';
    if (mime === 'application/pdf') return 'document';
    return 'other';
}

function FileIcon({ mime, className = 'h-8 w-8' }: { mime: string; className?: string }) {
    const type = getFileType(mime);
    if (type === 'image') return <Image className={`${className} text-primary`} />;
    if (type === 'video') return <Video className={`${className} text-primary`} />;
    if (type === 'document') return <FileText className={`${className} text-destructive`} />;
    return <File className={`${className} text-muted-foreground`} />;
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
function Breadcrumb({ folder, onNavigate }: { folder: string; onNavigate: (f: string) => void }) {
    const parts = folder ? folder.split('/') : [];
    return (
        <div className="flex items-center gap-1 text-sm flex-wrap">
            <button
                onClick={() => onNavigate('')}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
                <Home className="h-3.5 w-3.5" />
                <span>All media</span>
            </button>
            {parts.map((p, i) => {
                const path = parts.slice(0, i + 1).join('/');
                return (
                    <span key={path} className="flex items-center gap-1">
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        <button
                            onClick={() => onNavigate(path)}
                            className={`hover:text-foreground transition-colors ${i === parts.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                        >
                            {p}
                        </button>
                    </span>
                );
            })}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function MediaLibraryContent() {
    const { t } = useTranslation();
    const [folder, setFolder] = useState('');
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'document'>('all');
    const [preview, setPreview] = useState<MediaFile | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<MediaFile | null>(null);
    const [newFolderOpen, setNewFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, isLoading, refetch, isFetching } = useMediaFiles(folder);
    const uploadMutation = useUploadMediaFile();
    const deleteMutation = useDeleteMediaFile();
    const createFolderMutation = useCreateMediaFolder();

    const folders: MediaFolder[] = data?.folders ?? [];
    const files: MediaFile[] = data?.files ?? [];
    const driver = data?.driver ?? 'local';

    // Filter + search
    const filteredFiles = files.filter(f => {
        const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' || getFileType(f.mimetype) === filter;
        return matchSearch && matchFilter;
    });

    const filteredFolders = folders.filter(f =>
        !search || f.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadFiles = Array.from(e.target.files ?? []);
        if (!uploadFiles.length) return;
        for (const file of uploadFiles) {
            await uploadMutation.mutateAsync({ file, folder });
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [folder, uploadMutation]);

    const handleCreateFolder = () => {
        if (!newFolderName.trim()) return;
        createFolderMutation.mutate(
            { name: newFolderName.trim(), parent: folder },
            { onSuccess: () => { setNewFolderOpen(false); setNewFolderName(''); } }
        );
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        deleteMutation.mutate({ path: deleteTarget.path, folder }, {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    const copyLink = (url: string) => {
        navigator.clipboard.writeText(url);
        toast.success(t('media.copied', 'Link copied!'));
    };

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <TooltipProvider>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-3xl font-bold">{t('media.title', 'Media Library')}</h1>
                        <span className="text-muted-foreground mt-1 text-sm flex items-center gap-1">
                            {t('media.driver_label', 'Driver')}: <Badge variant="secondary" className="ml-1">{driver}</Badge>
                        </span>
                    </div>

                    {/* Toolbar */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Upload */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleUpload}
                            accept="image/*,video/*,audio/*,application/pdf"
                        />
                        <Button onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
                            <Upload className="mr-2 h-4 w-4" />
                            {uploadMutation.isPending ? t('media.uploading', 'Uploading...') : t('media.upload', 'Upload')}
                        </Button>

                        {/* New folder */}
                        <Button variant="outline" onClick={() => setNewFolderOpen(true)}>
                            <FolderPlus className="mr-2 h-4 w-4" />
                            {t('media.new_folder', 'New Folder')}
                        </Button>

                        {/* Refresh */}
                        <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isFetching}>
                            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* Toolbar row 2: breadcrumb + search + filter + view toggle */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <Breadcrumb folder={folder} onNavigate={setFolder} />

                    <div className="flex items-center gap-2">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('media.search', 'Search...')}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-8 h-9 w-48"
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="absolute right-2 top-2.5">
                                    <X className="h-4 w-4 text-muted-foreground" />
                                </button>
                            )}
                        </div>

                        {/* Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9">
                                    {filter === 'all' ? t('media.filter_all', 'All') : filter}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {(['all', 'image', 'video', 'document'] as const).map(f => (
                                    <DropdownMenuItem key={f} onClick={() => setFilter(f)}
                                        className={filter === f ? 'bg-accent' : ''}>
                                        {f === 'all' ? t('media.filter_all', 'Everything') : f.charAt(0).toUpperCase() + f.slice(1)}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Separator orientation="vertical" className="h-6" />

                        {/* View toggle */}
                        <Button
                            variant={view === 'grid' ? 'default' : 'ghost'}
                            size="icon" className="h-9 w-9"
                            onClick={() => setView('grid')}
                        >
                            <Grid3X3 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={view === 'list' ? 'default' : 'ghost'}
                            size="icon" className="h-9 w-9"
                            onClick={() => setView('list')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <Separator />

                {/* Content */}
                {isLoading ? (
                    <div className={`grid gap-3 ${view === 'grid' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6' : 'grid-cols-1'}`}>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <Skeleton key={i} className={view === 'grid' ? 'h-36 rounded-lg' : 'h-12 rounded-lg'} />
                        ))}
                    </div>
                ) : (filteredFolders.length === 0 && filteredFiles.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                        <FolderOpen className="h-12 w-12 mb-3 opacity-30" />
                        <p>{search ? t('media.no_results', 'No matching files') : t('media.empty', 'This folder is empty')}</p>
                        {!search && (
                            <Button variant="outline" size="sm" className="mt-3" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4" /> {t('media.upload_first', 'Upload files')}
                            </Button>
                        )}
                    </div>
                ) : view === 'grid' ? (

                    /* ══ GRID VIEW ══ */
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {/* Folders */}
                        {filteredFolders.map(f => (
                            <button
                                key={f.path}
                                onDoubleClick={() => setFolder(f.path)}
                                onClick={() => setFolder(f.path)}
                                className="group flex flex-col items-center justify-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent transition-colors aspect-square"
                            >
                                <FolderOpen className="h-10 w-10 text-primary group-hover:scale-105 transition-transform" />
                                <span className="text-xs text-center truncate w-full">{f.name}</span>
                            </button>
                        ))}
                        {/* Files */}
                        {filteredFiles.map(f => (
                            <div
                                key={f.path}
                                className="group relative flex flex-col rounded-lg border bg-card overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {/* Thumbnail / icon */}
                                <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden">
                                    {getFileType(f.mimetype) === 'image' ? (
                                        <img src={f.url} alt={f.name} className="w-full h-full object-cover" loading="lazy" />
                                    ) : (
                                        <FileIcon mime={f.mimetype} className="h-10 w-10" />
                                    )}
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => setPreview(f)}>
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Preview</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => copyLink(f.url)}>
                                                    <Copy className="h-3.5 w-3.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Copy link</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => setDeleteTarget(f)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Delete</TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                                <div className="p-2">
                                    <p className="text-xs truncate font-medium">{f.name}</p>
                                    <p className="text-xs text-muted-foreground">{formatBytes(f.size)}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                ) : (

                    /* ══ LIST VIEW ══ */
                    <div className="rounded-lg border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Name</th>
                                    <th className="text-right px-4 py-2 font-medium text-muted-foreground w-24">Size</th>
                                    <th className="text-right px-4 py-2 font-medium text-muted-foreground w-40">Date</th>
                                    <th className="w-24"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFolders.map(f => (
                                    <tr key={f.path} className="border-t hover:bg-muted/30 cursor-pointer" onDoubleClick={() => setFolder(f.path)}>
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <Folder className="h-4 w-4 text-primary shrink-0" />
                                                <span className="font-medium">{f.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-muted-foreground">—</td>
                                        <td className="px-4 py-2.5 text-right text-muted-foreground">—</td>
                                        <td className="px-4 py-2.5 text-right">
                                            <Button size="sm" variant="ghost" onClick={() => setFolder(f.path)}>Open</Button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredFiles.map(f => (
                                    <tr key={f.path} className="border-t hover:bg-muted/30">
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2">
                                                {getFileType(f.mimetype) === 'image'
                                                    ? <img src={f.url} className="h-8 w-8 rounded object-cover shrink-0" alt={f.name} loading="lazy" />
                                                    : <FileIcon mime={f.mimetype} className="h-5 w-5 shrink-0" />
                                                }
                                                <span className="truncate max-w-xs">{f.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-muted-foreground">{formatBytes(f.size)}</td>
                                        <td className="px-4 py-2.5 text-right text-muted-foreground text-xs">
                                            {f.created_at ? new Date(f.created_at).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setPreview(f)}>
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyLink(f.url)}>
                                                    <Copy className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(f)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Preview Dialog ── */}
                <Dialog open={!!preview} onOpenChange={o => !o && setPreview(null)}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle className="truncate">{preview?.name}</DialogTitle>
                            <DialogDescription className="flex gap-3 text-xs">
                                <span>{formatBytes(preview?.size ?? 0)}</span>
                                <span>{preview?.mimetype}</span>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center justify-center bg-muted rounded-lg overflow-hidden max-h-[60vh]">
                            {preview && getFileType(preview.mimetype) === 'image' ? (
                                <img src={preview.url} alt={preview.name} className="max-h-[60vh] object-contain" />
                            ) : preview && getFileType(preview.mimetype) === 'video' ? (
                                <video src={preview.url} controls className="max-h-[60vh] w-full" />
                            ) : (
                                <div className="p-12 text-center text-muted-foreground">
                                    <FileIcon mime={preview?.mimetype ?? ''} className="h-16 w-16 mx-auto mb-2" />
                                    <p className="text-sm">No preview available</p>
                                </div>
                            )}
                        </div>
                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => preview && copyLink(preview.url)}>
                                <Copy className="mr-2 h-4 w-4" /> Copy Link
                            </Button>
                            <Button asChild variant="outline">
                                <a href={preview?.url} target="_blank" rel="noreferrer" download>
                                    <Download className="mr-2 h-4 w-4" /> Download
                                </a>
                            </Button>
                            <Button variant="destructive" onClick={() => { setDeleteTarget(preview); setPreview(null); }}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ── New Folder Dialog ── */}
                <Dialog open={newFolderOpen} onOpenChange={o => { setNewFolderOpen(o); if (!o) setNewFolderName(''); }}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>{t('media.new_folder', 'New Folder')}</DialogTitle>
                            <DialogDescription>{t('media.new_folder_desc', 'Create a new folder in the current directory')}</DialogDescription>
                        </DialogHeader>
                        <Input
                            placeholder={t('media.folder_name', 'Folder name')}
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                            autoFocus
                        />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
                            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim() || createFolderMutation.isPending}>
                                <Plus className="mr-2 h-4 w-4" /> {t('common.create', 'Create')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ── Delete Confirm ── */}
                <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('common.are_you_sure', 'Are you sure?')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('media.delete_confirm', 'This will permanently delete')} <strong>{deleteTarget?.name}</strong>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={handleDelete}
                            >
                                {t('common.delete', 'Delete')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </TooltipProvider>
    );
}
