'use client';

import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Tag } from 'lucide-react';
import {
    useBlogTags, useCreateBlogTag, useUpdateBlogTag, useUpdateBlogTagStatus, useDeleteBlogTag, BlogTag
} from '@/hooks/use-blog-tags';
import { useTranslation } from '@/hooks/use-translation';
import { CommonTable, CommonColumn } from '@/components/common/common-table';
import { PageLoader } from '@/components/common/page-loader';
import { TablePagination } from '@/components/common/table-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DeleteDialog } from '@/components/common/delete-dialog';
import { useIsPluginActive } from '@/hooks/use-plugins';
import { PluginDisabledState } from '@/components/common/plugin-disabled';

const schema = z.object({
    name: z.string().trim().min(1, 'Name is required'),
    slug: z.string().trim().min(1, 'Slug is required'),
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
    const isActive = useIsPluginActive('blog');
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const { data: tagsResponse, isLoading } = useBlogTags({ page, limit });
    const rawTags: BlogTag[] = tagsResponse?.data ?? [];
    const pagination = tagsResponse?.pagination;
    const tags = useMemo(() => rawTags.map(tag => ({
        ...tag,
        is_active: tag.is_active as boolean | number,
        created_at: (tag as any).createdAt ?? tag.created_at ?? "",
    })), [rawTags]);
    const createTag = useCreateBlogTag();
    const updateTag = useUpdateBlogTag();
    const updateTagStatus = useUpdateBlogTagStatus();
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

    const onSubmit = (data: typeof schema._type) => {
        closeDialog();
        if (editItem) {
            updateTag.mutate({ id: editItem.id, data });
        } else {
            createTag.mutate(data);
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
            sortable: true,
        },
        {
            key: 'slug',
            header: t('common.slug', 'Slug'),
            render: (row: BlogTag) => (
                <Badge variant="outline" className="font-mono text-xs">{row.slug}</Badge>
            ),
            sortable: true,
        },
    ];

    const isPending = createTag.isPending || updateTag.isPending;

    if (!isActive) return <PluginDisabledState pluginName="Blog" pluginSlug="blog" />;

    return (
        <div className="space-y-6">
            <PageLoader open={isLoading || isPending || deleteTag.isPending} />

            <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{t('blog.tags_title', 'Blog Tags')}</h1>
                <p className="text-muted-foreground mt-1">{t('blog.tags_desc', 'Manage tags for blog posts')}</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
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
                        data={(tags || []).map(t => ({
                            ...t,
                            created_at: t.created_at || (t as any).createdAt || new Date().toISOString()
                        })) as any}
                        isLoading={isLoading}
                        emptyMessage={t('blog.no_tags', 'No blog tags found.')}
                        onStatusToggle={(row, val) => updateTagStatus.mutate({ id: row.id, is_active: val })}
                        onEdit={(row) => openEdit(row as BlogTag)}
                        onDelete={(row) => setDeleteId(row.id)}
                        showCreated={true}
                        showStatus
                        showActions
                    />
                    {pagination && <TablePagination pagination={{ ...pagination, limit }} onPageChange={setPage} onLimitChange={setLimit} />}
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
                                {t('common.save', 'Save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <DeleteDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title={t('common.are_you_sure', 'Are you sure?')}
                description={t('common.delete_confirm', 'This action cannot be undone.')}
                isDeleting={deleteTag.isPending}
                onConfirm={() => {
                    if (deleteId) {
                        deleteTag.mutate(deleteId, {
                            onSuccess: () => setDeleteId(null),
                            onError: () => setDeleteId(null)
                        });
                    }
                }}
            />
        </div>
    );
}
