'use client';

import { useState } from 'react';
import { Plus, Blocks } from 'lucide-react';
import { useUiBlocks, useDeleteUiBlock, useToggleUiBlock, UiBlock } from '@/hooks/use-ui-blocks';
import { CommonTable } from '@/components/common/common-table';
import { DeleteDialog } from '@/components/common/delete-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageLoader } from '@/components/common/page-loader';
import { TablePagination } from '@/components/common/table-pagination';
import { UiBlockForm } from './ui-block-form';

export function UiBlocksContent() {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');
    const [editBlock, setEditBlock] = useState<UiBlock | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data: response, isLoading } = useUiBlocks({ page, limit, search });
    const blocks: UiBlock[] = (response?.data || []).map((b) => ({
        ...b,
        created_at: b.created_at || (b as any).createdAt || '',
    }));
    const pagination = response?.pagination;

    const deleteBlock = useDeleteUiBlock();
    const toggleBlock = useToggleUiBlock();

    const isFormOpen = createOpen || !!editBlock;

    const columns = [
        {
            key: 'label',
            header: 'Block Name',
            sortable: true,
            render: (row: UiBlock) => (
                <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${row.color || 'bg-slate-500'}`} />
                    <div>
                        <div className="font-medium">{row.label}</div>
                        <div className="text-xs text-muted-foreground font-mono">{row.type}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'description',
            header: 'Description',
            render: (row: UiBlock) => (
                <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
                    {row.description || '—'}
                </span>
            ),
        },
        {
            key: 'fields',
            header: 'Fields',
            render: (row: UiBlock) => (
                <Badge variant="secondary">
                    {Array.isArray(row.fields) ? row.fields.length : 0} fields
                </Badge>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageLoader open={isLoading || deleteBlock.isPending || toggleBlock.isPending} />

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Blocks className="h-5 w-5 text-primary" />
                                UI Blocks
                            </CardTitle>
                            <CardDescription>
                                Define reusable content block types that admins can assemble into pages.
                            </CardDescription>
                        </div>
                        <Button size="sm" onClick={() => setCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Block Type
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <CommonTable
                        data={blocks as any}
                        columns={columns as any}
                        isLoading={isLoading}
                        onEdit={(row: any) => setEditBlock(row)}
                        onDelete={(row: any) => setDeleteId(row.id)}
                        onStatusToggle={(row: any, val: boolean) =>
                            toggleBlock.mutate(row.id)
                        }
                        showCreated
                        showActions
                        emptyMessage="No block types yet. Create your first block type."
                    />
                    {pagination && (
                        <TablePagination
                            pagination={{ ...pagination, limit }}
                            onPageChange={setPage}
                            onLimitChange={setLimit}
                        />
                    )}
                </CardContent>
            </Card>

            {isFormOpen && (
                <UiBlockForm
                    open={isFormOpen}
                    onOpenChange={(open) => {
                        if (!open) { setCreateOpen(false); setEditBlock(null); }
                    }}
                    block={editBlock}
                />
            )}

            <DeleteDialog
                open={!!deleteId}
                onOpenChange={(open) => { if (!open) setDeleteId(null); }}
                onConfirm={() => {
                    if (deleteId) {
                        deleteBlock.mutate(deleteId, {
                            onSuccess: () => setDeleteId(null),
                            onError: () => setDeleteId(null),
                        });
                    }
                }}
                isDeleting={deleteBlock.isPending}
                title="Delete Block Type"
                description="Are you sure? Pages using this block type will lose this section."
            />
        </div>
    );
}
