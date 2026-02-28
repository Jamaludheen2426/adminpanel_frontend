'use client';

import { useRef, useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, ChevronDown, X } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/common/rich-text-editor';
import { ImageCropper } from '@/components/common/image-cropper';
import { apiClient } from '@/lib/api-client';
import { resolveMediaUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { useBlogCategories } from '@/hooks/use-blog-categories';
import { useBlogTags } from '@/hooks/use-blog-tags';
import { useUsers } from '@/hooks/use-users';
import type { BlogPost } from '@/hooks/use-blog-posts';

// ─── MultiSelectDropdown ──────────────────────────────────────────────────────

interface MultiSelectOption { id: number; name: string; }

function MultiSelectDropdown({
    options,
    selectedIds,
    onChange,
    placeholder,
    emptyText,
}: {
    options: MultiSelectOption[];
    selectedIds: number[];
    onChange: (ids: number[]) => void;
    placeholder: string;
    emptyText: string;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const toggle = (id: number) =>
        onChange(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]);

    const remove = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selectedIds.filter((i) => i !== id));
    };

    const filtered = options.filter((o) =>
        o.name.toLowerCase().includes(search.toLowerCase())
    );

    const selectedOptions = options.filter((o) => selectedIds.includes(o.id));

    return (
        <div className="relative" ref={ref}>
            {/* Trigger box */}
            <div
                className="min-h-10 w-full border rounded-md px-3 py-2 flex flex-wrap gap-1 items-center cursor-pointer bg-background hover:border-ring transition-colors"
                onClick={() => setOpen((v) => !v)}
            >
                {selectedOptions.length === 0 && (
                    <span className="text-sm text-muted-foreground">{placeholder}</span>
                )}
                {selectedOptions.map((o) => (
                    <Badge key={o.id} variant="secondary" className="text-xs gap-1 pr-1">
                        {o.name}
                        <button
                            type="button"
                            className="ml-0.5 hover:text-destructive"
                            onClick={(e) => remove(o.id, e)}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
                <ChevronDown className={`h-4 w-4 text-muted-foreground ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                    {/* Search */}
                    <div className="p-2 border-b">
                        <Input
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8 text-sm"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    {/* List */}
                    <div className="max-h-48 overflow-y-auto p-1">
                        {filtered.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">{emptyText}</p>
                        ) : (
                            filtered.map((o) => {
                                const selected = selectedIds.includes(o.id);
                                return (
                                    <button
                                        key={o.id}
                                        type="button"
                                        className={`w-full text-left text-sm px-3 py-2 rounded flex items-center gap-2 transition-colors ${selected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
                                            }`}
                                        onClick={(e) => { e.stopPropagation(); toggle(o.id); }}
                                    >
                                        <span className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${selected ? 'bg-primary border-primary' : 'border-muted-foreground'
                                            }`}>
                                            {selected && <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>}
                                        </span>
                                        {o.name}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}


// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
    title: z.string().min(1, 'Title is required'),
    slug: z.string().min(1, 'Slug is required'),
    description: z.string().optional().nullable(),
    content: z.string().optional().nullable(),
    image: z.string().optional().nullable(),
    seo_title: z.string().optional().nullable(),
    seo_description: z.string().optional().nullable(),
    author_id: z.number().nullable().optional(),
    category_ids: z.array(z.number()).default([]),
    tag_ids: z.array(z.number()).default([]),
    is_featured: z.boolean().default(false),
    is_active: z.boolean().default(true),
});

export type BlogPostFormData = z.infer<typeof schema>;

interface BlogPostFormProps {
    defaultValues?: Partial<BlogPost>;
    onSave: (data: BlogPostFormData) => void;
    isPending: boolean;
}

function generateSlug(title: string) {
    return title.toLowerCase().trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

// ─── BlogPostForm ──────────────────────────────────────────────────────────────

export function BlogPostForm({ defaultValues, onSave, isPending }: BlogPostFormProps) {
    const { t } = useTranslation();
    const [isUploading, setIsUploading] = useState(false);
    const [cropperKey, setCropperKey] = useState(0);
    const [previewImageUrl, setPreviewImageUrl] = useState(
        resolveMediaUrl(defaultValues?.image || '')
    );
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!defaultValues?.slug);

    const { data: categories = [] } = useBlogCategories();
    const { data: tags = [] } = useBlogTags();
    const { data: usersResult } = useUsers({ limit: 200 });
    const users = usersResult?.data ?? [];

    const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<BlogPostFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            title: defaultValues?.title ?? '',
            slug: defaultValues?.slug ?? '',
            description: defaultValues?.description ?? '',
            content: defaultValues?.content ?? '',
            image: defaultValues?.image ?? '',
            seo_title: defaultValues?.seo_title ?? '',
            seo_description: defaultValues?.seo_description ?? '',
            author_id: defaultValues?.author_id ?? null,
            category_ids: defaultValues?.categories?.map((c) => c.id) ?? [],
            tag_ids: defaultValues?.tags?.map((tg) => tg.id) ?? [],
            is_featured: Boolean(defaultValues?.is_featured),
            is_active: defaultValues?.is_active !== undefined ? Boolean(defaultValues.is_active) : true,
        },
    });

    const selectedCategoryIds = watch('category_ids');
    const selectedTagIds = watch('tag_ids');

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue('title', e.target.value);
        if (!slugManuallyEdited) {
            setValue('slug', generateSlug(e.target.value), { shouldValidate: true });
        }
    };

    const handleImageChange = async (file: File) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'blog-posts');
        try {
            const response = await apiClient.post('/media/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const url = response.data.data?.file?.url || response.data.data?.url || response.data.url;
            if (url) {
                setValue('image', url);
                setPreviewImageUrl(resolveMediaUrl(url));
                toast.success(t('common.upload_success', 'Image uploaded successfully'));
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || t('common.upload_error', 'Failed to upload image'));
        } finally {
            setIsUploading(false);
        }
    };

    const toggleId = (ids: number[], id: number): number[] =>
        ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id];

    return (
        <form onSubmit={handleSubmit(onSave)} className="space-y-5">

            {/* Title + Slug — 2 col */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="post-title">
                        {t('blog.title', 'Title')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="post-title"
                        placeholder={t('blog.title_placeholder', 'Enter post title')}
                        {...register('title')}
                        onChange={handleTitleChange}
                    />
                    {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="post-slug">
                        {t('common.slug', 'Slug')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="post-slug"
                        placeholder="my-blog-post"
                        {...register('slug')}
                        onChange={(e) => {
                            setSlugManuallyEdited(true);
                            setValue('slug', e.target.value, { shouldValidate: true });
                        }}
                    />
                    {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="post-desc">{t('blog.description', 'Description / Excerpt')}</Label>
                <Textarea
                    id="post-desc"
                    rows={2}
                    placeholder={t('blog.description_placeholder', 'Short excerpt shown in listings...')}
                    {...register('description')}
                />
            </div>

            {/* Content */}
            <div className="space-y-2">
                <Label>{t('blog.content', 'Content')}</Label>
                <Controller
                    control={control}
                    name="content"
                    render={({ field }) => (
                        <RichTextEditor
                            value={field.value ?? ''}
                            onChange={field.onChange}
                            placeholder={t('blog.content_placeholder', 'Write your blog post here...')}
                        />
                    )}
                />
            </div>

            {/* Featured Image */}
            <div className="space-y-2">
                <Label>{t('blog.featured_image', 'Featured Image')}</Label>
                <ImageCropper
                    key={cropperKey}
                    title={t('blog.featured_image', 'Featured Image')}
                    description={t('blog.image_hint', 'Recommended: 1200×630 px')}
                    targetWidth={1200}
                    targetHeight={630}
                    currentImage={previewImageUrl}
                    onImageCropped={handleImageChange}
                    onRemove={() => {
                        setValue('image', '');
                        setPreviewImageUrl('');
                        setCropperKey((k) => k + 1);
                    }}
                    rounded={false}
                />
                {isUploading && <p className="text-xs text-muted-foreground">{t('common.uploading', 'Uploading...')}</p>}
            </div>

            <Separator />

            {/* Author + Active + Featured — row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>{t('blog.author', 'Author')}</Label>
                    <select
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={watch('author_id') ?? ''}
                        onChange={(e) => setValue('author_id', e.target.value ? Number(e.target.value) : null)}
                    >
                        <option value="">{t('blog.select_author', 'Select author...')}</option>
                        {users.map((u) => (
                            <option key={u.id} value={u.id}>{u.full_name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                        <Label>{t('common.active', 'Active')}</Label>
                        <p className="text-xs text-muted-foreground">{t('blog.active_hint', 'Publish this post')}</p>
                    </div>
                    <Controller control={control} name="is_active" render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )} />
                </div>
                <div className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                        <Label>{t('blog.is_featured', 'Featured')}</Label>
                        <p className="text-xs text-muted-foreground">{t('blog.is_featured_hint', 'Show in featured')}</p>
                    </div>
                    <Controller control={control} name="is_featured" render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )} />
                </div>
            </div>

            {/* Categories */}
            <div className="space-y-2">
                <Label>{t('blog.categories', 'Categories')}</Label>
                <MultiSelectDropdown
                    options={categories}
                    selectedIds={selectedCategoryIds}
                    onChange={(ids) => setValue('category_ids', ids)}
                    placeholder={t('blog.select_categories', 'Select categories...')}
                    emptyText={t('blog.no_categories', 'No categories found.')}
                />
            </div>

            {/* Tags */}
            <div className="space-y-2">
                <Label>{t('blog.tags', 'Tags')}</Label>
                <MultiSelectDropdown
                    options={tags}
                    selectedIds={selectedTagIds}
                    onChange={(ids) => setValue('tag_ids', ids)}
                    placeholder={t('blog.select_tags', 'Select tags...')}
                    emptyText={t('blog.no_tags', 'No tags found.')}
                />
            </div>

            <Separator />

            {/* SEO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="seo-title">{t('blog.seo_title', 'SEO Title')}</Label>
                    <Input
                        id="seo-title"
                        placeholder={t('blog.seo_title_placeholder', 'Leave empty to use post title')}
                        {...register('seo_title')}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="seo-desc">{t('blog.seo_description', 'SEO Description')}</Label>
                    <Input
                        id="seo-desc"
                        placeholder={t('blog.seo_description_placeholder', 'Leave empty to use excerpt')}
                        {...register('seo_description')}
                    />
                </div>
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isPending || isUploading}>
                <Save className="mr-2 h-4 w-4" />
                {isPending ? t('common.saving', 'Saving...') : (defaultValues?.id ? t('common.save', 'Save Changes') : t('blog.create_post', 'Create Blog Post'))}
            </Button>

        </form>
    );
}
