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
import { PageHeader } from '@/components/common/page-header';
import { DeleteDialog } from '@/components/common/delete-dialog';
import {
    TextInput,
    TextAreaInput,
    SwitchField,
} from '@/components/admin/form-field';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
            <PageHeader
                title={t('blog.categories_title', 'Blog Categories')}
                description={t('blog.categories_desc', 'Manage categories for blog posts')}
                icon={<FolderOpen className="h-6 w-6" />}
                action={
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('blog.add_category', 'Add Category')}
                    </Button>
                }
            />

            <Card>
                <CardContent className="pt-6">
                    <CommonTable
                        columns={columns}
                        data={categories as any}
                        isLoading={isLoading}
                        emptyMessage={t('blog.no_categories', 'No blog categories found.')}
                        onStatusToggle={(row, val) => updateCategory.mutate({ id: row.id, data: { is_active: val } })}
                        onEdit={(row) => openEdit(row as BlogCategory)}
                        onDelete={(row) => setDeleteId(row.id)}
                        showCreated={false}
                        showStatus
                        showActions
                    />
                </CardContent>
            </Card>

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editItem ? t('blog.edit_category', 'Edit Category') : t('blog.create_category', 'Create Category')}
                        </DialogTitle>
                        <DialogDescription>{t('blog.category_form_desc', 'Fill in the blog category details.')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                        <TextInput
                            label={t('common.name', 'Name')}
                            placeholder="e.g. Technology"
                            {...form.register('name')}
                            onChange={handleNameChange}
                            error={form.formState.errors.name?.message}
                            required
                        />

                        <TextInput
                            label={t('common.slug', 'Slug')}
                            placeholder="e.g. technology"
                            {...form.register('slug')}
                            onChange={(e) => { setSlugManuallyEdited(true); form.setValue('slug', e.target.value, { shouldValidate: true }); }}
                            error={form.formState.errors.slug?.message}
                            helper={t('common.slug_hint', 'Auto-generated from name.')}
                            required
                        />

                        <TextAreaInput
                            label={t('common.description', 'Description')}
                            placeholder="Optional description..."
                            rows={3}
                            {...form.register('description')}
                        />

                        <div className="space-y-2">
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
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <TextInput
                                label={t('common.sort_order', 'Sort Order')}
                                type="number"
                                {...form.register('sort_order')}
                            />

                            <div className="flex flex-col justify-end">
                                <Controller
                                    control={form.control}
                                    name="is_active"
                                    render={({ field }) => (
                                        <SwitchField
                                            label={t('common.active', 'Active')}
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={closeDialog}>{t('common.cancel', 'Cancel')}</Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <DeleteDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                onConfirm={() => {
                    if (deleteId) {
                        deleteCategory.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
                    }
                }}
                isDeleting={deleteCategory.isPending}
            />
        </div>
    );
}
