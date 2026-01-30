"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Edit, Trash2, Eye, Mail } from "lucide-react";
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

const templateSchema = z.object({
  name: z.string().min(2, "Template name required"),
  slug: z.string().optional(),
  subject: z.string().min(5, "Subject required"),
  body: z.string().min(10, "Body required"),
  description: z.string().optional(),
});

type TemplateFormData = z.infer<typeof templateSchema>;

export default function EmailTemplatesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSendTestOpen, setIsSendTestOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [previewContent, setPreviewContent] = useState<{
    subject: string;
    body: string;
  } | null>(null);

  const { data: templatesData, isLoading } = useEmailTemplates();
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

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteMutation.mutate(id);
    }
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

  const columns: ColumnDef<EmailTemplate>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "slug", header: "Slug" },
    { accessorKey: "subject", header: "Subject" },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handlePreview(row.original)}
            title="Preview"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleSendTest(row.original)}
            title="Send Test Email"
            className="bg-blue-500 text-white"
          >
            <Mail className="h-4 w-4" />
            TEST
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(row.original)}
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:text-red-700"
            onClick={() => handleDelete(row.original.id)}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const templates = templatesData?.data || [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {/* <h1 className="text-3xl font-bold">Email Templates</h1> */}
          <p className="text-gray-600 mt-1">Manage system email templates</p>
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

      <Card className="p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading templates...</p>
          </div>
        ) : templates.length > 0 ? (
          <DataTable columns={columns} data={templates} searchKey="name" />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No templates created yet</p>
            <Button onClick={() => setIsDialogOpen(true)} size="sm">
              Create First Template
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
