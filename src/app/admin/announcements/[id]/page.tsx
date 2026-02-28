import { EditAnnouncementContent } from '../_components/edit-announcement-content';

export default async function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
    const p = await params;
    return <EditAnnouncementContent id={Number(p.id)} />;
}
