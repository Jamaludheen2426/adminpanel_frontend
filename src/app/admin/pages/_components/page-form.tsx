'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import {
    Save, LogOut, ChevronDown, X, ImageIcon, FileText,
    Plus, Trash2, ChevronUp, Pencil, Blocks, LayoutTemplate, Code2,
} from 'lucide-react';
import { useCreatePage, useUpdatePage, type Page } from '@/hooks/use-pages';
import { useActiveUiBlocks, type UiBlock } from '@/hooks/use-ui-blocks';
import { isApprovalRequired } from '@/lib/api-client';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { MediaPickerModal } from '@/components/common/media-picker-modal';
import { resolveMediaUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageBlock {
    id: string;
    type: string;
    order: number;
    settings: Record<string, string | number>;
}

// ─── Block Picker Modal ───────────────────────────────────────────────────────

function BlockPickerModal({ open, onClose, blocks, onSelect }: {
    open: boolean; onClose: () => void; blocks: UiBlock[]; onSelect: (b: UiBlock) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Blocks className="h-4 w-4 text-primary" /> Add a Block
                    </DialogTitle>
                    <DialogDescription>Choose a block type to add to this page.</DialogDescription>
                </DialogHeader>
                {/* Search */}
                <div className="relative mb-3">
                    <input
                        type="text"
                        placeholder="Search blocks..."
                        className="w-full h-9 pl-3 pr-8 rounded-lg border border-border/60 bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                        onChange={(e) => {
                            const val = e.target.value.toLowerCase();
                            const items = document.querySelectorAll('[data-block-item]');
                            items.forEach((el) => {
                                const name = el.getAttribute('data-block-name') || '';
                                (el as HTMLElement).style.display = name.includes(val) ? '' : 'none';
                            });
                        }}
                    />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                    {blocks.filter(b => b.is_active).map((b) => {
                        const previewImg = b.preview_image ? resolveMediaUrl(b.preview_image) : null;
                        return (
                            <div key={b.id} data-block-item data-block-name={(b.label + ' ' + b.type).toLowerCase()}
                                className="group flex flex-col rounded-xl border border-border/60 overflow-hidden hover:border-primary hover:shadow-md transition-all cursor-pointer"
                                onClick={() => { onSelect(b); onClose(); }}>
                                {/* Preview image area */}
                                <div className="relative w-full bg-muted/40 overflow-hidden" style={{ aspectRatio: '16/9' }}>
                                    {previewImg ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={previewImg} alt={b.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                        <div className={cn('w-full h-full flex items-center justify-center', b.color || 'bg-slate-500')}>
                                            <Code2 className="h-8 w-8 text-white/60" />
                                        </div>
                                    )}
                                </div>
                                {/* Footer */}
                                <div className="p-2.5 flex items-end justify-between gap-2 bg-card">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm truncate">{b.label}</p>
                                        {b.description && (
                                            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{b.description}</p>
                                        )}
                                    </div>
                                    <span className="shrink-0 text-[11px] border border-border rounded px-2 py-0.5 text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">
                                        Use
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {blocks.filter(b => b.is_active).length === 0 && (
                        <div className="col-span-4 py-8 text-center text-muted-foreground text-sm">No active block types found.</div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Block Config Modal ───────────────────────────────────────────────────────

function BlockConfigModal({ open, onClose, blockDef, settings, onSave }: {
    open: boolean; onClose: () => void; blockDef: UiBlock | null;
    settings: Record<string, string | number>; onSave: (s: Record<string, string | number>) => void;
}) {
    const [local, setLocal] = useState<Record<string, string | number>>({});

    useEffect(() => {
        if (open && blockDef) {
            const defaults: Record<string, string | number> = {};
            blockDef.fields.forEach((f) => { defaults[f.key] = settings[f.key] ?? f.defaultValue ?? ''; });
            setLocal(defaults);
        }
    }, [open, blockDef, settings]);

    if (!blockDef) return null;
    const set = (key: string, val: string | number) => setLocal((p) => ({ ...p, [key]: val }));

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className={cn('w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold', blockDef.color || 'bg-slate-500')}>
                            {blockDef.label.charAt(0)}
                        </span>
                        Configure: {blockDef.label}
                    </DialogTitle>
                    <DialogDescription>Fill in the settings for this block.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    {blockDef.fields.map((field) => (
                        <div key={field.key} className="space-y-1.5">
                            <Label className="text-sm">
                                {field.label}
                                {field.required && <span className="text-destructive ml-1">*</span>}
                            </Label>
                            {field.type === 'textarea' || field.type === 'richtext' ? (
                                <Textarea rows={3} placeholder={field.placeholder}
                                    value={String(local[field.key] ?? '')}
                                    onChange={(e) => set(field.key, e.target.value)} />
                            ) : field.type === 'select' ? (
                                <Select value={String(local[field.key] ?? '')} onValueChange={(v) => set(field.key, v)}>
                                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                    <SelectContent>
                                        {(field.options || []).map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : field.type === 'number' ? (
                                <Input type="number" placeholder={field.placeholder}
                                    value={String(local[field.key] ?? '')}
                                    onChange={(e) => set(field.key, e.target.value)} />
                            ) : (
                                <Input type={field.type === 'color' ? 'color' : 'text'}
                                    placeholder={field.placeholder}
                                    value={String(local[field.key] ?? '')}
                                    onChange={(e) => set(field.key, e.target.value)} />
                            )}
                            {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
                        </div>
                    ))}
                    {blockDef.fields.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">This block has no configurable fields.</p>
                    )}
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="button" onClick={() => { onSave(local); onClose(); }}>Save Block</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Block Builder ─────────────────────────────────────────────────────────────

function BlockBuilder({ value, onChange, blockDefs }: {
    value: string; onChange: (json: string) => void; blockDefs: UiBlock[];
}) {
    const [blocks, setBlocks] = useState<PageBlock[]>([]);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [configBlock, setConfigBlock] = useState<PageBlock | null>(null);
    const [configDef, setConfigDef] = useState<UiBlock | null>(null);

    useEffect(() => {
        try {
            const parsed = JSON.parse(value || '[]');
            if (Array.isArray(parsed)) {
                setBlocks(parsed.map((b: any, i: number) => ({
                    id: b.id || `block_${i}_${Date.now()}`,
                    type: b.type, order: b.order ?? i + 1, settings: b.settings || {},
                })));
            }
        } catch { setBlocks([]); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const emit = (updated: PageBlock[]) => {
        const sorted = [...updated].sort((a, b) => a.order - b.order);
        onChange(JSON.stringify(sorted));
        setBlocks(sorted);
    };

    const addBlock = (def: UiBlock) => {
        const newBlock: PageBlock = {
            id: `block_${Date.now()}`,
            type: def.type, order: blocks.length + 1,
            settings: Object.fromEntries(def.fields.map((f) => [f.key, f.defaultValue ?? ''])),
        };
        if (def.fields.length === 0) { emit([...blocks, newBlock]); }
        else { setConfigBlock(newBlock); setConfigDef(def); }
    };

    const openEdit = (block: PageBlock) => {
        const def = blockDefs.find((d) => d.type === block.type);
        if (def) { setConfigBlock(block); setConfigDef(def); }
    };

    const saveConfig = (settings: Record<string, string | number>) => {
        if (!configBlock) return;
        const exists = blocks.find((b) => b.id === configBlock.id);
        if (exists) emit(blocks.map((b) => b.id === configBlock.id ? { ...b, settings } : b));
        else emit([...blocks, { ...configBlock, settings }]);
        setConfigBlock(null); setConfigDef(null);
    };

    const removeBlock = (id: string) => emit(blocks.filter((b) => b.id !== id));

    const move = (id: string, dir: -1 | 1) => {
        const idx = blocks.findIndex((b) => b.id === id);
        if (idx < 0) return;
        const arr = [...blocks];
        const target = idx + dir;
        if (target < 0 || target >= arr.length) return;
        [arr[idx], arr[target]] = [arr[target], arr[idx]];
        emit(arr.map((b, i) => ({ ...b, order: i + 1 })));
    };

    return (
        <>
            <div className="space-y-2">
                {blocks.length === 0 ? (
                    <div className="border-2 border-dashed rounded-lg py-10 text-center">
                        <LayoutTemplate className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm font-medium text-muted-foreground">No blocks yet</p>
                        <p className="text-xs text-muted-foreground mt-1 mb-4">Add blocks to build your page layout</p>
                        <Button type="button" size="sm" onClick={() => setPickerOpen(true)}>
                            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add First Block
                        </Button>
                    </div>
                ) : (
                    <>
                        {blocks.map((block, i) => {
                            const def = blockDefs.find((d) => d.type === block.type);
                            const settingEntries = Object.entries(block.settings).filter(([, v]) => v !== '' && v != null);
                            return (
                                <div key={block.id} className="rounded-xl border border-border/60 overflow-hidden shadow-sm bg-card">
                                    {/* Card header */}
                                    <div className={cn('flex items-center gap-3 px-4 py-3', def?.color || 'bg-slate-500')}>
                                        <div className="flex-1 min-w-0 flex items-center gap-2">
                                            <span className="text-white font-semibold text-sm truncate">
                                                {def?.label || block.type}
                                            </span>
                                            <span className="text-white/60 text-[10px] font-mono hidden sm:inline">
                                                #{i + 1}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-0.5 flex-shrink-0">
                                            <button type="button" disabled={i === 0} onClick={() => move(block.id, -1)}
                                                className="p-1.5 rounded hover:bg-white/20 disabled:opacity-30 text-white transition-colors">
                                                <ChevronUp className="h-3.5 w-3.5" />
                                            </button>
                                            <button type="button" disabled={i === blocks.length - 1} onClick={() => move(block.id, 1)}
                                                className="p-1.5 rounded hover:bg-white/20 disabled:opacity-30 text-white transition-colors">
                                                <ChevronDown className="h-3.5 w-3.5" />
                                            </button>
                                            <button type="button" onClick={() => openEdit(block)}
                                                className="p-1.5 rounded hover:bg-white/20 text-white transition-colors">
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                            <button type="button" onClick={() => removeBlock(block.id)}
                                                className="p-1.5 rounded hover:bg-red-600/60 text-white transition-colors">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    {/* Card body — settings preview */}
                                    <div className="px-4 py-3 bg-muted/20">
                                        {settingEntries.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                                                {settingEntries.map(([k, v]) => {
                                                    const fieldDef = def?.fields.find((f) => f.key === k);
                                                    return (
                                                        <div key={k} className="flex items-start gap-2 min-w-0">
                                                            <span className="text-[11px] font-medium text-muted-foreground shrink-0 mt-0.5 capitalize">
                                                                {fieldDef?.label || k}:
                                                            </span>
                                                            <span className="text-[11px] text-foreground truncate">
                                                                {String(v).length > 60 ? String(v).slice(0, 60) + '…' : String(v)}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground italic">No settings configured</span>
                                                <button type="button" onClick={() => openEdit(block)}
                                                    className="text-xs text-primary hover:underline">Configure →</button>
                                            </div>
                                        )}
                                        {def?.description && (
                                            <p className="text-[10px] text-muted-foreground/60 mt-2 border-t border-border/40 pt-2">
                                                {def.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <Button type="button" variant="outline" size="sm" className="w-full mt-1" onClick={() => setPickerOpen(true)}>
                            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Block
                        </Button>
                    </>
                )}
            </div>
            <BlockPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} blocks={blockDefs} onSelect={addBlock} />
            <BlockConfigModal open={!!configBlock} onClose={() => { setConfigBlock(null); setConfigDef(null); }}
                blockDef={configDef} settings={configBlock?.settings || {}} onSave={saveConfig} />
        </>
    );
}

// ─── SidebarImagePicker ───────────────────────────────────────────────────────

function SidebarImagePicker({ value, onChange }: {
    value: string | null | undefined; onChange: (v: string) => void;
}) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const [urlMode, setUrlMode] = useState(false);
    const [draft, setDraft] = useState('');
    const resolved = value ? resolveMediaUrl(value) : null;

    return (
        <>
            <div className="space-y-2">
                {resolved ? (
                    <div className="relative rounded-lg overflow-hidden border aspect-video bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={resolved} alt="" className="w-full h-full object-cover" />
                        <button type="button"
                            className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black rounded-full p-1"
                            onClick={() => onChange('')}>
                            <X className="h-3 w-3 text-white" />
                        </button>
                    </div>
                ) : (
                    <div className="border-2 border-dashed rounded-lg aspect-video flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                        onClick={() => setPickerOpen(true)}>
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Click to choose image</p>
                    </div>
                )}

                <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs flex-1"
                        onClick={() => setPickerOpen(true)}>
                        <ImageIcon className="h-3 w-3 mr-1" />
                        {resolved ? 'Change' : 'Choose from Media'}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs"
                        onClick={() => setUrlMode((v) => !v)}>
                        URL
                    </Button>
                </div>

                {urlMode && (
                    <div className="flex gap-2">
                        <Input value={draft} onChange={(e) => setDraft(e.target.value)}
                            placeholder="https://..." className="h-8 text-xs flex-1" autoFocus />
                        <Button type="button" size="sm" className="h-8 text-xs"
                            onClick={() => { onChange(draft); setUrlMode(false); }}>
                            OK
                        </Button>
                    </div>
                )}
            </div>
            <MediaPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)}
                onSelect={(url) => { onChange(url); setDraft(url); }} />
        </>
    );
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
    name: z.string().trim().min(1, 'Page name is required'),
    slug: z.string().optional(),
    template: z.string().default('default'),
    description: z.string().optional().nullable(),
    content: z.string().optional().nullable(),
    status: z.coerce.number().default(1),
    featured_image: z.string().optional().nullable(),
    is_featured: z.boolean().default(false),
    sort_order: z.coerce.number().default(0),
    seo_title: z.string().optional().nullable(),
    seo_description: z.string().optional().nullable(),
    seo_keywords: z.string().optional().nullable(),
    og_image: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

const TEMPLATES = [
    { value: 'default', label: 'Default' },
    { value: 'full-width', label: 'Full Width' },
    { value: 'homepage', label: 'Homepage' },
    { value: 'about', label: 'About Us' },
    { value: 'contact', label: 'Contact' },
    { value: 'faq', label: 'FAQ' },
];

// ─── PageForm ─────────────────────────────────────────────────────────────────

export function PageForm({ page }: { page?: Page }) {
    const router = useRouter();
    const isEdit = !!page;

    const createPage = useCreatePage();
    const updatePage = useUpdatePage();
    const isSaving = createPage.isPending || updatePage.isPending;
    const [seoOpen, setSeoOpen] = useState(false);

    const { data: uiBlocksResponse } = useActiveUiBlocks();
    const blockDefs: UiBlock[] = uiBlocksResponse?.data || [];

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '', slug: '', template: 'default', description: '',
            content: '', status: 1, featured_image: '', is_featured: false,
            sort_order: 0, seo_title: '', seo_description: '', seo_keywords: '', og_image: '',
        },
    });

    const nameValue = form.watch('name');

    // Auto-generate slug from name
    useEffect(() => {
        if (!isEdit && nameValue) {
            form.setValue('slug',
                nameValue.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
                { shouldDirty: false }
            );
        }
    }, [nameValue, isEdit, form]);

    // Load existing page data
    useEffect(() => {
        if (page) {
            form.reset({
                name: page.name, slug: page.slug,
                template: page.template ?? 'default',
                description: page.description ?? '',
                content: page.content ?? '',
                status: page.status ?? 1,
                featured_image: page.featured_image ?? '',
                is_featured: Boolean(page.is_featured),
                sort_order: page.sort_order ?? 0,
                seo_title: page.seo_title ?? '',
                seo_description: page.seo_description ?? '',
                seo_keywords: page.seo_keywords ?? '',
                og_image: page.og_image ?? '',
            });
        }
    }, [page, form]);

    const submit = (data: FormData, exit: boolean) => {
        const payload = {
            ...data,
            slug: data.slug || undefined,
            description: data.description || null,
            content: data.content || null,
            featured_image: data.featured_image || null,
            seo_title: data.seo_title || null,
            seo_description: data.seo_description || null,
            seo_keywords: data.seo_keywords || null,
            og_image: data.og_image || null,
            is_featured: data.is_featured ? 1 : 0,
            status: data.status as 0 | 1 | 2,
        };
        const cb = {
            onSuccess: () => { if (exit) router.push('/admin/pages'); },
            onError: (e: unknown) => { if (isApprovalRequired(e) && exit) router.push('/admin/pages'); },
        };
        if (isEdit) { updatePage.mutate({ id: page!.id, data: payload }, cb); }
        else { createPage.mutate(payload, cb); }
    };

    const onSave = form.handleSubmit((d) => submit(d, false));
    const onSaveExit = form.handleSubmit((d) => submit(d, true));
    const slugVal = form.watch('slug');

    return (
        <div className="space-y-5 pb-10">

            {/* Breadcrumb + top actions */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <button type="button" className="hover:text-foreground" onClick={() => router.push('/admin/pages')}>
                        Pages
                    </button>
                    <span>/</span>
                    <span className="text-foreground font-medium">{isEdit ? page!.name : 'New Page'}</span>
                </div>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={onSave}>
                        {isSaving ? (
                            <Spinner className="h-3.5 w-3.5 mr-1.5" />
                        ) : (
                            <Save className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        {isSaving ? 'Saving…' : 'Save'}
                    </Button>
                    <Button type="button" size="sm" disabled={isSaving} onClick={onSaveExit}>
                        <LogOut className="h-3.5 w-3.5 mr-1.5" />Save & Exit
                    </Button>
                </div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 items-start">

                {/* ── Left column ──────────────────────────────────────── */}
                <div className="space-y-4">

                    {/* Page Info */}
                    <Card>
                        <CardContent className="pt-5 space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <FileText className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-sm">Page Info</span>
                            </div>
                            <Separator />

                            <div className="space-y-1.5">
                                <Label htmlFor="page-name">Page Name <span className="text-destructive">*</span></Label>
                                <Input id="page-name" placeholder="e.g. About Us" className="h-10 text-base"
                                    {...form.register('name')} />
                                {form.formState.errors.name && (
                                    <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="page-slug">URL Slug</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground shrink-0">yoursite.com/</span>
                                    <Input id="page-slug" placeholder="about-us" {...form.register('slug')} className="h-9" />
                                </div>
                                {slugVal && (
                                    <p className="text-xs text-muted-foreground">
                                        Page URL: <span className="font-mono">/{slugVal}</span>
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="page-desc">Short Description <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                                <Textarea id="page-desc" rows={2} placeholder="A brief description of this page…" {...form.register('description')} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Page Content — Block Builder */}
                    <Card>
                        <CardContent className="pt-5 space-y-4">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <Blocks className="h-4 w-4 text-primary" />
                                    <span className="font-semibold text-sm">Page Blocks</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {blockDefs.length} block types available
                                </span>
                            </div>
                            <Separator />
                            <Controller
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                    <BlockBuilder
                                        value={field.value ?? '[]'}
                                        onChange={field.onChange}
                                        blockDefs={blockDefs}
                                    />
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* SEO - collapsible */}
                    <Card>
                        <button type="button"
                            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors rounded-xl"
                            onClick={() => setSeoOpen((v) => !v)}>
                            <div>
                                <p className="font-semibold text-sm">SEO Settings</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {seoOpen ? 'Click to hide' : 'Optimize for search engines (optional)'}
                                </p>
                            </div>
                            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', seoOpen && 'rotate-180')} />
                        </button>
                        {seoOpen && (
                            <CardContent className="pt-0 pb-5 space-y-4">
                                <Separator />
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="seo-title">SEO Title</Label>
                                        <Input id="seo-title" placeholder="Page title shown in search results" {...form.register('seo_title')} />
                                        <p className="text-xs text-muted-foreground">Keep it under 60 characters</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="seo-desc">Meta Description</Label>
                                        <Textarea id="seo-desc" rows={2} placeholder="Short description shown in Google results" {...form.register('seo_description')} />
                                        <p className="text-xs text-muted-foreground">Keep it under 160 characters</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="seo-kw">Keywords</Label>
                                        <Input id="seo-kw" placeholder="keyword1, keyword2, keyword3" {...form.register('seo_keywords')} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="og-img">Social Share Image URL</Label>
                                        <Input id="og-img" placeholder="https://... (1200×630 recommended)" {...form.register('og_image')} />
                                    </div>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                </div>

                {/* ── Right sidebar ─────────────────────────────────────── */}
                <div className="space-y-4">

                    {/* Publish {isSaving ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                
                    <Card>
                        <CardContent className="px-4 py-4 space-y-2.5">
                            <p className="font-semibold text-sm">Publish</p>
                            <Button type="button" className="w-full" disabled={isSaving} onClick={onSave}>
                                {isSaving ? (
                                    <Spinner className="h-4 w-4 mr-2" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                {isSaving ? 'Saving…' : 'Save Page'}
                            </Button>
                            <Button type="button" variant="outline" className="w-full" disabled={isSaving} onClick={onSaveExit}>
                                <LogOut className="h-4 w-4 mr-2" />Save & Exit
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Status */}
                    <Card>
                        <CardContent className="px-4 py-3 space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Status
                            </Label>
                            <Controller control={form.control} name="status" render={({ field }) => (
                                <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Published</SelectItem>
                                        <SelectItem value="0">Draft</SelectItem>
                                        <SelectItem value="2">Pending</SelectItem>
                                    </SelectContent>
                                </Select>
                            )} />
                        </CardContent>
                    </Card>

                    {/* Template */}
                    <Card>
                        <CardContent className="px-4 py-3 space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Page Template
                            </Label>
                            <Controller control={form.control} name="template" render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {TEMPLATES.map((tpl) => (
                                            <SelectItem key={tpl.value} value={tpl.value}>{tpl.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )} />
                            <p className="text-xs text-muted-foreground">Controls the page layout on the frontend</p>
                        </CardContent>
                    </Card>

                    {/* Featured Image */}
                    <Card>
                        <CardContent className="px-4 py-3 space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Page Cover Image
                            </Label>
                            <Controller control={form.control} name="featured_image" render={({ field }) => (
                                <SidebarImagePicker value={field.value} onChange={field.onChange} />
                            )} />
                        </CardContent>
                    </Card>

                    {/* Sort order + featured */}
                    <Card>
                        <CardContent className="px-4 py-3 space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Sort Order
                                </Label>
                                <Input type="number" {...form.register('sort_order')} className="h-8 text-sm" />
                                <p className="text-xs text-muted-foreground">Lower number = shown first</p>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Featured Page</p>
                                    <p className="text-xs text-muted-foreground">Highlight on frontend</p>
                                </div>
                                <Controller control={form.control} name="is_featured" render={({ field }) => (
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                )} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
