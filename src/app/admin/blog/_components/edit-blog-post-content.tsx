'use client';

import { useRouter } from 'next/navigation';
import { useBlogPost, useUpdateBlogPost } from '@/hooks/use-blog-posts';
import { BlogPostForm } from './blog-post-form';
import { useTranslation } from '@/hooks/use-translation';
import { Skeleton } from '@/components/ui/skeleton';

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
            <div>
                <h1 className="text-3xl font-bold">{t('blog.edit_post', 'Edit Blog Post')}</h1>
                <p className="text-muted-foreground mt-1">{post.title}</p>
            </div>
            <BlogPostForm
                defaultValues={post}
                isPending={update.isPending}
                onSave={(data) =>
                    update.mutate({ id, data }, {
                        onSuccess: () => router.push('/admin/blog'),
                    })
                }
            />
        </div>
    );
}
