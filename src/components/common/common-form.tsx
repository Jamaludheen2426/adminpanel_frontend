'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ImageCropper } from '@/components/common/image-cropper';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommonFormField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'switch' | 'image';
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    /** How many grid columns this field spans (matches section columns). Default: 1 */
    colSpan?: 2 | 3;
    // select
    options?: { value: string; label: string }[];
    // textarea
    rows?: number;
    // image
    imageTitle?: string;
    imageDescription?: string;
    targetWidth?: number;
    targetHeight?: number;
    rounded?: boolean;
    imageFolder?: string;
}

export interface CommonFormSection {
    title: string;
    icon?: React.ElementType;
    fields: CommonFormField[];
    /** Number of grid columns in this section. Default: 2 */
    columns?: 2 | 3;
}

export interface CommonFormProps {
    /** Zod schema for validation */
    schema: any;
    sections: CommonFormSection[];
    defaultValues?: Record<string, any>;
    onSubmit: (data: any) => void;
    isPending?: boolean;
    isEdit?: boolean;
    title: string;
    description?: string;
    /** Navigate back to this path on Cancel / Back */
    backPath?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const gridClass: Record<number, string> = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
};

const colSpanClass: Record<number, string> = {
    2: 'md:col-span-2',
    3: 'md:col-span-3',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CommonForm({
    schema,
    sections,
    defaultValues,
    onSubmit,
    isPending = false,
    isEdit = false,
    title,
    description,
    backPath,
}: CommonFormProps) {
    const router = useRouter();
    const [showPassMap, setShowPassMap]       = useState<Record<string, boolean>>({});
    const [uploadingField, setUploadingField] = useState<string | null>(null);
    const [imageKeys, setImageKeys]           = useState<Record<string, number>>({});
    const [imageUrls, setImageUrls]           = useState<Record<string, string>>(() => {
        const urls: Record<string, string> = {};
        sections.forEach(s => s.fields.forEach(f => {
            if (f.type === 'image' && defaultValues?.[f.name]) {
                urls[f.name] = defaultValues[f.name];
            }
        }));
        return urls;
    });

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<any>({
        resolver: zodResolver(schema),
        defaultValues,
    });

    const handleImageUpload = async (file: File, fieldName: string, folder = 'uploads') => {
        setUploadingField(fieldName);
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', folder);
        try {
            const res = await apiClient.post('/media/upload', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const url = res.data.data?.file?.url || res.data.data?.url || res.data.url;
            if (url) setImageUrls(prev => ({ ...prev, [fieldName]: url }));
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to upload image');
        } finally {
            setUploadingField(null);
        }
    };

    const handleBack = () => backPath ? router.push(backPath) : router.back();

    const handleFormSubmit = (values: any) => {
        onSubmit({ ...values, ...imageUrls });
    };

    const errMsg = (name: string): string | undefined => {
        const e = errors[name];
        if (!e) return undefined;
        return typeof e.message === 'string' ? e.message : undefined;
    };

    const renderField = (field: CommonFormField, sectionColumns: number) => {
        const err = errMsg(field.name);
        const spanClass = field.colSpan ? colSpanClass[field.colSpan] ?? '' : '';

        if (field.type === 'image') {
            return (
                <div key={field.name} className={spanClass}>
                    <ImageCropper
                        key={imageKeys[field.name] ?? 0}
                        title={field.imageTitle || field.label}
                        description={field.imageDescription || `Upload ${field.label.toLowerCase()}`}
                        targetWidth={field.targetWidth ?? 200}
                        targetHeight={field.targetHeight ?? 200}
                        currentImage={imageUrls[field.name] || ''}
                        onImageCropped={(file) => handleImageUpload(file, field.name, field.imageFolder)}
                        onRemove={() => {
                            setImageUrls(prev => ({ ...prev, [field.name]: '' }));
                            setImageKeys(prev => ({ ...prev, [field.name]: (prev[field.name] ?? 0) + 1 }));
                        }}
                        rounded={field.rounded}
                    />
                    {uploadingField === field.name && (
                        <p className="text-xs text-muted-foreground mt-1">Uploading...</p>
                    )}
                </div>
            );
        }

        if (field.type === 'switch') {
            return (
                <div key={field.name} className={`flex items-center justify-between rounded-lg border p-3 ${spanClass}`}>
                    <Label className="cursor-pointer">
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Switch
                        checked={!!watch(field.name)}
                        onCheckedChange={(v) => setValue(field.name, v)}
                        disabled={field.disabled}
                    />
                </div>
            );
        }

        if (field.type === 'select') {
            return (
                <div key={field.name} className={`space-y-2 ${spanClass}`}>
                    <Label>
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Select value={watch(field.name) || ''} onValueChange={(v) => setValue(field.name, v)}>
                        <SelectTrigger>
                            <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options?.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {err && <p className="text-sm text-destructive">{err}</p>}
                </div>
            );
        }

        if (field.type === 'textarea') {
            return (
                <div key={field.name} className={`space-y-2 ${spanClass}`}>
                    <Label>
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <Textarea placeholder={field.placeholder} rows={field.rows ?? 3} {...register(field.name)} />
                    {err && <p className="text-sm text-destructive">{err}</p>}
                </div>
            );
        }

        if (field.type === 'password') {
            const show = showPassMap[field.name] ?? false;
            return (
                <div key={field.name} className={`space-y-2 ${spanClass}`}>
                    <Label>
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <div className="relative">
                        <Input
                            type={show ? 'text' : 'password'}
                            placeholder={field.placeholder || '••••••••'}
                            className="pr-10"
                            {...register(field.name)}
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            onClick={() => setShowPassMap(prev => ({ ...prev, [field.name]: !show }))}
                        >
                            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {err && <p className="text-sm text-destructive">{err}</p>}
                </div>
            );
        }

        // text | email | number
        return (
            <div key={field.name} className={`space-y-2 ${spanClass}`}>
                <Label>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Input
                    type={field.type}
                    placeholder={field.placeholder}
                    disabled={field.disabled}
                    {...register(field.name, field.type === 'number' ? { valueAsNumber: true } : {})}
                />
                {err && <p className="text-sm text-destructive">{err}</p>}
            </div>
        );
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">

            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <Button type="button" variant="ghost" size="sm" onClick={handleBack} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{title}</h1>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </div>
            </div>

            {/* Sections */}
            {sections.map((section) => {
                const Icon = section.icon;
                const cols = section.columns ?? 2;
                return (
                    <Card key={section.title}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                {Icon && <Icon className="h-4 w-4 text-primary" />}
                                {section.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className={`grid gap-4 ${gridClass[cols] ?? gridClass[2]}`}>
                            {section.fields.map(f => renderField(f, cols))}
                        </CardContent>
                    </Card>
                );
            })}

            {/* Submit */}
            <div className="flex gap-3">
                <Button type="submit" disabled={isPending}>
                    {isPending
                        ? (isEdit ? 'Saving...' : 'Creating...')
                        : (isEdit ? 'Save Changes' : 'Create')}
                </Button>
                <Button type="button" variant="outline" onClick={handleBack}>Cancel</Button>
            </div>
        </form>
    );
}
