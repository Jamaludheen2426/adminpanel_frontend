'use client';

import { useRouter } from 'next/navigation';
import { useBlogPost, useUpdateBlogPost } from '@/hooks/use-blog-posts';
import { isApprovalRequired } from '@/lib/api-client';
import { BlogPostForm } from './blog-post-form';
import { useTranslation } from '@/hooks/use-translation';
import { Skeleton } from '@/components/ui/skeleton';
import { PageLoader } from '@/components/common/page-loader';

export function EditBlogPostContent({ id }: { id: number }) {
    const { t } = useTranslation();
    const router = useRouter();
    const { data: post, isLoading } = useBlogPost(id);
    const update = useUpdateBlogPost();

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="text-center py-24 text-muted-foreground">
                {t('blog.post_not_found', 'Blog post not found.')}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageLoader open={update.isPending} />
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{t('blog.edit_post', 'Edit Blog Post')}</h1>
                <p className="text-muted-foreground mt-1">{post.title}</p>
            </div>
            <BlogPostForm
                defaultValues={post}
                isPending={update.isPending}
                onSave={async (data) => {
                    try {
                        await update.mutateAsync({ id, data });
                        router.push('/admin/blog');
                        router.refresh();
                    } catch (e) {
                        if (isApprovalRequired(e)) {
                            router.push('/admin/blog');
                            router.refresh();
                            return;
                        }
                        throw e;
                    }
                }}
            />
        </div>
    );
}
