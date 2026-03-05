'use client';

import { use } from 'react';
import { usePage } from '@/hooks/use-pages';
import { PageForm } from '../_components/page-form';
import { PageLoader } from '@/components/common/page-loader';

interface Props {
    params: Promise<{ id: string }>;
}

export default function EditPagePage({ params }: Props) {
    const { id } = use(params);
    const { data: page, isLoading } = usePage(id);

    if (isLoading) return <PageLoader open />;

    return <PageForm page={page} />;
}
