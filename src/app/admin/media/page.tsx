import { MediaLibraryContent } from './_components/media-library-content';

export const metadata = {
    title: 'Media Library',
    description: 'Browse, upload and manage your media files',
};

export default function MediaPage() {
    return (
        <div className="p-6">
            <MediaLibraryContent />
        </div>
    );
}
