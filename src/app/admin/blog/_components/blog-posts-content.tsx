'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useBlogPosts, useDeleteBlogPost, useUpdateBlogPost, useCreateBlogPost, BlogPost } from '@/hooks/use-blog-posts';
import { useTranslation } from '@/hooks/use-translation';
import { CommonTable, CommonColumn } from '@/components/common/common-table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageLoader } from '@/components/common/page-loader';
import { resolveMediaUrl } from '@/lib/utils';
import { BlogPostForm } from './blog-post-form';
import { DeleteDialog } from '@/components/common/delete-dialog';

// ─── normalise API row so CommonTable's created_at works ─────────────────────
function normalise(post: BlogPost): BlogPost & { created_at: string } {
    return {
        ...post,
        // Sequelize returns createdAt (camelCase), CommonTable expects created_at
        created_at: (post as any).createdAt ?? (post as any).created_at ?? '',
    };
}

// ─── Blog Posts Content ───────────────────────────────────────────────────────

export function BlogPostsContent() {
    const { t } = useTranslation();
    const { data: result, isLoading, isFetching } = useBlogPosts();
    const rawPosts: BlogPost[] = result?.data ?? [];
    const posts = rawPosts.map(normalise);

    const updatePost = useUpdateBlogPost();
    const deletePost = useDeleteBlogPost();
    const createPost = useCreateBlogPost();

    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [editPost, setEditPost] = useState<BlogPost | null>(null);
    const [createOpen, setCreateOpen] = useState(false);

    const columns: CommonColumn<any>[] = [
        {
            key: 'image',
            header: t('common.image', 'Image'),
            render: (row: BlogPost) => (
                <Avatar className="h-10 w-14 rounded-md">
                    <AvatarImage src={resolveMediaUrl(row.image || '')} className="object-cover" />
                    <AvatarFallback className="rounded-md text-xs">–</AvatarFallback>
                </Avatar>
            ),
        },
        {
            key: 'title',
            header: t('blog.title', 'Title'),
            render: (row: BlogPost) => (
                <div className="max-w-xs">
                    <p className="font-medium truncate">{row.title}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{row.slug}</p>
                </div>
            ),
        },
        {
            key: 'categories',
            header: t('blog.categories', 'Categories'),
            render: (row: BlogPost) => (
                <div className="flex flex-wrap gap-1">
                    {(row as any).categories?.length
                        ? (row as any).categories.map((c: any) => (
                            <Badge key={c.id} variant="secondary" className="text-xs">{c.name}</Badge>
                        ))
                        : <span className="text-muted-foreground text-xs">—</span>
                    }
                </div>
            ),
        },
        {
            key: 'author',
            header: t('blog.author', 'Author'),
            render: (row: BlogPost) => {
                const a = (row as any).author;
                return a
                    ? <span className="text-sm">{a.full_name}</span>
                    : <span className="text-muted-foreground">—</span>;
            },
        },
        {
            key: 'is_featured',
            header: t('blog.featured', 'Featured'),
            render: (row: BlogPost) => (
                <Switch
                    checked={Boolean(row.is_featured)}
                    onCheckedChange={(checked) =>
                        updatePost.mutate({ id: row.id, data: { is_featured: checked ? 1 : 0 } })
                    }
                    disabled={updatePost.isPending}
                />
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageLoader open={isFetching} />

            <div>
                <h1 className="text-3xl font-bold">{t('blog.posts_title', 'Blog Posts')}</h1>
                <p className="text-muted-foreground mt-1">{t('blog.posts_desc', 'Manage all blog posts')}</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{t('blog.posts_title', 'Blog Posts')}</CardTitle>
                            <CardDescription>{t('blog.posts_desc', 'Manage all blog posts')}</CardDescription>
                        </div>
                        <Button size="sm" onClick={() => setCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('blog.add_post', 'Add Post')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <CommonTable
                        columns={columns}
                        data={posts as any}
                        isLoading={isLoading}
                        emptyMessage={t('blog.no_posts', 'No blog posts found.')}
                        onStatusToggle={(row, val) =>
                            updatePost.mutate({ id: row.id, data: { is_active: val ? 1 : 0 } })
                        }
                        onEdit={(row) => setEditPost(row as unknown as BlogPost)}
                        onDelete={(row) => setDeleteId(row.id)}
                        showCreated
                        showActions
                    />
                </CardContent>
            </Card>

            {/* ── Create Dialog ── */}
            <Dialog open={createOpen} onOpenChange={(o) => { if (!o) setCreateOpen(false); }}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('blog.create_post', 'Create Blog Post')}</DialogTitle>
                        <DialogDescription>{t('blog.create_post_desc', 'Add a new post to your blog')}</DialogDescription>
                    </DialogHeader>
                    <BlogPostForm
                        isPending={createPost.isPending}
                        onSave={(data) =>
                            createPost.mutate(data, {
                                onSuccess: () => setCreateOpen(false),
                            })
                        }
                    />
                </DialogContent>
            </Dialog>

            {/* ── Edit Dialog ── */}
            <Dialog open={!!editPost} onOpenChange={(o) => { if (!o) setEditPost(null); }}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('blog.edit_post', 'Edit Blog Post')}</DialogTitle>
                        <DialogDescription className="truncate">{editPost?.title}</DialogDescription>
                    </DialogHeader>
                    {editPost && (
                        <BlogPostForm
                            key={editPost.id}
                            defaultValues={editPost}
                            isPending={updatePost.isPending}
                            onSave={(data) =>
                                updatePost.mutate({ id: editPost.id, data }, {
                                    onSuccess: () => setEditPost(null),
                                })
                            }
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirm ── */}
            <DeleteDialog
                open={!!deleteId}
                onOpenChange={(open) => {
                    if (!open) setDeleteId(null);
                }}
                onConfirm={() => {
                    if (deleteId) {
                        deletePost.mutate(deleteId, {
                            onSuccess: () => setDeleteId(null),
                        });
                    }
                }}
                isDeleting={deletePost.isPending}
                title={t('blog.delete_post', 'Delete Blog Post')}
                description={t('blog.delete_confirm', 'Are you sure you want to delete this blog post?')}
            />
        </div>
    );
}
