"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  Eye,
  Mail,
  Code,
  Check,
  Search,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { isApprovalRequired } from "@/lib/api-client";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useEmailTemplates,
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
  useDeleteEmailTemplate,
  usePreviewEmailTemplate,
  useToggleEmailTemplate,
  useSendEmailTemplate,
  useTemplateVariables,
} from "@/hooks/use-email-templates";
import { useEmailConfigs } from "@/hooks/use-email-configs";
import type { EmailTemplate, CreateEmailTemplateDto } from "@/types";
import { Spinner } from "@/components/ui/spinner";
import { HtmlEditor } from "@/components/common/html-editor";

const defaultForm: CreateEmailTemplateDto = {
  name: "",
  type: "template",
  subject: "",
  body: "",
  description: "",
  email_config_id: undefined,
};

export function TemplatesContent() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: templatesData, isLoading } = useEmailTemplates({
    page,
    limit: 10,
    search,
  });
  const { data: configsData } = useEmailConfigs();
  const { data: templateVariables = [] } = useTemplateVariables();
  const createMutation = useCreateEmailTemplate();
  const updateMutation = useUpdateEmailTemplate();
  const deleteMutation = useDeleteEmailTemplate();
  const previewMutation = usePreviewEmailTemplate();
  const toggleMutation = useToggleEmailTemplate();
  const sendMutation = useSendEmailTemplate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [sendTestDialogOpen, setSendTestDialogOpen] = useState(false);
  const [sendingTemplate, setSendingTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [testEmail, setTestEmail] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateEmailTemplateDto>(defaultForm);
  const [previewContent, setPreviewContent] = useState<{
    subject: string;
    body: string;
  } | null>(null);
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);
  const [enableHtmlStructure, setEnableHtmlStructure] = useState(false);

  const templates = templatesData?.data || [];
  const configs = configsData?.data || [];

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setForm(defaultForm);
    setEnableHtmlStructure(false);
    setDialogOpen(true);
  };

  const openEditDialog = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      type: template.type || "template",
      subject: template.subject ?? "",
      body: template.body,
      description: template.description ?? "",
      email_config_id: template.email_config_id ?? undefined,
    });
    // Auto-detect if body contains HTML structure
    setEnableHtmlStructure(
      template.body.includes("<html") ||
        template.body.includes("<!DOCTYPE") ||
        template.body.includes("<body"),
    );
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const close = () => setDialogOpen(false);
    if (editingTemplate) {
      updateMutation.mutate(
        { id: editingTemplate.id, data: form },
        { onSuccess: close, onError: (e) => { if (isApprovalRequired(e)) close(); } },
      );
    } else {
      createMutation.mutate(form, {
        onSuccess: close,
        onError: (e) => { if (isApprovalRequired(e)) close(); },
      });
    }
  };

  const handleDelete = () => {
    if (deletingId) {
      const close = () => { setDeleteDialogOpen(false); setDeletingId(null); };
      deleteMutation.mutate(deletingId, {
        onSuccess: close,
        onError: (e) => { if (isApprovalRequired(e)) close(); },
      });
    }
  };

  const handlePreview = (template: EmailTemplate) => {
    const sampleVars: Record<string, string> = {};
    (template.variables || []).forEach((v) => {
      sampleVars[v] = `[${v}]`;
    });
    previewMutation.mutate(
      { id: template.id, variables: sampleVars },
      {
        onSuccess: (data) => {
          setPreviewContent(data);
          setPreviewDialogOpen(true);
        },
      },
    );
  };

  const handleToggleActive = (id: number) => {
    toggleMutation.mutate(id);
  };

  const openSendTestDialog = (template: EmailTemplate) => {
    setSendingTemplate(template);
    setTestEmail("");
    setSendTestDialogOpen(true);
  };

  const handleSendTest = () => {
    if (!sendingTemplate || !testEmail) return;
    sendMutation.mutate(
      { id: sendingTemplate.id, to: testEmail },
      {
        onSuccess: () => {
          setSendTestDialogOpen(false);
          setSendingTemplate(null);
          setTestEmail("");
        },
      },
    );
  };

  const handleCopyVariable = (variableKey: string) => {
    const variableText = `{{${variableKey}}}`;
    navigator.clipboard.writeText(variableText);
    setCopiedVariable(variableKey);
    setTimeout(() => setCopiedVariable(null), 2000);
  };

  const handleToggleHtmlStructure = (enabled: boolean) => {
    setEnableHtmlStructure(enabled);
    if (enabled && !form.body.includes("<html")) {
      // Wrap current body in HTML structure
      setForm({
        ...form,
        body: getDefaultHtmlStructure(form.body),
      });
    } else if (!enabled && form.body.includes("<html")) {
      // Try to extract body content
      const bodyMatch = form.body.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        setForm({
          ...form,
          body: bodyMatch[1].trim(),
        });
      }
    }
  };

  const handleResetToDefault = () => {
    setForm({
      ...form,
      body: getDefaultHtmlStructure(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/settings/email">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Email Templates</h1>
            <p className="text-muted-foreground mt-1">
              Manage email templates with dynamic variables
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Template
        </Button>
      </div>

      {/* Templates List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Templates</CardTitle>
              <CardDescription>
                Email templates used for notifications and communications
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : templates.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Variables</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {template.name}
                          {template.is_predefined && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            >
                              System
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {template.type === "header" ? (
                          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900 dark:text-purple-100">
                            Header
                          </Badge>
                        ) : template.type === "footer" ? (
                          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900 dark:text-orange-100">
                            Footer
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Template</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {template.subject || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {template.variables &&
                          template.variables.length > 0 ? (
                            template.variables.slice(0, 3).map((v) => (
                              <Badge
                                key={v}
                                variant="secondary"
                                className="text-xs"
                              >
                                {v}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              -
                            </span>
                          )}
                          {template.variables &&
                            template.variables.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.variables.length - 3}
                              </Badge>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={template.is_active}
                          pending={isApprovalRequired(toggleMutation.error) && toggleMutation.variables === template.id}
                          onCheckedChange={() =>
                            handleToggleActive(template.id)
                          }
                          disabled={toggleMutation.isPending}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreview(template)}
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => openSendTestDialog(template)}
                            title={
                              template.type !== "template"
                                ? "Test email only available for regular templates"
                                : "Send Test Email"
                            }
                            disabled={template.type !== "template"}
                            className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Test
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(template)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {!template.is_predefined && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeletingId(template.id);
                                setDeleteDialogOpen(true);
                              }}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {templatesData?.pagination &&
                templatesData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {templatesData.pagination.page} of{" "}
                      {templatesData.pagination.totalPages} (
                      {templatesData.pagination.totalItems} templates)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={!templatesData.pagination.hasPrevPage}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={!templatesData.pagination.hasNextPage}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {search
                  ? "No templates found matching your search."
                  : "No email templates yet. Create one to get started."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate
                ? "Edit Email Template"
                : "Create Email Template"}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? "Update the email template content and settings"
                : "Create a new email template with dynamic variables"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Template Type Selection */}
            {!editingTemplate?.is_predefined && (
              <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-lg border">
                <Label className="text-sm font-medium">Template Type:</Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.type === "header"}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          type: e.target.checked ? "header" : "template",
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm">Header</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.type === "footer"}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          type: e.target.checked ? "footer" : "template",
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm">Footer</span>
                  </label>
                </div>
                <span className="text-xs text-muted-foreground">
                  {form.type === "header" &&
                    "Header content wraps body + footer"}
                  {form.type === "footer" &&
                    "Footer content appears after header + body"}
                  {form.type === "template" && "Regular email template"}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Name *</Label>
                <Input
                  placeholder="e.g. Welcome Email, Password Reset"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={
                    editingTemplate?.is_predefined &&
                    (editingTemplate?.type === "header" ||
                      editingTemplate?.type === "footer")
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email Sender</Label>
                <Select
                  value={form.email_config_id?.toString() || ""}
                  onValueChange={(val) =>
                    setForm({
                      ...form,
                      email_config_id: val ? parseInt(val) : undefined,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Sender Email" />
                  </SelectTrigger>
                  <SelectContent>
                    {configs.map((config) => (
                      <SelectItem key={config.id} value={config.id.toString()}>
                        {config.name} ({config.driver})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of when this template is used"
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
              />
            </div>

            {/* Subject field - only for regular templates */}
            {form.type === "template" && (
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Input
                  placeholder="e.g. Welcome to {{app_name}}, {{user_name}}!"
                  value={form.subject || ""}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                />
              </div>
            )}

            {/* Available Variables - Dropdown with Copy */}
            <div className="space-y-2">
              <Label>Available Variables</Label>
              <Select
                onValueChange={(key) => handleCopyVariable(key)}
                value={copiedVariable || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a variable to copy" />
                </SelectTrigger>
                <SelectContent>
                  {templateVariables.map((v) => (
                    <SelectItem
                      key={v.key}
                      value={v.key}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono text-sm">{`{{${v.key}}}`}</span>
                        {copiedVariable === v.key && (
                          <Check className="h-3 w-3 ml-2 text-green-500" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select a variable to copy it to clipboard
              </p>
            </div>

            {/* HTML Structure Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
              <div className="space-y-0.5">
                <Label
                  htmlFor="html-structure"
                  className="flex items-center gap-2"
                >
                  <Code className="h-4 w-4" />
                  Enable Full HTML Structure
                </Label>
                <p className="text-xs text-muted-foreground">
                  Include complete HTML document structure with head, body, and
                  styling
                </p>
              </div>
              <Switch
                id="html-structure"
                checked={enableHtmlStructure}
                onCheckedChange={handleToggleHtmlStructure}
              />
            </div>

            {/* HTML Editor Component */}
            <HtmlEditor
              value={form.body}
              onChange={(value) => setForm({ ...form, body: value })}
              label="Body *"
              placeholder={
                enableHtmlStructure
                  ? "<!-- Full HTML structure will be generated -->"
                  : "Hello {{user_name}},\n\nWelcome to {{app_name}}!\n\nBest regards,\nThe {{app_name}} Team"
              }
              rows={16}
              helpText="Use variables like {{user_name}} in your email body"
              showResetButton={enableHtmlStructure}
              onReset={handleResetToDefault}
              resetButtonText="Reset to Default Template"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : editingTemplate
                  ? "Update Template"
                  : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview of the email template with sample variables
            </DialogDescription>
          </DialogHeader>
          {previewContent && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">
                  Subject:
                </Label>
                <p className="font-medium text-lg">{previewContent.subject}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">Body:</Label>
                {previewContent.body.includes("<html") ||
                previewContent.body.includes("<!DOCTYPE") ? (
                  <iframe
                    srcDoc={previewContent.body}
                    className="w-full min-h-[500px] border rounded-lg"
                    title="Email Body Preview"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div className="border rounded-lg p-4 bg-muted/30 whitespace-pre-wrap font-mono text-sm max-h-[500px] overflow-auto">
                    {previewContent.body}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPreviewDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this email template? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Test Email Dialog */}
      <Dialog open={sendTestDialogOpen} onOpenChange={setSendTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email using the &quot;{sendingTemplate?.name}&quot;
              template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testEmail">Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSendTestDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendTest}
              disabled={!testEmail || sendMutation.isPending}
            >
              {sendMutation.isPending ? "Sending..." : "Send Test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getDefaultHtmlStructure(bodyContent: string = ""): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      background-color: #ffffff;
      padding: 30px;
      border: 1px solid #e9ecef;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6c757d;
      border-radius: 0 0 5px 5px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #007bff;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{app_name}}</h1>
  </div>
  <div class="content">
    ${
      bodyContent ||
      `<p>Hello {{user_name}},</p>
    <p>Welcome to {{app_name}}!</p>
    <p>We're excited to have you on board.</p>
    <a href="#" class="button">Get Started</a>`
    }
  </div>
  <div class="footer">
    <p>&copy; 2024 {{app_name}}. All rights reserved.</p>
  </div>
</body>
</html>`;
}