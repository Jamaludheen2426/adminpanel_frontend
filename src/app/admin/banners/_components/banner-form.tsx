'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { AdBanner } from '@/hooks/use-ad-banners';
import { useTranslation } from '@/hooks/use-translation';
import { Monitor, Tablet, Smartphone } from 'lucide-react';

const bannerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().nullable().optional(),
    type: z.array(z.string()).min(1, 'Select at least one device'),
    desktop_width: z.coerce.number().min(1).default(1200),
    desktop_height: z.coerce.number().min(1).default(400),
    tablet_width: z.coerce.number().min(1).default(768),
    tablet_height: z.coerce.number().min(1).default(300),
    mobile_width: z.coerce.number().min(1).default(480),
    mobile_height: z.coerce.number().min(1).default(200),
    is_active: z.coerce.number().default(1),
});

type BannerFormValues = z.infer<typeof bannerSchema>;

interface BannerFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    banner?: AdBanner | null;
    onSave: (data: BannerFormValues) => void;
    isLoading?: boolean;
}

export function BannerForm({ open, onOpenChange, banner, onSave, isLoading }: BannerFormProps) {
    const { t } = useTranslation();
    const form = useForm<BannerFormValues>({
        resolver: zodResolver(bannerSchema),
        defaultValues: {
            name: '',
            description: '',
            type: ['desktop', 'tablet', 'mobile'],
            desktop_width: 1200,
            desktop_height: 400,
            tablet_width: 768,
            tablet_height: 300,
            mobile_width: 480,
            mobile_height: 200,
            is_active: 1,
        },
    });

    const bannerType = form.watch('type');

    useEffect(() => {
        if (banner) {
            form.reset({
                name: banner.name,
                description: banner.description || '',
                type: banner.type,
                desktop_width: banner.desktop_width,
                desktop_height: banner.desktop_height,
                tablet_width: banner.tablet_width,
                tablet_height: banner.tablet_height,
                mobile_width: banner.mobile_width,
                mobile_height: banner.mobile_height,
                is_active: banner.is_active ? 1 : 0,
            });
        } else {
            form.reset({
                name: '',
                description: '',
                type: ['desktop', 'tablet', 'mobile'],
                desktop_width: 1200,
                desktop_height: 400,
                tablet_width: 768,
                tablet_height: 300,
                mobile_width: 480,
                mobile_height: 200,
                is_active: 1,
            });
        }
    }, [banner, form, open]);

    const showDesktop = bannerType.includes('desktop');
    const showTablet = bannerType.includes('tablet');
    const showMobile = bannerType.includes('mobile');

    const renderDimensionRow = (
        widthField: keyof BannerFormValues,
        heightField: keyof BannerFormValues,
        label: string,
        Icon: React.ElementType,
    ) => (
        <div className="p-4 rounded-lg bg-muted/30 space-y-3">
            <div className="flex items-center gap-2 font-medium text-sm">
                <Icon className="h-4 w-4" />
                {label}
            </div>
            <div className="grid grid-cols-2 gap-3">
                <FormField
                    control={form.control}
                    name={widthField}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">{t('ads.width_px', 'Width (px)')}</FormLabel>
                            <FormControl>
                                <Input type="number" min="1" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name={heightField}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">{t('ads.height_px', 'Height (px)')}</FormLabel>
                            <FormControl>
                                <Input type="number" min="1" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{banner ? t('ads.edit_banner', 'Edit Banner') : t('ads.create_banner', 'Create Banner')}</DialogTitle>
                    <DialogDescription>
                        {t('ads.banner_desc', 'Define the pixel dimensions for this banner template. These dimensions are used by the ImageCropper when creating ads.')}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>{t('common.name', 'Name')} *</FormLabel>
                                        <FormControl>
                                            <Input placeholder={t('ads.banner_name_placeholder', 'e.g. Homepage Hero Banner')} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Description */}
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>{t('common.description', 'Description')}</FormLabel>
                                        <FormControl>
                                            {/* @ts-ignore */}
                                            <Textarea placeholder={t('ads.banner_desc_placeholder', 'Optional notes about this banner size')} className="min-h-[70px]" {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Type */}
                            <FormField
                                control={form.control}
                                name="type"
                                render={() => (
                                    <FormItem className="col-span-2 space-y-3">
                                        <div className="mb-2">
                                            <FormLabel className="text-base">{t('ads.target_device', 'Target Device(s)')}</FormLabel>
                                            <FormDescription>
                                                {t('ads.target_device_desc', 'Controls which image slots appear when this banner is used in an Ad.')}
                                            </FormDescription>
                                        </div>
                                        <div className="flex flex-row space-x-6">
                                            {[
                                                { id: 'desktop', label: t('ads.desktop', 'Desktop'), icon: Monitor },
                                                { id: 'tablet', label: t('ads.tablet', 'Tablet'), icon: Tablet },
                                                { id: 'mobile', label: t('ads.mobile', 'Mobile'), icon: Smartphone },
                                            ].map((item) => (
                                                <FormField
                                                    key={item.id}
                                                    control={form.control}
                                                    name="type"
                                                    render={({ field }) => {
                                                        return (
                                                            <FormItem
                                                                key={item.id}
                                                                className="flex flex-row items-center space-x-2 space-y-0"
                                                            >
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value?.includes(item.id)}
                                                                        onCheckedChange={(checked) => {
                                                                            return checked
                                                                                ? field.onChange([...field.value, item.id])
                                                                                : field.onChange(
                                                                                    field.value?.filter(
                                                                                        (value) => value !== item.id
                                                                                    )
                                                                                )
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="font-normal flex justify-center items-center gap-1 cursor-pointer">
                                                                    <item.icon className="w-3.5 h-3.5" />
                                                                    {item.label}
                                                                </FormLabel>
                                                            </FormItem>
                                                        )
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Separator />

                        {/* Dimension inputs — filtered by type */}
                        <div className="space-y-3">
                            <p className="text-sm font-medium">{t('common.dimensions', 'Dimensions')}</p>
                            {showDesktop && renderDimensionRow('desktop_width', 'desktop_height', 'Desktop', Monitor)}
                            {showTablet && renderDimensionRow('tablet_width', 'tablet_height', 'Tablet', Tablet)}
                            {showMobile && renderDimensionRow('mobile_width', 'mobile_height', 'Mobile', Smartphone)}
                        </div>

                        <Separator />

                        {/* Status */}
                        <FormField
                            control={form.control}
                            name="is_active"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>{t('common.status', 'Status')}</FormLabel>
                                        <FormDescription>{field.value === 1 ? t('ads.banner_active_desc', 'Active — visible in Ads dropdown') : t('ads.banner_inactive_desc', 'Inactive — hidden from Ads dropdown')}</FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value === 1}
                                            onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? t('common.saving', 'Saving...') : t('ads.save_banner', 'Save Banner')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
