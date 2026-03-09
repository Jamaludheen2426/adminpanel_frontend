'use client';

import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useCreateVendor, useUpdateVendor, Vendor } from '@/hooks/use-vendors';
import { CommonForm, CommonFormSection } from '@/components/common/common-form';
import { Building2, User, Landmark } from 'lucide-react';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const baseSchema = z.object({
    company_name:    z.string().min(1, 'Company name is required'),
    reg_no:          z.string().optional(),
    gst_no:          z.string().optional(),
    company_address: z.string().optional(),
    company_contact: z.string().optional(),
    landline:        z.string().optional(),
    company_email:   z.string().email('Invalid email').optional().or(z.literal('')),
    website:         z.string().optional(),
    youtube:         z.string().optional(),
    facebook:        z.string().optional(),
    instagram:       z.string().optional(),
    name:            z.string().min(1, 'Vendor name is required'),
    address:         z.string().optional(),
    contact:         z.string().optional(),
    email:           z.string().email('Invalid email'),
    membership:      z.enum(['basic', 'silver', 'gold', 'platinum']).default('basic'),
    bank_name:       z.string().optional(),
    acc_no:          z.string().optional(),
    ifsc_code:       z.string().optional(),
    acc_type:        z.enum(['savings', 'current', 'overdraft']).optional(),
    branch:          z.string().optional(),
});

const createSchema = baseSchema.extend({
    password:         z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string().min(1, 'Please confirm password'),
}).refine(d => d.password === d.confirm_password, { message: 'Passwords do not match', path: ['confirm_password'] });

const editSchema = baseSchema.extend({
    password:         z.string().min(6).optional().or(z.literal('')),
    confirm_password: z.string().optional().or(z.literal('')),
}).refine(d => !d.password || d.password === d.confirm_password, { message: 'Passwords do not match', path: ['confirm_password'] });

// ─── Sections config ─────────────────────────────────────────────────────────

const sections = (isEdit: boolean): CommonFormSection[] => [
    {
        title: 'Company Information',
        icon: Building2,
        fields: [
            { name: 'company_name',    label: 'Company Name',    type: 'text',  placeholder: 'Acme Pvt Ltd',        required: true },
            { name: 'reg_no',          label: 'Registration No.', type: 'text', placeholder: 'REG123456' },
            { name: 'gst_no',          label: 'GST No.',          type: 'text', placeholder: '22AAAAA0000A1Z5' },
            { name: 'company_contact', label: 'Company Contact',  type: 'text', placeholder: '+91 9000000000' },
            { name: 'landline',        label: 'Landline',         type: 'text', placeholder: '022-12345678' },
            { name: 'company_email',   label: 'Company Email',    type: 'email', placeholder: 'info@company.com' },
            { name: 'company_address', label: 'Company Address',  type: 'text', placeholder: '123 Business Park, City', colSpan: 2 },
            { name: 'website',         label: 'Website',          type: 'text', placeholder: 'https://company.com' },
            { name: 'youtube',         label: 'YouTube',          type: 'text', placeholder: 'https://youtube.com/channel/...' },
            { name: 'facebook',        label: 'Facebook',         type: 'text', placeholder: 'https://facebook.com/...' },
            { name: 'instagram',       label: 'Instagram',        type: 'text', placeholder: 'https://instagram.com/...' },
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
            { name: 'name',       label: 'Vendor Name',  type: 'text',  placeholder: 'John Doe',            required: true },
            { name: 'contact',    label: 'Contact',      type: 'text',  placeholder: '+91 9000000000' },
            { name: 'email',      label: 'Login Email',  type: 'email', placeholder: 'vendor@example.com',  required: true },
            {
                name: 'membership', label: 'Membership', type: 'select',
                options: [
                    { value: 'basic',    label: 'Basic' },
                    { value: 'silver',   label: 'Silver' },
                    { value: 'gold',     label: 'Gold' },
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
            { name: 'bank_name', label: 'Bank Name',       type: 'text', placeholder: 'State Bank of India' },
            { name: 'acc_no',    label: 'Account Number',  type: 'text', placeholder: '0123456789' },
            { name: 'ifsc_code', label: 'IFSC Code',       type: 'text', placeholder: 'SBIN0001234' },
            {
                name: 'acc_type', label: 'Account Type', type: 'select',
                options: [
                    { value: 'savings',   label: 'Savings' },
                    { value: 'current',   label: 'Current' },
                    { value: 'overdraft', label: 'Overdraft' },
                ],
            },
            { name: 'branch', label: 'Branch', type: 'text', placeholder: 'MG Road Branch' },
        ],
    },
];

// ─── Component ───────────────────────────────────────────────────────────────

interface Props { vendor?: Vendor; }

export function VendorForm({ vendor }: Props) {
    const router  = useRouter();
    const isEdit  = !!vendor;
    const create  = useCreateVendor();
    const update  = useUpdateVendor();

    const defaultValues = vendor ? {
        company_name: vendor.company_name, reg_no: vendor.reg_no || '',
        gst_no: vendor.gst_no || '', company_address: vendor.company_address || '',
        company_contact: vendor.company_contact || '', landline: vendor.landline || '',
        company_email: vendor.company_email || '', website: vendor.website || '',
        youtube: vendor.youtube || '', facebook: vendor.facebook || '',
        instagram: vendor.instagram || '', name: vendor.name,
        address: vendor.address || '', contact: vendor.contact || '',
        email: vendor.email, membership: vendor.membership,
        profile: vendor.profile || '', bank_logo: vendor.bank_logo || '',
        password: '', confirm_password: '',
        bank_name: vendor.bank_name || '', acc_no: vendor.acc_no || '',
        ifsc_code: vendor.ifsc_code || '', acc_type: vendor.acc_type || undefined,
        branch: vendor.branch || '',
    } : { membership: 'basic' };

    const handleSubmit = (data: any) => {
        const { confirm_password, ...payload } = data;
        if (!payload.password) delete payload.password;

        if (isEdit && vendor) {
            update.mutate({ id: vendor.id, data: payload }, { onSuccess: () => router.push('/admin/vendors') });
        } else {
            create.mutate(payload, { onSuccess: () => router.push('/admin/vendors') });
        }
    };

    return (
        <CommonForm
            schema={isEdit ? editSchema : createSchema}
            sections={sections(isEdit)}
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
