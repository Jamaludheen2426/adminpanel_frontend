'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVendors, useDeleteVendor, useUpdateVendorStatus, Vendor } from '@/hooks/use-vendors';
import { CommonTable } from '@/components/common/common-table';
import { DeleteDialog } from '@/components/common/delete-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { resolveMediaUrl } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { PageLoader } from '@/components/common/page-loader';
import { TablePagination } from '@/components/common/table-pagination';

const MEMBERSHIP_COLORS: Record<string, string> = {
    basic: 'bg-gray-100 text-gray-700',
    silver: 'bg-slate-200 text-slate-700',
    gold: 'bg-yellow-100 text-yellow-700',
    platinum: 'bg-purple-100 text-purple-700',
};

function VendorDetailPane({ vendor, open, onClose }: { vendor: Vendor | null; open: boolean; onClose: () => void }) {
    const router = useRouter();
    if (!vendor) return null;

    const row = (label: string, value: string | null | undefined) =>
        value ? (
            <div className="flex flex-col gap-0.5">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</span>
                <span className="text-sm">{value}</span>
            </div>
        ) : null;

    return (
        <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <SheetContent side="right" className="w-full sm:max-w-[400px] flex flex-col p-0 overflow-y-auto">
                {/* Top — name + location */}
                <SheetHeader className="px-5 pt-6 pb-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border shrink-0">
                            <AvatarImage src={resolveMediaUrl(vendor.profile || '')} />
                            <AvatarFallback className="text-base bg-primary/10 text-primary">
                                {vendor.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <SheetTitle className="text-base font-semibold leading-tight">{vendor.name}</SheetTitle>
                            {vendor.company_address && (
                                <p className="text-sm text-muted-foreground mt-0.5">{vendor.company_address}</p>
                            )}
                        </div>
                    </div>

                    {/* Membership badge */}
                    <Badge className={`w-fit mt-2 border-0 capitalize text-xs ${MEMBERSHIP_COLORS[vendor.membership] || ''}`}>
                        {vendor.membership}
                    </Badge>
                </SheetHeader>

                <Separator />

                {/* Company info */}
                <div className="px-5 py-4 flex flex-col gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Company</p>
                    {vendor.company_logo && (
                        <img
                            src={resolveMediaUrl(vendor.company_logo)}
                            alt={vendor.company_name}
                            className="h-10 w-28 object-contain rounded border border-border bg-muted/30"
                        />
                    )}
                    {row('Company Name', vendor.company_name)}
                    {row('Registration No.', vendor.reg_no)}
                    {row('GST No.', vendor.gst_no)}
                    {row('Company Email', vendor.company_email)}
                    {row('Company Contact', vendor.company_contact)}
                    {row('Landline', vendor.landline)}
                    {row('Address', vendor.company_address)}
                    {row('Website', vendor.website)}
                </div>

                <Separator />

                {/* Vendor info */}
                <div className="px-5 py-4 flex flex-col gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vendor</p>
                    {row('Email', vendor.email)}
                    {row('Contact', vendor.contact)}
                    {row('Address', vendor.address)}
                </div>

                <Separator />

                {/* Bank info */}
                <div className="px-5 py-4 flex flex-col gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bank</p>
                    {row('Bank Name', vendor.bank_name)}
                    {row('Account No.', vendor.acc_no)}
                    {row('IFSC Code', vendor.ifsc_code)}
                    {row('Account Type', vendor.acc_type)}
                    {row('Branch', vendor.branch)}
                </div>

                <Separator />

                <div className="px-5 py-4 flex gap-2">
                    <Button size="sm" onClick={() => { onClose(); router.push(`/admin/vendors/${vendor.id}/edit`); }}>
                        Edit Vendor
                    </Button>
                    <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

export function VendorsContent() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

    const { data: vendorsRes, isLoading } = useVendors({ page, limit });
    const deleteVendor = useDeleteVendor();
    const updateStatus = useUpdateVendorStatus();

    const vendors: Vendor[] = (vendorsRes?.data || []).map((v: any) => ({
        ...v,
        created_at: v.created_at || v.createdAt || '',
    }));

    const columns = [
        {
            key: 'name',
            header: 'Vendor',
            render: (row: Vendor) => (
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border">
                        <AvatarImage src={resolveMediaUrl(row.profile || '')} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {row.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{row.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{row.email}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'company_name',
            header: 'Company',
            render: (row: Vendor) => (
                <div className="flex items-center gap-3">
                    {row.company_logo ? (
                        <img
                            src={resolveMediaUrl(row.company_logo)}
                            alt={row.company_name}
                            className="h-8 w-16 object-contain rounded border border-border shrink-0 bg-muted/30"
                        />
                    ) : (
                        <div className="h-8 w-16 rounded border border-border bg-muted/30 flex items-center justify-center shrink-0">
                            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide">Logo</span>
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{row.company_name}</p>
                        {row.company_email ? (
                            <p className="text-xs text-muted-foreground truncate">{row.company_email}</p>
                        ) : null}
                    </div>
                </div>
            ),
        },
        {
            key: 'membership',
            header: 'Membership',
            render: (row: Vendor) => (
                <Badge className={`text-xs border-0 capitalize ${MEMBERSHIP_COLORS[row.membership] || ''}`}>
                    {row.membership}
                </Badge>
            ),
        },
        {
            key: 'contact',
            header: 'Contact',
            render: (row: Vendor) => (
                <span className="text-sm">{row.contact || row.company_contact || '—'}</span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            render: (row: Vendor) => (
                <Switch
                    checked={row.status === 'active'}
                    disabled={updateStatus.isPending && updateStatus.variables?.id === row.id}
                    onCheckedChange={(checked) =>
                        updateStatus.mutate({ id: row.id, status: checked ? 'active' : 'inactive' })
                    }
                />
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageLoader open={isLoading || deleteVendor.isPending || updateStatus.isPending} />
            <VendorDetailPane
                vendor={selectedVendor}
                open={!!selectedVendor}
                onClose={() => setSelectedVendor(null)}
            />
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <CardTitle>Vendors</CardTitle>
                            <CardDescription>Manage vendor accounts and their details.</CardDescription>
                        </div>
                        <Button onClick={() => router.push('/admin/vendors/new')} className="gap-2">
                            <Plus className="h-4 w-4" /> Add Vendor
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <CommonTable
                        data={vendors as any}
                        columns={columns}
                        isLoading={isLoading}
                        showStatus={false}
                        showCreated={true}
                        showActions={true}
                        onRowClick={(row) => setSelectedVendor(row as Vendor)}
                        onEdit={(row) => router.push(`/admin/vendors/${row.id}/edit`)}
                        onDelete={(row) => setDeleteId(row.id)}
                        emptyMessage="No vendors found. Add your first vendor."
                    />
                    {vendorsRes?.pagination && (
                        <TablePagination
                            pagination={{ ...vendorsRes.pagination, limit }}
                            onPageChange={setPage}
                            onLimitChange={setLimit}
                        />
                    )}
                </CardContent>
            </Card>

            <DeleteDialog
                open={!!deleteId}
                onOpenChange={(open: boolean) => { if (!open) setDeleteId(null); }}
                title="Delete Vendor"
                description="Are you sure you want to delete this vendor? This action cannot be undone."
                isDeleting={deleteVendor.isPending}
                onConfirm={() => {
                    if (deleteId) {
                        deleteVendor.mutate(deleteId, {
                            onSuccess: () => setDeleteId(null),
                            onError: () => setDeleteId(null)
                        });
                    }
                }}
            />
        </div>
    );
}
