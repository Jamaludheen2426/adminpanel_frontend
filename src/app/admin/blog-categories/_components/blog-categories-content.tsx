'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, FolderOpen } from 'lucide-react';
import {
    useBlogCategories, useCreateBlogCategory, useUpdateBlogCategory, useDeleteBlogCategory, BlogCategory
} from '@/hooks/use-blog-categories';
import { useTranslation } from '@/hooks/use-translation';
import { CommonTable, CommonColumn } from '@/components/common/common-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageCropper } from '@/components/common/image-cropper';
import { apiClient } from '@/lib/api-client';
import { resolveMediaUrl } from '@/lib/utils';
import { toast } from 'sonner';

const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1, 'Slug is required'),
    description: z.string().optional(),
    image: z.string().default(''),
    sort_order: z.preprocess((val) => Number(val), z.number().default(0)),
    is_active: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

function generateSlug(name: string) {
    return name.toLowerCase().trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export function BlogCategoriesContent() {
    const { t } = useTranslation();
    const { data: categories = [], isLoading } = useBlogCategories();
    const createCategory = useCreateBlogCategory();
    const updateCategory = useUpdateBlogCategory();
    const deleteCategory = useDeleteBlogCategory();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<BlogCategory | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [cropperKey, setCropperKey] = useState(0);
    const [previewImageUrl, setPreviewImageUrl] = useState('');
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { name: '', slug: '', description: '', image: '', sort_order: 0, is_active: true },
    });

    const closeDialog = () => {
        setDialogOpen(false);
        setEditItem(null);
        setSlugManuallyEdited(false);
        setPreviewImageUrl('');
        form.reset();
    };

    const openCreate = () => {
        setEditItem(null);
        setSlugManuallyEdited(false);
        setPreviewImageUrl('');
        setCropperKey((k) => k + 1);
        form.reset({ name: '', slug: '', description: '', image: '', sort_order: 0, is_active: true });
        setDialogOpen(true);
    };

    const openEdit = (item: BlogCategory) => {
        setEditItem(item);
        setSlugManuallyEdited(true);
        setPreviewImageUrl(resolveMediaUrl(item.image || ''));
        setCropperKey((k) => k + 1);
        form.reset({
            name: item.name, slug: item.slug,
            description: item.description ?? '',
            image: item.image ?? '',
            sort_order: item.sort_order,
            is_active: Boolean(item.is_active),
        });
        setDialogOpen(true);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        form.setValue('name', e.target.value);
        if (!slugManuallyEdited) {
            form.setValue('slug', generateSlug(e.target.value), { shouldValidate: true });
        }
    };

    const handleImageChange = async (file: File) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'blog-categories');
        try {
            const response = await apiClient.post('/media/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const url = response.data.data?.file?.url || response.data.data?.url || response.data.url;
            if (url) {
                form.setValue('image', url);
                setPreviewImageUrl(resolveMediaUrl(url));
                toast.success(t('common.upload_success', 'Image uploaded successfully'));
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('common.upload_error', 'Failed to upload image'));
        } finally {
            setIsUploading(false);
        }
    };

    const onSubmit = (data: FormData) => {
        const payload = { ...data, description: data.description || null };
        if (editItem) {
            updateCategory.mutate({ id: editItem.id, data: payload }, { onSuccess: closeDialog });
        } else {
            createCategory.mutate(payload, { onSuccess: closeDialog });
        }
    };

    const columns: CommonColumn<any>[] = [
        {
            key: 'image',
            header: t('common.image', 'Image'),
            render: (row: BlogCategory) => (
                <Avatar className="h-10 w-10 rounded-md">
                    <AvatarImage src={resolveMediaUrl(row.image || '')} className="object-cover" />
                    <AvatarFallback className="rounded-md">
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    </AvatarFallback>
                </Avatar>
            ),
        },
        {
            key: 'name',
            header: t('common.name', 'Name'),
            render: (row: BlogCategory) => <span className="font-medium">{row.name}</span>,
        },
        {
            key: 'slug',
            header: t('common.slug', 'Slug'),
            render: (row: BlogCategory) => (
                <Badge variant="outline" className="font-mono text-xs">{row.slug}</Badge>
            ),
        },
        {
            key: 'sort_order',
            header: t('common.sort_order', 'Order'),
            render: (row: BlogCategory) => (
                <span className="text-muted-foreground">{row.sort_order}</span>
            ),
        },
    ];

    const isPending = createCategory.isPending || updateCategory.isPending || isUploading;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{t('blog.categories_title', 'Blog Categories')}</h1>
                <p className="text-muted-foreground mt-1">{t('blog.categories_desc', 'Manage categories for blog posts')}</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{t('blog.categories_title', 'Blog Categories')}</CardTitle>
                            <CardDescription>{t('blog.categories_desc', 'Manage categories for blog posts')}</CardDescription>
                        </div>
                        <Button size="sm" onClick={openCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('blog.add_category', 'Add Category')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <CommonTable
                        columns={columns}
                        data={categories as any}
                        isLoading={isLoading}
                        emptyMessage={t('blog.no_categories', 'No blog categories found.')}
                        onStatusToggle={(row, val) => updateCategory.mutate({ id: row.id, data: { is_active: val } })}
                        onEdit={(row) => openEdit(row as BlogCategory)}
                        onDelete={(row) => setDeleteId(row.id)}
                        showCreated={false}
                    />
                </CardContent>
            </Card>

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editItem ? t('blog.edit_category', 'Edit Category') : t('blog.create_category', 'Create Category')}
                        </DialogTitle>
                        <DialogDescription>{t('blog.category_form_desc', 'Fill in the blog category details.')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="cat-name">{t('common.name', 'Name')} *</Label>
                            <Input id="cat-name" placeholder="e.g. Technology" {...form.register('name')} onChange={handleNameChange} />
                            {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cat-slug">{t('common.slug', 'Slug')} *</Label>
                            <Input
                                id="cat-slug"
                                placeholder="e.g. technology"
                                {...form.register('slug')}
                                onChange={(e) => { setSlugManuallyEdited(true); form.setValue('slug', e.target.value, { shouldValidate: true }); }}
                            />
                            <p className="text-xs text-muted-foreground">{t('common.slug_hint', 'Auto-generated from name.')}</p>
                            {form.formState.errors.slug && <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cat-desc">{t('common.description', 'Description')}</Label>
                            <Textarea id="cat-desc" placeholder="Optional description..." rows={3} {...form.register('description')} />
                        </div>
                        <ImageCropper
                            key={cropperKey}
                            title={t('common.image', 'Image')}
                            description={t('blog.category_image_desc', 'Recommended size: 600x400 px')}
                            targetWidth={600}
                            targetHeight={400}
                            currentImage={previewImageUrl}
                            onImageCropped={handleImageChange}
                            onRemove={() => { form.setValue('image', ''); setPreviewImageUrl(''); }}
                            rounded={false}
                        />
                        {isUploading && <p className="text-xs text-muted-foreground">{t('common.uploading', 'Uploading...')}</p>}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cat-order">{t('common.sort_order', 'Sort Order')}</Label>
                                <Input id="cat-order" type="number" {...form.register('sort_order')} />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('common.active', 'Active')}</Label>
                                <div className="flex items-center h-10">
                                    <Controller
                                        control={form.control}
                                        name="is_active"
                                        render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeDialog}>{t('common.cancel', 'Cancel')}</Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('common.are_you_sure', 'Are you sure?')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('common.delete_confirm', 'This action cannot be undone.')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => { if (deleteId) deleteCategory.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }}
                        >
                            {t('common.delete', 'Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
