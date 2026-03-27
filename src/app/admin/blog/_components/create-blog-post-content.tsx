'use client';

import { useRouter } from 'next/navigation';
import { useCreateBlogPost } from '@/hooks/use-blog-posts';
import { isApprovalRequired } from '@/lib/api-client';
import { BlogPostForm } from './blog-post-form';
import { useTranslation } from '@/hooks/use-translation';
import { PageLoader } from '@/components/common/page-loader';

export function CreateBlogPostContent() {
    const { t } = useTranslation();
    const router = useRouter();
    const create = useCreateBlogPost();

    return (
        <div className="space-y-6">
            <PageLoader open={create.isPending} />
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{t('blog.create_post', 'Create Blog Post')}</h1>
                <p className="text-muted-foreground mt-1">{t('blog.create_post_desc', 'Add a new post to your blog')}</p>
            </div>
            <BlogPostForm
                isPending={create.isPending}
                onSave={async (data) => {
                    return new Promise((resolve, reject) => {
                        create.mutate(data, {
                            onSuccess: () => {
                                router.push('/admin/blog');
                                resolve();
                            },
                            onError: (e) => {
                                if (isApprovalRequired(e)) {
                                    router.push('/admin/blog');
                                    resolve();
                                } else {
                                    reject(e);
                                }
                            }
                        });
                    });
                }}
            />
        </div>
    );
}
