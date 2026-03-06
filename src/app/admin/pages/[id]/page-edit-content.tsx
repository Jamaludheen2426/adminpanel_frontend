'use client';

import { usePage } from '@/hooks/use-pages';
import { PageForm } from '../_components/page-form';
import { PageLoader } from '@/components/common/page-loader';

interface Props {
    id: string;
}

export function PageEditContent({ id }: Props) {
    const { data: page, isLoading } = usePage(id);

    if (isLoading) return <PageLoader open />;

    return <PageForm page={page} />;
}