'use client';

import { useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Save, LogOut } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RichTextEditor } from '@/components/common/rich-text-editor';
import type { Announcement, CreateAnnouncementDto } from '@/hooks/use-announcements';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    content: z.string().min(1, 'Content is required'),
    start_date: z.string().nullable().optional(),
    end_date: z.string().nullable().optional(),
    has_action: z.boolean().default(false),
    action_label: z.string().nullable().optional(),
    action_url: z.string().nullable().optional(),
    open_in_new_tab: z.boolean().default(false),
    bg_color: z.string().default('#ffffff'),
    text_color: z.string().default('#000000'),
    is_active: z.boolean().default(true),
});

export type AnnouncementFormData = z.infer<typeof schema>;

interface AnnouncementFormProps {
    defaultValues?: Partial<Announcement>;
    onSave: (data: CreateAnnouncementDto, exitAfter: boolean) => void;
    isPending: boolean;
}


// ─── AnnouncementForm ─────────────────────────────────────────────────────────

export function AnnouncementForm({ defaultValues, onSave, isPending }: AnnouncementFormProps) {
    const { t } = useTranslation();
    const router = useRouter();
    const exitRef = useRef(false);

    const { register, control, handleSubmit, watch, formState: { errors } } = useForm<AnnouncementFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: defaultValues?.name ?? '',
            content: defaultValues?.content ?? '',
            start_date: defaultValues?.start_date
                ? new Date(defaultValues.start_date).toISOString().slice(0, 16) : '',
            end_date: defaultValues?.end_date
                ? new Date(defaultValues.end_date).toISOString().slice(0, 16) : '',
            has_action: Boolean(defaultValues?.has_action),
            action_label: defaultValues?.action_label ?? '',
            action_url: defaultValues?.action_url ?? '',
            open_in_new_tab: Boolean(defaultValues?.open_in_new_tab),
            bg_color: defaultValues?.bg_color ?? '#ffffff',
            text_color: defaultValues?.text_color ?? '#000000',
            is_active: defaultValues?.is_active !== undefined ? Boolean(defaultValues.is_active) : true,
        },
    });

    const hasAction = watch('has_action');

    const onSubmit = (data: AnnouncementFormData) => {
        const cleaned: CreateAnnouncementDto = {
            ...data,
            start_date: data.start_date || null,
            end_date: data.end_date || null,
            action_label: data.action_label || null,
            action_url: data.action_url || null,
        };
        onSave(cleaned, exitRef.current);
        exitRef.current = false;
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Main content (2/3) ── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Name */}
                    <Card>
                        <CardContent className="pt-6 space-y-2">
                            <Label htmlFor="ann-name">
                                {t('announcements.name', 'Name')} <span className="text-destructive">*</span>
                            </Label>
                            <Input id="ann-name"
                                placeholder={t('announcements.name_placeholder', 'Announcement 1')}
                                {...register('name')} />
                            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                            <p className="text-xs text-muted-foreground">
                                {t('announcements.name_hint', 'Name for internal reference only, not visible to users')}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Content */}
                    <Card>
                        <CardContent className="pt-6 space-y-2">
                            <Label>
                                {t('announcements.content', 'Content')} <span className="text-destructive">*</span>
                            </Label>
                            <Controller control={control} name="content" render={({ field }) => (
                                <RichTextEditor
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Write announcement content here..."
                                    disableVisual={true} // Defaults to HTML source mode
                                />
                            )} />
                            {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
                            <p className="text-xs text-muted-foreground">
                                {t('announcements.content_hint', 'The message that will be displayed to users. Supports HTML formatting.')}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Dates */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ann-start">{t('announcements.start_date', 'Start date')}</Label>
                                    <Input id="ann-start" type="datetime-local" {...register('start_date')} />
                                    <p className="text-xs text-muted-foreground">
                                        {t('announcements.start_date_hint', 'Announcement will be visible from this date. Leave empty to start immediately.')}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ann-end">{t('announcements.end_date', 'End date')}</Label>
                                    <Input id="ann-end" type="datetime-local" {...register('end_date')} />
                                    <p className="text-xs text-muted-foreground">
                                        {t('announcements.end_date_hint', 'Announcement will be hidden after this date. Leave empty for no expiration.')}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Styling Colors */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">{t('announcements.styling', 'Styling')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bg-color">{t('announcements.bg_color', 'Background Color')}</Label>
                                    <div className="flex gap-2">
                                        <Input id="bg-color" type="color" className="p-1 h-10 w-20" {...register('bg_color')} />
                                        <Input type="text" value={watch('bg_color')} onChange={(e) => control._fields.bg_color && control.register('bg_color').onChange({ target: { value: e.target.value, name: 'bg_color' } })} className="flex-1" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="text-color">{t('announcements.text_color', 'Text Color')}</Label>
                                    <div className="flex gap-2">
                                        <Input id="text-color" type="color" className="p-1 h-10 w-20" {...register('text_color')} />
                                        <Input type="text" value={watch('text_color')} onChange={(e) => control._fields.text_color && control.register('text_color').onChange({ target: { value: e.target.value, name: 'text_color' } })} className="flex-1" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* CTA Action */}
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base font-medium">
                                        {t('announcements.has_action', 'Has action')}
                                    </Label>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {t('announcements.has_action_hint', 'Add a call-to-action button to your announcement')}
                                    </p>
                                </div>
                                <Controller control={control} name="has_action" render={({ field }) => (
                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                )} />
                            </div>

                            {hasAction && (
                                <>
                                    <Separator />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="ann-label">{t('announcements.action_label', 'Action label')}</Label>
                                            <Input id="ann-label"
                                                placeholder={t('announcements.action_label_placeholder', 'e.g. Learn More, Shop Now')}
                                                {...register('action_label')} />
                                            <p className="text-xs text-muted-foreground">
                                                {t('announcements.action_label_hint', 'Text displayed on the action button')}
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="ann-url">{t('announcements.action_url', 'Action URL')}</Label>
                                            <Input id="ann-url"
                                                placeholder="https://example.com/page"
                                                {...register('action_url')} />
                                            <p className="text-xs text-muted-foreground">
                                                {t('announcements.action_url_hint', 'URL where users will be redirected when clicking the action button')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between border rounded-lg p-3">
                                        <div>
                                            <Label className="font-medium">{t('announcements.open_in_new_tab', 'Open in new tab')}</Label>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {t('announcements.open_in_new_tab_hint', 'Open the action link in a new browser tab')}
                                            </p>
                                        </div>
                                        <Controller control={control} name="open_in_new_tab" render={({ field }) => (
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        )} />
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Sidebar (1/3) ── */}
                <div className="space-y-4">

                    {/* Publish */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">{t('announcements.publish', 'Publish')}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex gap-2">
                            <Button type="submit" className="flex-1" disabled={isPending}
                                onClick={() => { exitRef.current = false; }}>
                                <Save className="mr-2 h-4 w-4" />
                                {isPending ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                            </Button>
                            <Button type="submit" variant="outline" className="flex-1" disabled={isPending}
                                onClick={() => { exitRef.current = true; }}>
                                <LogOut className="mr-2 h-4 w-4" />
                                {t('announcements.save_exit', 'Save & Exit')}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Is Active */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">{t('announcements.is_active', 'Is active')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Controller control={control} name="is_active" render={({ field }) => (
                                <div className="flex items-center gap-3">
                                    <Switch id="ann-active" checked={field.value} onCheckedChange={field.onChange} />
                                    <Label htmlFor="ann-active" className="cursor-pointer text-sm text-muted-foreground">
                                        {t('announcements.is_active_hint', 'Enable or disable this announcement without deleting it')}
                                    </Label>
                                </div>
                            )} />
                        </CardContent>
                    </Card>

                    <Button type="button" variant="ghost" className="w-full"
                        onClick={() => router.push('/admin/announcements')}>
                        ← {t('common.back_to_list', 'Back to list')}
                    </Button>
                </div>
            </div>
        </form>
    );
}
