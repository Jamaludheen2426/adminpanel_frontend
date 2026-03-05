'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/hooks/use-translation';
import { Ad } from '@/hooks/use-ads';
import { useAdBanners } from '@/hooks/use-ad-banners';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ImageCropper } from '@/components/common/image-cropper';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import Image from 'next/image';
import { X, CalendarIcon } from 'lucide-react';

const adSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    title: z.string().nullable(),
    subtitle: z.string().nullable(),
    button_label: z.string().nullable(),
    key: z.string().min(1, 'Key is required'),
    sort_order: z.coerce.number().default(0),
    ads_type: z.enum(['custom', 'google_adsense']),
    url: z.string().nullable(),
    target: z.string().default('_blank'),
    image: z.string().nullable(),
    tablet_image: z.string().nullable(),
    mobile_image: z.string().nullable(),
    google_adsense_slot_id: z.string().nullable(),
    location: z.string().min(1, 'Location is required'),
    banner_id: z.coerce.number().nullable().optional(),
    started_at: z.string().nullable().optional(),
    expired_at: z.string().nullable().optional(),
    is_scheduled: z.coerce.number().default(0),
    is_active: z.coerce.number().default(1),
});

type AdFormValues = z.infer<typeof adSchema>;

interface AdFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ad?: Ad | null;
    onSave: (data: AdFormValues) => void;
    isLoading?: boolean;
}

export function AdForm({ open, onOpenChange, ad, onSave, isLoading }: AdFormProps) {
    const { t } = useTranslation();
    const [uploadingField, setUploadingField] = useState<string | null>(null);
    const [cropperKeys, setCropperKeys] = useState({ image: 0, tablet_image: 0, mobile_image: 0 });
    const [neverExpires, setNeverExpires] = useState(false);

    const { data: bannersRes } = useAdBanners({ limit: 100 });
    const banners = bannersRes?.data || [];

    const form = useForm<AdFormValues>({
        resolver: zodResolver(adSchema),
        defaultValues: {
            name: '',
            title: '',
            subtitle: '',
            button_label: '',
            key: '',
            sort_order: 0,
            ads_type: 'custom',
            url: '',
            target: '_blank',
            image: '',
            tablet_image: '',
            mobile_image: '',
            google_adsense_slot_id: '',
            location: '',
            banner_id: undefined,
            started_at: '',
            expired_at: '',
            is_scheduled: 0,
            is_active: 1,
        },
    });

    const adsType = form.watch('ads_type');

    useEffect(() => {
        if (ad) {
            form.reset({
                ...ad,
                title: ad.title || '',
                subtitle: ad.subtitle || '',
                button_label: ad.button_label || '',
                url: ad.url || '',
                image: ad.image || '',
                tablet_image: ad.tablet_image || '',
                mobile_image: ad.mobile_image || '',
                google_adsense_slot_id: ad.google_adsense_slot_id || '',
                banner_id: ad.banner_id || undefined,
                started_at: ad.started_at ? new Date(ad.started_at).toISOString().split('T')[0] : '',
                expired_at: ad.expired_at ? new Date(ad.expired_at).toISOString().split('T')[0] : '', // Format Date to YYYY-MM-DD for simple input[type=date]
                is_scheduled: ad.is_scheduled ? 1 : 0,
                is_active: ad.is_active ? 1 : 0,
            });
            setNeverExpires(ad.is_scheduled === 0);
        } else {
            form.reset({
                name: '',
                title: '',
                subtitle: '',
                button_label: '',
                key: `AD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`, // Auto-generate random key
                sort_order: 0,
                ads_type: 'custom',
                url: '',
                target: '_blank',
                image: '',
                tablet_image: '',
                mobile_image: '',
                google_adsense_slot_id: '',
                location: '',
                started_at: '',
                expired_at: '',
                is_scheduled: 0,
                is_active: 1,
            });
            setNeverExpires(true);
        }
    }, [ad, form, open]);

    const onSubmit = (data: AdFormValues) => {
        if (!neverExpires && !data.started_at && !data.expired_at) {
            toast.error(t('ads.schedule_required_error', 'Please provide a Start Date or End Date when scheduling is enabled.'));
            form.setError('started_at', { type: 'manual', message: 'Required if End Date is empty.' });
            form.setError('expired_at', { type: 'manual', message: 'Required if Start Date is empty.' });
            return;
        }

        if (!neverExpires && data.started_at && data.expired_at) {
            if (new Date(data.started_at) > new Date(data.expired_at)) {
                toast.error(t('ads.schedule_order_error', 'End Date must be after Start Date.'));
                form.setError('expired_at', { type: 'manual', message: 'Must be after Start Date.' });
                return;
            }
        }

        // cleanup empty strings to null for DB consistency
        const cleanData = {
            ...data,
            title: data.title || null,
            subtitle: data.subtitle || null,
            button_label: data.button_label || null,
            url: data.url || null,
            image: data.image || null,
            tablet_image: data.tablet_image || null,
            mobile_image: data.mobile_image || null,
            google_adsense_slot_id: data.google_adsense_slot_id || null,
            banner_id: data.banner_id || null,
            is_scheduled: neverExpires ? 0 : 1,
            started_at: neverExpires ? null : (data.started_at || null),
            expired_at: neverExpires ? null : (data.expired_at || null),
        };
        onSave(cleanData);
    };

    const selectedBannerId = form.watch('banner_id');
    const selectedBanner = banners.find((b: any) => b.id === Number(selectedBannerId));

    const getTargetDims = (field: 'image' | 'tablet_image' | 'mobile_image') => {
        if (!selectedBanner) {
            return {
                w: field === 'image' ? 1200 : (field === 'tablet_image' ? 768 : 480),
                h: field === 'image' ? 400 : (field === 'tablet_image' ? 400 : 300)
            };
        }
        if (field === 'image') return { w: selectedBanner.desktop_width, h: selectedBanner.desktop_height };
        if (field === 'tablet_image') return { w: selectedBanner.tablet_width, h: selectedBanner.tablet_height };
        return { w: selectedBanner.mobile_width, h: selectedBanner.mobile_height };
    };

    const handleImageUpload = async (file: File, fieldName: 'image' | 'tablet_image' | 'mobile_image') => {
        setUploadingField(fieldName);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'ads');
        try {
            const response = await apiClient.post('/media/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const url = response.data.data?.file?.url || response.data.data?.url || response.data.url;
            if (url) {
                form.setValue(fieldName, url);
                toast.success(t('common.upload_success', 'Image uploaded successfully'));
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || t('common.upload_error', 'Failed to upload image'));
        } finally {
            setUploadingField(null);
        }
    };

    const renderImagePicker = (fieldName: 'image' | 'tablet_image' | 'mobile_image', label: string) => {
        return (
            <FormField
                control={form.control}
                name={fieldName}
                render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <div className="space-y-2">
                                <ImageCropper
                                    key={cropperKeys[fieldName]}
                                    title={label}
                                    description={fieldName === 'image' ? `e.g. ${getTargetDims('image').w}x${getTargetDims('image').h}` : 'Recommended smaller size'}
                                    targetWidth={getTargetDims(fieldName).w}
                                    targetHeight={getTargetDims(fieldName).h}
                                    currentImage={field.value || ''}
                                    onImageCropped={(file) => handleImageUpload(file, fieldName)}
                                    onRemove={() => {
                                        field.onChange('');
                                        setCropperKeys((prev: any) => ({ ...prev, [fieldName]: prev[fieldName] + 1 }));
                                    }}
                                    rounded={false}
                                />
                                {uploadingField === fieldName && (
                                    <p className="text-xs text-muted-foreground">{t('common.uploading', 'Uploading...')}</p>
                                )}
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{ad ? t('ads.edit_ad', 'Edit Ad') : t('ads.create_ad', 'Create New Ad')}</DialogTitle>
                    <DialogDescription>
                        {ad ? t('ads.edit_desc', 'Update ad details.') : t('ads.create_desc', 'Fill in the details to create a new ad.')}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form id="ad-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* --- General Info (Always Visible) --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('common.name', 'Name')} *</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t('ads.name_placeholder', 'e.g. Homepage Top Banner')} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="key"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('ads.key', 'Key')} *</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t('ads.key_placeholder', 'Unique identifier key')} {...field} />
                                        </FormControl>
                                        <FormDescription>Used by the theme to reference this ad dynamically.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('ads.location', 'Location')} *</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t('ads.location_placeholder', 'e.g. top_banner, sidebar')} {...field} />
                                        </FormControl>
                                        <FormDescription>Physical placement reference in the frontend.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="banner_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('nav.ad_banners', 'Ad Banner Template')}</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a banner template" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">None (Free-form image sizes)</SelectItem>
                                                {banners.map((b: any) => (
                                                    <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>Binds the image cropper to specific dimensions.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="ads_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('ads.type', 'Ads Type')}</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="custom">{t('ads.type_custom', 'Custom Banner Image Ad')}</SelectItem>
                                                <SelectItem value="google_adsense">{t('ads.type_adsense', 'Google AdSense')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="bg-muted/30 p-4 rounded-lg space-y-4">
                            {/* --- Conditional Fields based on Ads Type --- */}
                            {adsType === 'google_adsense' ? (
                                <FormField
                                    control={form.control}
                                    name="google_adsense_slot_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('ads.adsense_slot', 'Google AdSense Slot ID')}</FormLabel>
                                            <FormControl>
                                                {/* @ts-ignore zod typing requires string but null comes from db sometimes */}
                                                <Input placeholder="e.g. 1234567890" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormDescription>The data-ad-slot identifier provided by Google AdSense.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="url"
                                            render={({ field }) => (
                                                <FormItem className="col-span-1 md:col-span-2">
                                                    <FormLabel>{t('ads.url', 'Target URL')}</FormLabel>
                                                    <FormControl>
                                                        {/* @ts-ignore */}
                                                        <Input placeholder="https://..." {...field} value={field.value || ''} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="title"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('common.title', 'Title')}</FormLabel>
                                                    <FormControl>
                                                        {/* @ts-ignore */}
                                                        <Textarea placeholder="Headline text overlay" className="min-h-[80px]" {...field} value={field.value || ''} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="subtitle"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('ads.subtitle', 'Subtitle')}</FormLabel>
                                                    <FormControl>
                                                        {/* @ts-ignore */}
                                                        <Textarea placeholder="Sub-headline text overlay" className="min-h-[80px]" {...field} value={field.value || ''} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="button_label"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('ads.button_label', 'Button Label')}</FormLabel>
                                                    <FormControl>
                                                        {/* @ts-ignore */}
                                                        <Input placeholder="e.g. Shop Now" {...field} value={field.value || ''} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 border-t pt-4">
                                        {(!selectedBanner || (Array.isArray(selectedBanner.type) && selectedBanner.type.includes('desktop')) || selectedBanner.type === 'desktop' || selectedBanner.type === 'all') &&
                                            renderImagePicker('image', t('ads.image_desktop', 'Desktop Image (Required)') || '')}
                                        {(!selectedBanner || (Array.isArray(selectedBanner.type) && selectedBanner.type.includes('tablet')) || selectedBanner.type === 'tablet' || selectedBanner.type === 'all') &&
                                            renderImagePicker('tablet_image', t('ads.image_tablet', 'Tablet Image (Optional)') || '')}
                                        {(!selectedBanner || (Array.isArray(selectedBanner.type) && selectedBanner.type.includes('mobile')) || selectedBanner.type === 'mobile' || selectedBanner.type === 'all') &&
                                            renderImagePicker('mobile_image', t('ads.image_mobile', 'Mobile Image (Optional)') || '')}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-muted/30 p-4 rounded-lg space-y-4">
                            <div className="flex items-center justify-between border-b pb-4">
                                <h3 className="text-sm font-medium">{t('ads.schedule', 'Ad Schedule')}</h3>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="never-expires"
                                        checked={neverExpires}
                                        onCheckedChange={(checked) => {
                                            setNeverExpires(checked);
                                        }}
                                    />
                                    <label htmlFor="never-expires" className="text-xs font-medium leading-none cursor-pointer">
                                        {t('ads.never_expires', 'Never expires')}
                                    </label>
                                </div>
                            </div>

                            {!neverExpires && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="started_at"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('ads.started_at', 'Start Date')}</FormLabel>
                                                <FormControl>
                                                    {/* @ts-ignore */}
                                                    <Input type="date" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormDescription>Leave blank to start immediately.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="expired_at"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('ads.expired_at', 'End Date')}</FormLabel>
                                                <FormControl>
                                                    {/* @ts-ignore */}
                                                    <Input type="date" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}
                        </div>

                        {/* --- Settings --- */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="sort_order"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('common.sort_order', 'Sort Order')}</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="is_active"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col justify-end pb-2">
                                        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                            <div className="space-y-0.5">
                                                <FormLabel>{t('common.status', 'Status')}</FormLabel>
                                                <FormDescription>
                                                    {field.value === 1 ? 'Active' : 'Inactive'}
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value === 1}
                                                    onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                                                />
                                            </FormControl>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="flex justify-end space-x-2 pt-4 mt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog >
    );
}
