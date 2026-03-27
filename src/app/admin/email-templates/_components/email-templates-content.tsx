"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CommonTable, type CommonColumn } from "@/components/common/common-table";
import { Plus, Edit, Trash2, Eye, Mail } from "lucide-react";
import { DeleteDialog } from "@/components/common/delete-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useEmailTemplates,
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
  useDeleteEmailTemplate,
  usePreviewEmailTemplate,
  useSendEmailTemplate,
} from "@/hooks";
import { EmailTemplate } from "@/types";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { PageLoader } from "@/components/common/page-loader";
import { TablePagination } from "@/components/common/table-pagination";

const templateSchema = z.object({
  name: z.string().trim().min(2, "Template name required"),
  slug: z.string().trim().optional(),
  subject: z.string().trim().min(5, "Subject required"),
  body: z.string().trim().min(10, "Body required"),
  description: z.string().trim().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

export function EmailTemplatesContent() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSendTestOpen, setIsSendTestOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [previewContent, setPreviewContent] = useState<{
    subject: string;
    body: string;
  } | null>(null);

  const { data: templatesData, isLoading } = useEmailTemplates({ page, limit });
  const createMutation = useCreateEmailTemplate();
  const updateMutation = useUpdateEmailTemplate();
  const deleteMutation = useDeleteEmailTemplate();
  const previewMutation = usePreviewEmailTemplate();
  const sendMutation = useSendEmailTemplate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: selectedTemplate
      ? {
        name: selectedTemplate.name,
        subject: selectedTemplate.subject ?? "",
        body: selectedTemplate.body,
        description: selectedTemplate.description || "",
      }
      : {},
  });

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    reset({
      name: template.name,
      subject: template.subject ?? "",
      body: template.body,
      description: template.description || "",
    });
    setIsDialogOpen(true);
  };

  const handlePreview = async (template: EmailTemplate) => {
    try {
      const result = await previewMutation.mutateAsync({
        id: template.id,
        variables: {},
      });
      setPreviewContent(result);
      setSelectedTemplate(template);
      setIsPreviewOpen(true);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = (template: EmailTemplate) => {
    setDeleteId(template.id);
  };

  const handleSendTest = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setTestEmail("");
    setIsSendTestOpen(true);
  };

  const handleSendTestSubmit = () => {
    if (!selectedTemplate || !testEmail) return;
    sendMutation.mutate(
      { id: selectedTemplate.id, to: testEmail },
      {
        onSuccess: () => {
          setIsSendTestOpen(false);
          setTestEmail("");
        },
      },
    );
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedTemplate(null);
    reset({});
  };

  const onSubmit = (data: TemplateFormData) => {
    if (selectedTemplate) {
      updateMutation.mutate(
        { id: selectedTemplate.id, data },
        { onSuccess: handleDialogClose },
      );
    } else {
      createMutation.mutate(data, { onSuccess: handleDialogClose });
    }
  };

  const columns: CommonColumn<EmailTemplate>[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "slug", header: "Slug", sortable: true },
    { key: "subject", header: "Subject", sortable: true },
    {
      key: "custom_actions",
      header: "Quick Actions",
      render: (row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handlePreview(row)}
            title="Preview"
            className="h-8 px-2"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSendTest(row)}
            title="Send Test Email"
            className="h-8 gap-1 px-2 text-[10px] font-bold uppercase"
          >
            <Mail className="h-3.5 w-3.5" />
            TEST
          </Button>
        </div>
      )
    }
  ];

  const templates: EmailTemplate[] = templatesData?.data || [];
  const pagination = templatesData?.pagination;
  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || previewMutation.isPending || sendMutation.isPending;

  return (
    <PermissionGuard permission="email_templates.read">
      <div className="space-y-6">
        <PageLoader open={isLoading || isPending} />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Email Templates</h1>
            <p className="text-muted-foreground mt-1">Manage system email templates</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setSelectedTemplate(null);
                  reset({});
                }}
              >
                <Plus size={18} className="mr-2" />
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedTemplate ? "Edit Template" : "Create Template"}
                </DialogTitle>
                <DialogDescription>
                  {selectedTemplate
                    ? "Update the email template details below."
                    : "Fill in the details to create a new email template."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    placeholder="Welcome Email"
                    {...register("name")}
                    className="mt-2"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {!selectedTemplate && (
                  <div>
                    <Label htmlFor="slug">Slug (optional)</Label>
                    <Input
                      id="slug"
                      placeholder="welcome_email"
                      {...register("slug")}
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-generated if empty
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Welcome to our platform"
                    {...register("subject")}
                    className="mt-2"
                  />
                  {errors.subject && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.subject.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="body">Email Body (HTML)</Label>
                  <Textarea
                    id="body"
                    placeholder="<h1>Hello {{name}}</h1><p>Welcome to our platform...</p>"
                    {...register("body")}
                    className="mt-2 font-mono text-sm"
                    rows={10}
                  />
                  {errors.body && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.body.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Use {"{{variable}}"} for dynamic content
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="Sent when a new user registers"
                    {...register("description")}
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={isPending}>
                    {isPending
                      ? "Saving..."
                      : selectedTemplate
                        ? "Update"
                        : "Create"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDialogClose}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview: {selectedTemplate?.name}</DialogTitle>
              <DialogDescription>
                Preview of the email template with sample data.
              </DialogDescription>
            </DialogHeader>
            {previewContent && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-500">Subject</Label>
                  <p className="font-medium">{previewContent.subject}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Body</Label>
                  <div
                    className="border rounded p-4 mt-2 bg-white text-black"
                    dangerouslySetInnerHTML={{ __html: previewContent.body }}
                  />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Send Test Email Dialog */}
        <Dialog open={isSendTestOpen} onOpenChange={setIsSendTestOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Test Email</DialogTitle>
              <DialogDescription>
                Send a test email using the &quot;{selectedTemplate?.name}&quot;
                template.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="testEmail">Email Address</Label>
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-4 pt-2">
                <Button
                  onClick={handleSendTestSubmit}
                  disabled={!testEmail || sendMutation.isPending}
                >
                  {sendMutation.isPending ? "Sending..." : "Send Test"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsSendTestOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Card>
          <CardContent className="pt-6">
            <CommonTable
              columns={columns}
              data={templates as any}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              disableEdit={(row) => Number((row as any).is_active) === 2 || !!(row as any).has_pending_approval}
              disableDelete={(row) => Number((row as any).is_active) === 2 || !!(row as any).has_pending_approval}
              onStatusToggle={(row, val) => updateMutation.mutate({ id: row.id, data: { is_active: val } })}
              showStatus
              showCreated
              showActions
              emptyMessage="No templates created yet"
            />
            {pagination && (
              <TablePagination
                pagination={{ ...pagination, limit }}
                onPageChange={setPage}
                onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
              />
            )}
          </CardContent>
        </Card>

        <DeleteDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          onConfirm={() => {
            if (deleteId) {
              deleteMutation.mutate(deleteId, {
                onSuccess: () => setDeleteId(null)
              });
            }
          }}
          title="Delete Template"
          description="Are you sure you want to delete this email template? This action cannot be undone."
          isDeleting={deleteMutation.isPending}
        />
      </div>
    </PermissionGuard>
  );
}
