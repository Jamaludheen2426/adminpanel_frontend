'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SlideItem } from '@/hooks/use-simple-sliders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Link as LinkIcon, Type, Palette, Monitor, Tablet, Smartphone } from 'lucide-react';
import { ImageCropper } from '@/components/common/image-cropper';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

const generateId = () => Math.random().toString(36).substring(2, 9);

const slideSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, 'Title is required'),
    subtitle: z.string().optional(),
    link: z.string().optional(),
    button_label: z.string().optional(),
    description: z.string().optional(),
    image: z.string().min(1, 'Desktop image is required'),
    tablet_image: z.string().optional(),
    mobile_image: z.string().optional(),
    bg_color: z.string().optional(),
    is_light_bg: z.boolean().default(false),
    sort_order: z.coerce.number().default(0),
    is_active: z.coerce.number().default(1), // 0=inactive/draft, 1=active
});

type SlideFormData = z.infer<typeof slideSchema>;

interface SlideItemModalProps {
    open: boolean;
    onClose: () => void;
    initialData?: SlideItem | null;
    onSave: (item: SlideItem) => void;
}

export function SlideItemModal({ open, onClose, initialData, onSave }: SlideItemModalProps) {
    const [uploadingField, setUploadingField] = useState<string | null>(null);
    const [cropperKeys, setCropperKeys] = useState({ image: 0, tablet_image: 0, mobile_image: 0 });
    const [showButton, setShowButton] = useState(() => !!initialData?.button_label);
    const [activeTab, setActiveTab] = useState('content');

    const form = useForm<SlideFormData>({
        resolver: zodResolver(slideSchema),
        defaultValues: initialData || {
            title: '', subtitle: '', link: '', button_label: '', description: '',
            image: '', tablet_image: '', mobile_image: '', bg_color: '#ffffff',
            is_light_bg: false, sort_order: 0, is_active: 1,
        },
    });

    const handleImageUpload = async (file: File, fieldName: 'image' | 'tablet_image' | 'mobile_image') => {
        setUploadingField(fieldName);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'sliders');
        try {
            const response = await apiClient.post('/media/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const url = response.data.data?.file?.url || response.data.data?.url || response.data.url;
            if (url) {
                form.setValue(fieldName, url);
                toast.success('Image uploaded successfully');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to upload image');
        } finally {
            setUploadingField(null);
        }
    };

    const onSubmit = (data: SlideFormData) => {
        onSave({ ...data, id: data.id || generateId() } as SlideItem);
        form.reset();
        onClose();
    };

    const onInvalid = (errors: Record<string, unknown>) => {
        if (errors.image) {
            setActiveTab('images');
            toast.error('Desktop image is required. Please add an image.');
        } else {
            toast.error('Please fill in all required fields.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Slide' : 'Add New Slide'}</DialogTitle>
                    <DialogDescription>
                        {initialData ? 'Update the slide content and settings.' : 'Fill in the details to create a new slide.'}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
                    <TabsList className="grid grid-cols-3 w-full">
                        <TabsTrigger value="content" className="gap-1.5 text-xs">
                            <Type className="h-3.5 w-3.5" /> Content
                        </TabsTrigger>
                        <TabsTrigger value="images" className="gap-1.5 text-xs">
                            <Monitor className="h-3.5 w-3.5" /> Images
                        </TabsTrigger>
                        <TabsTrigger value="appearance" className="gap-1.5 text-xs">
                            <Palette className="h-3.5 w-3.5" /> Appearance
                        </TabsTrigger>
                    </TabsList>

                    {/* ── Content Tab ── */}
                    <TabsContent value="content" className="space-y-4 pt-4">
                        <div className="space-y-1.5">
                            <Label>Title <span className="text-destructive">*</span></Label>
                            <Input placeholder="Slide title..." {...form.register('title')} />
                            {form.formState.errors.title && (
                                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Subtitle</Label>
                            <Input placeholder="Optional subtitle..." {...form.register('subtitle')} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Description</Label>
                            <Textarea rows={3} placeholder="Optional description..." {...form.register('description')} />
                        </div>
                        <Separator />
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-1.5">
                                <LinkIcon className="h-3.5 w-3.5" /> Link URL
                            </Label>
                            <Input placeholder="https://..." {...form.register('link')} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                                <p className="text-sm font-medium">Show Button</p>
                                <p className="text-xs text-muted-foreground">Display a CTA button on this slide</p>
                            </div>
                            <Switch
                                checked={showButton}
                                onCheckedChange={(checked) => {
                                    setShowButton(checked);
                                    if (!checked) form.setValue('button_label', '');
                                }}
                            />
                        </div>
                        {showButton && (
                            <div className="space-y-1.5">
                                <Label>Button Label</Label>
                                <Input placeholder="e.g. Learn More" {...form.register('button_label')} />
                            </div>
                        )}
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Sort Order</Label>
                                <Input type="number" {...form.register('sort_order')} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Status</Label>
                                <Controller control={form.control} name="is_active" render={({ field }) => (
                                    <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Active</SelectItem>
                                            <SelectItem value="0">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )} />
                            </div>
                        </div>
                    </TabsContent>

                    {/* ── Images Tab ── */}
                    <TabsContent value="images" className="space-y-5 pt-4">
                        {/* Desktop */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-primary/10">
                                    <Monitor className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Desktop Image <span className="text-destructive">*</span></p>
                                    <p className="text-xs text-muted-foreground">Recommended: 1920×600px</p>
                                </div>
                            </div>
                            <Controller control={form.control} name="image" render={({ field }) => (
                                <div className="space-y-1">
                                    <ImageCropper
                                        key={cropperKeys.image}
                                        title="Desktop Image"
                                        description="Recommended: 1920×600px · Required"
                                        targetWidth={1920}
                                        targetHeight={600}
                                        currentImage={field.value || ''}
                                        onImageCropped={(file) => handleImageUpload(file, 'image')}
                                        showUpload={false}
                                        onRemove={() => {
                                            field.onChange('');
                                            setCropperKeys(prev => ({ ...prev, image: prev.image + 1 }));
                                        }}
                                        rounded={false}
                                    />
                                    {uploadingField === 'image' && (
                                        <p className="text-xs text-muted-foreground">Uploading...</p>
                                    )}
                                </div>
                            )} />
                            {form.formState.errors.image && (
                                <p className="text-xs text-destructive">{form.formState.errors.image.message}</p>
                            )}
                        </div>

                        <Separator />

                        {/* Tablet */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-muted">
                                    <Tablet className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Tablet Image <span className="text-xs text-muted-foreground font-normal">(Optional)</span></p>
                                    <p className="text-xs text-muted-foreground">Recommended: 1024×500px · Falls back to desktop</p>
                                </div>
                            </div>
                            <Controller control={form.control} name="tablet_image" render={({ field }) => (
                                <div className="space-y-1">
                                    <ImageCropper
                                        key={cropperKeys.tablet_image}
                                        title="Tablet Image"
                                        description="Recommended: 1024×500px · Falls back to desktop"
                                        targetWidth={1024}
                                        targetHeight={500}
                                        currentImage={field.value || ''}
                                        onImageCropped={(file) => handleImageUpload(file, 'tablet_image')}
                                        showUpload={false}
                                        onRemove={() => {
                                            field.onChange('');
                                            setCropperKeys(prev => ({ ...prev, tablet_image: prev.tablet_image + 1 }));
                                        }}
                                        rounded={false}
                                    />
                                    {uploadingField === 'tablet_image' && (
                                        <p className="text-xs text-muted-foreground">Uploading...</p>
                                    )}
                                </div>
                            )} />
                        </div>

                        <Separator />

                        {/* Mobile */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-muted">
                                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Mobile Image <span className="text-xs text-muted-foreground font-normal">(Optional)</span></p>
                                    <p className="text-xs text-muted-foreground">Recommended: 640×400px · Falls back to desktop</p>
                                </div>
                            </div>
                            <Controller control={form.control} name="mobile_image" render={({ field }) => (
                                <div className="space-y-1">
                                    <ImageCropper
                                        key={cropperKeys.mobile_image}
                                        title="Mobile Image"
                                        description="Recommended: 640×400px · Falls back to desktop"
                                        targetWidth={640}
                                        targetHeight={400}
                                        currentImage={field.value || ''}
                                        onImageCropped={(file) => handleImageUpload(file, 'mobile_image')}
                                        showUpload={false}
                                        onRemove={() => {
                                            field.onChange('');
                                            setCropperKeys(prev => ({ ...prev, mobile_image: prev.mobile_image + 1 }));
                                        }}
                                        rounded={false}
                                    />
                                    {uploadingField === 'mobile_image' && (
                                        <p className="text-xs text-muted-foreground">Uploading...</p>
                                    )}
                                </div>
                            )} />
                        </div>
                    </TabsContent>

                    {/* ── Appearance Tab ── */}
                    <TabsContent value="appearance" className="space-y-5 pt-4">
                        <div className="space-y-1.5">
                            <Label>Background Color</Label>
                            <Controller control={form.control} name="bg_color" render={({ field }) => (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={field.value || '#ffffff'}
                                        onChange={e => field.onChange(e.target.value)}
                                        className="w-10 h-10 rounded border cursor-pointer p-0.5 bg-background"
                                    />
                                    <Input
                                        value={field.value || ''}
                                        onChange={e => field.onChange(e.target.value)}
                                        placeholder="#ffffff"
                                        className="flex-1 font-mono"
                                    />
                                </div>
                            )} />
                            <p className="text-xs text-muted-foreground">Used as slide background color</p>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <Label className="text-sm font-medium">Light Background</Label>
                                <p className="text-xs text-muted-foreground mt-0.5">Enable if text should be dark (light background)</p>
                            </div>
                            <Controller control={form.control} name="is_light_bg" render={({ field }) => (
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            )} />
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-2">
                    <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                    <Button type="button" onClick={form.handleSubmit(onSubmit, onInvalid)}>
                        {initialData ? 'Save Changes' : 'Add Slide'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
