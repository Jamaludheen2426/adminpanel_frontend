'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ColumnDef } from '@tanstack/react-table';
import {
    Plus, Pencil, Trash2, BellRing, CalendarIcon,
} from 'lucide-react';
import { RichTextEditor } from '@/components/common/rich-text-editor';
import {
    useAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement,
} from '@/hooks/use-announcements';
import { useTranslation } from '@/hooks/use-translation';
import { isApprovalRequired } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageLoader } from '@/components/common/page-loader';
import type { Announcement } from '@/hooks/use-announcements';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    content: z.string().min(1, 'Content is required'),
    start_date: z.date().nullable().optional(),
    end_date: z.date().nullable().optional(),
    has_action: z.boolean().default(false),
    action_label: z.string().optional(),
    action_url: z.string().optional(),
    open_in_new_tab: z.boolean().default(false),
    bg_color: z.string().default('#ffffff'),
    text_color: z.string().default('#000000'),
    is_active: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

function toDate(dt: string | null | undefined): Date | null {
    if (!dt) return null;
    const d = new Date(dt);
    return isNaN(d.getTime()) ? null : d;
}

function fmtDate(dt: string | null | undefined) {
    if (!dt) return '—';
    const d = new Date(dt);
    return isNaN(d.getTime()) ? '—' : format(d, 'dd MMM yyyy');
}

// ─── DateTimePicker — Shadcn Calendar + AM/PM ─────────────────────────────────

const selectCls = 'rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer';

function DateTimePicker({ value, onChange, placeholder }: {
    value: Date | null | undefined;
    onChange: (d: Date | null) => void;
    placeholder: string;
}) {
    const [open, setOpen] = useState(false);
    const hour24 = value ? value.getHours() : 0;
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 < 12 ? 'AM' : 'PM';
    const minute = value ? value.getMinutes() : 0;

    const setTime = (h12: number, m: number, period: string) => {
        const base = value ? new Date(value) : new Date();
        let h24 = h12 % 12;
        if (period === 'PM') h24 += 12;
        base.setHours(h24, m, 0, 0);
        onChange(base);
    };

    const handleDaySelect = (day: Date | undefined) => {
        if (!day) { onChange(null); return; }
        const next = new Date(day);
        next.setHours(hour24, minute, 0, 0);
        onChange(next);
    };

    const display = value ? format(value, 'dd MMM yyyy  hh:mm aa') : null;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button type="button" variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {display ?? <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={value ?? undefined} onSelect={handleDaySelect} initialFocus />
                <div className="border-t px-3 py-2.5 flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground shrink-0">Time</span>
                    <select value={hour12} onChange={(e) => setTime(Number(e.target.value), minute, ampm)} className={selectCls}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                            <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                        ))}
                    </select>
                    <span className="text-muted-foreground font-bold text-sm">:</span>
                    <select value={minute} onChange={(e) => setTime(hour12, Number(e.target.value), ampm)} className={selectCls}>
                        {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                            <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                        ))}
                    </select>
                    <select value={ampm} onChange={(e) => setTime(hour12, minute, e.target.value)} className={selectCls}>
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                    </select>
                    <Button type="button" variant="ghost" size="sm"
                        className="text-xs text-destructive hover:text-destructive shrink-0 h-7 px-2"
                        onClick={() => { onChange(null); setOpen(false); }}>
                        Clear
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}


// ─── Main Component ───────────────────────────────────────────────────────────

export function AnnouncementsContent() {
    const { t } = useTranslation();

    const { data: announcements = [], isLoading } = useAnnouncements();
    const createAnnouncement = useCreateAnnouncement();
    const updateAnnouncement = useUpdateAnnouncement();
    const deleteAnnouncement = useDeleteAnnouncement();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<Announcement | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ label: string; onConfirm: () => void } | null>(null);

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { name: '', content: '', has_action: false, open_in_new_tab: false, bg_color: '#ffffff', text_color: '#000000', is_active: true },
    });

    const hasAction = form.watch('has_action');

    // ── dialog helpers ────────────────────────────────────────────────────────
    const closeDialog = () => { setDialogOpen(false); setEditItem(null); form.reset(); };

    const openCreate = () => {
        setEditItem(null);
        form.reset({ name: '', content: '', start_date: null, end_date: null, has_action: false, open_in_new_tab: false, bg_color: '#ffffff', text_color: '#000000', is_active: true });
        setDialogOpen(true);
    };

    const openEdit = (item: Announcement) => {
        setEditItem(item);
        form.reset({
            name: item.name,
            content: item.content,
            start_date: toDate(item.start_date),
            end_date: toDate(item.end_date),
            has_action: Boolean(item.has_action),
            action_label: item.action_label ?? '',
            action_url: item.action_url ?? '',
            open_in_new_tab: Boolean(item.open_in_new_tab),
            bg_color: (item.bg_color as string) ?? '#ffffff',
            text_color: (item.text_color as string) ?? '#000000',
            is_active: Boolean(item.is_active),
        });
        setDialogOpen(true);
    };

    const onSubmit = (data: FormData) => {
        const payload = {
            ...data,
            start_date: data.start_date ? data.start_date.toISOString() : null,
            end_date: data.end_date ? data.end_date.toISOString() : null,
            action_label: data.action_label || null,
            action_url: data.action_url || null,
        };
        if (editItem) {
            updateAnnouncement.mutate({ id: editItem.id, data: payload }, {
                onSuccess: closeDialog,
                onError: (e) => { if (isApprovalRequired(e)) closeDialog(); },
            });
        } else {
            createAnnouncement.mutate(payload, {
                onSuccess: closeDialog,
                onError: (e) => { if (isApprovalRequired(e)) closeDialog(); },
            });
        }
    };

    const isPending = createAnnouncement.isPending || updateAnnouncement.isPending;

    // ── TanStack column definitions ───────────────────────────────────────────
    const columns = useMemo<ColumnDef<Announcement>[]>(() => [
        {
            accessorKey: 'name',
            header: t('announcements.name', 'Name'),
            enableSorting: true,
            cell: ({ row }) => (
                <span className="font-medium max-w-xs truncate block">{row.original.name}</span>
            ),
        },
        {
            accessorKey: 'start_date',
            header: t('announcements.start_date', 'Start Date'),
            enableSorting: true,
            cell: ({ row }) => (
                <span className="flex items-center gap-1 text-muted-foreground text-sm">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {fmtDate(row.original.start_date)}
                </span>
            ),
        },
        {
            accessorKey: 'end_date',
            header: t('announcements.end_date', 'End Date'),
            enableSorting: true,
            cell: ({ row }) => (
                <span className="flex items-center gap-1 text-muted-foreground text-sm">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {fmtDate(row.original.end_date)}
                </span>
            ),
        },
        {
            accessorKey: 'has_action',
            header: t('announcements.has_action', 'Has Action'),
            enableSorting: false,
            cell: ({ row }) => Boolean(row.original.has_action)
                ? <Badge variant="outline">{row.original.action_label || t('announcements.cta', 'CTA')}</Badge>
                : <span className="text-muted-foreground">—</span>,
        },
        {
            accessorKey: 'is_active',
            header: t('locations.is_active', 'Active'),
            enableSorting: false,
            cell: ({ row }) => (
                <Switch
                    checked={Boolean(row.original.is_active)}
                    onCheckedChange={(checked) => updateAnnouncement.mutate({ id: row.original.id, data: { is_active: checked } })}
                    disabled={updateAnnouncement.isPending}
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
                    <Button variant="destructive-outline" size="icon" disabled={deleteAnnouncement.isPending}
                        onClick={() => setDeleteConfirm({
                            label: `${t('common.delete', 'Delete')} "${row.original.name}"?`,
                            onConfirm: () => deleteAnnouncement.mutate(row.original.id),
                        })}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [updateAnnouncement.isPending, deleteAnnouncement.isPending]);

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <CardTitle>{t('announcements.title', 'Announcements')}</CardTitle>
                            <CardDescription>{t('announcements.desc', 'Manage site-wide announcements shown to users')}</CardDescription>
                        </div>
                        <Button size="sm" onClick={openCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('announcements.add', 'Add Announcement')}
                        </Button>
                    </div>
                </CardHeader>

                <CardContent>
                    <PageLoader open={isLoading} />
                    {!isLoading && (
                        <DataTable
                            columns={columns}
                            data={announcements}
                            searchKey="name"
                        />
                    )}
                </CardContent>
            </Card>

            {/* ── Add / Edit Dialog ── */}
            <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editItem ? t('announcements.edit_title', 'Edit Announcement') : t('announcements.create_title', 'Create Announcement')}
                        </DialogTitle>
                        <DialogDescription>
                            {editItem
                                ? t('announcements.edit_desc', 'Update announcement details.')
                                : t('announcements.create_desc', 'Fill in details to create a new announcement.')}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Name — full width */}
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="ann-name">{t('announcements.name', 'Name')} *</Label>
                            <Input id="ann-name" placeholder={t('announcements.name_placeholder', 'Announcement 1')} {...form.register('name')} />
                            <p className="text-xs text-muted-foreground">{t('announcements.name_hint', 'Name for internal reference only, not visible to users')}</p>
                            {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
                        </div>

                        {/* Content — full width rich editor */}
                        <div className="md:col-span-2 space-y-2">
                            <Label>{t('announcements.content', 'Content')} *</Label>
                            <Controller control={form.control} name="content" render={({ field }) => (
                                <RichTextEditor
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Announcement content..."
                                />
                            )} />
                            <p className="text-xs text-muted-foreground">{t('announcements.content_hint', 'The message displayed to users. Supports HTML formatting.')}</p>
                            {form.formState.errors.content && <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>}
                        </div>

                        {/* Start date — col 1 */}
                        <div className="space-y-2">
                            <Label>{t('announcements.start_date', 'Start date')}</Label>
                            <Controller control={form.control} name="start_date" render={({ field }) => (
                                <DateTimePicker value={field.value} onChange={field.onChange}
                                    placeholder={t('announcements.start_date_placeholder', 'Pick a start date & time')} />
                            )} />
                            <p className="text-xs text-muted-foreground">{t('announcements.start_date_hint', 'Leave empty to start immediately.')}</p>
                        </div>

                        {/* End date — col 2 */}
                        <div className="space-y-2">
                            <Label>{t('announcements.end_date', 'End date')}</Label>
                            <Controller control={form.control} name="end_date" render={({ field }) => (
                                <DateTimePicker value={field.value} onChange={field.onChange}
                                    placeholder={t('announcements.end_date_placeholder', 'Pick an end date & time')} />
                            )} />
                            <p className="text-xs text-muted-foreground">{t('announcements.end_date_hint', 'Leave empty for no expiration.')}</p>
                        </div>

                        {/* Colors — col 1 & 2 */}
                        <div className="space-y-2">
                            <Label htmlFor="bg-color">{t('announcements.bg_color', 'Background Color')}</Label>
                            <div className="flex gap-2">
                                <Input id="bg-color" type="color" className="p-1 h-10 w-20" {...form.register('bg_color')} />
                                <Input type="text" value={form.watch('bg_color')} onChange={(e) => form.setValue('bg_color', e.target.value)} className="flex-1" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="text-color">{t('announcements.text_color', 'Text Color')}</Label>
                            <div className="flex gap-2">
                                <Input id="text-color" type="color" className="p-1 h-10 w-20" {...form.register('text_color')} />
                                <Input type="text" value={form.watch('text_color')} onChange={(e) => form.setValue('text_color', e.target.value)} className="flex-1" />
                            </div>
                        </div>

                        {/* Has action — full width */}
                        <div className="md:col-span-2 flex items-center justify-between border rounded-lg p-3">
                            <div>
                                <Label className="font-medium">{t('announcements.has_action', 'Has action')}</Label>
                                <p className="text-xs text-muted-foreground mt-0.5">{t('announcements.has_action_hint', 'Add a call-to-action button to your announcement')}</p>
                            </div>
                            <Controller control={form.control} name="has_action" render={({ field }) => (
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            )} />
                        </div>

                        {/* CTA fields — col 1 & col 2 when has_action */}
                        {hasAction && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="ann-label">{t('announcements.action_label', 'Action label')}</Label>
                                    <Input id="ann-label" placeholder={t('announcements.action_label_placeholder', 'e.g. Learn More, Shop Now')} {...form.register('action_label')} />
                                    <p className="text-xs text-muted-foreground">{t('announcements.action_label_hint', 'Text displayed on the action button')}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ann-url">{t('announcements.action_url', 'Action URL')}</Label>
                                    <Input id="ann-url" placeholder="https://example.com/page" {...form.register('action_url')} />
                                    <p className="text-xs text-muted-foreground">{t('announcements.action_url_hint', 'URL users are redirected to')}</p>
                                </div>
                                <div className="md:col-span-2 flex items-center justify-between border rounded-lg p-3">
                                    <div>
                                        <Label className="font-medium">{t('announcements.open_in_new_tab', 'Open in new tab')}</Label>
                                        <p className="text-xs text-muted-foreground mt-0.5">{t('announcements.open_in_new_tab_hint', 'Open the action link in a new browser tab')}</p>
                                    </div>
                                    <Controller control={form.control} name="open_in_new_tab" render={({ field }) => (
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    )} />
                                </div>
                            </>
                        )}

                        {/* Is active — full width */}
                        <div className="md:col-span-2 flex items-center justify-between border rounded-lg p-3">
                            <Label htmlFor="ann-active">{t('announcements.is_active', 'Is active')}</Label>
                            <Controller control={form.control} name="is_active" render={({ field }) => (
                                <Switch id="ann-active" checked={field.value} onCheckedChange={field.onChange} />
                            )} />
                        </div>

                        {/* Submit — full width */}
                        <Button type="submit" className="w-full md:col-span-2" disabled={isPending}>
                            {isPending
                                ? t('common.saving', 'Saving...')
                                : editItem
                                    ? t('announcements.update', 'Update Announcement')
                                    : t('announcements.create_title', 'Create Announcement')}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirm ── */}
            <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('common.are_you_sure', 'Are you sure?')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteConfirm?.label} {t('common.cannot_undo', 'This action cannot be undone.')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { deleteConfirm?.onConfirm(); setDeleteConfirm(null); }}>
                            {t('common.delete', 'Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
