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
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const defaultForm: CreateEmailTemplateDto = {
  name: "",
  subject: "",
  body: "",
  description: "",
  email_config_id: undefined,
};

export default function EmailTemplatesPage() {
  const { data: templatesData, isLoading } = useEmailTemplates();
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
  const [sendingTemplate, setSendingTemplate] = useState<EmailTemplate | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateEmailTemplateDto>(defaultForm);
  const [previewContent, setPreviewContent] = useState<{
    subject: string;
    body: string;
  } | null>(null);
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);
  const [bodyEditorTab, setBodyEditorTab] = useState<"editor" | "preview">("editor");
  const [enableHtmlStructure, setEnableHtmlStructure] = useState(false);

  const templates = templatesData?.data || [];
  const configs = configsData?.data || [];

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setForm(defaultForm);
    setEnableHtmlStructure(false);
    setBodyEditorTab("editor");
    setDialogOpen(true);
  };

  const openEditDialog = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      subject: template.subject ?? "",
      body: template.body,
      description: template.description ?? "",
      email_config_id: template.email_config_id ?? undefined,
    });
    // Auto-detect if body contains HTML structure
    setEnableHtmlStructure(
      template.body.includes("<html") || 
      template.body.includes("<!DOCTYPE") ||
      template.body.includes("<body")
    );
    setBodyEditorTab("editor");
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingTemplate) {
      updateMutation.mutate(
        { id: editingTemplate.id, data: form },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createMutation.mutate(form, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  const handleDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setDeletingId(null);
        },
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
      }
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
      }
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

  // Generate preview with sample variables
  const generateBodyPreview = () => {
    let previewBody = form.body;
    templateVariables.forEach((v) => {
      const regex = new RegExp(`{{${v.key}}}`, "g");
      previewBody = previewBody.replace(regex, `[${v.key}]`);
    });
    return previewBody;
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
          <CardTitle>Templates</CardTitle>
          <CardDescription>
            Email templates used for notifications and communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : templates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Variables</TableHead>
                  <TableHead>Email Config</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      {template.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {template.subject || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {template.variables && template.variables.length > 0 ? (
                          template.variables.slice(0, 3).map((v) => (
                            <Badge key={v} variant="secondary" className="text-xs">
                              {v}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                        {template.variables && template.variables.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.variables.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {template.email_config ? (
                        <Badge variant="outline">
                          {template.email_config.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Default
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={template.is_active}
                        onCheckedChange={() => handleToggleActive(template.id)}
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
                          title="Send Test Email"
                          className="bg-blue-500 hover:bg-blue-600 text-white"
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No email templates yet. Create one to get started.
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
              {editingTemplate ? "Edit Email Template" : "Create Email Template"}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? "Update the email template content and settings"
                : "Create a new email template with dynamic variables"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Name *</Label>
                <Input
                  placeholder="e.g. Welcome Email, Password Reset"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email Sender</Label>
                <Select
                  value={form.email_config_id?.toString() || "default"}
                  onValueChange={(val) =>
                    setForm({
                      ...form,
                      email_config_id: val === "default" ? undefined : parseInt(val),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select email config" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Select Sender Email</SelectItem>
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
              <Input
                placeholder="Brief description of when this template is used"
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                placeholder="e.g. Welcome to {{app_name}}, {{user_name}}!"
                value={form.subject || ""}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>

            {/* Available Variables - Enhanced with Click to Copy */}
            <div className="p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold">Available Variables</Label>
                <span className="text-xs text-muted-foreground">
                  Click any variable to copy
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {templateVariables.map((v) => (
                  <Button
                    key={v.key}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-auto py-2 px-3 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all"
                    onClick={() => handleCopyVariable(v.key)}
                    title={v.description}
                  >
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono">
                        {`{{${v.key}}}`}
                      </code>
                      {copiedVariable === v.key ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3 opacity-50" />
                      )}
                    </div>
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Variables will be replaced with actual values when sending emails
              </p>
            </div>

            {/* HTML Structure Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
              <div className="space-y-0.5">
                <Label htmlFor="html-structure" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Enable Full HTML Structure
                </Label>
                <p className="text-xs text-muted-foreground">
                  Include complete HTML document structure with head, body, and styling
                </p>
              </div>
              <Switch
                id="html-structure"
                checked={enableHtmlStructure}
                onCheckedChange={handleToggleHtmlStructure}
              />
            </div>

            {/* Body Editor with Preview */}
            <div className="space-y-2">
              <Label>Body *</Label>
              <Tabs value={bodyEditorTab} onValueChange={(v) => setBodyEditorTab(v as "editor" | "preview")} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="editor" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    HTML Editor
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="space-y-2">
                  <Textarea
                    placeholder={
                      enableHtmlStructure
                        ? "<!-- Full HTML structure will be generated -->"
                        : "Hello {{user_name}},\n\nWelcome to {{app_name}}!\n\nBest regards,\nThe {{app_name}} Team"
                    }
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    rows={16}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use variables like {`{{user_name}}`} in your email body
                  </p>
                </TabsContent>

                <TabsContent value="preview" className="space-y-2">
                  <div className="border rounded-lg p-6 min-h-[400px] bg-background overflow-auto">
                    {enableHtmlStructure || form.body.includes("<html") ? (
                      <iframe
                        srcDoc={generateBodyPreview()}
                        className="w-full min-h-[400px] border-0"
                        title="Email Preview"
                        sandbox="allow-same-origin"
                      />
                    ) : (
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: generateBodyPreview() }}
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Preview showing sample variable values
                  </p>
                </TabsContent>
              </Tabs>
            </div>
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
                <Label className="text-muted-foreground text-sm">Subject:</Label>
                <p className="font-medium text-lg">{previewContent.subject}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-sm">Body:</Label>
                {previewContent.body.includes("<html") || previewContent.body.includes("<!DOCTYPE") ? (
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
            <AlertDialogAction onClick={handleDelete}>
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
              Send a test email using the &quot;{sendingTemplate?.name}&quot; template.
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
    ${bodyContent || `<p>Hello {{user_name}},</p>
    <p>Welcome to {{app_name}}!</p>
    <p>We're excited to have you on board.</p>
    <a href="#" class="button">Get Started</a>`}
  </div>
  <div class="footer">
    <p>&copy; 2024 {{app_name}}. All rights reserved.</p>
  </div>
</body>
</html>`;
}