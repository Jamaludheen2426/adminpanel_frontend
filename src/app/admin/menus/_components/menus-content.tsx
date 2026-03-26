'use client';

import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, HelpCircle, LayoutGrid, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Icon as IconifyIcon } from '@iconify/react';
import { IconPickerDialog } from './icon-picker-dialog';
import {
    useMenus,
    useCreateMenu,
    useUpdateMenu,
    useUpdateMenuStatus,
    useDeleteMenu,
    Menu,
} from '@/hooks/use-menus';
import { useTranslation } from '@/hooks/use-translation';
import { CommonTable, type CommonColumn } from '@/components/common/common-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PageLoader } from '@/components/common/page-loader';
import { TablePagination } from '@/components/common/table-pagination';
import { DeleteDialog } from '@/components/common/delete-dialog';

const schema = z.object({
    name: z.string().trim().min(1, 'Name is required'),
    icon: z.string().default(''),
    icon_fill_color_light: z.string().default(''),
    icon_fill_color_dark: z.string().default(''),
    sort_order: z.coerce.number().int().min(0).default(0),
    is_active: z.boolean().default(true),
    display_status: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

// Case-insensitive map: 'airvent' → AirVent component, built once at module load
// Icons are forwardRef objects (typeof === 'object'), so filter by uppercase first letter
const lucideIconMap: Record<string, any> = Object.fromEntries(
    Object.entries(LucideIcons)
        .filter(([k]) => /^[A-Z]/.test(k))
        .map(([k, v]) => [k.toLowerCase(), v])
);

function resolveLucideIcon(name: string) {
    if (!name) return null;
    // 1. Exact match (fastest path)
    if ((LucideIcons as any)[name]) return (LucideIcons as any)[name];
    // 2. Case-insensitive match (handles 'Airvent' → 'AirVent', 'wifi' → 'Wifi')
    if (lucideIconMap[name.toLowerCase()]) return lucideIconMap[name.toLowerCase()];
    // 3. Auto-convert hyphen/underscore input: 'arrow-right' → 'ArrowRight'
    const converted = name.trim().split(/[-_ ]+/).filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    return lucideIconMap[converted.toLowerCase()] || null;
}

function DynamicIcon({ name, color, size = 'h-5 w-5' }: { name: string; color?: string; size?: string }) {
    if (!name) return <HelpCircle className={`${size} text-muted-foreground`} />;
    const style = color ? { color } : undefined;

    if (name.includes(':')) {
        return <IconifyIcon icon={name} className={size} style={style} />;
    }

    const LucideIcon = resolveLucideIcon(name);
    if (!LucideIcon) return <HelpCircle className={`${size} text-muted-foreground`} />;
    return <LucideIcon className={size} style={style} />;
}

function normalise(item: Menu) {
    return {
        ...item,
        is_active: item.is_active,   // keep raw value (2 = pending)
        display_status: Boolean(item.display_status),
        created_at: (item as any).created_at ?? (item as any).createdAt ?? '',
    };
}

export function MenusContent() {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const { data: menusResponse, isLoading } = useMenus({ page, limit });
    const raw: Menu[] = menusResponse?.data ?? [];
    const pagination = menusResponse?.pagination;
    const menus = useMemo(() => raw.map(normalise), [raw]);
    const createMenu = useCreateMenu();
    const updateMenu = useUpdateMenu();
    const updateStatus = useUpdateMenuStatus();
    const deleteMenu = useDeleteMenu();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<Menu | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [pickerOpen, setPickerOpen] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            icon: '',
            icon_fill_color_light: '',
            icon_fill_color_dark: '',
            sort_order: 0,
            is_active: true,
            display_status: true,
        },
    });

    const fillColorLight = form.watch('icon_fill_color_light');

    const closeDialog = () => {
        setDialogOpen(false);
        setEditItem(null);
        form.reset();
    };

    const openCreate = () => {
        setEditItem(null);
        form.reset({
            name: '',
            icon: '',
            icon_fill_color_light: '',
            icon_fill_color_dark: '',
            sort_order: 0,
            is_active: true,
            display_status: true,
        });
        setDialogOpen(true);
    };

    const openEdit = (item: Menu) => {
        if (Number(item.is_active) === 2) return;
        setEditItem(item);
        form.reset({
            name: item.name,
            icon: item.icon || '',
            icon_fill_color_light: item.icon_fill_color_light || '',
            icon_fill_color_dark: item.icon_fill_color_dark || '',
            sort_order: item.sort_order ?? 0,
            is_active: Number(item.is_active) === 1,
            display_status: Boolean(item.display_status),
        });
        setDialogOpen(true);
    };

    const onSubmit = (data: FormData) => {
        closeDialog();
        
        // Auto-format icon name before saving
        if (data.icon) {
            data.icon = data.icon
                .trim()
                .split(/[-_ ]+/)
                .filter(Boolean)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
        }

        if (editItem) {
            updateMenu.mutate({ id: editItem.id, data });
        } else {
            createMenu.mutate(data);
        }
    };

    const columns: CommonColumn<Menu>[] = [
        {
            key: 'name',
            header: t('menus.name', 'Menu Name'),
            sortable: true,
            render: (row) => <span className="font-medium">{row.name}</span>,
        },
        {
            key: 'icon_fill_color_light',
            header: t('menus.icon_fill_color_light', 'Icon Color (Light)'),
            render: (row) =>
                row.icon_fill_color_light ? (
                    <div className="flex items-center gap-2">
                        <DynamicIcon name={row.icon || ''} color={row.icon_fill_color_light} size="h-5 w-5" />
                        <span
                            className="inline-block h-4 w-4 rounded border border-border shrink-0"
                            style={{ background: row.icon_fill_color_light }}
                        />
                        <span className="text-xs text-muted-foreground">{row.icon_fill_color_light}</span>
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                ),
        },
        {
            key: 'icon_fill_color_dark',
            header: t('menus.icon_fill_color_dark', 'Icon Color (Dark)'),
            render: (row) =>
                row.icon_fill_color_dark ? (
                    <div className="flex items-center gap-2">
                        <DynamicIcon name={row.icon || ''} color={row.icon_fill_color_dark} size="h-5 w-5" />
                        <span
                            className="inline-block h-4 w-4 rounded border border-border shrink-0"
                            style={{ background: row.icon_fill_color_dark }}
                        />
                        <span className="text-xs text-muted-foreground">{row.icon_fill_color_dark}</span>
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                ),
        },
        {
            key: 'sort_order',
            header: t('menus.sort_order', 'Sort Order'),
            sortable: true,
            render: (row) => (
                <span className="text-sm tabular-nums">{row.sort_order ?? 0}</span>
            ),
        },
    ];

    const isPending = createMenu.isPending || updateMenu.isPending;

    return (
        <div className="space-y-6">
            <PageLoader open={isLoading || isPending || deleteMenu.isPending} />
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <CardTitle>{t('menus.title', 'Menus')}</CardTitle>
                            <CardDescription>{t('menus.desc', 'Manage menu items')}</CardDescription>
                        </div>
                        <Button size="sm" onClick={openCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('menus.add', 'Add Menu')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <CommonTable
                        columns={columns}
                        data={menus as any}
                        isLoading={isLoading}
                        emptyMessage={t('menus.no_records', 'No menus found. Create your first menu.')}
                        onStatusToggle={(row, val) =>
                            updateStatus.mutate({ id: row.id, is_active: val ? 1 : 0 })
                        }
                        onEdit={openEdit}
                        onDelete={(row) => setDeleteId(row.id)}
                        disableStatusToggle={(row) => Number(row.is_active) === 2 || !!row.has_pending_approval}
                        disableEdit={(row) => Number(row.is_active) === 2 || !!row.has_pending_approval}
                        disableDelete={(row) => Number(row.is_active) === 2 || !!row.has_pending_approval}
                        showStatus
                        showCreated
                        showActions
                    />
                    {pagination && <TablePagination pagination={{ ...pagination, limit }} onPageChange={setPage} onLimitChange={setLimit} />}
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editItem ? t('menus.edit', 'Edit Menu') : t('menus.add', 'Add Menu')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('menus.form_desc', 'Fill in the menu item details.')}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('menus.name', 'Menu Name')} *</Label>
                            <Input id="name" {...form.register('name')} placeholder="e.g. Drinks" />
                            {form.formState.errors.name && (
                                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                            )}
                        </div>

                        {/* Icon picker */}
                        <div className="space-y-2">
                            <Label>{t('menus.icon', 'Icon')}</Label>
                            <Controller
                                control={form.control}
                                name="icon"
                                render={({ field }) => (
                                    <div className="flex items-start gap-3">
                                        {/* Clickable preview square */}
                                        <button
                                            type="button"
                                            title="Browse icons"
                                            onClick={() => setPickerOpen(true)}
                                            className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:border-primary hover:bg-muted"
                                        >
                                            <DynamicIcon name={field.value} color={fillColorLight || undefined} size="h-7 w-7" />
                                            {!field.value && (
                                                <span className="text-[9px] text-muted-foreground leading-none">Browse</span>
                                            )}
                                        </button>

                                        {/* Text input + clear */}
                                        <div className="flex flex-1 flex-col gap-1.5">
                                            <div className="relative">
                                                <Input
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="e.g. Home, ArrowRight, mdi:star"
                                                    className="pr-8"
                                                />
                                                {field.value && (
                                                    <button
                                                        type="button"
                                                        onClick={() => field.onChange('')}
                                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="w-full gap-2 text-xs"
                                                onClick={() => setPickerOpen(true)}
                                            >
                                                <LayoutGrid className="h-3.5 w-3.5" />
                                                Browse Icon Library
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            />
                        </div>

                        {/* Colors */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="icon_fill_color_light">{t('menus.icon_fill_color_light', 'Icon Color (Light)')}</Label>
                                <Controller
                                    control={form.control}
                                    name="icon_fill_color_light"
                                    render={({ field }) => (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                id="icon_fill_color_light"
                                                value={field.value || '#000000'}
                                                onChange={(e) => field.onChange(e.target.value)}
                                                className="h-9 w-9 cursor-pointer rounded border border-border bg-transparent p-0.5"
                                            />
                                            <Input
                                                value={field.value}
                                                onChange={(e) => field.onChange(e.target.value)}
                                                placeholder="#000000"
                                                className="flex-1 text-xs"
                                            />
                                        </div>
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="icon_fill_color_dark">{t('menus.icon_fill_color_dark', 'Icon Color (Dark)')}</Label>
                                <Controller
                                    control={form.control}
                                    name="icon_fill_color_dark"
                                    render={({ field }) => (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                id="icon_fill_color_dark"
                                                value={field.value || '#ffffff'}
                                                onChange={(e) => field.onChange(e.target.value)}
                                                className="h-9 w-9 cursor-pointer rounded border border-border bg-transparent p-0.5"
                                            />
                                            <Input
                                                value={field.value}
                                                onChange={(e) => field.onChange(e.target.value)}
                                                placeholder="#ffffff"
                                                className="flex-1 text-xs"
                                            />
                                        </div>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Sort Order */}
                        <div className="space-y-2">
                            <Label htmlFor="sort_order">{t('menus.sort_order', 'Sort Order')}</Label>
                            <Input
                                id="sort_order"
                                type="number"
                                min={0}
                                {...form.register('sort_order')}
                                placeholder="0"
                                className="w-32"
                            />
                            <p className="text-[11px] text-muted-foreground">Lower number = higher in list</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Active Status */}
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
                            
                            {/* Display Status */}
                            <div className="space-y-2">
                                <Label>{t('menus.display_status', 'Display Status')}</Label>
                                <div className="flex items-center gap-2">
                                    <Controller
                                        control={form.control}
                                        name="display_status"
                                        render={({ field }) => (
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        )}
                                    />
                                    <span className="text-sm text-muted-foreground">
                                        {form.watch('display_status') ? 'Visible' : 'Hidden'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeDialog}>
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button type="submit">
                                {t('common.save', 'Save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <DeleteDialog
                open={!!deleteId}
                onOpenChange={(open: boolean) => !open && setDeleteId(null)}
                title={t('menus.delete', 'Delete Menu')}
                description={t('menus.delete_confirm', 'Are you sure you want to delete this menu? This action cannot be undone.')}
                isDeleting={deleteMenu.isPending}
                onConfirm={() => {
                    if (deleteId) {
                        deleteMenu.mutate(deleteId, {
                            onSuccess: () => setDeleteId(null),
                            onError: () => setDeleteId(null),
                        });
                    }
                }}
            />

            <IconPickerDialog
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                onSelect={(value) => form.setValue('icon', value, { shouldValidate: true })}
            />
        </div>
    );
}
