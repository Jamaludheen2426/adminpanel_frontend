'use client';

import { useState, useRef } from 'react';
import { Search, X, Folder, CheckCircle2, Image as ImageIcon, Upload } from 'lucide-react';
import { useMediaFiles, type MediaFile, type MediaFolder } from '@/hooks/use-media-files';
import { resolveMediaUrl } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MediaPickerModalProps {
    open: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    /** Only show images (default: true) */
    imagesOnly?: boolean;
}

export function MediaPickerModal({ open, onClose, onSelect, imagesOnly = true }: MediaPickerModalProps) {
    const [folder, setFolder] = useState('');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<MediaFile | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const { data, isLoading } = useMediaFiles(folder, { enabled: open });

    const folders: MediaFolder[] = data?.folders ?? [];
    const files: MediaFile[] = (data?.files ?? []).filter((f) => {
        if (imagesOnly && !f.mimetype.startsWith('image/')) return false;
        if (search) return f.name.toLowerCase().includes(search.toLowerCase());
        return true;
    });

    const openFolder = (f: MediaFolder) => {
        setFolder(f.path);
        setBreadcrumbs((b) => [...b, f.name]);
        setSelected(null);
    };

    const goBack = (idx: number) => {
        const newCrumbs = breadcrumbs.slice(0, idx);
        setBreadcrumbs(newCrumbs);
        // rebuild path from crumbs
        const newFolder = newCrumbs.length === 0 ? '' : data?.path?.split('/').slice(0, idx).join('/') ?? '';
        setFolder(newFolder);
        setSelected(null);
    };

    const handleInsert = () => {
        if (!selected) return;
        onSelect(resolveMediaUrl(selected.url) ?? selected.url);
        handleClose();
    };

    const handleClose = () => {
        setSelected(null);
        setSearch('');
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
            <DialogContent
                className="max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden"
                onOpenAutoFocus={(e) => {
                    // Redirect focus to search input instead of first image button
                    e.preventDefault();
                    searchInputRef.current?.focus();
                }}
                onKeyDown={(e) => {
                    // Block Enter from propagating to any parent form
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }}
            >

                {/* Header */}
                <DialogHeader className="px-5 py-4 border-b shrink-0">
                    <DialogTitle className="text-base">Media Library</DialogTitle>
                </DialogHeader>

                {/* Toolbar */}
                <div className="px-5 py-3 border-b flex items-center gap-3 shrink-0 bg-muted/30">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1 text-sm flex-1 min-w-0 overflow-x-auto">
                        <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground shrink-0"
                            onClick={() => { setFolder(''); setBreadcrumbs([]); setSelected(null); }}
                        >
                            Root
                        </button>
                        {breadcrumbs.map((crumb, i) => (
                            <span key={i} className="flex items-center gap-1 shrink-0">
                                <span className="text-muted-foreground">/</span>
                                <button
                                    type="button"
                                    className="text-muted-foreground hover:text-foreground"
                                    onClick={() => goBack(i + 1)}
                                >
                                    {crumb}
                                </button>
                            </span>
                        ))}
                    </div>
                    {/* Search */}
                    <div className="relative w-52 shrink-0">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            ref={searchInputRef}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search files…"
                            className="pl-8 h-8 text-xs"
                        />
                        {search && (
                            <button 
                                type="button" 
                                className="absolute right-2 top-1/2 -translate-y-1/2" 
                                onClick={() => setSearch('')}
                            >
                                <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Grid */}
                <div className="overflow-y-auto flex-1 p-5">
                    {isLoading ? (
                        <div className="grid grid-cols-4 gap-3">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {/* Folders */}
                            {folders.map((f) => (
                                <button
                                    key={f.path}
                                    type="button"
                                    className="aspect-square rounded-lg border bg-muted/40 hover:bg-muted hover:border-primary/40 transition-all flex flex-col items-center justify-center gap-2 p-2"
                                    onClick={() => openFolder(f)}
                                >
                                    <Folder className="h-8 w-8 text-primary/60" />
                                    <span className="text-xs text-center truncate w-full">{f.name}</span>
                                </button>
                            ))}

                            {/* Files */}
                            {files.map((file) => {
                                const isSelected = selected?.path === file.path;
                                const thumb = resolveMediaUrl(file.url);
                                return (
                                    <button
                                        type="button"
                                        key={file.path}
                                        className={cn(
                                            'aspect-square rounded-lg border overflow-hidden relative transition-all',
                                            isSelected
                                                ? 'border-primary ring-2 ring-primary/30'
                                                : 'border-border hover:border-primary/40'
                                        )}
                                        onClick={() => setSelected(isSelected ? null : file)}
                                    >
                                        {thumb ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={thumb} alt={file.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-muted">
                                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                        )}
                                        {isSelected && (
                                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                <CheckCircle2 className="h-6 w-6 text-primary" />
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-1 opacity-0 hover:opacity-100 transition-opacity">
                                            <p className="text-white text-[10px] truncate">{file.name}</p>
                                        </div>
                                    </button>
                                );
                            })}

                            {folders.length === 0 && files.length === 0 && (
                                <div className="col-span-5 flex flex-col items-center justify-center py-16 text-muted-foreground">
                                    <ImageIcon className="h-10 w-10 mb-3 opacity-20" />
                                    <p className="text-sm">No files found</p>
                                    <p className="text-xs mt-1 opacity-60">Upload files from the Media module</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <DialogFooter className="px-5 py-3 border-t bg-muted/30 shrink-0 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        {selected ? (
                            <span className="text-foreground font-medium truncate max-w-xs block">{selected.name}</span>
                        ) : (
                            'Click an image to select it'
                        )}
                    </p>
                    <div className="flex gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            disabled={!selected}
                            onClick={handleInsert}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.stopPropagation();
                                    handleInsert();
                                }
                            }}
                        >
                            Insert
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
