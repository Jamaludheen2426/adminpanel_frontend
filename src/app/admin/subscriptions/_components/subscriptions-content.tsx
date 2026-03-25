'use client';

import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X, ChevronDown } from 'lucide-react';
import {
    useSubscriptions,
    useCreateSubscription,
    useUpdateSubscription,
    useUpdateSubscriptionStatus,
    useDeleteSubscription,
    Subscription,
} from '@/hooks/use-subscriptions';
import { useMenus } from '@/hooks/use-menus';
import { useTranslation } from '@/hooks/use-translation';
import { CommonTable, type CommonColumn } from '@/components/common/common-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageLoader } from '@/components/common/page-loader';
import { TablePagination } from '@/components/common/table-pagination';
import { DeleteDialog } from '@/components/common/delete-dialog';
import { RichTextEditor } from '@/components/common/rich-text-editor';

const schema = z.object({
    name: z.string().trim().min(1, 'Plan name is required'),
    description: z.string().default(''),
    menu_ids: z.array(z.number()).default([]),
    price: z.preprocess(
        (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
        z.number({ required_error: 'Price is required' }).min(0, 'Price must be 0 or more')
    ),
    validity: z.coerce.number().int().min(0).default(0),
    features: z.string().default(''),
    sort_order: z.coerce.number().int().min(0).default(0),
    is_active: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

function normalise(item: Subscription) {
    return {
        ...item,
        is_active: item.is_active,   // keep raw value (2 = pending)
        menu_ids: Array.isArray(item.menu_ids) ? item.menu_ids : [],
        created_at: (item as any).created_at ?? (item as any).createdAt ?? '',
    };
}

export function SubscriptionsContent() {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const { data: subsResponse, isLoading } = useSubscriptions({ page, limit });
    const raw: Subscription[] = subsResponse?.data ?? [];
    const pagination = subsResponse?.pagination;
    const { data: menusResponse } = useMenus({ limit: 200 });
    const menus = menusResponse?.data ?? [];
    const subscriptions = useMemo(() => raw.map(normalise), [raw]);

    const createSubscription = useCreateSubscription();
    const updateSubscription = useUpdateSubscription();
    const updateStatus = useUpdateSubscriptionStatus();
    const deleteSubscription = useDeleteSubscription();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<Subscription | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '', description: '', menu_ids: [], price: undefined,
            validity: 0, features: '', sort_order: 0, is_active: true,
        },
    });

    const closeDialog = () => {
        setDialogOpen(false);
        setEditItem(null);
        setMenuDropdownOpen(false);
        form.reset();
    };

    const openCreate = () => {
        setEditItem(null);
        form.reset({ name: '', description: '', menu_ids: [], price: undefined, validity: 0, features: '', sort_order: 0, is_active: true });
        setDialogOpen(true);
    };

    const openEdit = (item: Subscription) => {
        if (Number(item.is_active) === 2) return;
        setEditItem(item);
        form.reset({
            name: item.name,
            description: item.description || '',
            menu_ids: Array.isArray(item.menu_ids) ? item.menu_ids : [],
            price: item.price,
            validity: item.validity ?? 0,
            features: item.features || '',
            sort_order: item.sort_order ?? 0,
            is_active: Number(item.is_active) === 1,
        });
        setDialogOpen(true);
    };

    const onSubmit = (data: FormData) => {
        const isDuplicate = subscriptions.some(
            (s) => s.sort_order === data.sort_order && s.id !== editItem?.id
        );
        if (isDuplicate) {
            form.setError('sort_order', { message: `Sort order ${data.sort_order} is already in use` });
            return;
        }
        closeDialog();
        const payload = { ...data, validity: data.validity || undefined };
        if (editItem) {
            updateSubscription.mutate({ id: editItem.id, data: payload });
        } else {
            createSubscription.mutate(payload);
        }
    };

    const toggleMenu = (menuId: number, current: number[], onChange: (v: number[]) => void) => {
        onChange(current.includes(menuId) ? current.filter(id => id !== menuId) : [...current, menuId]);
    };

    const columns: CommonColumn<Subscription>[] = [
        {
            key: 'name',
            header: 'Plan Name',
            sortable: true,
            render: (row) => <span className="font-medium">{row.name}</span>,
        },
        {
            key: 'price',
            header: 'Price',
            sortable: true,
            render: (row) => <span className="tabular-nums font-medium">${Number(row.price).toFixed(2)}</span>,
        },
        {
            key: 'validity',
            header: 'Validity',
            render: (row) => <span className="text-sm">{row.validity ? `${row.validity} days` : '—'}</span>,
        },
        {
            key: 'menu_ids',
            header: 'Menus',
            render: (row) => {
                const ids = Array.isArray(row.menu_ids) ? row.menu_ids : [];
                if (!ids.length) return <span className="text-xs text-muted-foreground">—</span>;
                return (
                    <div className="flex flex-wrap gap-1">
                        {ids.slice(0, 3).map(id => {
                            const menu = menus.find((m: any) => m.id === id);
                            return menu ? <Badge key={id} variant="secondary" className="text-xs">{menu.name}</Badge> : null;
                        })}
                        {ids.length > 3 && <Badge variant="outline" className="text-xs">+{ids.length - 3}</Badge>}
                    </div>
                );
            },
        },
        {
            key: 'sort_order',
            header: 'Sort Order',
            sortable: true,
            render: (row) => <span className="tabular-nums text-sm">{row.sort_order ?? 0}</span>,
        },
    ];

    const isPending = createSubscription.isPending || updateSubscription.isPending;

    return (
        <div className="space-y-6">
            <PageLoader open={isLoading || isPending || deleteSubscription.isPending} />
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <CardTitle>Subscriptions</CardTitle>
                            <CardDescription>Manage subscription plans</CardDescription>
                        </div>
                        <Button size="sm" onClick={openCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Subscription
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <CommonTable
                        columns={columns}
                        data={subscriptions as any}
                        isLoading={isLoading}
                        emptyMessage="No subscriptions found. Create your first plan."
                        onStatusToggle={(row, val) => updateStatus.mutate({ id: row.id, is_active: val })}
                        onEdit={openEdit}
                        onDelete={(row) => setDeleteId(row.id)}
                        showStatus
                        showCreated
                        showActions
                    />
                    {pagination && <TablePagination pagination={{ ...pagination, limit }} onPageChange={setPage} onLimitChange={setLimit} />}
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editItem ? 'Edit Subscription' : 'Add Subscription'}</DialogTitle>
                        <DialogDescription>Fill in the subscription plan details.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">

                        {/* Plan Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Plan Name *</Label>
                            <Input id="name" {...form.register('name')} placeholder="e.g. Pro Plan" />
                            {form.formState.errors.name && (
                                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" {...form.register('description')} placeholder="Brief description..." rows={2} />
                        </div>

                        {/* Menus multi-select */}
                        <div className="space-y-2">
                            <Label>Menus</Label>
                            <Controller
                                control={form.control}
                                name="menu_ids"
                                render={({ field }) => (
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setMenuDropdownOpen(v => !v)}
                                            className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm hover:bg-accent transition-colors"
                                        >
                                            <span className="truncate text-left text-muted-foreground">
                                                {field.value.length === 0 ? 'Select menus...' : `${field.value.length} menu${field.value.length > 1 ? 's' : ''} selected`}
                                            </span>
                                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        </button>

                                        {field.value.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {field.value.map(id => {
                                                    const menu = menus.find((m: any) => m.id === id);
                                                    return menu ? (
                                                        <Badge key={id} variant="secondary" className="text-xs gap-1 pr-1">
                                                            {menu.name}
                                                            <button type="button" onClick={() => toggleMenu(id, field.value, field.onChange)} className="hover:text-destructive ml-0.5">
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </Badge>
                                                    ) : null;
                                                })}
                                            </div>
                                        )}

                                        {menuDropdownOpen && (
                                            <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
                                                <ScrollArea className="h-44 p-1">
                                                    {menus.length === 0 ? (
                                                        <p className="text-xs text-muted-foreground p-3 text-center">No menus available</p>
                                                    ) : menus.map((menu: any) => (
                                                        <button
                                                            key={menu.id}
                                                            type="button"
                                                            onClick={() => toggleMenu(menu.id, field.value, field.onChange)}
                                                            className={`flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-accent transition-colors text-left ${field.value.includes(menu.id) ? 'bg-accent' : ''}`}
                                                        >
                                                            <span className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${field.value.includes(menu.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-input'}`}>
                                                                {field.value.includes(menu.id) && (
                                                                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                )}
                                                            </span>
                                                            {menu.name}
                                                        </button>
                                                    ))}
                                                </ScrollArea>
                                            </div>
                                        )}
                                    </div>
                                )}
                            />
                        </div>

                        {/* Price + Validity */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Price *</Label>
                                <Input id="price" type="number" min={0} step="0.01" {...form.register('price')} placeholder="0.00" />
                                {form.formState.errors.price && (
                                    <p className="text-xs text-destructive">{form.formState.errors.price.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="validity">Validity (days)</Label>
                                <Input id="validity" type="number" min={0} {...form.register('validity')} placeholder="e.g. 30, 365" />
                                <p className="text-[11px] text-muted-foreground">Leave 0 for no expiry</p>
                            </div>
                        </div>

                        {/* Features - Rich Text */}
                        <div className="space-y-2">
                            <Label>Features</Label>
                            <Controller
                                control={form.control}
                                name="features"
                                render={({ field }) => (
                                    <RichTextEditor
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Describe the features of this plan..."
                                        variant="compact"
                                    />
                                )}
                            />
                        </div>

                        {/* Sort Order */}
                        <div className="space-y-2">
                            <Label htmlFor="sort_order">Sort Order</Label>
                            <Input id="sort_order" type="number" min={0} {...form.register('sort_order')} placeholder="0" className="w-32" />
                            {form.formState.errors.sort_order ? (
                                <p className="text-xs text-destructive">{form.formState.errors.sort_order.message}</p>
                            ) : (
                                <p className="text-[11px] text-muted-foreground">Lower number = higher in list</p>
                            )}
                        </div>

                        {/* Active */}
                        <div className="space-y-2">
                            <Label>{t('common.active', 'Active')}</Label>
                            <div className="flex items-center gap-2">
                                <Controller
                                    control={form.control}
                                    name="is_active"
                                    render={({ field }) => (
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    )}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {form.watch('is_active') ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeDialog}>{t('common.cancel', 'Cancel')}</Button>
                            <Button type="submit">{t('common.save', 'Save')}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <DeleteDialog
                open={!!deleteId}
                onOpenChange={(open: boolean) => !open && setDeleteId(null)}
                title="Delete Subscription"
                description="Are you sure you want to delete this subscription plan? This action cannot be undone."
                isDeleting={deleteSubscription.isPending}
                onConfirm={() => {
                    if (deleteId) {
                        deleteSubscription.mutate(deleteId, {
                            onSuccess: () => setDeleteId(null),
                            onError: () => setDeleteId(null),
                        });
                    }
                }}
            />
        </div>
    );
}
