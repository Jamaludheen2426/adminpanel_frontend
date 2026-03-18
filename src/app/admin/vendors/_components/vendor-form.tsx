'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useCreateVendor, useUpdateVendor, Vendor } from '@/hooks/use-vendors';
import { isApprovalRequired } from '@/lib/api-client';
import { CommonForm, CommonFormSection } from '@/components/common/common-form';
import { Building2, User, Landmark, Share2, Globe, Youtube, Facebook, Instagram, Twitter, Linkedin, MessageCircle, Music, Send, Bookmark } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useCountries, useStates, useCities, useLocalities } from '@/hooks/use-locations';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import dynamic from 'next/dynamic';
import { resolveMediaUrl } from '@/lib/utils';

const MapPicker = dynamic(
    () => import('@/components/common/map-picker').then(m => m.MapPicker),
    { ssr: false }
);
// ─── Schemas ─────────────────────────────────────────────────────────────────

const baseSchema = z.object({
    company_name: z.string().trim().min(1, 'Company name is required'),
    company_logo: z.string().optional(),
    country_id: z.number().optional(),
    state_id: z.number().optional(),
    city_id: z.number().optional(),
    pincode_id: z.number().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    company_address: z.string().trim().optional(),
    reg_no: z.string().trim().optional(),
    gst_no: z.string().trim().optional(),
    company_contact: z.string().trim().optional(),
    landline: z.string().trim().optional(),
    company_email: z.string().trim().email('Invalid email').optional().or(z.literal('')),
    website: z.string().trim().optional(),
    youtube: z.string().trim().optional(),
    facebook: z.string().trim().optional(),
    instagram: z.string().trim().optional(),
    twitter: z.string().trim().optional(),
    linkedin: z.string().trim().optional(),
    whatsapp: z.string().trim().optional(),
    tiktok: z.string().trim().optional(),
    telegram: z.string().trim().optional(),
    pinterest: z.string().trim().optional(),
    name: z.string().trim().min(1, 'Vendor name is required'),
    address: z.string().trim().optional(),
    contact: z.string().trim().optional(),
    email: z.string().trim().email('Invalid email'),
    membership: z.enum(['basic', 'silver', 'gold', 'platinum']).default('basic'),
    bank_name: z.string().trim().optional(),
    acc_no: z.string().trim().optional(),
    ifsc_code: z.string().trim().optional(),
    acc_type: z.enum(['savings', 'current', 'overdraft']).optional(),
    branch: z.string().trim().optional(),
});

const createSchema = baseSchema.extend({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string().min(1, 'Please confirm password'),
}).refine(d => d.password === d.confirm_password, { message: 'Passwords do not match', path: ['confirm_password'] });

const editSchema = baseSchema.extend({
    password: z.string().min(6).optional().or(z.literal('')),
    confirm_password: z.string().optional().or(z.literal('')),
}).refine(d => !d.password || d.password === d.confirm_password, { message: 'Passwords do not match', path: ['confirm_password'] });

// ─── Component ───────────────────────────────────────────────────────────────

interface Props { vendor?: Vendor; }

export function VendorForm({ vendor }: Props) {
    const router = useRouter();
    const isEdit = !!vendor;
    const create = useCreateVendor();
    const update = useUpdateVendor();

    // Location cascading — IDs drive hook deps, names drive map flyTo
    const [selCountryId,   setSelCountryId]   = useState<number | undefined>(vendor?.country_id ?? undefined);
    const [selStateId,     setSelStateId]     = useState<number | undefined>(vendor?.state_id ?? undefined);
    const [selDistrictId,  setSelDistrictId]  = useState<number | undefined>(vendor?.city_id ?? undefined);

    const [selCountryName,  setSelCountryName]  = useState('');
    const [selStateName,    setSelStateName]    = useState('');
    const [selDistrictName, setSelDistrictName] = useState('');
    const [selCityName,     setSelCityName]     = useState('');

    // Map pin state
    const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(
        vendor?.latitude != null && vendor?.longitude != null
            ? { lat: vendor.latitude, lng: vendor.longitude }
            : null
    );

    const { data: countries   = [] } = useCountries();
    const { data: states      = [] } = useStates(selCountryId || 0);
    const { data: districts   = [] } = useCities(selStateId || 0);
    const { data: cityOptions = [] } = useLocalities(selDistrictId || 0);

    // Build the geocode query from the most-specific known location name
    const mapFlyQuery = [selCityName, selDistrictName, selStateName, selCountryName]
        .filter(Boolean)
        .join(', ');

    // ─── Sections ──────────────────────────────────────────────────────────────

    const sections: CommonFormSection[] = [
        {
            title: 'Company Information',
            icon: Building2,
            fields: [
                {
                    name: 'company_logo', label: 'Company Logo', type: 'image', colSpan: 2,
                    imageTitle: 'Company Logo', imageDescription: 'Upload company logo (recommended: 300×100px)',
                    targetWidth: 300, targetHeight: 100, imageFolder: 'vendors',
                },
                { name: 'company_name', label: 'Company Name', type: 'text', placeholder: 'Acme Pvt Ltd', required: true },
                { name: 'reg_no', label: 'Registration No.', type: 'text', placeholder: 'REG123456' },
                { name: 'gst_no', label: 'GST No.', type: 'text', placeholder: '22AAAAA0000A1Z5' },
                { name: 'company_contact', label: 'Company Contact', type: 'text', placeholder: '+91 9000000000' },
                { name: 'landline', label: 'Landline', type: 'text', placeholder: '022-12345678' },
                { name: 'company_email', label: 'Company Email', type: 'email', placeholder: 'info@company.com' },
                { name: 'company_address', label: 'Company Address', type: 'textarea', placeholder: '123 Business Park, City', rows: 2, colSpan: 2 },
                // Country
                {
                    name: 'country_id', label: 'Country', type: 'custom',
                    render: ({ watch, setValue }) => (
                        <div className="space-y-2">
                            <Label>Country</Label>
                            <Select
                                value={watch('country_id')?.toString() || ''}
                                onValueChange={(v) => {
                                    const id   = parseInt(v);
                                    const name = countries.find(c => c.id === id)?.name || '';
                                    setValue('country_id', id);
                                    setValue('state_id',   undefined);
                                    setValue('city_id',    undefined);
                                    setValue('pincode_id', undefined);
                                    setSelCountryId(id);     setSelCountryName(name);
                                    setSelStateId(undefined);    setSelStateName('');
                                    setSelDistrictId(undefined); setSelDistrictName('');
                                    setSelCityName('');
                                }}
                            >
                                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                                <SelectContent>
                                    {countries.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ),
                },
                // State
                {
                    name: 'state_id', label: 'State', type: 'custom',
                    render: ({ watch, setValue }) => (
                        <div className="space-y-2">
                            <Label>State</Label>
                            <Select
                                value={watch('state_id')?.toString() || ''}
                                onValueChange={(v) => {
                                    const id   = parseInt(v);
                                    const name = states.find(s => s.id === id)?.name || '';
                                    setValue('state_id',   id);
                                    setValue('city_id',    undefined);
                                    setValue('pincode_id', undefined);
                                    setSelStateId(id);       setSelStateName(name);
                                    setSelDistrictId(undefined); setSelDistrictName('');
                                    setSelCityName('');
                                }}
                                disabled={!selCountryId || states.length === 0}
                            >
                                <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                                <SelectContent>
                                    {states.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ),
                },
                // District
                {
                    name: 'city_id', label: 'District', type: 'custom',
                    render: ({ watch, setValue }) => (
                        <div className="space-y-2">
                            <Label>District</Label>
                            <Select
                                value={watch('city_id')?.toString() || ''}
                                onValueChange={(v) => {
                                    const id   = parseInt(v);
                                    const name = districts.find(d => d.id === id)?.name || '';
                                    setValue('city_id',    id);
                                    setValue('pincode_id', undefined);
                                    setSelDistrictId(id); setSelDistrictName(name);
                                    setSelCityName('');
                                }}
                                disabled={!selStateId || districts.length === 0}
                            >
                                <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                                <SelectContent>
                                    {districts.map(d => (
                                        <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ),
                },
                // City
                {
                    name: 'pincode_id', label: 'City', type: 'custom',
                    render: ({ watch, setValue }) => (
                        <div className="space-y-2">
                            <Label>City</Label>
                            <Select
                                value={watch('pincode_id')?.toString() || ''}
                                onValueChange={(v) => {
                                    const id   = parseInt(v);
                                    const name = cityOptions.find(c => c.id === id)?.name || '';
                                    setValue('pincode_id', id);
                                    setSelCityName(name);
                                }}
                                disabled={!selDistrictId || cityOptions.length === 0}
                            >
                                <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                                <SelectContent>
                                    {cityOptions.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ),
                },
                // Map picker — after City, full width
                {
                    name: 'map_location',
                    label: 'Office Location on Map',
                    type: 'custom',
                    colSpan: 2,
                    render: ({ setValue, watch }) => (
                        <MapPicker
                            label="Office Location on Map"
                            value={mapCoords}
                            flyToQuery={mapFlyQuery || undefined}
                            logo={watch('company_logo') ? resolveMediaUrl(watch('company_logo')!) : undefined}
                            companyName={watch('company_name') || undefined}
                            city={selCityName || selDistrictName || selStateName || undefined}
                            onChange={(coords) => {
                                setMapCoords(coords);
                                setValue('latitude',  coords?.lat ?? null);
                                setValue('longitude', coords?.lng ?? null);
                            }}
                        />
                    ),
                },
            ],
        },
        {
            title: 'Vendor Information',
            icon: User,
            fields: [
                {
                    name: 'profile', label: 'Profile Photo', type: 'image', colSpan: 2,
                    imageTitle: 'Profile Photo', imageDescription: 'Upload vendor profile photo (square)',
                    targetWidth: 200, targetHeight: 200, rounded: true, imageFolder: 'vendors',
                },
                { name: 'name', label: 'Vendor Name', type: 'text', placeholder: 'John Doe', required: true },
                { name: 'contact', label: 'Contact', type: 'text', placeholder: '+91 9000000000' },
                { name: 'email', label: 'Login Email', type: 'email', placeholder: 'vendor@example.com', required: true },
                {
                    name: 'membership', label: 'Membership', type: 'select',
                    options: [
                        { value: 'basic', label: 'Basic' },
                        { value: 'silver', label: 'Silver' },
                        { value: 'gold', label: 'Gold' },
                        { value: 'platinum', label: 'Platinum' },
                    ],
                },
                { name: 'address', label: 'Address', type: 'textarea', placeholder: 'Vendor personal address', rows: 2, colSpan: 2 },
                {
                    name: 'password', label: isEdit ? 'Password (leave blank to keep current)' : 'Password',
                    type: 'password', placeholder: '••••••••', required: !isEdit,
                },
                { name: 'confirm_password', label: 'Confirm Password', type: 'password', placeholder: '••••••••', required: !isEdit },
            ],
        },
        {
            title: 'Bank Information',
            icon: Landmark,
            fields: [
                {
                    name: 'bank_logo', label: 'Bank Logo', type: 'image', colSpan: 2,
                    imageTitle: 'Bank Logo', imageDescription: 'Upload bank logo image',
                    targetWidth: 300, targetHeight: 100, imageFolder: 'vendors',
                },
                { name: 'bank_name', label: 'Bank Name', type: 'text', placeholder: 'State Bank of India' },
                { name: 'acc_no', label: 'Account Number', type: 'text', placeholder: '0123456789' },
                { name: 'ifsc_code', label: 'IFSC Code', type: 'text', placeholder: 'SBIN0001234' },
                {
                    name: 'acc_type', label: 'Account Type', type: 'select',
                    options: [
                        { value: 'savings', label: 'Savings' },
                        { value: 'current', label: 'Current' },
                        { value: 'overdraft', label: 'Overdraft' },
                    ],
                },
                { name: 'branch', label: 'Branch', type: 'text', placeholder: 'MG Road Branch' },
            ],
        },
        {
            title: 'Social Media',
            icon: Share2,
            fields: [
                {
                    name: 'website', label: 'Website', type: 'custom',
                    render: ({ watch, setValue }) => (
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-2 text-sm font-medium">
                                <Globe className="h-4 w-4 text-gray-500" /> Website
                            </Label>
                            <Input value={watch('website') || ''} onChange={e => setValue('website', e.target.value)} placeholder="https://company.com" />
                        </div>
                    ),
                },
                {
                    name: 'youtube', label: 'YouTube', type: 'custom',
                    render: ({ watch, setValue }) => (
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-2 text-sm font-medium">
                                <Youtube className="h-4 w-4 text-red-500" /> YouTube
                            </Label>
                            <Input value={watch('youtube') || ''} onChange={e => setValue('youtube', e.target.value)} placeholder="https://youtube.com/channel/..." />
                        </div>
                    ),
                },
                {
                    name: 'facebook', label: 'Facebook', type: 'custom',
                    render: ({ watch, setValue }) => (
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-2 text-sm font-medium">
                                <Facebook className="h-4 w-4 text-blue-600" /> Facebook
                            </Label>
                            <Input value={watch('facebook') || ''} onChange={e => setValue('facebook', e.target.value)} placeholder="https://facebook.com/..." />
                        </div>
                    ),
                },
                {
                    name: 'instagram', label: 'Instagram', type: 'custom',
                    render: ({ watch, setValue }) => (
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-2 text-sm font-medium">
                                <Instagram className="h-4 w-4 text-pink-500" /> Instagram
                            </Label>
                            <Input value={watch('instagram') || ''} onChange={e => setValue('instagram', e.target.value)} placeholder="https://instagram.com/..." />
                        </div>
                    ),
                },
                {
                    name: 'twitter', label: 'Twitter / X', type: 'custom',
                    render: ({ watch, setValue }) => (
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-2 text-sm font-medium">
                                <Twitter className="h-4 w-4 text-sky-500" /> Twitter / X
                            </Label>
                            <Input value={watch('twitter') || ''} onChange={e => setValue('twitter', e.target.value)} placeholder="https://x.com/..." />
                        </div>
                    ),
                },
                {
                    name: 'linkedin', label: 'LinkedIn', type: 'custom',
                    render: ({ watch, setValue }) => (
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-2 text-sm font-medium">
                                <Linkedin className="h-4 w-4 text-blue-700" /> LinkedIn
                            </Label>
                            <Input value={watch('linkedin') || ''} onChange={e => setValue('linkedin', e.target.value)} placeholder="https://linkedin.com/company/..." />
                        </div>
                    ),
                },
                {
                    name: 'whatsapp', label: 'WhatsApp', type: 'custom',
                    render: ({ watch, setValue }) => (
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-2 text-sm font-medium">
                                <MessageCircle className="h-4 w-4 text-green-500" /> WhatsApp
                            </Label>
                            <Input value={watch('whatsapp') || ''} onChange={e => setValue('whatsapp', e.target.value)} placeholder="+91 9000000000 or wa.me link" />
                        </div>
                    ),
                },
                {
                    name: 'tiktok', label: 'TikTok', type: 'custom',
                    render: ({ watch, setValue }) => (
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-2 text-sm font-medium">
                                <Music className="h-4 w-4 text-black dark:text-white" /> TikTok
                            </Label>
                            <Input value={watch('tiktok') || ''} onChange={e => setValue('tiktok', e.target.value)} placeholder="https://tiktok.com/@..." />
                        </div>
                    ),
                },
                {
                    name: 'telegram', label: 'Telegram', type: 'custom',
                    render: ({ watch, setValue }) => (
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-2 text-sm font-medium">
                                <Send className="h-4 w-4 text-sky-400" /> Telegram
                            </Label>
                            <Input value={watch('telegram') || ''} onChange={e => setValue('telegram', e.target.value)} placeholder="https://t.me/..." />
                        </div>
                    ),
                },
                {
                    name: 'pinterest', label: 'Pinterest', type: 'custom',
                    render: ({ watch, setValue }) => (
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-2 text-sm font-medium">
                                <Bookmark className="h-4 w-4 text-red-600" /> Pinterest
                            </Label>
                            <Input value={watch('pinterest') || ''} onChange={e => setValue('pinterest', e.target.value)} placeholder="https://pinterest.com/..." />
                        </div>
                    ),
                },
            ],
        },
    ];

    const defaultValues = vendor ? {
        company_name: vendor.company_name, company_logo: vendor.company_logo || '',
        country_id: vendor.country_id ?? undefined,
        state_id: vendor.state_id ?? undefined,
        city_id: vendor.city_id ?? undefined,
        pincode_id: vendor.pincode_id ?? undefined,
        latitude: vendor.latitude ?? null,
        longitude: vendor.longitude ?? null,
        reg_no: vendor.reg_no || '',
        gst_no: vendor.gst_no || '', company_address: vendor.company_address || '',
        company_contact: vendor.company_contact || '', landline: vendor.landline || '',
        company_email: vendor.company_email || '', website: vendor.website || '',
        youtube: vendor.youtube || '', facebook: vendor.facebook || '',
        instagram: vendor.instagram || '', twitter: (vendor as any).twitter || '',
        linkedin: (vendor as any).linkedin || '', whatsapp: (vendor as any).whatsapp || '',
        tiktok: (vendor as any).tiktok || '', telegram: (vendor as any).telegram || '',
        pinterest: (vendor as any).pinterest || '', name: vendor.name,
        address: vendor.address || '', contact: vendor.contact || '',
        email: vendor.email, membership: vendor.membership,
        profile: vendor.profile || '', bank_logo: vendor.bank_logo || '',
        password: '', confirm_password: '',
        bank_name: vendor.bank_name || '', acc_no: vendor.acc_no || '',
        ifsc_code: vendor.ifsc_code || '', acc_type: vendor.acc_type || undefined,
        branch: vendor.branch || '',
    } : { membership: 'basic' };

    const handleSubmit = (data: any) => {
        const { confirm_password, map_location, ...payload } = data;
        if (!payload.password) delete payload.password;

        // Always use the live mapCoords state so the values are current
        payload.latitude = mapCoords?.lat ?? null;
        payload.longitude = mapCoords?.lng ?? null;

        const onError = (e: any) => { if (isApprovalRequired(e)) router.push('/admin/vendors'); };
        if (isEdit && vendor) {
            update.mutate({ id: vendor.id, data: payload }, { onSuccess: () => router.push('/admin/vendors'), onError });
        } else {
            create.mutate(payload, { onSuccess: () => router.push('/admin/vendors'), onError });
        }
    };

    return (
        <CommonForm
            schema={isEdit ? editSchema : createSchema}
            sections={sections}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            isPending={create.isPending || update.isPending}
            isEdit={isEdit}
            title={isEdit ? 'Edit Vendor' : 'Add New Vendor'}
            description={isEdit ? 'Update vendor details' : 'Fill in the details to create a new vendor account'}
            backPath="/admin/vendors"
        />
    );
}
