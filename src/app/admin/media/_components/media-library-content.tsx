'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    Folder, FolderOpen, Upload, Grid3X3, List, RefreshCw, Trash2,
    Plus, ChevronRight, Home, File as LucideFile, Image, Video, FileText, Copy,
    Search, X, FolderPlus, Eye, Download, MoreVertical, Edit2, ArrowRightCircle,
    ChevronDown
} from 'lucide-react';
import {
    useMediaFiles, useUploadMediaFile, useDeleteMediaFile, useCreateMediaFolder, MediaFile, MediaFolder,
    useRenameMediaFile, useCopyMediaFile, useMoveMediaFile
} from '@/hooks/use-media-files';
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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { PageLoader } from '@/components/common/page-loader';

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
    return <LucideFile className={`${className} text-muted-foreground`} />;
}

function getImageUrl(f: any, refreshKey: number = 0, preview?: string): string {
    if (!f || !f.url) return '';

    // Crop preview passed in from component state — show immediately, no proxy.
    if (preview) return preview;
    if (f.url.startsWith('blob:') || f.url.startsWith('data:')) return f.url;

    try {
        const u = new URL(f.url, window.location.origin);

        // Add updated_at if available
        if (f.updated_at) {
            u.searchParams.set('upd', new Date(f.updated_at).getTime().toString());
        }

        // Add local update seed to force-bust browser cache
        if (refreshKey > 0) {
            u.searchParams.set('rk', refreshKey.toString());
        }

        const directUrl = u.toString();

        // If it's an external URL (S3/CloudFront), wrap it in our proxy.
        // We add the refreshKey to the proxy URL itself so Next.js doesn't cache the API response.
        const isExternal = u.origin !== window.location.origin;
        if (isExternal) {
            return `/api/proxy-image?url=${encodeURIComponent(directUrl)}&_rk=${refreshKey}`;
        }

        return directUrl;
    } catch {
        return f.url;
    }
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

// ─── Folder Tree for Move Dialog ──────────────────────────────────────────────
function FolderTreeNode({ folder, level, selectedPath, onSelect }: { folder: MediaFolder, level: number, selectedPath: string, onSelect: (path: string) => void }) {
    const [expanded, setExpanded] = useState(false);
    const { data } = useMediaFiles(folder.path, { enabled: expanded });

    return (
        <div>
            <div
                className={`flex items-center gap-1.5 p-2 py-1.5 hover:bg-accent cursor-pointer transition-colors text-sm ${selectedPath === folder.path ? 'bg-primary/10 text-primary font-medium' : ''}`}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onClick={() => onSelect(folder.path)}
            >
                <button
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                    className="p-0.5 hover:bg-muted-foreground/20 rounded"
                >
                    <ChevronRight className={`h-3 w-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                </button>
                <Folder className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1" title={folder.path}>{folder.name}</span>
            </div>
            {expanded && data?.folders?.map(f => (
                <FolderTreeNode
                    key={f.path}
                    folder={f}
                    level={level + 1}
                    selectedPath={selectedPath}
                    onSelect={onSelect}
                />
            ))}
        </div>
    );
}

function MoveDialogExplorer({ selectedPath, onSelect }: { selectedPath: string, onSelect: (path: string) => void }) {
    const { data, isLoading } = useMediaFiles(''); // fetch root
    return (
        <div className="border rounded-md max-h-48 overflow-auto py-1">
            {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Loading folders...</div>
            ) : data?.folders?.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No folders found</div>
            ) : (
                data?.folders?.map(f => (
                    <FolderTreeNode
                        key={f.path}
                        folder={f}
                        level={0}
                        selectedPath={selectedPath}
                        onSelect={onSelect}
                    />
                ))
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function MediaLibraryContent() {
    const { t } = useTranslation();
    const qc = useQueryClient();
    const [folder, setFolder] = useState('');
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'document'>('all');
    const [preview, setPreview] = useState<MediaFile | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<MediaFile | null>(null);
    const [newFolderOpen, setNewFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [cropTarget, setCropTarget] = useState<MediaFile | null>(null);
    const [crop, setCrop] = useState<Crop>({ unit: '%', width: 50, height: 50, x: 25, y: 25 });
    const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const [renameTarget, setRenameTarget] = useState<MediaFile | MediaFolder | null>(null);
    const [renameName, setRenameName] = useState('');
    const [moveTarget, setMoveTarget] = useState<MediaFile | MediaFolder | null>(null);
    const [moveTargetFolder, setMoveTargetFolder] = useState('');
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [globalRefreshKey, setGlobalRefreshKey] = useState(0);
    // Keyed by file path — holds data URLs of freshly-cropped images so the UI
    // shows the new crop immediately without waiting for CDN propagation.
    const [cropPreviews, setCropPreviews] = useState<Record<string, string>>({});

    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, isLoading, refetch, isFetching } = useMediaFiles(folder);
    const uploadMutation = useUploadMediaFile();
    const deleteMutation = useDeleteMediaFile();
    const createFolderMutation = useCreateMediaFolder();
    const renameMutation = useRenameMediaFile();
    const copyMutation = useCopyMediaFile();
    const moveMutation = useMoveMediaFile();

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

    const selectedObject = (selectedPath
        ? [...folders, ...files].find(i => i.path === selectedPath)
        : null
    ) as MediaFile | MediaFolder | null;

    const incrementUpdate = () => setGlobalRefreshKey(Date.now());

    const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadFiles = Array.from(e.target.files ?? []);
        if (!uploadFiles.length) return;
        for (const file of uploadFiles) {
            await uploadMutation.mutateAsync({ file, folder }, {
                onSuccess: () => {
                    incrementUpdate();
                },
                onError: (e: any) => toast.error(e?.response?.data?.message || 'Upload failed'),
            });
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [folder, uploadMutation]);

    useEffect(() => {
        if (createFolderMutation.isSuccess) {
            qc.invalidateQueries({ queryKey: ['media-files', folder] });
            incrementUpdate();
        }
    }, [createFolderMutation.isSuccess, folder, qc]);

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
            onSuccess: () => {
                toast.success('Deleted successfully');
                setDeleteTarget(null);
                setSelectedPath(null);
                incrementUpdate();
            }
        });
    };

    const handleRename = () => {
        if (!renameTarget || !renameName.trim() || renameName === renameTarget.name) return;
        renameMutation.mutate({ path: renameTarget.path, newName: renameName.trim(), folder }, {
            onSuccess: () => {
                toast.success('Renamed successfully');
                setRenameTarget(null);
                setRenameName('');
                incrementUpdate();
            }
        });
    };

    useEffect(() => {
        if (copyMutation.isSuccess) {
            qc.invalidateQueries({ queryKey: ['media-files', folder] });
            incrementUpdate();
        }
    }, [copyMutation.isSuccess, folder, qc]);

    const handleMove = () => {
        if (!moveTarget) return;
        // If 'root' is selected, send empty string to API to represent root directory
        const apiTarget = moveTargetFolder === 'root' ? '' : moveTargetFolder;

        moveMutation.mutate({ path: moveTarget.path, targetFolder: apiTarget, folder }, {
            onSuccess: () => {
                toast.success('Moved successfully');
                setMoveTarget(null);
                setMoveTargetFolder('');
                setSelectedPath(null);
                incrementUpdate();
            }
        });
    };

    const toggleSelection = (item: MediaFile | MediaFolder) => {
        setSelectedPath(prev => prev === item.path ? null : item.path);
    };

    const copyLink = (url: string) => {
        navigator.clipboard.writeText(url);
        toast.success(t('media.copied', 'Link copied!'));
    };

    // ── Render ──────────────────────────────────────────────────────────────
    const isAnyPending = uploadMutation.isPending || deleteMutation.isPending || createFolderMutation.isPending || renameMutation.isPending || copyMutation.isPending || moveMutation.isPending;

    return (
        <TooltipProvider>
            <div className="space-y-4">
                <PageLoader open={isAnyPending} text={t('common.processing', 'Processing...')} />
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

                        {selectedObject && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 font-medium text-primary border-primary bg-primary/5 hover:bg-primary/10">
                                        {t('common.actions', 'Actions')}
                                        <ChevronDown className="h-4 w-4 ml-1" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    {'url' in selectedObject && (
                                        <DropdownMenuItem onClick={() => setPreview(selectedObject as MediaFile)}>
                                            <Eye className="mr-2 h-4 w-4" /> {t('common.preview', 'Preview')}
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => { setRenameTarget(selectedObject); setRenameName(selectedObject.name); }}>
                                        <Edit2 className="mr-2 h-4 w-4" /> {t('common.rename', 'Rename')}
                                    </DropdownMenuItem>

                                    {'url' in selectedObject && (
                                        <>
                                            <DropdownMenuItem onClick={() => {
                                                const file = selectedObject as MediaFile;
                                                const parts = file.name.split('.');
                                                const ext = parts.length > 1 ? `.${parts.pop()}` : '';
                                                const nameWithoutExt = parts.join('.');

                                                const match = nameWithoutExt.match(/^(.*?)(?:-copy(-\d+)?)?$/);
                                                const baseName = match?.[1] || nameWithoutExt;

                                                let counter = 1;
                                                let copyName = `${baseName}-copy-${counter}${ext}`;
                                                while (files.some(f => f.name === copyName)) {
                                                    counter++;
                                                    copyName = `${baseName}-copy-${counter}${ext}`;
                                                }

                                                copyMutation.mutate({ path: file.path, targetFolder: folder, newName: copyName, folder });
                                            }}>
                                                <Copy className="mr-2 h-4 w-4" /> {t('common.make_copy', 'Make a copy')}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => copyLink((selectedObject as MediaFile).url)}>
                                                <Copy className="mr-2 h-4 w-4" /> {t('media.copy_link', 'Copy Link')}
                                            </DropdownMenuItem>
                                            {getFileType((selectedObject as MediaFile).mimetype) === 'image' && (
                                                <DropdownMenuItem onClick={() => setCropTarget(selectedObject as MediaFile)}>
                                                    <Image className="mr-2 h-4 w-4" /> {t('common.crop', 'Crop')}
                                                </DropdownMenuItem>
                                            )}
                                        </>
                                    )}

                                    <DropdownMenuItem onClick={() => { setMoveTarget(selectedObject); setMoveTargetFolder(''); }}>
                                        <ArrowRightCircle className="mr-2 h-4 w-4" /> {t('common.move', 'Move')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setDeleteTarget(selectedObject as MediaFile)} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
                                        <Trash2 className="mr-2 h-4 w-4" /> {t('common.delete', 'Delete')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

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
                <div className="flex gap-4">
                    <div className="flex-1 min-w-0">
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
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                {/* Folders */}
                                {filteredFolders.map(f => (
                                    <div
                                        key={f.path}
                                        className={`group relative rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer ${selectedPath === f.path ? 'ring-2 ring-primary border-primary' : ''}`}
                                        onClick={() => toggleSelection(f)}
                                        onDoubleClick={() => setFolder(f.path)}
                                    >
                                        <div className="w-full flex flex-col items-center justify-center gap-2 p-3 aspect-square">
                                            <FolderOpen className="h-10 w-10 text-primary group-hover:scale-105 transition-transform" />
                                            <span className="text-xs text-center truncate w-full">{f.name}</span>
                                        </div>
                                        {selectedPath === f.path && (
                                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {/* Files */}
                                {filteredFiles.map(f => (
                                    <div
                                        key={f.path}
                                        onClick={() => toggleSelection(f)}
                                        className={`group relative flex flex-col rounded-lg border bg-card overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${selectedPath === f.path ? 'ring-2 ring-primary border-primary' : ''}`}
                                    >
                                        {selectedPath === f.path && (
                                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5 z-10">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            </div>
                                        )}
                                        {/* Thumbnail / icon */}
                                        <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden">
                                            {getFileType(f.mimetype) === 'image' ? (
                                                <img src={getImageUrl(f, globalRefreshKey, cropPreviews[f.path])} alt={f.name} className="w-full h-full object-cover" loading="lazy" />
                                            ) : (
                                                <FileIcon mime={f.mimetype} className="h-10 w-10" />
                                            )}
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
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredFolders.map(f => (
                                            <tr
                                                key={f.path}
                                                className={`border-t hover:bg-muted/30 cursor-pointer ${selectedPath === f.path ? 'bg-primary/5' : ''}`}
                                                onClick={() => toggleSelection(f)}
                                                onDoubleClick={() => setFolder(f.path)}
                                            >
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center gap-3">
                                                        <Folder className="h-4 w-4 text-primary shrink-0" />
                                                        <span className="font-medium">{f.name}</span>
                                                        {selectedPath === f.path && (
                                                            <Badge variant="secondary" className="ml-auto bg-primary/10 text-primary border-primary">Selected</Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 text-right text-muted-foreground">—</td>
                                                <td className="px-4 py-2.5 text-right text-muted-foreground">—</td>
                                            </tr>
                                        ))}
                                        {filteredFiles.map(f => (
                                            <tr
                                                key={f.path}
                                                className={`border-t hover:bg-muted/30 cursor-pointer ${selectedPath === f.path ? 'bg-primary/5' : ''}`}
                                                onClick={() => toggleSelection(f)}
                                            >
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center gap-3">
                                                        {getFileType(f.mimetype) === 'image'
                                                            ? <img src={getImageUrl(f, globalRefreshKey, cropPreviews[f.path])} className="h-8 w-8 rounded object-cover shrink-0" alt={f.name} loading="lazy" />
                                                            : <FileIcon mime={f.mimetype} className="h-5 w-5 shrink-0" />
                                                        }
                                                        <span className="truncate max-w-xs">{f.name}</span>
                                                        {selectedPath === f.path && (
                                                            <Badge variant="secondary" className="ml-auto bg-primary/10 text-primary border-primary">Selected</Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 text-right text-muted-foreground">{formatBytes(f.size)}</td>
                                                <td className="px-4 py-2.5 text-right text-muted-foreground text-xs">
                                                    {f.created_at ? new Date(f.created_at).toLocaleDateString() : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* ── Details Sidebar (Shofy Style) ── */}
                    {selectedObject && (
                        <div className="w-72 hidden lg:flex flex-col border rounded-lg bg-card overflow-hidden h-fit sticky top-4">
                            <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden border-b">
                                {'url' in selectedObject ? (
                                    getFileType(selectedObject.mimetype) === 'image' ? (
                                        <img
                                            key={globalRefreshKey}
                                            src={getImageUrl(selectedObject as MediaFile, globalRefreshKey, cropPreviews[(selectedObject as MediaFile).path])}
                                            className="w-full h-full object-contain"
                                            alt={selectedObject.name}
                                        />
                                    ) : (
                                        <FileIcon mime={selectedObject.mimetype} className="h-24 w-24" />
                                    )
                                ) : (
                                    <Folder className="h-24 w-24 text-primary" />
                                )}
                            </div>
                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Name</label>
                                    <p className="text-sm font-medium break-all">{selectedObject.name}</p>
                                </div>
                                {'url' in selectedObject && (
                                    <>
                                        <div>
                                            <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Full URL</label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Input readOnly value={(selectedObject as MediaFile).url} className="h-7 text-[10px] bg-muted/50" />
                                                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => copyLink((selectedObject as MediaFile).url)}>
                                                    <Copy className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Size</label>
                                                <p className="text-xs">{formatBytes((selectedObject as MediaFile).size)}</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Type</label>
                                                <p className="text-xs">{(selectedObject as MediaFile).mimetype.split('/').pop()?.toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Location</label>
                                    <p className="text-xs truncate" title={selectedObject.path}>{selectedObject.path}</p>
                                </div>
                                {'created_at' in selectedObject && (selectedObject as MediaFile).created_at && (
                                    <div>
                                        <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Uploaded At</label>
                                        <p className="text-xs">{new Date((selectedObject as MediaFile).created_at!).toLocaleString()}</p>
                                    </div>
                                )}
                                <div className="pt-2">
                                    <Button variant="outline" className="w-full text-xs h-8" onClick={() => setSelectedPath(null)}>
                                        Clear Selection
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

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
                        <div className="flex-1 min-h-[300px] flex items-center justify-center bg-black/5 rounded-md overflow-hidden p-2">
                            {preview && getFileType(preview.mimetype) === 'image' ? (
                                <img
                                    key={globalRefreshKey}
                                    src={getImageUrl(preview, globalRefreshKey, cropPreviews[preview?.path ?? ''])}
                                    alt={preview.name}
                                    className="max-w-full max-h-[70vh] object-contain shadow-lg"
                                />
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

                {/* ── Rename Dialog ── */}
                <Dialog open={!!renameTarget} onOpenChange={o => { if (!o) setRenameTarget(null); }}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>{t('common.rename', 'Rename')}</DialogTitle>
                            <DialogDescription>{t('media.rename_desc', 'Enter a new name for the file')}</DialogDescription>
                        </DialogHeader>
                        <Input
                            placeholder={t('media.new_name', 'New name')}
                            value={renameName}
                            onChange={e => setRenameName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleRename()}
                            autoFocus
                        />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setRenameTarget(null)}>{t('common.cancel', 'Cancel')}</Button>
                            <Button onClick={handleRename} disabled={!renameName.trim() || renameMutation.isPending || renameName === renameTarget?.name}>
                                {t('common.rename', 'Rename')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* ── Move Dialog ── */}
                <Dialog open={!!moveTarget} onOpenChange={o => { if (!o) setMoveTarget(null); }}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>{t('common.move', 'Move Items')}</DialogTitle>
                        </DialogHeader>

                        <div className="py-2">
                            <span className="text-sm font-medium text-muted-foreground block mb-2">{t('media.select_destination', 'Select a destination folder')}</span>

                            <MoveDialogExplorer selectedPath={moveTargetFolder} onSelect={setMoveTargetFolder} />

                            <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
                                <Checkbox
                                    id="root-folder"
                                    checked={moveTargetFolder === 'root' || (!moveTargetFolder && moveTargetFolder !== 'root' && moveTargetFolder !== '')}
                                    onCheckedChange={(checked) => checked && setMoveTargetFolder('root')}
                                />
                                <label htmlFor="root-folder" className="text-sm cursor-pointer">{t('media.move_to_root', 'Move to root folder')}</label>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setMoveTarget(null)}>{t('common.close', 'Close')}</Button>
                            <Button onClick={handleMove} disabled={moveMutation.isPending || moveTargetFolder === ''}>
                                <FolderOpen className="mr-2 h-4 w-4" /> Move here
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Crop Dialog */}
                <Dialog open={!!cropTarget} onOpenChange={(open) => {
                    if (!open) {
                        setCropTarget(null);
                        setCompletedCrop(null);
                    } else {
                        // Reset to default crop on open
                        setCrop({ unit: '%', width: 50, height: 50, x: 25, y: 25 });
                    }
                }}>
                    <DialogContent className="max-w-3xl overflow-hidden p-6">
                        <DialogHeader>
                            <DialogTitle>{t('common.crop', 'Crop')} {cropTarget?.name}</DialogTitle>
                            <DialogDescription>{t('media.crop_desc', 'Adjust boundaries to crop the image.')}</DialogDescription>
                        </DialogHeader>
                        <div className="text-center max-h-[80vh] overflow-auto bg-black/5 rounded-md border p-2">
                            {cropTarget && (
                                <ReactCrop className="inline-block" crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        key={globalRefreshKey}
                                        src={getImageUrl(cropTarget, globalRefreshKey)}
                                        ref={imgRef}
                                        alt="Crop preview"
                                        crossOrigin="anonymous"
                                        style={{ maxHeight: '75vh', maxWidth: '100%', width: 'auto' }}
                                    />
                                </ReactCrop>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCropTarget(null)}>
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button onClick={async () => {
                                if (!cropTarget || !imgRef.current) return;

                                const image = imgRef.current;
                                const nW = image.naturalWidth;
                                const nH = image.naturalHeight;

                                // PURE PERCENTAGE MATH (Resolution Independent)
                                // We use the current 'crop' state which is always normalized 0-100%
                                if (!crop.width || !crop.height) {
                                    toast.error(t('media.crop_error_select', 'Please select an area to crop'));
                                    return;
                                }

                                const sx = (crop.x * nW) / 100;
                                const sy = (crop.y * nH) / 100;
                                const sw = (crop.width * nW) / 100;
                                const sh = (crop.height * nH) / 100;

                                console.log('[CROP_DEBUG]', {
                                    resolution: `${nW}x${nH}`,
                                    percent: crop,
                                    pixels: { sx, sy, sw, sh }
                                });

                                const canvas = document.createElement('canvas');
                                const ctx = canvas.getContext('2d');
                                if (!ctx) return;

                                canvas.width = Math.round(sw);
                                canvas.height = Math.round(sh);
                                ctx.imageSmoothingQuality = 'high';

                                ctx.drawImage(
                                    image,
                                    sx, sy, sw, sh,     // Source (Absolute natural pixels)
                                    0, 0, Math.round(sw), Math.round(sh) // Destination
                                );

                                canvas.toBlob((blob) => {
                                    if (!blob) {
                                        toast.error(t('media.crop_error', 'Failed to crop image'));
                                        return;
                                    }

                                    console.log('[CROP_BLOB_DEBUG]', {
                                        size: `${(blob.size / 1024).toFixed(2)} KB`,
                                        type: blob.type
                                    });

                                    const file = new window.File([blob], cropTarget.name, { type: cropTarget.mimetype });
                                    const croppedPath = cropTarget.path;

                                    // Convert blob → data URL (base64 string) so we can store it in
                                    // React Query cache permanently — no revocation needed, no memory-leak
                                    // risk, and no premature re-fetch that would pull the still-cached
                                    // old image from CloudFront.
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        const dataUrl = reader.result as string;

                                        uploadMutation.mutate({ file, folder, path: croppedPath }, {
                                            onSuccess: () => {
                                                // Store the data URL in component state keyed by path.
                                                // getImageUrl() checks cropPreviews[f.path] first, so
                                                // the cropped image displays instantly for all img tags
                                                // without touching the React Query cache or the real URL.
                                                // CDN propagation happens in the background; the preview
                                                // stays until the user navigates away or refreshes.
                                                setCropPreviews(prev => ({ ...prev, [croppedPath]: dataUrl }));
                                                incrementUpdate();
                                                toast.success(t('media.crop_success', 'Image cropped and replaced successfully'));
                                                setCropTarget(null);
                                            },
                                            onError: () => {
                                                toast.error(t('media.crop_upload_error', 'Failed to upload cropped image'));
                                            },
                                        });
                                    };
                                    reader.readAsDataURL(blob);
                                }, cropTarget.mimetype, 0.98); // High quality
                            }} disabled={uploadMutation.isPending}>
                                {uploadMutation.isPending ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}
