'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText } from 'lucide-react';
import { usePages, useDeletePage, useUpdatePageStatus, type Page } from '@/hooks/use-pages';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DeleteDialog } from '@/components/common/delete-dialog';
import { CommonTable, type CommonColumn } from '@/components/common/common-table';
import { PageLoader } from '@/components/common/page-loader';

function normalise(item: Page): Page & { created_at: string; is_active: boolean } {
    return {
        ...item,
        is_active: item.status === 1,
        created_at: (item as any).created_at ?? (item as any).createdAt ?? '',
    };
}

export function PagesContent() {
    const router = useRouter();
    const { data: result, isLoading } = usePages();
    const rawPages: Page[] = result?.data ?? (Array.isArray(result) ? result : []);
    const pages = useMemo(() => rawPages.map(normalise), [rawPages]);

    const deletePage = useDeletePage();
    const updateStatus = useUpdatePageStatus();
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const deleteName = pages.find((p) => p.id === deleteId)?.name ?? '';

    const columns: CommonColumn<Page>[] = [
        {
            key: 'name',
            header: 'Page',
            render: (row) => (
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{row.name}</p>
                        {row.is_featured ? (
                            <Badge variant="secondary" className="text-[10px] h-4 px-1 shrink-0">Featured</Badge>
                        ) : null}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                        /{row.slug}
                    </p>
                </div>
            ),
        },
        {
            key: 'template',
            header: 'Template',
            render: (row) => (
                <span className="text-xs text-muted-foreground capitalize">
                    {row.template ?? 'default'}
                </span>
            ),
        },
    ];

    return (
        <>
            <PageLoader open={isLoading || deletePage.isPending || updateStatus.isPending} />
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Pages</CardTitle>
                                <CardDescription>
                                    Create and manage pages that appear on your website
                                </CardDescription>
                            </div>
                        </div>
                        <Button onClick={() => router.push('/admin/pages/create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Page
                        </Button>
                    </div>
                </CardHeader>

                <CardContent>
                    <CommonTable
                        columns={columns}
                        data={pages as any}
                        isLoading={isLoading}
                        emptyMessage="No pages found. Create your first page to get started."
                        onStatusToggle={(row, val) =>
                            updateStatus.mutate({ id: row.id, status: val ? 1 : 0 })
                        }
                        onEdit={(row) => router.push(`/admin/pages/${row.id}`)}
                        onDelete={(row) => setDeleteId(row.id)}
                        showStatus
                        showCreated
                        showActions
                    />
                </CardContent>
            </Card>

            <DeleteDialog
                open={deleteId !== null}
                onOpenChange={(open: boolean) => { if (!open) setDeleteId(null); }}
                title="Delete Page"
                description={`Are you sure you want to delete "${deleteName}"? This cannot be undone.`}
                onConfirm={() => {
                    if (deleteId) {
                        deletePage.mutate(deleteId, {
                            onSuccess: () => setDeleteId(null),
                            onError: () => setDeleteId(null)
                        });
                    }
                }}
                isDeleting={deletePage.isPending}
            />
        </>
    );
}
