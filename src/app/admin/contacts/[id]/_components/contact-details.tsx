'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useContact, useUpdateContactStatus, useReplyContent, useDeleteContact } from '@/hooks/use-contacts';
import { useEmailConfigs } from '@/hooks/use-email-configs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Mail, Phone, Calendar, Clock, Inbox, Send, Trash2, AlertTriangle, Settings } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { PageLoader } from '@/components/common/page-loader';
import { DeleteDialog } from '@/components/common/delete-dialog';
import { RichEditor } from '@/components/common/rich-editor';

export function ContactDetails({ id }: { id: number }) {
    const { t } = useTranslation();
    const router = useRouter();
    const { data: contact, isLoading, isError } = useContact(id);
    const updateStatus = useUpdateContactStatus();
    const sendReply = useReplyContent();
    const deleteContact = useDeleteContact();
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const [replyMode, setReplyMode] = useState(false);
    const [replyMessage, setReplyMessage] = useState('');
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedEmailConfigId, setSelectedEmailConfigId] = useState<string>('');

    const { data: emailConfigsRes, isLoading: emailConfigsLoading } = useEmailConfigs({ limit: 100 } as any);
    const emailConfigs = (emailConfigsRes?.data || []).filter((c: any) => c.is_active);
    const hasEmailConfigs = !emailConfigsLoading && emailConfigs.length > 0;
    useEffect(() => {
        if (emailConfigs.length > 0 && !selectedEmailConfigId) {
            const def = emailConfigs.find((c: any) => c.is_default) || emailConfigs[0];
            setSelectedEmailConfigId(String(def.id));
        }
    }, [emailConfigs.length]);

    if (isLoading) return <PageLoader open={true} />;
    if (isError || !contact) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="rounded-full bg-red-100 p-3 text-red-600">
                    <Inbox className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-lg font-medium">{t('contacts.not_found', 'Contact Message Not Found')}</h3>
                    <p className="text-sm text-muted-foreground">{t('contacts.not_found_desc', 'The message you are looking for might have been deleted or does not exist.')}</p>
                </div>
                <Button variant="outline" onClick={() => router.push('/admin/contacts')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('common.back', 'Go Back')}
                </Button>
            </div>
        );
    }

    const createdDate = new Date(contact.createdAt || contact.created_at);
    const isUnread = contact.status === 'unread';
    // Single reply: take the first (only) admin reply if it exists
    const adminReply = contact.replies?.[0];
    const hasReplied = !!adminReply;

    const handleSendReply = () => {
        if (!replyMessage.trim()) return;
        sendReply.mutate(
            { id: contact.id, message: replyMessage, email_config_id: selectedEmailConfigId ? Number(selectedEmailConfigId) : undefined },
            {
                onSuccess: () => {
                    setReplyMode(false);
                    setReplyMessage('');
                },
            }
        );
    };

    return (
        <div className="space-y-6">
            <PageLoader open={deleteContact.isPending || sendReply.isPending} />
            {/* Page title */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{contact.subject || t('contacts.no_subject', '(No Subject)')}</h1>
                <p className="text-muted-foreground mt-1">{t('contacts.from', 'From')}: {contact.name} &lt;{contact.email}&gt;</p>
            </div>

            {/* Action bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    {t('common.back', 'Back')}
                </Button>
                <div className="flex items-center gap-2">
                    <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('common.delete', 'Delete')}
                    </Button>
                </div>
            </div>

            {/* Original contact message */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border">
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">{contact.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-semibold text-sm">{contact.name}</div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                                    <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:text-primary hover:underline">
                                        <Mail className="h-3 w-3" />{contact.email}
                                    </a>
                                    {contact.phone && (
                                        <a href={`tel:${contact.phone}`} className="flex items-center gap-1 hover:text-primary hover:underline">
                                            <Phone className="h-3 w-3" />{contact.phone}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{isUnread ? t('contacts.status_unread', 'Unread') : t('contacts.status_read', 'Read')}</span>
                                <Switch
                                    checked={!isUnread}
                                    onCheckedChange={(checked) =>
                                        updateStatus.mutate({ id: contact.id, status: checked ? 'read' : 'unread' })
                                    }
                                    disabled={updateStatus.isPending}
                                />
                            </div>
                            <div className="text-xs text-muted-foreground text-right">
                                <div className="flex items-center gap-1 justify-end">
                                    <Calendar className="h-3 w-3" />
                                    {createdDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </div>
                                <div className="flex items-center gap-1 justify-end mt-0.5">
                                    <Clock className="h-3 w-3" />
                                    {createdDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6">
                    <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
                        {contact.content.split('\n').map((paragraph: string, i: number) => (
                            <p key={i} className="whitespace-pre-wrap">{paragraph}</p>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Admin reply (if sent) */}
            {hasReplied && (
                <Card className="relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                    <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b">
                        <div className="flex gap-3 items-center">
                            <Avatar className="h-8 w-8 border">
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                    {adminReply.author?.full_name?.charAt(0) || 'A'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-medium text-sm flex items-center gap-2">
                                    {adminReply.author?.full_name || t('common.admin', 'Admin')}
                                    <Badge className="text-[10px] h-4 px-1.5 bg-primary text-primary-foreground border-0 gap-1">
                                        <Send className="h-2.5 w-2.5" />
                                        {t('contacts.replied', 'Replied')}
                                    </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">{adminReply.author?.email}</div>
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {new Date(adminReply.createdAt || adminReply.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {new Date(adminReply.createdAt || adminReply.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </CardHeader>
                    <CardContent className="px-5 py-4">
                        <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: adminReply.message }} />
                    </CardContent>
                </Card>
            )}

            {/* Reply form — only shown if not yet replied */}
            {!hasReplied && (
                !emailConfigsLoading && !hasEmailConfigs ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-10 text-center gap-4">
                            <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/30 p-3 text-yellow-600 dark:text-yellow-400">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">{t('contacts.no_email_config', 'No email configuration found')}</p>
                                <p className="text-xs text-muted-foreground mt-1">{t('contacts.no_email_config_desc', 'Please configure an email provider first before sending replies.')}</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => router.push('/admin/settings/email')} className="gap-2">
                                <Settings className="h-4 w-4" />
                                {t('contacts.configure_email', 'Configure Email')}
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className={replyMode ? 'ring-2 ring-primary ring-offset-2' : ''}>
                        <CardHeader className="border-b">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-primary" />
                                        {t('contacts.send_reply', 'Send a Reply')}
                                    </CardTitle>
                                    <CardDescription>{t('contacts.send_reply_desc', 'Compose an email response to the user.')}</CardDescription>
                                </div>
                                {!replyMode && (
                                    <Button onClick={() => setReplyMode(true)} variant="secondary" className="gap-2">
                                        <Send className="h-4 w-4" />
                                        {t('contacts.start_reply', 'Write Reply')}
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        {replyMode && (
                            <>
                                <CardContent className="pt-4">
                                    <div className="rounded-md border bg-background mb-4">
                                        <div className="px-3 py-2 border-b bg-muted/50 text-xs text-muted-foreground flex items-center gap-2">
                                            <span className="font-medium w-14 shrink-0">From:</span>
                                            <Select value={selectedEmailConfigId} onValueChange={setSelectedEmailConfigId}>
                                                <SelectTrigger className="h-6 text-xs border-0 shadow-none p-0 focus:ring-0 bg-transparent">
                                                    <SelectValue placeholder="Select email config" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {emailConfigs.map((cfg: any) => (
                                                        <SelectItem key={cfg.id} value={String(cfg.id)}>
                                                            <span className="flex items-center gap-2">
                                                                {cfg.name} — {cfg.from_email}
                                                                {cfg.is_default && <Badge className="text-[10px] h-4 px-1 bg-green-500 text-white border-0 hover:bg-green-500">Default</Badge>}
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="px-3 py-2 border-b bg-muted/50 text-xs text-muted-foreground flex gap-2">
                                            <span className="font-medium w-14 shrink-0">To:</span> {contact.name} &lt;{contact.email}&gt;
                                        </div>
                                        <div className="px-3 py-2 border-b bg-muted/50 text-xs text-muted-foreground flex gap-2">
                                            <span className="font-medium w-14 shrink-0">Subject:</span> Re: {contact.subject || 'Your Inquiry'}
                                        </div>
                                        <div className="p-0.5">
                                            <RichEditor
                                                value={replyMessage}
                                                onChange={setReplyMessage}
                                                placeholder={t('contacts.reply_placeholder', 'Type your response here...')}
                                                minHeight="150px"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end gap-2 border-t">
                                    <Button variant="ghost" onClick={() => { setReplyMode(false); setReplyMessage(''); }} disabled={sendReply.isPending}>
                                        {t('common.cancel', 'Cancel')}
                                    </Button>
                                    <Button
                                        onClick={handleSendReply}
                                        disabled={!replyMessage.trim() || sendReply.isPending}
                                        className="gap-2"
                                    >
                                        <Send className="h-4 w-4" />
                                        {sendReply.isPending ? t('common.sending', 'Sending...') : t('common.send', 'Send Email')}
                                    </Button>
                                </CardFooter>
                            </>
                        )}
                    </Card>
                )
            )}

            <DeleteDialog
                open={deleteOpen}
                onOpenChange={(open: boolean) => setDeleteOpen(open)}
                title={t('contacts.delete', 'Delete Contact Message')}
                description={t('contacts.delete_confirm', 'Are you sure you want to delete this message? This action cannot be undone and will delete all replies associated with it.')}
                isDeleting={deleteContact.isPending}
                onConfirm={() => {
                    deleteContact.mutate(contact.id, {
                        onSuccess: () => {
                            setDeleteOpen(false);
                            router.push('/admin/contacts');
                        },
                        onError: () => setDeleteOpen(false)
                    });
                }}
            />
        </div>
    );
}
