'use client';

import { useState } from 'react';
import { CommonTable } from '@/components/common/common-table';
import { useAds, useCreateAd, useUpdateAd, useDeleteAd, Ad } from '@/hooks/use-ads';
import { AdForm } from './ad-form';
import { DeleteDialog } from '@/components/common/delete-dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { resolveMediaUrl } from '@/lib/utils';
import Image from 'next/image';
import { FileCode2, Plus } from 'lucide-react';
import { ImageCropper } from '@/components/common/image-cropper';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function AdsContent() {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedAd, setSelectedAd] = useState<Ad | null>(null);

    const { data: adsResponse, isLoading } = useAds({
        page,
        limit,
        search,
        sortBy: sort?.column,
        sortDesc: sort?.direction === 'desc',
    });

    const rawAds: Ad[] = adsResponse?.data || [];
    const ads = rawAds.map(ad => ({
        ...ad,
        is_active: ad.is_active === 1,
        created_at: ad.created_at || new Date().toISOString()
    }));

    const updateAd = useUpdateAd();
    const deleteAd = useDeleteAd();
    const createAd = useCreateAd();

    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [editAd, setEditAd] = useState<Ad | null>(null);
    const [createOpen, setCreateOpen] = useState(false);

    const handleSave = (data: any) => {
        if (editAd) {
            updateAd.mutate(
                { id: editAd.id, data },
                {
                    onSuccess: () => {
                        setEditAd(null);
                    },
                }
            );
        } else {
            createAd.mutate(data, {
                onSuccess: () => {
                    setCreateOpen(false);
                },
            });
        }
    };

    const columns = [
        {
            key: 'image',
            header: t('common.image', 'Image'),
            render: (row: any) => {
                const ad = row;
                if (ad.ads_type === 'google_adsense') {
                    return (
                        <div className="w-16 h-12 relative flex items-center justify-center bg-blue-50 text-blue-500 rounded border">
                            <FileCode2 className="w-6 h-6" />
                        </div>
                    );
                }
                if (ad.image) {
                    return (
                        <div className="w-16 h-12 relative rounded border overflow-hidden">
                            <Image
                                src={resolveMediaUrl(ad.image)}
                                alt={ad.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                    );
                }
                return <div className="w-16 h-12 bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">None</div>;
            },
        },
        {
            key: 'name',
            header: t('common.name', 'Name'),
            sortable: true,
            render: (row: any) => (
                <div className="max-w-[180px]">
                    <div className="font-medium truncate" title={row.name}>{row.name}</div>
                    <div className="text-xs text-muted-foreground truncate" title={row.location}>Location: {row.location}</div>
                    {row.banner && (
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5 truncate bg-blue-50 dark:bg-blue-900/20 px-1 py-0.5 rounded border border-blue-100 dark:border-blue-800/30 inline-block w-full" title={row.banner.name}>
                            Template: {row.banner.name}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'key',
            header: t('ads.shortcode', 'Shortcode'),
            render: (row: any) => (
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">
                    [ads key="{row.key}"][/ads]
                </code>
            ),
        },
        {
            key: 'sort_order',
            header: t('common.sort_order', 'Sort Order'),
            sortable: true,
            render: (row: any) => <span>{row.sort_order}</span>,
        },
        {
            key: 'clicked',
            header: t('ads.clicked', 'Clicked'),
            sortable: true,
            render: (row: any) => <span>{row.clicked}</span>,
        },
        {
            key: 'schedule',
            header: t('ads.schedule', 'Schedule'),
            render: (row: any) => {
                const now = new Date();
                const start = row.started_at ? new Date(row.started_at) : null;
                const end = row.expired_at ? new Date(row.expired_at) : null;

                let status = 'Active';
                let color = 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';

                // Only consider it Expired or Scheduled if the schedule feature is explicitly active
                if (row.is_scheduled) {
                    if (end && now > end) {
                        status = 'Expired';
                        color = 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
                    } else if (start && now < start) {
                        status = 'Scheduled'; // Indicates it's waiting to start
                        color = 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
                    } else {
                        // If it's valid right now AND has a schedule lock, we can still visually distinguish it from an "always active" ad
                        status = 'Active'; // Indicates it's active but bound by dates
                        color = 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
                    }
                }

                if (!row.is_active) {
                    status = 'Inactive';
                    color = 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
                }

                return (
                    <div className="space-y-1.5 mt-0.5 w-fit">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-medium w-fit ${color}`}>
                            {t(`ads.status_${status.toLowerCase()}`, status)}
                        </Badge>

                    </div>
                );
            },
        },
    ];

    const handleSort = (column: string) => {
        if (sort?.column === column) {
            if (sort.direction === 'asc') setSort({ column, direction: 'desc' });
            else setSort(null);
        } else {
            setSort({ column, direction: 'asc' });
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{t('nav.ads', 'Ads')}</CardTitle>
                            <CardDescription>{t('ads.description', 'Manage front-end advertisements and banners.')}</CardDescription>
                        </div>
                        <Button size="sm" onClick={() => setCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('ads.create_ad', 'Create New Ad')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <CommonTable
                        data={ads as any}
                        columns={columns}
                        isLoading={isLoading}
                        onEdit={(row: any) => setEditAd(row)}
                        onDelete={(row: any) => setDeleteId(row.id)}
                        onStatusToggle={(row: any, val: boolean) =>
                            updateAd.mutate({ id: row.id, data: { is_active: val ? 1 : 0 } })
                        }
                        sortColumn={sort?.column}
                        sortDirection={sort?.direction}
                        onSort={handleSort}
                        showCreated
                        showActions
                        emptyMessage={t('ads.no_ads', 'No ads found')}
                    />
                </CardContent>
            </Card>

            {(createOpen || editAd) && (
                <AdForm
                    open={createOpen || !!editAd}
                    onOpenChange={(open) => {
                        if (!open) {
                            setCreateOpen(false);
                            setEditAd(null);
                        }
                    }}
                    ad={editAd as unknown as Ad}
                    onSave={handleSave}
                    isLoading={createAd.isPending || updateAd.isPending}
                />
            )}

            <DeleteDialog
                open={!!deleteId}
                onOpenChange={(open) => {
                    if (!open) setDeleteId(null);
                }}
                onConfirm={() => {
                    if (deleteId) {
                        deleteAd.mutate(deleteId, {
                            onSuccess: () => setDeleteId(null),
                        });
                    }
                }}
                isDeleting={deleteAd.isPending}
                title={t('ads.delete_ad', 'Delete Ad')}
                description={t('ads.delete_confirm', 'Are you sure you want to delete this ad? This action cannot be undone.')}
            />
        </div>
    );
}
