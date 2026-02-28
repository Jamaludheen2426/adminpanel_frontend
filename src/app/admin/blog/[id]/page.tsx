import { EditBlogPostContent } from '../_components/edit-blog-post-content';

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
    const p = await params;
    return <EditBlogPostContent id={Number(p.id)} />;
}
