'use client';

import { use } from 'react';
import { useVendor } from '@/hooks/use-vendors';
import { VendorForm } from '../../_components/vendor-form';
import { PageLoader } from '@/components/common/page-loader';

export default function EditVendorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: vendor, isLoading } = useVendor(parseInt(id));

    if (isLoading) return <PageLoader open />;

    return <VendorForm vendor={vendor} />;
}
