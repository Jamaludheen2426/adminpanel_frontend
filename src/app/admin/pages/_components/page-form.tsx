'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(
    () => import('@/components/common/rich-text-editor').then(m => m.RichTextEditor),
    { ssr: false }
);
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Save, LogOut, ChevronDown, X, ImageIcon, FileText } from 'lucide-react';
import { useCreatePage, useUpdatePage, type Page } from '@/hooks/use-pages';
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
import { MediaPickerModal } from '@/components/common/media-picker-modal';
import { resolveMediaUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';

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
                        {isSaving ? <Spinner className="h-3.5 w-3.5 mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
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

                            <div className="space-y-1.5">
                                <Label>Content</Label>
                                <Controller
                                    control={form.control}
                                    name="content"
                                    render={({ field }) => (
                                        <RichTextEditor
                                            value={field.value ?? ''}
                                            onChange={field.onChange}
                                            placeholder="Page content…"
                                        />
                                    )}
                                />
                            </div>
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
