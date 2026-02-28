'use client';

import { useRouter } from 'next/navigation';
import { useCreateBlogPost } from '@/hooks/use-blog-posts';
import { BlogPostForm } from './blog-post-form';
import { useTranslation } from '@/hooks/use-translation';

export function CreateBlogPostContent() {
    const { t } = useTranslation();
    const router = useRouter();
    const create = useCreateBlogPost();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{t('blog.create_post', 'Create Blog Post')}</h1>
                <p className="text-muted-foreground mt-1">{t('blog.create_post_desc', 'Add a new post to your blog')}</p>
            </div>
            <BlogPostForm
                isPending={create.isPending}
                onSave={(data) =>
                    create.mutate(data, {
                        onSuccess: () => router.push('/admin/blog'),
                    })
                }
            />
        </div>
    );
}
