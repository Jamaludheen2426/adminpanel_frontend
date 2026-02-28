'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Tag } from 'lucide-react';
import {
    useBlogTags, useCreateBlogTag, useUpdateBlogTag, useDeleteBlogTag, BlogTag
} from '@/hooks/use-blog-tags';
import { useTranslation } from '@/hooks/use-translation';
import { CommonTable, CommonColumn } from '@/components/common/common-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().min(1, 'Slug is required'),
    is_active: z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

function generateSlug(name: string) {
    return name.toLowerCase().trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export function BlogTagsContent() {
    const { t } = useTranslation();
    const { data: tags = [], isLoading } = useBlogTags();
    const createTag = useCreateBlogTag();
    const updateTag = useUpdateBlogTag();
    const deleteTag = useDeleteBlogTag();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<BlogTag | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { name: '', slug: '', is_active: true },
    });

    const closeDialog = () => {
        setDialogOpen(false);
        setEditItem(null);
        setSlugManuallyEdited(false);
        form.reset();
    };

    const openCreate = () => {
        setEditItem(null);
        setSlugManuallyEdited(false);
        form.reset({ name: '', slug: '', is_active: true });
        setDialogOpen(true);
    };

    const openEdit = (item: BlogTag) => {
        setEditItem(item);
        setSlugManuallyEdited(true);
        form.reset({ name: item.name, slug: item.slug, is_active: Boolean(item.is_active) });
        setDialogOpen(true);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        form.setValue('name', e.target.value);
        if (!slugManuallyEdited) {
            form.setValue('slug', generateSlug(e.target.value), { shouldValidate: true });
        }
    };

    const onSubmit = (data: FormData) => {
        if (editItem) {
            updateTag.mutate({ id: editItem.id, data }, { onSuccess: closeDialog });
        } else {
            createTag.mutate(data, { onSuccess: closeDialog });
        }
    };

    const columns: CommonColumn<any>[] = [
        {
            key: 'name',
            header: t('common.name', 'Name'),
            render: (row: BlogTag) => (
                <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium">{row.name}</span>
                </div>
            ),
        },
        {
            key: 'slug',
            header: t('common.slug', 'Slug'),
            render: (row: BlogTag) => (
                <Badge variant="outline" className="font-mono text-xs">{row.slug}</Badge>
            ),
        },
    ];

    const isPending = createTag.isPending || updateTag.isPending;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{t('blog.tags_title', 'Blog Tags')}</h1>
                <p className="text-muted-foreground mt-1">{t('blog.tags_desc', 'Manage tags for blog posts')}</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{t('blog.tags_title', 'Blog Tags')}</CardTitle>
                            <CardDescription>{t('blog.tags_desc', 'Manage tags for blog posts')}</CardDescription>
                        </div>
                        <Button size="sm" onClick={openCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('blog.add_tag', 'Add Tag')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <CommonTable
                        columns={columns}
                        data={tags as any}
                        isLoading={isLoading}
                        emptyMessage={t('blog.no_tags', 'No blog tags found.')}
                        onStatusToggle={(row, val) => updateTag.mutate({ id: row.id, data: { is_active: val } })}
                        onEdit={(row) => openEdit(row as BlogTag)}
                        onDelete={(row) => setDeleteId(row.id)}
                        showCreated={false}
                    />
                </CardContent>
            </Card>

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editItem ? t('blog.edit_tag', 'Edit Tag') : t('blog.create_tag', 'Create Tag')}
                        </DialogTitle>
                        <DialogDescription>{t('blog.tag_form_desc', 'Fill in the tag details.')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="tag-name">{t('common.name', 'Name')} *</Label>
                            <Input id="tag-name" placeholder="e.g. Technology" {...form.register('name')} onChange={handleNameChange} />
                            {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tag-slug">{t('common.slug', 'Slug')} *</Label>
                            <Input
                                id="tag-slug"
                                placeholder="e.g. technology"
                                {...form.register('slug')}
                                onChange={(e) => { setSlugManuallyEdited(true); form.setValue('slug', e.target.value, { shouldValidate: true }); }}
                            />
                            <p className="text-xs text-muted-foreground">{t('common.slug_hint', 'Auto-generated from name.')}</p>
                            {form.formState.errors.slug && <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>}
                        </div>
                        <div className="flex items-center justify-between border rounded-lg p-3">
                            <Label htmlFor="tag-active" className="cursor-pointer">{t('common.active', 'Active')}</Label>
                            <Controller
                                control={form.control}
                                name="is_active"
                                render={({ field }) => <Switch id="tag-active" checked={field.value} onCheckedChange={field.onChange} />}
                            />
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
                            onClick={() => { if (deleteId) deleteTag.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }}
                        >
                            {t('common.delete', 'Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
