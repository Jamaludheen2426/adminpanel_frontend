'use client';

import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useFaqs, useCreateFaq, useUpdateFaq, useDeleteFaq, Faq } from '@/hooks/use-faqs';
import { isApprovalRequired } from '@/lib/api-client';
import { useFaqCategories } from '@/hooks/use-faq-categories';
import { useTranslation } from '@/hooks/use-translation';
import { CommonTable, type CommonColumn } from '@/components/common/common-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RichTextEditor } from "@/components/common/rich-text-editor";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PageLoader } from '@/components/common/page-loader';
import { TablePagination } from '@/components/common/table-pagination';
import { DeleteDialog } from '@/components/common/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { useIsPluginActive } from '@/hooks/use-plugins';
import { PluginDisabledState } from '@/components/common/plugin-disabled';

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

const schema = z.object({
    faq_category_id: z.preprocess((val) => Number(val), z.number().min(1, 'Category is required')),
    question: z.string().trim().min(1, 'Question is required'),
    answer: z.string().refine((val) => stripHtml(val).length > 0, { message: 'Answer is required' }),
    sort_order: z.preprocess((val) => Number(val), z.number().default(0)),
    is_active: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

// ─── normalise function for CommonTable ───────────────────────────────────────
function normalise(item: Faq): Faq & { created_at: string; is_active: boolean | number } {
    return {
        ...item,
        is_active: item.is_active as boolean | number,
        created_at: (item as any).created_at ?? (item as any).createdAt ?? '',
    };
}

export function FaqsContent() {
    const isActive = useIsPluginActive('faq');
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const { data: faqsResponse, isLoading } = useFaqs({ page, limit });
    const rawFaqs = faqsResponse?.data || [];
    const pagination = faqsResponse?.pagination;
    const faqs = useMemo(() => rawFaqs.map(normalise), [rawFaqs]);
    const { data: categoriesResponse } = useFaqCategories();
    const categories = categoriesResponse?.data || [];
    const createFaq = useCreateFaq();
    const updateFaq = useUpdateFaq();
    const deleteFaq = useDeleteFaq();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<Faq | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [sortColumn, setSortColumn] = useState<string>('sort_order');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { faq_category_id: 0, question: '', answer: '', sort_order: 0, is_active: true },
    });

    const closeDialog = () => {
        setDialogOpen(false);
        setEditItem(null);
        form.reset();
    };

    const openCreate = () => {
        setEditItem(null);
        form.reset({
            faq_category_id: categories.length > 0 ? categories[0].id : 0,
            question: '',
            answer: '',
            sort_order: 0,
            is_active: true
        });
        setDialogOpen(true);
    };

    const openEdit = (item: Faq) => {
        if (Number(item.is_active) === 2) return; // block editing pending items
        setEditItem(item);
        form.reset({
            faq_category_id: item.faq_category_id,
            question: item.question,
            answer: item.answer,
            sort_order: item.sort_order,
            is_active: Number(item.is_active) === 1,
        });
        setDialogOpen(true);
    };

    const onSubmit = (data: FormData) => {
        const onError = (error: any) => { if (isApprovalRequired(error)) closeDialog(); };
        if (editItem) {
            updateFaq.mutate({ id: editItem.id, data }, { onSuccess: closeDialog, onError });
        } else {
            createFaq.mutate(data, { onSuccess: closeDialog, onError });
        }
    };

    const sortedFaqs = useMemo(() => [...faqs].sort((a, b) => {
        let aVal: any = a[sortColumn as keyof Faq];
        let bVal: any = b[sortColumn as keyof Faq];
        if (sortColumn === 'category.name') { aVal = a.category?.name ?? ''; bVal = b.category?.name ?? ''; }
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    }), [faqs, sortColumn, sortDirection]);

    const columns: CommonColumn<Faq>[] = [
        {
            key: 'sort_order',
            header: t('faq.sort_order', 'Sort Order'),
            sortable: true,
            render: (row) => <span className="text-muted-foreground">{row.sort_order}</span>,
        },
        {
            key: 'category.name',
            header: t('faq.category', 'Category'),
            sortable: true,
            render: (row) => (
                <Badge variant="secondary">
                    {row.category?.name || 'Unassigned'}
                </Badge>
            ),
        },
        {
            key: 'question',
            header: t('faq.question', 'Question'),
            sortable: true,
            render: (row) => <span className="font-medium block max-w-sm truncate">{row.question}</span>,
        },
    ];

    const isPending = createFaq.isPending || updateFaq.isPending;

    if (!isActive) return <PluginDisabledState pluginName="FAQ" pluginSlug="faq" />;

    return (
        <div className="space-y-6">
            <PageLoader open={isLoading || isPending || deleteFaq.isPending} />
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <CardTitle>{t('faq.title', 'FAQs')}</CardTitle>
                            <CardDescription>{t('faq.desc', 'Manage frequently asked questions and answers')}</CardDescription>
                        </div>
                        <Button size="sm" onClick={openCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('faq.add_faq', 'Add FAQ')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <CommonTable
                        columns={columns}
                        data={sortedFaqs as any}
                        isLoading={isLoading}
                        emptyMessage={t('faq.no_faqs', 'No FAQs found.')}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                        onStatusToggle={(row, val) =>
                            updateFaq.mutate({ id: row.id, data: { is_active: val } })
                        }
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
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editItem ? t('faq.edit_faq', 'Edit FAQ') : t('faq.create_faq', 'Create FAQ')}</DialogTitle>
                        <DialogDescription>{t('faq.form_desc', 'Fill in the FAQ details.')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">{t('faq.category', 'Category')} <span className="text-destructive">*</span></Label>
                            <Controller
                                control={form.control}
                                name="faq_category_id"
                                render={({ field }) => (
                                    <Select
                                        value={field.value.toString()}
                                        onValueChange={(val) => field.onChange(val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id.toString()}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {form.formState.errors.faq_category_id && <p className="text-xs text-destructive">{form.formState.errors.faq_category_id.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="question">{t('faq.question', 'Question')} <span className="text-destructive">*</span></Label>
                            <Input id="question" {...form.register('question')} placeholder="e.g. How do I reset my password?" />
                            {form.formState.errors.question && <p className="text-xs text-destructive">{form.formState.errors.question.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="answer">{t('faq.answer', 'Answer')} <span className="text-destructive">*</span></Label>
                            <Controller
                                control={form.control}
                                name="answer"
                                render={({ field }) => (
                                    <RichTextEditor
                                        key={editItem ? `edit-${editItem.id}` : 'create'}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Provide a detailed answer..."
                                        variant="compact"
                                    />
                                )}
                            />
                            {form.formState.errors.answer && <p className="text-xs text-destructive">{form.formState.errors.answer.message}</p>}
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
                isDeleting={deleteFaq.isPending}
                onConfirm={() => {
                    if (deleteId) {
                        deleteFaq.mutate(deleteId, {
                            onSuccess: () => setDeleteId(null),
                            onError: () => setDeleteId(null)
                        });
                    }
                }}
            />
        </div>
    );
}
