'use client';

import { useState } from 'react';
import { CommonTable } from '@/components/common/common-table';
import { useAdBanners, useCreateAdBanner, useUpdateAdBanner, useDeleteAdBanner, AdBanner } from '@/hooks/use-ad-banners';
import { BannerForm } from './banner-form';
import { DeleteDialog } from '@/components/common/delete-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Monitor, Tablet, Smartphone, LayoutTemplate, Plus } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { PageLoader } from '@/components/common/page-loader';
import { TablePagination } from '@/components/common/table-pagination';
import { useIsPluginActive } from '@/hooks/use-plugins';
import { PluginDisabledState } from '@/components/common/plugin-disabled';

const TYPE_CONFIG = {
    desktop: { label: 'Desktop', icon: Monitor, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    tablet: { label: 'Tablet', icon: Tablet, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
    mobile: { label: 'Mobile', icon: Smartphone, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    all: { label: 'All Devices', icon: LayoutTemplate, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
};

export function BannersContent() {
    const isActive = useIsPluginActive('ads');
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');
    const [editBanner, setEditBanner] = useState<AdBanner | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const { data: response, isLoading } = useAdBanners({ page, limit, search });
    const rawBanners: AdBanner[] = response?.data || [];
    const pagination = response?.pagination;
    const banners = rawBanners.map(banner => ({
        ...banner,
        is_active: banner.is_active as boolean | number,
        created_at: banner.created_at || new Date().toISOString()
    }));

    const createBanner = useCreateAdBanner();
    const updateBanner = useUpdateAdBanner();
    const deleteBanner = useDeleteAdBanner();

    const handleSave = (data: any) => {
        if (editBanner) {
            updateBanner.mutate({ id: editBanner.id, data });
            setEditBanner(null);
        } else {
            createBanner.mutate(data);
            setCreateOpen(false);
        }
    };

    const columns = [
        {
            key: 'name',
            header: t('common.name', 'Name'),
            sortable: true,
            render: (row: AdBanner) => (
                <div>
                    <div className="font-medium">{row.name}</div>
                    {row.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{row.description}</div>}
                </div>
            ),
        },
        {
            key: 'type',
            header: t('ads.device', 'Device'),
            render: (row: AdBanner) => (
                <div className="flex flex-wrap gap-1">
                    {Array.isArray(row.type) ? row.type.map(type => {
                        const cfg = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.all;
                        const Icon = cfg.icon;
                        return (
                            <Badge key={type} variant="outline" className={`text-[10px] gap-1 px-1.5 ${cfg.color}`}>
                                <Icon className="h-2.5 w-2.5" />
                                {cfg.label}
                            </Badge>
                        );
                    }) : null}
                </div>
            ),
        },
        {
            key: 'dimensions',
            header: t('common.dimensions', 'Dimensions'),
            render: (row: AdBanner) => (
                <div className="text-xs space-y-1">
                    {(Array.isArray(row.type) && row.type.includes('desktop')) && (
                        <div className="flex items-center gap-1"><Monitor className="h-3 w-3 text-blue-500" />{row.desktop_width}×{row.desktop_height}px</div>
                    )}
                    {(Array.isArray(row.type) && row.type.includes('tablet')) && (
                        <div className="flex items-center gap-1"><Tablet className="h-3 w-3 text-purple-500" />{row.tablet_width}×{row.tablet_height}px</div>
                    )}
                    {(Array.isArray(row.type) && row.type.includes('mobile')) && (
                        <div className="flex items-center gap-1"><Smartphone className="h-3 w-3 text-green-500" />{row.mobile_width}×{row.mobile_height}px</div>
                    )}
                </div>
            ),
        },
    ];

    const isFormOpen = createOpen || !!editBanner;

    if (!isActive) return <PluginDisabledState pluginName="Ads & Banners" pluginSlug="ads" />;

    return (
        <div className="space-y-6">
            <PageLoader open={isLoading || createBanner.isPending || updateBanner.isPending || deleteBanner.isPending} />
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <CardTitle>{t('nav.ad_banners', 'Create Banner')}</CardTitle>
                            <CardDescription>{t('ads.banners_desc', 'Define banner dimension templates that are used to enforce image sizes in ads.')}</CardDescription>
                        </div>
                        <Button size="sm" onClick={() => setCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('ads.new_banner', 'New Banner')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <CommonTable
                        data={banners as any}
                        columns={columns as any}
                        isLoading={isLoading}
                        onEdit={(row: any) => setEditBanner(row)}
                        onDelete={(row: any) => setDeleteId(row.id)}
                        onStatusToggle={(row: any, val: boolean) =>
                            updateBanner.mutate({ id: row.id, data: { is_active: val ? 1 : 0 } })
                        }
                        disableStatusToggle={(row: any) => Number(row.is_active) === 2 || !!row.has_pending_approval}
                        disableEdit={(row: any) => Number(row.is_active) === 2 || !!row.has_pending_approval}
                        disableDelete={(row: any) => Number(row.is_active) === 2 || !!row.has_pending_approval}
                        showCreated
                        showActions
                        emptyMessage={t('ads.no_banners', 'No banners found. Create your first banner template.')}
                    />
                    {pagination && <TablePagination pagination={{ ...pagination, limit }} onPageChange={setPage} onLimitChange={setLimit} />}
                </CardContent>
            </Card>

            {isFormOpen && (
                <BannerForm
                    open={isFormOpen}
                    onOpenChange={(open) => { if (!open) { setCreateOpen(false); setEditBanner(null); } }}
                    banner={editBanner}
                    onSave={handleSave}
                    isLoading={createBanner.isPending || updateBanner.isPending}
                />
            )}

            <DeleteDialog
                open={!!deleteId}
                onOpenChange={(open: boolean) => { if (!open) setDeleteId(null); }}
                onConfirm={() => {
                    if (deleteId) {
                        deleteBanner.mutate(deleteId, {
                            onSuccess: () => setDeleteId(null),
                            onError: () => setDeleteId(null)
                        });
                    }
                }}
                isDeleting={deleteBanner.isPending}
                title={t('ads.delete_banner', 'Delete Banner')}
                description={t('ads.delete_banner_confirm', 'Are you sure? Ads using this banner will lose their dimension reference.')}
            />
        </div>
    );
}
