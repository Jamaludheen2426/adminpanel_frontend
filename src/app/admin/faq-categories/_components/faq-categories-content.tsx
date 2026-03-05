'use client';

import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, List } from 'lucide-react';
import {
    useFaqCategories,
    useCreateFaqCategory,
    useUpdateFaqCategory,
    useDeleteFaqCategory,
    FaqCategory
} from '@/hooks/use-faq-categories';
import { useTranslation } from '@/hooks/use-translation';
import { CommonTable, type CommonColumn } from '@/components/common/common-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageLoader } from '@/components/common/page-loader';

const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    sort_order: z.preprocess((val) => Number(val), z.number().default(0)),
    is_active: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

// ─── normalise function for CommonTable ───────────────────────────────────────
function normalise(item: FaqCategory): FaqCategory & { created_at: string; is_active: boolean } {
    return {
        ...item,
        is_active: Boolean(item.is_active),
        created_at: (item as any).created_at ?? (item as any).createdAt ?? '',
    };
}

export function FaqCategoriesContent() {
    const { t } = useTranslation();
    const { data: rawCategories = [], isLoading } = useFaqCategories();
    const categories = useMemo(() => rawCategories.map(normalise), [rawCategories]);
    const createCategory = useCreateFaqCategory();
    const updateCategory = useUpdateFaqCategory();
    const deleteCategory = useDeleteFaqCategory();

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
        setEditItem(item);
        form.reset({
            name: item.name,
            description: item.description ?? '',
            sort_order: item.sort_order,
            is_active: Boolean(item.is_active),
        });
        setDialogOpen(true);
    };

    const onSubmit = (data: FormData) => {
        const payload = {
            ...data,
            description: data.description || null,
        };
        if (editItem) {
            updateCategory.mutate({ id: editItem.id, data: payload }, { onSuccess: closeDialog });
        } else {
            createCategory.mutate(payload, { onSuccess: closeDialog });
        }
    };

    const columns: CommonColumn<FaqCategory>[] = [
        {
            key: 'sort_order',
            header: t('faq.sort_order', 'Sort Order'),
            render: (row) => <span className="text-muted-foreground">{row.sort_order}</span>,
        },
        {
            key: 'name',
            header: t('faq.category_name', 'Category Name'),
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
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <List className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>{t('faq.categories_title', 'FAQ Categories')}</CardTitle>
                                <CardDescription>{t('faq.categories_desc', 'Manage categories for your FAQ section')}</CardDescription>
                            </div>
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
                        data={categories as any}
                        isLoading={isLoading}
                        emptyMessage={t('faq.no_categories', 'No categories found.')}
                        onStatusToggle={(row, val) =>
                            updateCategory.mutate({ id: row.id, data: { is_active: val } })
                        }
                        onEdit={openEdit}
                        onDelete={(row) => setDeleteId(row.id)}
                        showStatus
                        showCreated
                        showActions
                    />
                </CardContent>
            </Card>


            <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editItem ? t('faq.edit_category', 'Edit Category') : t('faq.create_category', 'Create Category')}</DialogTitle>
                        <DialogDescription>{t('faq.category_form_desc', 'Fill in the category details.')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('faq.name', 'Name')} *</Label>
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
                                    deleteCategory.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
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
