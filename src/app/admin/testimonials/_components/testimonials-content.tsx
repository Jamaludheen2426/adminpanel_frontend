'use client';

import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2, User, Building } from 'lucide-react';
import { useTestimonials, useCreateTestimonial, useUpdateTestimonial, useDeleteTestimonial, Testimonial } from '@/hooks/use-testimonials';
import { useTranslation } from '@/hooks/use-translation';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RichTextEditor } from "@/components/common/rich-text-editor";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageLoader } from '@/components/common/page-loader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageCropper } from "@/components/common/image-cropper";
import { apiClient } from '@/lib/api-client';
import { resolveMediaUrl } from '@/lib/utils';
import { toast } from 'sonner';

const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    designation: z.string().min(1, 'Designation/Company is required'),
    content: z.string().min(1, 'Content is required'),
    image: z.string().default(''),
    sort_order: z.preprocess((val) => Number(val), z.number().default(0)),
    is_active: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

export function TestimonialsContent() {
    const { t } = useTranslation();
    const { data: testimonials = [], isLoading } = useTestimonials();
    const createTestimonial = useCreateTestimonial();
    const updateTestimonial = useUpdateTestimonial();
    const deleteTestimonial = useDeleteTestimonial();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<Testimonial | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [cropperKey, setCropperKey] = useState(0);
    const [previewImageUrl, setPreviewImageUrl] = useState('');

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { name: '', designation: '', content: '', image: '', sort_order: 0, is_active: true },
    });

    const closeDialog = () => {
        setDialogOpen(false);
        setEditItem(null);
        form.reset();
        setPreviewImageUrl('');
    };

    const openCreate = () => {
        setEditItem(null);
        form.reset({
            name: '',
            designation: '',
            content: '',
            image: '',
            sort_order: 0,
            is_active: true
        });
        setPreviewImageUrl('');
        setCropperKey(k => k + 1);
        setDialogOpen(true);
    };

    const openEdit = (item: Testimonial) => {
        setEditItem(item);
        form.reset({
            name: item.name,
            designation: item.designation,
            content: item.content,
            image: item.image,
            sort_order: item.sort_order,
            is_active: Boolean(item.is_active),
        });
        setPreviewImageUrl(resolveMediaUrl(item.image || ''));
        setCropperKey(k => k + 1);
        setDialogOpen(true);
    };

    const handleImageChange = async (file: File) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'testimonials');

        try {
            const response = await apiClient.post('/media/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const url = response.data.data?.file?.url || response.data.data?.url || response.data.url;
            if (url) {
                // Store original URL in form (DB); resolve only for preview display
                form.setValue('image', url);
                setPreviewImageUrl(resolveMediaUrl(url));
                toast.success("Image uploaded successfully");
            } else {
                console.error("No URL in response:", response.data);
                throw new Error("Invalid response from server");
            }
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(error.response?.data?.message || "Failed to upload image");
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveImage = () => {
        form.setValue('image', '');
        setPreviewImageUrl('');
    };

    const onSubmit = (data: FormData) => {
        if (editItem) {
            updateTestimonial.mutate({ id: editItem.id, data }, { onSuccess: closeDialog });
        } else {
            createTestimonial.mutate(data, { onSuccess: closeDialog });
        }
    };

    const columns = useMemo<ColumnDef<Testimonial>[]>(() => [
        {
            accessorKey: 'sort_order',
            header: t('common.sort_order', 'Order'),
            cell: ({ row }) => <span className="text-muted-foreground">{row.original.sort_order}</span>,
        },
        {
            accessorKey: 'image',
            header: t('common.image', 'Image'),
            cell: ({ row }) => (
                <Avatar className="h-10 w-10">
                    <AvatarImage src={resolveMediaUrl(row.original.image)} />
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                </Avatar>
            ),
        },
        {
            accessorKey: 'name',
            header: t('common.name', 'Name'),
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.original.name}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building className="h-3 w-3" /> {row.original.designation}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'is_active',
            header: t('common.active', 'Active'),
            cell: ({ row }) => (
                <Switch
                    checked={Boolean(row.original.is_active)}
                    onCheckedChange={(checked) => updateTestimonial.mutate({ id: row.original.id, data: { is_active: checked } })}
                    disabled={updateTestimonial.isPending}
                />
            ),
        },
        {
            id: 'actions',
            header: () => <div className="text-right">{t('common.actions', 'Actions')}</div>,
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(row.original)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive-outline" size="icon" onClick={() => setDeleteId(row.original.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ], [t, updateTestimonial]);

    const isPending = createTestimonial.isPending || updateTestimonial.isPending || isUploading;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{t('testimonial.title', 'Testimonials')}</CardTitle>
                            <CardDescription>{t('testimonial.desc', 'Manage customer reviews and feedback')}</CardDescription>
                        </div>
                        <Button size="sm" onClick={openCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('testimonial.add', 'Add Testimonial')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <PageLoader open={isLoading} />
                    {!isLoading && <DataTable columns={columns} data={testimonials} searchKey="name" />}
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editItem ? t('testimonial.edit', 'Edit Testimonial') : t('testimonial.create', 'Create Testimonial')}</DialogTitle>
                        <DialogDescription>{t('testimonial.form_desc', 'Fill in the information for the testimonial.')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t('common.name', 'Name')} *</Label>
                                <Input id="name" {...form.register('name')} placeholder="e.g. John Doe" />
                                {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="designation">{t('testimonial.designation', 'Designation / Company')} *</Label>
                                <Input id="designation" {...form.register('designation')} placeholder="e.g. CEO, Google" />
                                {form.formState.errors.designation && <p className="text-xs text-destructive">{form.formState.errors.designation.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <ImageCropper
                                key={cropperKey}
                                title={t('common.profile_image', 'Profile Image')}
                                description={t('testimonial.image_desc', 'Recommended size: 160x160 px')}
                                targetWidth={160}
                                targetHeight={160}
                                currentImage={previewImageUrl}
                                onImageCropped={handleImageChange}
                                onRemove={handleRemoveImage}
                                rounded={true}
                            />
                            {isUploading && <p className="text-xs text-muted-foreground mt-1">Uploading...</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content">{t('common.content', 'Content')} *</Label>
                            <Controller
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                    <RichTextEditor
                                        key={editItem ? `edit-${editItem.id}` : 'create'}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Enter testimonial content..."
                                        variant="compact"
                                        disableVisual={true} // Defaults to HTML source mode
                                    />
                                )}
                            />
                            {form.formState.errors.content && <p className="text-xs text-destructive">{form.formState.errors.content.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="sort_order">{t('common.sort_order', 'Sort Order')}</Label>
                                <Input id="sort_order" type="number" {...form.register('sort_order')} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="is_active">{t('common.active', 'Active')}</Label>
                                <div className="flex items-center h-10">
                                    <Controller
                                        control={form.control}
                                        name="is_active"
                                        render={({ field }) => (
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        )}
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
                            onClick={() => {
                                if (deleteId) {
                                    deleteTestimonial.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
                                }
                            }}
                        >
                            {t('common.delete', 'Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
