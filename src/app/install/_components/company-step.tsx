'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageCropper } from '@/components/common/image-cropper';
import {
  companyStepSchema,
  type CompanyStepData,
  nameToSlug,
} from '@/lib/setup-validation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface Timezone {
  value: string;
  label: string;
  offset: number;
}

interface CompanyStepProps {
  data: CompanyStepData;
  onNext: (data: CompanyStepData, logoFile?: File | null, faviconFile?: File | null) => void;
  onBack: () => void;
}

export function CompanyStep({ data, onNext, onBack }: CompanyStepProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | undefined>();
  const [faviconPreview, setFaviconPreview] = useState<string | undefined>();

  // Fetch timezones from backend
  const { data: tzData } = useQuery({
    queryKey: ['timezones'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/timezones`);
      const json = await res.json();
      return json.data?.timezones as Timezone[];
    },
    staleTime: Infinity,
  });

  const timezones = tzData ?? [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompanyStepData>({
    resolver: zodResolver(companyStepSchema),
    defaultValues: data,
  });

  // Auto-generate slug when name changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue('name', val);
    setValue('slug', nameToSlug(val));
  };

  const handleLogoCropped = (file: File) => {
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleFaviconCropped = (file: File) => {
    setFaviconFile(file);
    setFaviconPreview(URL.createObjectURL(file));
  };

  const onSubmit = (values: CompanyStepData) => {
    onNext(values, logoFile, faviconFile);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Company Setup</h2>
        <p className="text-muted-foreground mt-1">
          Set up your company profile and regional preferences.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Company Information</CardTitle>
            <CardDescription>Basic details about your company</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Company Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                placeholder="Acme Inc."
                {...register('name')}
                onChange={handleNameChange}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug <span className="text-destructive">*</span></Label>
              <Input id="slug" placeholder="acme-inc" {...register('slug')} />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="copyright">Copyright Name <span className="text-destructive">*</span></Label>
              <Input id="copyright" placeholder="© Acme Inc." {...register('copyright')} />
              {errors.copyright && <p className="text-xs text-destructive">{errors.copyright.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Company Email</Label>
              <Input id="email" type="email" placeholder="contact@acme.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+1 555 000 0000" {...register('phone')} />
            </div>
          </CardContent>
        </Card>

        {/* Regional */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Regional Settings</CardTitle>
            <CardDescription>Timezone, language and currency defaults</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Timezone <span className="text-destructive">*</span></Label>
              <Select
                defaultValue={data.timezone}
                onValueChange={(v) => setValue('timezone', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.timezone && <p className="text-xs text-destructive">{errors.timezone.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Default Language <span className="text-destructive">*</span></Label>
              <Select
                defaultValue={data.language}
                onValueChange={(v) => setValue('language', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                </SelectContent>
              </Select>
              {errors.language && <p className="text-xs text-destructive">{errors.language.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Default Currency <span className="text-destructive">*</span></Label>
              <Select
                defaultValue={data.currency}
                onValueChange={(v) => setValue('currency', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD — US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR — Euro</SelectItem>
                  <SelectItem value="GBP">GBP — British Pound</SelectItem>
                  <SelectItem value="INR">INR — Indian Rupee</SelectItem>
                  <SelectItem value="AED">AED — UAE Dirham</SelectItem>
                  <SelectItem value="SAR">SAR — Saudi Riyal</SelectItem>
                </SelectContent>
              </Select>
              {errors.currency && <p className="text-xs text-destructive">{errors.currency.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Branding — using the existing ImageCropper component */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branding</CardTitle>
            <CardDescription>Logo and favicon (optional — with crop & resize)</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageCropper
              title="Company Logo"
              description="Logo shown in admin sidebar (150×50 px)"
              targetWidth={150}
              targetHeight={50}
              currentImage={logoPreview}
              onImageCropped={handleLogoCropped}
              onRemove={() => { setLogoFile(null); setLogoPreview(undefined); }}
            />
            <ImageCropper
              title="Favicon"
              description="Square icon for browser tabs (32×32 px)"
              targetWidth={32}
              targetHeight={32}
              currentImage={faviconPreview}
              onImageCropped={handleFaviconCropped}
              onRemove={() => { setFaviconFile(null); setFaviconPreview(undefined); }}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button type="submit" className="gap-2">
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
