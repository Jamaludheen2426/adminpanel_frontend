import { SimpleSliderForm } from '../_components/simple-slider-form';
import { PageHeader } from '@/components/common/page-header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default async function SimpleSliderEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const isNew = id === 'new';

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/simple-sliders">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <PageHeader
                    title={isNew ? 'Create Simple Slider' : 'Edit Simple Slider'}
                    description={isNew ? 'Add a new slider to manage items' : 'Manage your slider settings and internal slide items'}
                />
            </div>
            <SimpleSliderForm id={id} />
        </div>
    );
}
