'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/use-translation';
import { Plus, Image as ImageIcon } from 'lucide-react';
import {
    useSimpleSliders,
    useDeleteSimpleSlider,
    useUpdateSimpleSlider,
    type SimpleSlider,
} from '@/hooks/use-simple-sliders';
import { CommonTable, type CommonColumn } from '@/components/common/common-table';
import { PageLoader } from '@/components/common/page-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DeleteDialog } from '@/components/common/delete-dialog';
import { TablePagination } from '@/components/common/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useIsPluginActive } from '@/hooks/use-plugins';
import { PluginDisabledState } from '@/components/common/plugin-disabled';

export function SimpleSlidersContent() {
    const isActive = useIsPluginActive('simple-slider');
    const router = useRouter();
    const { t } = useTranslation();

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');

    const { data: qData, isLoading } = useSimpleSliders({ page, limit, search });
    const { mutate: deleteSlider, isPending: isDeleting } = useDeleteSimpleSlider();
    const { mutate: updateSlider } = useUpdateSimpleSlider();

    const [deleteId, setDeleteId] = useState<number | null>(null);

    const columns: CommonColumn<SimpleSlider>[] = useMemo(() => [
        {
            key: 'name',
            header: t('simple_sliders.name', 'Name'),
            render: (row) => <span className="font-medium">{row.name}</span>,
        },
        {
            key: 'key',
            header: t('simple_sliders.key', 'Key'),
            render: (row) => <span className="text-muted-foreground font-mono text-sm">{row.key}</span>,
        },
        {
            key: 'items_count',
            header: t('simple_sliders.items', 'Items'),
            render: (row) => {
                const count = Array.isArray(row.slider_items) ? row.slider_items.length : 0;
                return <Badge variant="outline">{count} {count === 1 ? 'item' : 'items'}</Badge>;
            },
        },
        {
            key: 'status_display',
            header: 'Status',
            render: (row) => {
                // is_active: 0=inactive/draft, 1=active/published, 2=pending approval
                if (row.is_active === 2) {
                    return (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded bg-yellow-100 text-yellow-800 border border-yellow-200">
                            Pending
                        </span>
                    );
                }
                return (
                    <Switch
                        checked={row.is_active === 1}
                        onCheckedChange={(val) =>
                            updateSlider({ id: row.id, payload: { is_active: val ? 1 : 0 } })
                        }
                    />
                );
            },
        },
    ], [t, updateSlider]);

    const sliders: SimpleSlider[] = (qData as any)?.data || (Array.isArray(qData) ? qData : []);
    const pagination = (qData as any)?.pagination;

    const dataForTable = sliders.map(item => ({
        ...item,
        is_active: item.is_active as any,
        created_at: item.created_at || new Date().toISOString(),
    }));

    if (!isActive) return <PluginDisabledState pluginName="Simple Slider" pluginSlug="simple-slider" />;

    return (
        <>
            <PageLoader open={isLoading || isDeleting} />
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <ImageIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>{t('simple_sliders.title', 'Simple Sliders')}</CardTitle>
                                <CardDescription>{t('simple_sliders.desc', 'Manage homepage sliders and slide items')}</CardDescription>
                            </div>
                        </div>
                        <Button onClick={() => router.push('/admin/simple-sliders/new')}>
                            <Plus className="mr-2 h-4 w-4" /> {t('simple_sliders.add', 'Add Slider')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <CommonTable
                        columns={columns}
                        data={dataForTable as any}
                        isLoading={isLoading}
                        searchPlaceholder={t('simple_sliders.search', 'Search sliders...')}
                        onSearch={setSearch}
                        onEdit={(row) => router.push(`/admin/simple-sliders/${row.id}`)}
                        onDelete={(row) => setDeleteId(row.id)}
                        showStatus={false}
                        showCreated={false}
                        showActions={true}
                    />
                    {pagination && (
                        <TablePagination
                            pagination={{ ...pagination, limit }}
                            onPageChange={setPage}
                            onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
                        />
                    )}
                </CardContent>
            </Card>

            <DeleteDialog
                open={!!deleteId}
                onOpenChange={(open: boolean) => { if (!open) setDeleteId(null); }}
                title={t('simple_sliders.delete', 'Delete Slider')}
                description={t('simple_sliders.delete_confirm', 'Are you sure you want to delete this slider? All slide items will also be removed. This action cannot be undone.')}
                isDeleting={isDeleting}
                onConfirm={() => {
                    if (deleteId) {
                        deleteSlider(deleteId, {
                            onSuccess: () => setDeleteId(null),
                            onError: () => setDeleteId(null)
                        });
                    }
                }}
            />
        </>
    );
}
