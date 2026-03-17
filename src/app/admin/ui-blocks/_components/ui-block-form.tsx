'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Plus, Trash2, ChevronUp, ChevronDown, GripVertical,
    Layers, Code2, SlidersHorizontal, ImageIcon, X,
    Braces, Hash, Type, AlignLeft, Link, Palette,
    ToggleLeft, ListFilter, FileCode2, Sparkles,
} from 'lucide-react';
import { useCreateUiBlock, useUpdateUiBlock, UiBlock, UiBlockField } from '@/hooks/use-ui-blocks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { MediaPickerModal } from '@/components/common/media-picker-modal';
import { resolveMediaUrl } from '@/lib/utils';
import dynamic from 'next/dynamic';

const HtmlEditor = dynamic(() => import('@/components/common/html-editor').then(m => m.HtmlEditor), { ssr: false });

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_OPTIONS = [
    { value: 'bg-violet-500', hex: '#8b5cf6', label: 'Violet' },
    { value: 'bg-blue-500',   hex: '#3b82f6', label: 'Blue' },
    { value: 'bg-sky-500',    hex: '#0ea5e9', label: 'Sky' },
    { value: 'bg-cyan-500',   hex: '#06b6d4', label: 'Cyan' },
    { value: 'bg-teal-500',   hex: '#14b8a6', label: 'Teal' },
    { value: 'bg-green-500',  hex: '#22c55e', label: 'Green' },
    { value: 'bg-yellow-500', hex: '#eab308', label: 'Yellow' },
    { value: 'bg-orange-500', hex: '#f97316', label: 'Orange' },
    { value: 'bg-red-500',    hex: '#ef4444', label: 'Red' },
    { value: 'bg-pink-500',   hex: '#ec4899', label: 'Pink' },
    { value: 'bg-slate-500',  hex: '#64748b', label: 'Slate' },
    { value: 'bg-zinc-700',   hex: '#3f3f46', label: 'Dark' },
];

const FIELD_TYPES = [
    { value: 'text',     label: 'Text',            icon: Type },
    { value: 'textarea', label: 'Textarea',         icon: AlignLeft },
    { value: 'richtext', label: 'Rich Text',        icon: FileCode2 },
    { value: 'number',   label: 'Number',           icon: Hash },
    { value: 'image',    label: 'Image URL',        icon: ImageIcon },
    { value: 'url',      label: 'URL / Link',       icon: Link },
    { value: 'color',    label: 'Color',            icon: Palette },
    { value: 'select',   label: 'Select dropdown',  icon: ListFilter },
];

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
    label:         z.string().trim().min(1, 'Block name is required'),
    type:          z.string().trim().min(1, 'Type slug is required').regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, underscores'),
    description:   z.string().optional(),
    color:         z.string().default('bg-slate-500'),
    preview_image: z.string().optional(),
    html_template: z.string().optional(),
    is_active:     z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

function emptyField(): UiBlockField {
    return { key: '', label: '', type: 'text', placeholder: '', hint: '', required: false };
}

// ─── Field Row ────────────────────────────────────────────────────────────────

function FieldRow({ field, index, total, onChange, onRemove, onMoveUp, onMoveDown }: {
    field: UiBlockField; index: number; total: number;
    onChange: (f: UiBlockField) => void; onRemove: () => void;
    onMoveUp: () => void; onMoveDown: () => void;
}) {
    const [open, setOpen] = useState(index === 0);
    const set = (patch: Partial<UiBlockField>) => onChange({ ...field, ...patch });
    const TypeIcon = FIELD_TYPES.find(t => t.value === field.type)?.icon || Type;

    const addOption    = () => set({ options: [...(field.options || []), { value: '', label: '' }] });
    const updateOption = (i: number, k: 'value' | 'label', v: string) => {
        const opts = [...(field.options || [])]; opts[i] = { ...opts[i], [k]: v }; set({ options: opts });
    };
    const removeOption = (i: number) => {
        const opts = [...(field.options || [])]; opts.splice(i, 1); set({ options: opts });
    };

    return (
        <div className="rounded-xl border border-border/60 overflow-hidden bg-card transition-all">
            {/* Header */}
            <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-muted/30 transition-colors"
                onClick={() => setOpen(v => !v)}
            >
                <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <TypeIcon className="h-3.5 w-3.5 text-primary" />
                    </span>
                    <span className="text-sm font-medium truncate">
                        {field.label || <span className="text-muted-foreground/60 italic font-normal">Unnamed field</span>}
                    </span>
                    {field.key && (
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {field.key}
                        </span>
                    )}
                    {field.required && (
                        <span className="text-[10px] font-medium text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">req</span>
                    )}
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button type="button" disabled={index === 0} onClick={onMoveUp}
                        className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-25 transition-colors">
                        <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" disabled={index === total - 1} onClick={onMoveDown}
                        className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-25 transition-colors">
                        <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={onRemove}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Body */}
            {open && (
                <div className="border-t border-border/40 px-4 py-4 space-y-4 bg-muted/10">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Field Type</Label>
                            <Select value={field.type} onValueChange={v => set({ type: v as UiBlockField['type'] })}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FIELD_TYPES.map(ft => (
                                        <SelectItem key={ft.value} value={ft.value} className="text-sm">
                                            <div className="flex items-center gap-2">
                                                <ft.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                                {ft.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Key (machine name)</Label>
                            <Input className="h-9 font-mono text-sm" placeholder="e.g. button_text"
                                value={field.key}
                                onChange={e => set({ key: e.target.value.replace(/[^a-z0-9_]/g, '_') })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Label</Label>
                            <Input className="h-9 text-sm" placeholder="e.g. Button Text"
                                value={field.label} onChange={e => set({ label: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Placeholder</Label>
                            <Input className="h-9 text-sm" placeholder="e.g. Enter heading…"
                                value={field.placeholder || ''} onChange={e => set({ placeholder: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hint text</Label>
                            <Input className="h-9 text-sm" placeholder="Short helper shown to admin"
                                value={field.hint || ''} onChange={e => set({ hint: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Default value</Label>
                            <Input className="h-9 text-sm" placeholder="Optional default"
                                value={String(field.defaultValue ?? '')}
                                onChange={e => set({ defaultValue: e.target.value })} />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                        <Switch id={`req-${index}`} checked={!!field.required} onCheckedChange={v => set({ required: v })} />
                        <Label htmlFor={`req-${index}`} className="text-sm cursor-pointer">Required field</Label>
                    </div>

                    {field.type === 'select' && (
                        <div className="space-y-2 pt-1 border-t border-border/40">
                            <div className="flex items-center justify-between pt-2">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Options</Label>
                                <button type="button" onClick={addOption}
                                    className="flex items-center gap-1 text-xs text-primary hover:underline">
                                    <Plus className="h-3 w-3" /> Add option
                                </button>
                            </div>
                            {(field.options || []).map((opt, oi) => (
                                <div key={oi} className="flex items-center gap-2">
                                    <Input className="h-8 text-xs flex-1 font-mono" placeholder="value"
                                        value={opt.value} onChange={e => updateOption(oi, 'value', e.target.value)} />
                                    <Input className="h-8 text-xs flex-1" placeholder="Label"
                                        value={opt.label} onChange={e => updateOption(oi, 'label', e.target.value)} />
                                    <button type="button" onClick={() => removeOption(oi)}
                                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                            {!field.options?.length && (
                                <p className="text-xs text-muted-foreground/60 italic">No options yet.</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

interface Props {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    block?: UiBlock | null;
}

export function UiBlockForm({ open, onOpenChange, block }: Props) {
    const isEdit = !!block;
    const createBlock = useCreateUiBlock();
    const updateBlock = useUpdateUiBlock();
    const isPending = createBlock.isPending || updateBlock.isPending;

    const [fields, setFields] = useState<UiBlockField[]>([]);
    const [previewPickerOpen, setPreviewPickerOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('details');

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { label: '', type: '', description: '', color: 'bg-slate-500', preview_image: '', html_template: '', is_active: true },
    });

    useEffect(() => {
        if (block) {
            form.reset({
                label: block.label, type: block.type,
                description: block.description ?? '',
                color: block.color ?? 'bg-slate-500',
                preview_image: block.preview_image ?? '',
                html_template: block.html_template ?? '',
                is_active: Boolean(block.is_active),
            });
            setFields(Array.isArray(block.fields) ? block.fields : []);
        } else {
            form.reset({ label: '', type: '', description: '', color: 'bg-slate-500', preview_image: '', html_template: '', is_active: true });
            setFields([]);
        }
        setActiveTab('details');
    }, [block, form]);

    const labelVal = form.watch('label');
    useEffect(() => {
        if (!isEdit && labelVal) {
            form.setValue('type',
                labelVal.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
                { shouldDirty: false }
            );
        }
    }, [labelVal, isEdit, form]);

    const addField    = () => setFields(p => [...p, emptyField()]);
    const updateField = (i: number, f: UiBlockField) => setFields(p => p.map((x, idx) => idx === i ? f : x));
    const removeField = (i: number) => setFields(p => p.filter((_, idx) => idx !== i));
    const moveField   = (i: number, dir: -1 | 1) => {
        setFields(prev => {
            const arr = [...prev]; const t = i + dir;
            if (t < 0 || t >= arr.length) return arr;
            [arr[i], arr[t]] = [arr[t], arr[i]]; return arr;
        });
    };

    const onSubmit = form.handleSubmit(data => {
        const payload = { ...data, is_active: data.is_active ? 1 : 0, fields };
        if (isEdit) {
            updateBlock.mutate({ id: block!.id, data: payload }, { onSuccess: () => onOpenChange(false) });
        } else {
            createBlock.mutate(payload as any, { onSuccess: () => onOpenChange(false) });
        }
    });

    const selectedColor = form.watch('color');
    const previewVal    = form.watch('preview_image');
    const resolvedImg   = previewVal ? resolveMediaUrl(previewVal) : null;
    const colorObj      = COLOR_OPTIONS.find(c => c.value === selectedColor);

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0">

                    {/* ── Header ── */}
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0', selectedColor || 'bg-slate-500')}>
                                <Layers className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-semibold">
                                    {isEdit ? `Edit — ${block?.label}` : 'New Block Type'}
                                </DialogTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {isEdit ? 'Update this reusable block definition' : 'Define a new reusable content block for the page builder'}
                                </p>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                                <Switch
                                    id="is_active"
                                    checked={form.watch('is_active')}
                                    onCheckedChange={v => form.setValue('is_active', v)}
                                />
                                <Label htmlFor="is_active" className="text-sm cursor-pointer">Active</Label>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* ── Tabs ── */}
                    <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
                            <TabsList className="flex-shrink-0 px-6 pt-3 pb-0 h-auto bg-transparent border-b border-border/50 rounded-none justify-start gap-1">
                                <TabsTrigger value="details"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 text-sm font-medium gap-2">
                                    <SlidersHorizontal className="h-3.5 w-3.5" /> Details
                                </TabsTrigger>
                                <TabsTrigger value="template"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 text-sm font-medium gap-2">
                                    <Code2 className="h-3.5 w-3.5" /> HTML Template
                                </TabsTrigger>
                                <TabsTrigger value="fields"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3 text-sm font-medium gap-2">
                                    <Braces className="h-3.5 w-3.5" /> Fields
                                    {fields.length > 0 && (
                                        <span className="ml-1 bg-primary/10 text-primary text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                                            {fields.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                            </TabsList>

                            {/* ── Details Tab ── */}
                            <TabsContent value="details" className="flex-1 overflow-y-auto m-0 px-6 py-5 space-y-6">

                                {/* Name + Slug */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Block Name *</Label>
                                        <Input placeholder="e.g. Hero Banner" className="h-10" {...form.register('label')} />
                                        {form.formState.errors.label && (
                                            <p className="text-xs text-destructive">{form.formState.errors.label.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Type Slug *</Label>
                                        <Input
                                            placeholder="e.g. hero_banner"
                                            {...form.register('type')}
                                            readOnly={isEdit}
                                            title={isEdit ? 'Cannot change after creation' : ''}
                                            className={cn('h-10 font-mono text-sm', isEdit && 'bg-muted text-muted-foreground cursor-not-allowed')}
                                        />
                                        {form.formState.errors.type && (
                                            <p className="text-xs text-destructive">{form.formState.errors.type.message}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Description</Label>
                                    <Textarea rows={2} placeholder="What does this block do? Shown in the block picker." {...form.register('description')} />
                                </div>

                                {/* Color + Preview side by side */}
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Color */}
                                    <div className="space-y-3">
                                        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Accent Color</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {COLOR_OPTIONS.map(c => (
                                                <button key={c.value} type="button" title={c.label}
                                                    onClick={() => form.setValue('color', c.value)}
                                                    style={{ backgroundColor: c.hex }}
                                                    className={cn(
                                                        'w-7 h-7 rounded-lg transition-all duration-150',
                                                        selectedColor === c.value
                                                            ? 'ring-2 ring-offset-2 ring-foreground scale-110 shadow-md'
                                                            : 'hover:scale-110 opacity-70 hover:opacity-100'
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        {colorObj && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                <span className={cn('w-3 h-3 rounded-sm inline-block', selectedColor)} />
                                                {colorObj.label} selected
                                            </p>
                                        )}
                                    </div>

                                    {/* Preview image */}
                                    <div className="space-y-3">
                                        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                            Preview Screenshot
                                        </Label>
                                        <div
                                            onClick={() => setPreviewPickerOpen(true)}
                                            className="relative rounded-xl overflow-hidden border-2 border-dashed border-border/60 bg-muted/20 cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-all group"
                                            style={{ aspectRatio: '16/9' }}
                                        >
                                            {resolvedImg ? (
                                                <>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={resolvedImg} alt="Preview" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-white text-xs font-medium">Change image</span>
                                                    </div>
                                                    <button type="button"
                                                        onClick={e => { e.stopPropagation(); form.setValue('preview_image', ''); }}
                                                        className="absolute top-2 right-2 bg-black/60 hover:bg-black rounded-full p-1 z-10">
                                                        <X className="h-3 w-3 text-white" />
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                                    <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                                                    <p className="text-xs text-muted-foreground/60">Click to upload screenshot</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ── Template Tab ── */}
                            <TabsContent value="template" className="flex-1 overflow-y-auto m-0 px-6 py-5 space-y-4">
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                                    <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-xs text-muted-foreground leading-relaxed">
                                        Write the HTML output for this block. Use{' '}
                                        <code className="bg-muted text-foreground px-1.5 py-0.5 rounded font-mono text-[11px]">{'{{field_key}}'}</code>{' '}
                                        placeholders — they are replaced with configured field values when the page renders on the frontend.
                                    </div>
                                </div>

                                {/* Placeholder chips from defined fields */}
                                {fields.filter(f => f.key).length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Available placeholders</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {fields.filter(f => f.key).map(f => (
                                                <button key={f.key} type="button"
                                                    onClick={() => {
                                                        const tpl = form.getValues('html_template') || '';
                                                        form.setValue('html_template', tpl + `{{${f.key}}}`);
                                                    }}
                                                    className="group flex items-center gap-1 text-[11px] bg-muted hover:bg-primary hover:text-primary-foreground border border-border/60 rounded-lg px-2 py-1 font-mono transition-all">
                                                    <Braces className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                                                    {`{{${f.key}}}`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <HtmlEditor
                                    value={form.watch('html_template') || ''}
                                    onChange={v => form.setValue('html_template', v)}
                                    label=""
                                    placeholder={'<section class="hero-banner">\n  <h1>{{title}}</h1>\n  <p>{{subtitle}}</p>\n  <a href="{{button_url}}" class="btn">{{button_text}}</a>\n</section>'}
                                    rows={16}
                                />
                            </TabsContent>

                            {/* ── Fields Tab ── */}
                            <TabsContent value="fields" className="flex-1 overflow-y-auto m-0 px-6 py-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold">Field Definitions</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Define the inputs admins fill in when placing this block on a page.
                                        </p>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={addField} className="gap-1.5">
                                        <Plus className="h-3.5 w-3.5" /> Add Field
                                    </Button>
                                </div>

                                {fields.length === 0 ? (
                                    <div className="border-2 border-dashed border-border/50 rounded-2xl py-16 flex flex-col items-center gap-3 text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center">
                                            <SlidersHorizontal className="h-5 w-5 text-muted-foreground/50" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">No fields defined</p>
                                            <p className="text-xs text-muted-foreground/60 mt-1">Click <strong>Add Field</strong> to start building the config form.</p>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={addField}>
                                            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add First Field
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {fields.map((f, i) => (
                                            <FieldRow key={i} field={f} index={i} total={fields.length}
                                                onChange={updated => updateField(i, updated)}
                                                onRemove={() => removeField(i)}
                                                onMoveUp={() => moveField(i, -1)}
                                                onMoveDown={() => moveField(i, 1)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>

                        {/* ── Footer ── */}
                        <div className="flex-shrink-0 border-t border-border/50 px-6 py-4 flex items-center justify-between bg-muted/20">
                            <p className="text-xs text-muted-foreground">
                                {fields.length} field{fields.length !== 1 ? 's' : ''} defined
                            </p>
                            <div className="flex gap-2">
                                <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" size="sm" disabled={isPending} className="min-w-28">
                                    {isPending ? 'Saving…' : isEdit ? 'Update Block' : 'Create Block'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <MediaPickerModal
                open={previewPickerOpen}
                onClose={() => setPreviewPickerOpen(false)}
                onSelect={url => { form.setValue('preview_image', url); setPreviewPickerOpen(false); }}
            />
        </>
    );
}
