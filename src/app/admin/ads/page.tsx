import { Metadata } from 'next';
import { AdsContent } from './_components/ads-content';

export const metadata: Metadata = {
  title: 'Ads Management | Admin Panel',
  description: 'Manage banner and google adsense advertisements in the system',
};

export default function AdsPage() {
  return <AdsContent />;
}
