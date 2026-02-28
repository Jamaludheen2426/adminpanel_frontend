'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/use-translation';
import { useAnnouncement, useUpdateAnnouncement } from '@/hooks/use-announcements';
import { AnnouncementForm } from './announcement-form';
import { Skeleton } from '@/components/ui/skeleton';

export function EditAnnouncementContent({ id }: { id: number }) {
    const { t } = useTranslation();
    const router = useRouter();
    const { data: announcement, isLoading } = useAnnouncement(id);
    const update = useUpdateAnnouncement();

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }

    if (!announcement) {
        return (
            <div className="text-center py-24 text-muted-foreground">
                {t('announcements.not_found', 'Announcement not found.')}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{t('announcements.edit_title', 'Edit Announcement')}</h1>
                <p className="text-muted-foreground mt-1">{announcement.name}</p>
            </div>
            <AnnouncementForm
                defaultValues={announcement}
                isPending={update.isPending}
                onSave={(data, exitAfter) => {
                    update.mutate({ id, data }, {
                        onSuccess: () => { if (exitAfter) router.push('/admin/announcements'); },
                    });
                }}
            />
        </div>
    );
}
