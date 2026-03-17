'use client';

import { useState } from 'react';
import { CommonTable } from '@/components/common/common-table';
import { useContacts, useDeleteContact, Contact } from '@/hooks/use-contacts';
import { DeleteDialog } from '@/components/common/delete-dialog';
import { Button } from '@/components/ui/button';
import { Trash2, Eye } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { PageLoader } from '@/components/common/page-loader';
import { TablePagination } from '@/components/common/table-pagination';
import { useIsPluginActive } from '@/hooks/use-plugins';
import { PluginDisabledState } from '@/components/common/plugin-disabled';

export function ContactsContent() {
    const isActive = useIsPluginActive('contact-form');
    const { t } = useTranslation();
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search] = useState('');
    const [sort, setSort] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // API params
    const queryParams: any = {
        page,
        limit,
        search,
        sortBy: sort?.column,
        sortDesc: sort?.direction === 'desc',
    };
    if (filterStatus !== 'all') {
        queryParams.status = filterStatus;
    }

    const { data: contactsResponse, isLoading } = useContacts(queryParams);
    const deleteContact = useDeleteContact();

    const [deleteId, setDeleteId] = useState<number | null>(null);

    const rawContacts: Contact[] = contactsResponse?.data || [];

    const handleSort = (column: string) => {
        if (sort?.column === column) {
            if (sort.direction === 'asc') setSort({ column, direction: 'desc' });
            else setSort(null);
        } else {
            setSort({ column, direction: 'asc' });
        }
    };

    const columns = [
        {
            key: 'name',
            header: t('common.name', 'Name'),
            sortable: true,
            render: (row: any) => (
                <div className="font-medium text-sm flex flex-col gap-0.5 max-w-[200px]">
                    <span className="truncate" title={row.name}>{row.name}</span>
                    <span className="text-xs text-muted-foreground font-normal truncate" title={row.email}>{row.email}</span>
                </div>
            )
        },
        {
            key: 'phone',
            header: t('common.phone', 'Phone'),
            render: (row: any) => <span className="text-sm whitespace-nowrap">{row.phone || '-'}</span>
        },
        {
            key: 'subject',
            header: t('contacts.subject', 'Subject'),
            render: (row: any) => (
                <div className="max-w-[250px] truncate text-sm" title={row.subject || 'No Subject'}>
                    {row.subject || <span className="italic text-muted-foreground">No Subject</span>}
                </div>
            )
        },
        {
            key: 'status',
            header: t('common.status', 'Status'),
            sortable: true,
            render: (row: any) => (
                <Badge className={`font-medium text-xs border-0 ${row.status === 'read' ? 'bg-green-500 text-white hover:bg-green-500' : 'bg-yellow-400 text-yellow-900 hover:bg-yellow-400'}`}>
                    {row.status === 'read' ? t('contacts.read', 'Read') : t('contacts.unread', 'Unread')}
                </Badge>
            )
        },
        {
            key: 'created_at',
            header: t('common.created_at', 'Date'),
            sortable: true,
            render: (row: any) => {
                const date = new Date(row.createdAt || row.created_at);
                return (
                    <div className="text-sm">
                        {date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        <p className="text-xs text-muted-foreground mt-0.5">{date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                )
            }
        },
        {
            key: 'actions',
            header: t('common.actions', 'Actions'),
            headerAlign: 'right' as const,
            render: (row: any) => (
                <div className="flex justify-end gap-2 items-center">
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => router.push(`/admin/contacts/${row.id}/view`)}
                        className="h-8 gap-1.5 px-3"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        {t('common.view', 'View')}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(row.id)}
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        title={t('common.delete', 'Delete')}
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            )
        }
    ];

    // Options for filtering by status
    const statusFilters = [
        { label: t('common.all', 'All'), value: 'all' },
        { label: t('contacts.unread', 'Unread'), value: 'unread' },
        { label: t('contacts.read', 'Read'), value: 'read' },
    ];

    if (!isActive) return <PluginDisabledState pluginName="Contact Form" pluginSlug="contact-form" />;

    return (
        <div className="space-y-6">
            <PageLoader open={isLoading || deleteContact.isPending} />
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{t('nav.contact', 'Contact Messages')}</CardTitle>
                            <CardDescription>{t('contacts.description', 'Manage and reply to inquiries sent via the contact form.')}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            {statusFilters.map((filter) => (
                                <Button
                                    key={filter.value}
                                    variant={filterStatus === filter.value ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => {
                                        setFilterStatus(filter.value);
                                        setPage(1);
                                    }}
                                >
                                    {filter.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <CommonTable
                        data={rawContacts as any}
                        columns={columns}
                        isLoading={isLoading}
                        sortColumn={sort?.column}
                        sortDirection={sort?.direction?.toLowerCase() as "asc" | "desc" | undefined}
                        onSort={handleSort}
                        showStatus={false}
                        showCreated={false}
                        showActions={false}
                        emptyMessage={t('contacts.no_contacts', 'No contact messages found')}
                    />

                    {contactsResponse?.pagination && (
                        <TablePagination
                            pagination={{ ...contactsResponse.pagination, limit }}
                            onPageChange={setPage}
                            onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
                        />
                    )}
                </CardContent>
            </Card>

            <DeleteDialog
                open={!!deleteId}
                onOpenChange={(open: boolean) => {
                    if (!open) setDeleteId(null);
                }}
                onConfirm={() => {
                    if (deleteId) {
                        deleteContact.mutate(deleteId, {
                            onSuccess: () => setDeleteId(null),
                            onError: () => setDeleteId(null)
                        });
                    }
                }}
                isDeleting={deleteContact.isPending}
                title={t('contacts.delete', 'Delete Contact Message')}
                description={t('contacts.delete_confirm', 'Are you sure you want to delete this message? This action cannot be undone and will delete all replies associated with it.')}
            />
        </div>
    );
}

