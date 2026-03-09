'use client';

import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageLoader } from '@/components/common/page-loader';
import { Spinner } from '@/components/ui/spinner';
import { useVendorMe, useUpdateVendorProfile, useChangeVendorPassword } from '@/hooks/use-vendors';
import { useUploadMedia } from '@/hooks/use-media';
import { resolveMediaUrl } from '@/lib/utils';
import { Camera, Building2, User, Mail, Phone, CreditCard } from 'lucide-react';

// ── Schemas ────────────────────────────────────────────────────────────────────

const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    contact: z.string().optional(),
    address: z.string().optional(),
    company_name: z.string().min(2, 'Company name is required'),
    company_contact: z.string().optional(),
    company_address: z.string().optional(),
    company_email: z.string().email('Invalid email').optional().or(z.literal('')),
    website: z.string().optional(),
});

const passwordSchema = z
    .object({
        current_password: z.string().min(1, 'Current password is required'),
        new_password: z.string().min(6, 'New password must be at least 6 characters'),
        confirm_password: z.string().min(1, 'Please confirm your new password'),
    })
    .refine((d) => d.new_password === d.confirm_password, {
        message: "Passwords don't match",
        path: ['confirm_password'],
    });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

// ── Component ──────────────────────────────────────────────────────────────────

export function VendorProfileContent() {
    const { data: vendor, isLoading } = useVendorMe();
    const updateProfile = useUpdateVendorProfile();
    const changePassword = useChangeVendorPassword();
    const uploadMedia = useUploadMedia();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Profile form ──
    const profileForm = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        values: {
            name: vendor?.name ?? '',
            contact: vendor?.contact ?? '',
            address: vendor?.address ?? '',
            company_name: vendor?.company_name ?? '',
            company_contact: vendor?.company_contact ?? '',
            company_address: vendor?.company_address ?? '',
            company_email: vendor?.company_email ?? '',
            website: vendor?.website ?? '',
        },
    });

    // ── Password form ──
    const passwordForm = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { current_password: '', new_password: '', confirm_password: '' },
    });

    // ── Handlers ──
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const result = await uploadMedia.mutateAsync({ file, folder: 'vendors' });
        updateProfile.mutate({ profile: result.url });
    };

    const onProfileSubmit = (data: ProfileFormData) => {
        updateProfile.mutate(data);
    };

    const onPasswordSubmit = (data: PasswordFormData) => {
        changePassword.mutate(
            { current_password: data.current_password, new_password: data.new_password },
            { onSuccess: () => passwordForm.reset() },
        );
    };

    const MEMBERSHIP_COLORS: Record<string, string> = {
        basic: 'bg-gray-100 text-gray-700 border-gray-200',
        silver: 'bg-slate-200 text-slate-700 border-slate-300',
        gold: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        platinum: 'bg-purple-100 text-purple-700 border-purple-200',
    };

    return (
        <div className="space-y-6">
            <PageLoader open={isLoading || updateProfile.isPending || changePassword.isPending} />

            <div>
                <h1 className="text-3xl font-bold">Profile</h1>
                <p className="text-muted-foreground mt-1">Manage your vendor profile and account settings</p>
            </div>

            {!isLoading && (
                <div className="grid gap-6 md:grid-cols-3">
                    {/* ── Left column: summary card ── */}
                    <Card className="md:col-span-1">
                        <CardHeader>
                            <CardTitle>Account Info</CardTitle>
                            <CardDescription>Your vendor account details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Avatar */}
                            <div className="flex items-center justify-center">
                                <div
                                    className="relative cursor-pointer group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Avatar className="h-24 w-24 border">
                                        <AvatarImage src={resolveMediaUrl(vendor?.profile || '')} className="object-cover" />
                                        <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
                                            {vendor?.name?.charAt(0).toUpperCase() ?? 'V'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        {uploadMedia.isPending
                                            ? <Spinner className="h-6 w-6 text-white" />
                                            : <Camera className="h-5 w-5 text-white" />}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />
                                </div>
                            </div>

                            <div className="text-center">
                                <h3 className="font-semibold text-lg">{vendor?.name ?? '—'}</h3>
                                <p className="text-sm text-muted-foreground">{vendor?.email}</p>
                            </div>

                            <Separator />

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="text-muted-foreground">Company:</span>
                                    <span className="font-medium truncate">{vendor?.company_name ?? '—'}</span>
                                </div>
                                {vendor?.contact && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <span className="text-muted-foreground">Contact:</span>
                                        <span>{vendor.contact}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="text-muted-foreground">Membership:</span>
                                    {vendor?.membership && (
                                        <Badge
                                            variant="outline"
                                            className={`capitalize text-xs ${MEMBERSHIP_COLORS[vendor.membership] ?? ''}`}
                                        >
                                            {vendor.membership}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="text-muted-foreground">Status:</span>
                                    <Badge
                                        variant="outline"
                                        className={vendor?.status === 'active'
                                            ? 'bg-green-100 text-green-700 border-green-200'
                                            : 'bg-red-100 text-red-700 border-red-200'}
                                    >
                                        {vendor?.status ?? '—'}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Right column: forms ── */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Profile Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-4 w-4" /> Personal Information
                                </CardTitle>
                                <CardDescription>Update your personal and company details</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name</Label>
                                            <Input id="name" placeholder="Your name" {...profileForm.register('name')} />
                                            {profileForm.formState.errors.name && (
                                                <p className="text-xs text-destructive">{profileForm.formState.errors.name.message}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="contact">Contact Number</Label>
                                            <Input id="contact" placeholder="+1234567890" {...profileForm.register('contact')} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">Personal Address</Label>
                                        <Input id="address" placeholder="Your address" {...profileForm.register('address')} />
                                    </div>

                                    <Separator />
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Company Details</p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="company_name">Company Name</Label>
                                            <Input id="company_name" placeholder="Company name" {...profileForm.register('company_name')} />
                                            {profileForm.formState.errors.company_name && (
                                                <p className="text-xs text-destructive">{profileForm.formState.errors.company_name.message}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="company_contact">Company Contact</Label>
                                            <Input id="company_contact" placeholder="Company phone" {...profileForm.register('company_contact')} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="company_email">Company Email</Label>
                                            <Input id="company_email" type="email" placeholder="company@example.com" {...profileForm.register('company_email')} />
                                            {profileForm.formState.errors.company_email && (
                                                <p className="text-xs text-destructive">{profileForm.formState.errors.company_email.message}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="website">Website</Label>
                                            <Input id="website" placeholder="https://example.com" {...profileForm.register('website')} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="company_address">Company Address</Label>
                                        <Input id="company_address" placeholder="Company address" {...profileForm.register('company_address')} />
                                    </div>

                                    <Button type="submit" disabled={updateProfile.isPending}>
                                        {updateProfile.isPending ? 'Saving…' : 'Update Profile'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Change Password */}
                        <Card id="change-password">
                            <CardHeader>
                                <CardTitle>Change Password</CardTitle>
                                <CardDescription>Update your account password</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="current_password">Current Password</Label>
                                        <Input
                                            id="current_password"
                                            type="password"
                                            placeholder="Enter current password"
                                            {...passwordForm.register('current_password')}
                                        />
                                        {passwordForm.formState.errors.current_password && (
                                            <p className="text-xs text-destructive">{passwordForm.formState.errors.current_password.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="new_password">New Password</Label>
                                        <Input
                                            id="new_password"
                                            type="password"
                                            placeholder="Enter new password"
                                            {...passwordForm.register('new_password')}
                                        />
                                        {passwordForm.formState.errors.new_password && (
                                            <p className="text-xs text-destructive">{passwordForm.formState.errors.new_password.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirm_password">Confirm New Password</Label>
                                        <Input
                                            id="confirm_password"
                                            type="password"
                                            placeholder="Confirm new password"
                                            {...passwordForm.register('confirm_password')}
                                        />
                                        {passwordForm.formState.errors.confirm_password && (
                                            <p className="text-xs text-destructive">{passwordForm.formState.errors.confirm_password.message}</p>
                                        )}
                                    </div>

                                    <Button type="submit" disabled={changePassword.isPending}>
                                        {changePassword.isPending ? 'Changing…' : 'Change Password'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
