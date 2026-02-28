'use client';

import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useFaqs, useCreateFaq, useUpdateFaq, useDeleteFaq, Faq } from '@/hooks/use-faqs';
import { useFaqCategories } from '@/hooks/use-faq-categories';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageLoader } from '@/components/common/page-loader';
import { Badge } from '@/components/ui/badge';

const schema = z.object({
    faq_category_id: z.preprocess((val) => Number(val), z.number().min(1, 'Category is required')),
    question: z.string().min(1, 'Question is required'),
    answer: z.string().min(1, 'Answer is required'),
    sort_order: z.preprocess((val) => Number(val), z.number().default(0)),
    is_active: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

export function FaqsContent() {
    const { t } = useTranslation();
    const { data: faqs = [], isLoading } = useFaqs();
    const { data: categories = [] } = useFaqCategories();
    const createFaq = useCreateFaq();
    const updateFaq = useUpdateFaq();
    const deleteFaq = useDeleteFaq();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<Faq | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);

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
        setEditItem(item);
        form.reset({
            faq_category_id: item.faq_category_id,
            question: item.question,
            answer: item.answer,
            sort_order: item.sort_order,
            is_active: Boolean(item.is_active),
        });
        setDialogOpen(true);
    };

    const onSubmit = (data: FormData) => {
        if (editItem) {
            updateFaq.mutate({ id: editItem.id, data }, { onSuccess: closeDialog });
        } else {
            createFaq.mutate(data, { onSuccess: closeDialog });
        }
    };

    const columns = useMemo<ColumnDef<Faq>[]>(() => [
        {
            accessorKey: 'sort_order',
            header: t('faq.sort_order', 'Sort Order'),
            cell: ({ row }) => <span className="text-muted-foreground">{row.original.sort_order}</span>,
        },
        {
            accessorKey: 'category.name',
            header: t('faq.category', 'Category'),
            cell: ({ row }) => (
                <Badge variant="secondary">
                    {row.original.category?.name || 'Unassigned'}
                </Badge>
            ),
        },
        {
            accessorKey: 'question',
            header: t('faq.question', 'Question'),
            cell: ({ row }) => <span className="font-medium block max-w-sm truncate">{row.original.question}</span>,
        },
        {
            accessorKey: 'is_active',
            header: t('common.active', 'Active'),
            cell: ({ row }) => (
                <Switch
                    checked={Boolean(row.original.is_active)}
                    onCheckedChange={(checked) => updateFaq.mutate({ id: row.original.id, data: { is_active: checked } })}
                    disabled={updateFaq.isPending}
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
    ], [t, updateFaq]);

    const isPending = createFaq.isPending || updateFaq.isPending;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
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
                    <PageLoader open={isLoading} />
                    {!isLoading && <DataTable columns={columns} data={faqs} searchKey="question" />}
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editItem ? t('faq.edit_faq', 'Edit FAQ') : t('faq.create_faq', 'Create FAQ')}</DialogTitle>
                        <DialogDescription>{t('faq.form_desc', 'Fill in the FAQ details.')}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">{t('faq.category', 'Category')} *</Label>
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
                            <Label htmlFor="question">{t('faq.question', 'Question')} *</Label>
                            <Input id="question" {...form.register('question')} placeholder="e.g. How do I reset my password?" />
                            {form.formState.errors.question && <p className="text-xs text-destructive">{form.formState.errors.question.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="answer">{t('faq.answer', 'Answer')} *</Label>
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
                                        disableVisual={true} // Defaults to HTML source mode
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
                                    deleteFaq.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
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
