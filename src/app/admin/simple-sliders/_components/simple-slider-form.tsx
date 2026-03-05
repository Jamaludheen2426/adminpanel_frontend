'use client';

import { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Save, LogOut, FileText, Image as ImageIcon, Plus } from 'lucide-react';
import { isApprovalRequired } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CommonTable, type CommonColumn } from '@/components/common/common-table';
import { SlideItemModal } from './slide-item-modal';
import { resolveMediaUrl } from '@/lib/utils';
import {
    useSimpleSlider,
    useCreateSimpleSlider,
    useUpdateSimpleSlider,
    SlideItem
} from '@/hooks/use-simple-sliders';
import { PageLoader } from '@/components/common/page-loader';

const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    key: z.string().min(1, 'Key is required'),
    description: z.string().optional().nullable(),
    is_active: z.coerce.number().default(1), // 0=inactive/draft, 1=active/published, 2=pending
    slider_items: z.array(z.any()).default([]),
});

type FormData = z.infer<typeof schema>;

export function SimpleSliderForm({ id }: { id: string }) {
    const router = useRouter();
    const isEdit = id !== 'new';

    const { data: slider, isLoading } = useSimpleSlider(id);
    const createSlider = useCreateSimpleSlider();
    const updateSlider = useUpdateSimpleSlider();
    const isSaving = createSlider.isPending || updateSlider.isPending;

    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<SlideItem | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        values: slider ? {
            name: slider.name,
            key: slider.key,
            description: slider.description ?? '',
            is_active: slider.is_active,
            slider_items: slider.slider_items || [],
        } : {
            name: '', key: '', description: '', is_active: 1, slider_items: [],
        },
    });

    const { fields: sliderItems, append, update, remove } = useFieldArray({
        control: form.control,
        name: 'slider_items',
    });

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        form.setValue('name', e.target.value);
        if (!isEdit) {
            form.setValue('key',
                e.target.value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
                { shouldValidate: true }
            );
        }
    };

    const submit = (data: FormData, exit: boolean) => {
        const payload = {
            ...data,
            description: data.description || undefined,
        };
        const cb = {
            onSuccess: () => { if (exit) router.push('/admin/simple-sliders'); },
            onError: (e: unknown) => { if (isApprovalRequired(e) && exit) router.push('/admin/simple-sliders'); },
        };
        if (isEdit) { updateSlider.mutate({ id: Number(id), payload }, cb); }
        else { createSlider.mutate(payload, cb); }
    };

    const onSave = form.handleSubmit((d) => submit(d, false));
    const onSaveExit = form.handleSubmit((d) => submit(d, true));

    const handleSaveSlideItem = (item: SlideItem) => {
        if (editingIndex !== null) {
            update(editingIndex, item);
        } else {
            append(item);
        }
    };

    const columns: CommonColumn<any>[] = [
        {
            key: 'image',
            header: 'Image',
            render: (row) => {
                const url = resolveMediaUrl(row.image);
                return (
                    <div className="h-12 w-20 rounded overflow-hidden bg-muted border relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="object-cover w-full h-full" />
                    </div>
                );
            }
        },
        { key: 'title', header: 'Title' },
        { key: 'sort_order', header: 'Order' },
        {
            key: 'is_active',
            header: 'Status',
            render: (row) => {
                const val = row.is_active;
                if (val === 1) return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-green-100 text-green-800">Active</span>;
                return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">Draft</span>;
            }
        },
    ];

    const mappedItems = sliderItems.map((item, idx) => ({
        ...item,
        id: idx, // CommonTable expects a numeric id
        is_active: (item as any).is_active === 1,
        created_at: new Date().toISOString(),
    }));

    // Determine if current slider is pending (is_active === 2)
    const isPending = slider?.is_active === 2;

    if (isEdit && isLoading) return <PageLoader open={true} />;

    return (
        <div className="space-y-5 pb-10">
            {/* Top Actions */}
            <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={onSave}>
                    <Save className="h-3.5 w-3.5 mr-1.5" />{isSaving ? 'Saving…' : 'Save'}
                </Button>
                <Button type="button" size="sm" disabled={isSaving} onClick={onSaveExit}>
                    <LogOut className="h-3.5 w-3.5 mr-1.5" />Save & Exit
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
                {/* ── Left column ──────────────────────────────────────── */}
                <div className="space-y-5">
                    <Card>
                        <CardContent className="pt-5 space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <FileText className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-sm">Slider Info</span>
                            </div>
                            <Separator />
                            <div className="grid gap-4">
                                <div className="space-y-1.5">
                                    <Label>Name <span className="text-destructive">*</span></Label>
                                    <Input
                                        placeholder="e.g. Home Slider"
                                        {...form.register('name')}
                                        onChange={handleNameChange}
                                    />
                                    {form.formState.errors.name && (
                                        <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Key <span className="text-destructive">*</span></Label>
                                    <Input placeholder="home-slider" {...form.register('key')} />
                                    {form.formState.errors.key && (
                                        <p className="text-xs text-destructive">{form.formState.errors.key.message}</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Description</Label>
                                    <Textarea rows={3} {...form.register('description')} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Slide Items Sub-Table */}
                    <Card>
                        <CardContent className="pt-5 space-y-4">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4 text-primary" />
                                    <span className="font-semibold text-sm">Slide Items</span>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => { setEditingItem(null); setEditingIndex(null); setModalOpen(true); }}
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1" /> Add new
                                </Button>
                            </div>
                            <Separator />
                            <div>
                                <CommonTable
                                    columns={columns}
                                    data={mappedItems as any}
                                    onEdit={(row) => {
                                        setEditingItem(sliderItems[row.id] as SlideItem);
                                        setEditingIndex(row.id);
                                        setModalOpen(true);
                                    }}
                                    onDelete={(row) => {
                                        remove(row.id);
                                    }}
                                    isLoading={false}
                                    showStatus={false}
                                    showCreated={false}
                                    emptyMessage="No slide items yet. Click Add new to create one."
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Right sidebar ─────────────────────────────────────── */}
                <div className="space-y-5">
                    {/* Publish */}
                    <Card>
                        <CardContent className="px-4 py-4 space-y-2.5">
                            <p className="font-semibold text-sm">Publish</p>
                            <Button type="button" className="w-full" disabled={isSaving} onClick={onSave}>
                                <Save className="h-4 w-4 mr-2" />{isSaving ? 'Saving…' : 'Save'}
                            </Button>
                            <Button type="button" variant="outline" className="w-full" disabled={isSaving} onClick={onSaveExit}>
                                <LogOut className="h-4 w-4 mr-2" />Save & Exit
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Status */}
                    <Card>
                        <CardContent className="px-4 py-3 space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Status
                            </Label>
                            {isPending ? (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
                                    <span className="font-semibold">Pending Approval</span>
                                    <span className="text-xs text-yellow-600">· awaiting super admin</span>
                                </div>
                            ) : (
                                <Controller control={form.control} name="is_active" render={({ field }) => (
                                    <Select
                                        value={String(field.value)}
                                        onValueChange={(v) => field.onChange(Number(v))}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Active</SelectItem>
                                            <SelectItem value="0">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )} />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {modalOpen && (
                <SlideItemModal
                    open={modalOpen}
                    onClose={() => { setModalOpen(false); setEditingItem(null); setEditingIndex(null); }}
                    initialData={editingItem}
                    onSave={handleSaveSlideItem}
                />
            )}
        </div>
    );
}
