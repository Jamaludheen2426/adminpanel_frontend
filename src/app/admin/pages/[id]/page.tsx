import { PageEditContent } from './page-edit-content';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function EditPagePage({ params }: Props) {
    const { id } = await params;
    return <PageEditContent id={id} />;
}