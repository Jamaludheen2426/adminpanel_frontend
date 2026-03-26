'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import {
    useFaqCategories,
    useCreateFaqCategory,
    useUpdateFaqCategory,
    useUpdateFaqCategoryStatus,
    useDeleteFaqCategory,
    FaqCategory
} from '@/hooks/use-faq-categories';
import { isApprovalRequired } from '@/lib/api-client';
import { useTranslation } from '@/hooks/use-translation';
import { CommonTable, type CommonColumn } from '@/components/common/common-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PageLoader } from '@/components/common/page-loader';
import { DeleteDialog } from '@/components/common/delete-dialog';
import { TablePagination } from '@/components/common/table-pagination';

const schema = z.object({
    name: z.string().trim().min(1, 'Name is required'),
    description: z.string().trim().optional(),
    sort_order: z.preprocess((val) => Number(val), z.number().default(0)),
    is_active: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

export function FaqCategoriesContent() {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const { data: categoriesResponse, isLoading } = useFaqCategories({ page, limit });
    const rawCategories: FaqCategory[] = categoriesResponse?.data ?? [];
    const pagination = categoriesResponse?.pagination;
    const createCategory = useCreateFaqCategory();
    const updateCategory = useUpdateFaqCategory();
    const deleteCategory = useDeleteFaqCategory();
    const updateCategoryStatus = useUpdateFaqCategoryStatus();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<FaqCategory | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { name: '', description: '', sort_order: 0, is_active: true },
    });

    const closeDialog = () => {
        setDialogOpen(false);
        setEditItem(null);
        form.reset();
    };

    const openCreate = () => {
        setEditItem(null);
        form.reset({ name: '', description: '', sort_order: 0, is_active: true });
        setDialogOpen(true);
    };

    const openEdit = (item: FaqCategory) => {
        if (Number(item.is_active) === 2) return;
        setEditItem(item);
        form.reset({
            name: item.name,
            description: item.description ?? '',
            sort_order: item.sort_order,
            is_active: Number(item.is_active) === 1,
        });
        setDialogOpen(true);
    };

    const onSubmit = (data: FormData) => {
        const payload = { ...data, description: data.description || null };
        const onError = (error: any) => { if (isApprovalRequired(error)) closeDialog(); };
        if (editItem) {
            updateCategory.mutate({ id: editItem.id, data: payload }, { onSuccess: closeDialog, onError });
        } else {
            createCategory.mutate(payload, { onSuccess: closeDialog, onError });
        }
    };

    const normalise = (item: FaqCategory) => ({
        ...item,
        is_active: item.is_active,
        created_at: (item as any).created_at ?? (item as any).createdAt ?? '',
    });

    const processedCategories = rawCategories.map(normalise);

    const columns: CommonColumn<FaqCategory>[] = [
        {
            key: 'sort_order',
            header: t('faq.sort_order', 'Sort Order'),
            sortable: true,
            render: (row) => <span className="text-muted-foreground">{row.sort_order}</span>,
        },
        {
            key: 'name',
            header: t('faq.category_name', 'Category Name'),
            sortable: true,
            render: (row) => <span className="font-medium">{row.name}</span>,
        },
        {
            key: 'description',
            header: t('faq.description', 'Description'),
            render: (row) => <span className="text-muted-foreground truncate max-w-xs block">{row.description || '—'}</span>,
        },
    ];

    const isPending = createCategory.isPending || updateCategory.isPending;

    return (
        <div className="space-y-6">
            <PageLoader open={isLoading || isPending || deleteCategory.isPending} />
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <CardTitle>{t('faq.categories_title', 'FAQ Categories')}</CardTitle>
                            <CardDescription>{t('faq.categories_desc', 'Manage categories for your FAQ section')}</CardDescription>
                        </div>
                        <Button size="sm" onClick={openCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('faq.add_category', 'Add Category')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <CommonTable
                        columns={columns}
                        data={processedCategories as any}
                        isLoading={isLoading}
                        emptyMessage={t('faq.no_categories', 'No categories found.')}
                        onStatusToggle={(row, val) => updateCategoryStatus.mutate({ id: row.id, is_active: val })}
                        onEdit={openEdit}
                        onDelete={(row) => setDeleteId(row.id)}
                        showStatus
                        showCreated
                        showActions
                    />
                    {pagination && <TablePagination pagination={{ ...pagination, limit }} onPageChange={setPage} onLimitChange={setLimit} />}
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={(open: boolean) => !open && closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editItem ? t('faq.edit_category', 'Edit Category') : t('faq.create_category', 'Create Category')}</DialogTitle>
                        <DialogDescription>{t('faq.category_form_desc', 'Fill in the category details.')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('faq.name', 'Name')} <span className="text-destructive">*</span></Label>
                            <Input id="name" {...form.register('name')} placeholder="e.g. General, Billing" />
                            {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">{t('faq.description', 'Description')}</Label>
                            <Textarea id="description" {...form.register('description')} placeholder="Optional description..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="sort_order">{t('faq.sort_order', 'Sort Order')}</Label>
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

            <DeleteDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title={t('common.are_you_sure', 'Are you sure?')}
                description={t('common.delete_confirm', 'This action cannot be undone.')}
                isDeleting={deleteCategory.isPending}
                onConfirm={() => {
                    if (deleteId) {
                        deleteCategory.mutate(deleteId, {
                            onSuccess: () => setDeleteId(null),
                            onError: () => setDeleteId(null)
                        });
                    }
                }}
            />
        </div>
    );
}
