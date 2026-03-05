import { Metadata } from 'next';
import { BannersContent } from './_components/banners-content';

export const metadata: Metadata = {
    title: 'Ad Banners',
    description: 'Manage banner dimension templates for ads.',
};

export default function BannersPage() {
    return <BannersContent />;
}
