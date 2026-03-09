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
import { resolveMediaUrl } from '@/lib/utils';
import { Plus } from 'lucide-react';

const MEMBERSHIP_COLORS: Record<string, string> = {
    basic:    'bg-gray-100 text-gray-700',
    silver:   'bg-slate-200 text-slate-700',
    gold:     'bg-yellow-100 text-yellow-700',
    platinum: 'bg-purple-100 text-purple-700',
};

export function VendorsContent() {
    const router = useRouter();
    const [page, setPage]         = useState(1);
    const [limit]                 = useState(10);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data: vendorsRes, isLoading } = useVendors({ page, limit });
    const deleteVendor = useDeleteVendor();
    const updateStatus = useUpdateVendorStatus();

    const vendors: Vendor[] = vendorsRes?.data || [];

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
                <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{row.company_name}</p>
                    {row.company_email && (
                        <p className="text-xs text-muted-foreground truncate">{row.company_email}</p>
                    )}
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
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
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
                        onEdit={(row) => router.push(`/admin/vendors/${row.id}/edit`)}
                        onDelete={(row) => setDeleteId(row.id)}
                        emptyMessage="No vendors found. Add your first vendor."
                    />
                    {vendorsRes?.pagination && vendorsRes.pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                            <div>
                                Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, vendorsRes.pagination.totalItems)} of {vendorsRes.pagination.totalItems}
                            </div>
                            <div className="flex gap-1">
                                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                                <Button size="sm" variant="outline" disabled={!vendorsRes.pagination.hasNextPage} onClick={() => setPage(p => p + 1)}>Next</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <DeleteDialog
                open={!!deleteId}
                onOpenChange={(open) => { if (!open) setDeleteId(null); }}
                title="Delete Vendor"
                description="Are you sure you want to delete this vendor? This action cannot be undone."
                isDeleting={deleteVendor.isPending}
                onConfirm={() => {
                    if (deleteId) deleteVendor.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
                }}
            />
        </div>
    );
}
