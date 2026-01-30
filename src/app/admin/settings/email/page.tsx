"use client";

import { useState } from "react";
import { ArrowLeft, Plus, Trash2, TestTube, Star, Pencil } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  useEmailConfigs,
  useCreateEmailConfig,
  useUpdateEmailConfig,
  useDeleteEmailConfig,
  useTestEmailConfig,
} from "@/hooks/use-email-configs";
import type { EmailConfig, CreateEmailConfigDto } from "@/types";

const drivers = [
  { value: "smtp", label: "SMTP (Generic)", free: true },
  { value: "brevo", label: "Brevo (300/day FREE)", free: true },
  { value: "sendmail", label: "Sendmail (Server)", free: true },
];

const defaultForm: CreateEmailConfigDto = {
  name: "",
  from_email: "",
  from_name: "",
  driver: "smtp",
  host: "",
  port: 587,
  username: "",
  password: "",
  encryption: "tls",
  api_key: "",
  domain: "",
  region: "",
  is_default: false,
};

export default function EmailSettingsPage() {
  const { data: configsData, isLoading } = useEmailConfigs();
  const createMutation = useCreateEmailConfig();
  const updateMutation = useUpdateEmailConfig();
  const deleteMutation = useDeleteEmailConfig();
  const testMutation = useTestEmailConfig();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<EmailConfig | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [form, setForm] = useState<CreateEmailConfigDto>(defaultForm);

  const configs = configsData?.data || [];

  const openCreateDialog = () => {
    setEditingConfig(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEditDialog = (config: EmailConfig) => {
    setEditingConfig(config);
    setForm({
      name: config.name,
      from_email: config.from_email,
      from_name: config.from_name,
      driver: config.driver,
      host: config.host || "",
      port: config.port || 587,
      username: config.username || "",
      password: "",
      encryption: config.encryption || "tls",
      api_key: "",
      domain: config.domain || "",
      region: config.region || "",
      is_default: config.is_default,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingConfig) {
      updateMutation.mutate(
        { id: editingConfig.id, data: form },
        { onSuccess: () => setDialogOpen(false) },
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
  // Add this helper function to render driver-specific fields
  const renderDriverFields = () => {
    switch (form.driver) {
      case "smtp":
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Host</Label>
                <Input
                  placeholder="smtp.gmail.com"
                  value={form.host || ""}
                  onChange={(e) => setForm({ ...form, host: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Port</Label>
                <Input
                  type="number"
                  placeholder="587"
                  value={form.port || ""}
                  onChange={(e) =>
                    setForm({ ...form, port: parseInt(e.target.value) || 587 })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  placeholder="your-email@gmail.com"
                  value={form.username || ""}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={form.password || ""}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Encryption</Label>
              <Select
                value={form.encryption || "tls"}
                onValueChange={(val) => setForm({ ...form, encryption: val as "tls" | "ssl" | "none" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tls">TLS</SelectItem>
                  <SelectItem value="ssl">SSL</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "brevo":
        return (
          <>
            <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950 space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                ✨ Free Forever: 300 emails/day
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Sign up at https://www.brevo.com/ (no credit card needed)
              </p>
            </div>
            <div className="p-3 border rounded-lg bg-amber-50 dark:bg-amber-950 space-y-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                ⚠️ Important: &quot;From Email&quot; must be verified in Brevo
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Go to Settings → Senders, domains, IPs → Add & verify your sender email
              </p>
            </div>
            <div className="space-y-2">
              <Label>SMTP Login</Label>
              <Input
                placeholder="a0ff1b001@smtp-brevo.com"
                value={form.username || ""}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Found at: SMTP & API → SMTP tab → &quot;Login&quot; field (e.g. a0ff1b001@smtp-brevo.com)
              </p>
            </div>
            <div className="space-y-2">
              <Label>SMTP Key</Label>
              <Input
                type="password"
                placeholder="xsmtpsib-xxxxx..."
                value={form.api_key || ""}
                onChange={(e) => setForm({ ...form, api_key: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Generate at: SMTP & API → Your SMTP Keys → Generate a new SMTP key
              </p>
            </div>
          </>
        );

      case "sendmail":
        return (
          <div className="text-sm text-muted-foreground p-3 border rounded-lg bg-muted/30">
            Sendmail uses the server&apos;s local sendmail binary. No additional
            configuration required.
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Email Settings</h1>
            <p className="text-muted-foreground mt-1">
              Configure email providers and manage templates
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/settings/email/campaigns">
            <Button variant="outline">Email Campaigns</Button>
          </Link>
          <Link href="/admin/settings/templates">
            <Button variant="outline">Email Templates</Button>
          </Link>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Email Config
          </Button>
        </div>
      </div>

      {/* Email Configs List */}
      <Card>
        <CardHeader>
          <CardTitle>Email Configurations</CardTitle>
          <CardDescription>
            Manage your email provider configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : configs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>From Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {config.name}
                        {config.is_default && (
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {config.driver}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {config.from_email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={config.is_active ? "default" : "secondary"}
                      >
                        {config.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setTestingId(config.id);
                            setTestEmail("");
                            setTestDialogOpen(true);
                          }}
                          disabled={testMutation.isPending}
                          title="Test Connection"
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(config)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeletingId(config.id);
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
                No email configurations yet. Add one to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingConfig
                ? "Edit Email Configuration"
                : "Add Email Configuration"}
            </DialogTitle>
            <DialogDescription>
              {editingConfig
                ? "Update your email provider settings"
                : "Configure a new email provider"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Configuration Name</Label>
              <Input
                placeholder="e.g. Primary SMTP, Marketing Brevo"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Email</Label>
                <Input
                  type="email"
                  placeholder="noreply@yourdomain.com"
                  value={form.from_email}
                  onChange={(e) =>
                    setForm({ ...form, from_email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>From Name</Label>
                <Input
                  placeholder="Your App Name"
                  value={form.from_name}
                  onChange={(e) =>
                    setForm({ ...form, from_name: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email Driver</Label>
              <Select
                value={form.driver}
                onValueChange={(val) => setForm({ ...form, driver: val as "smtp" | "brevo" | "sendmail" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {renderDriverFields()}
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
                : editingConfig
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this email configuration? This
              action cannot be undone.
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

      {/* Test Email Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Test Email Connection</DialogTitle>
            <DialogDescription>
              Enter an email address to receive a test email. Leave empty to
              only verify the connection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="test_email">Test Email Address</Label>
              <Input
                id="test_email"
                type="email"
                placeholder="your@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (testingId) {
                  testMutation.mutate({
                    id: testingId,
                    test_email: testEmail || undefined,
                  });
                  setTestDialogOpen(false);
                }
              }}
              disabled={testMutation.isPending}
            >
              {testMutation.isPending ? "Testing..." : "Test Connection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
