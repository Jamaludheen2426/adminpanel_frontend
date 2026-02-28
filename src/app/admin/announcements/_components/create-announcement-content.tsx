'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/use-translation';
import { useCreateAnnouncement } from '@/hooks/use-announcements';
import { AnnouncementForm } from './announcement-form';

export function CreateAnnouncementContent() {
    const { t } = useTranslation();
    const router = useRouter();
    const create = useCreateAnnouncement();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{t('announcements.create_title', 'Create Announcement')}</h1>
                <p className="text-muted-foreground mt-1">{t('announcements.create_desc', 'Add a new announcement for your users')}</p>
            </div>
            <AnnouncementForm
                isPending={create.isPending}
                onSave={(data, exitAfter) => {
                    create.mutate(data, {
                        onSuccess: () => { if (exitAfter) router.push('/admin/announcements'); },
                    });
                }}
            />
        </div>
    );
}
