"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  Play,
  Pause,
  Zap,
  Calendar,
  Users,
  Mail,
  BarChart3,
  Clock,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  useEmailCampaigns,
  useCreateEmailCampaign,
  useUpdateEmailCampaign,
  useDeleteEmailCampaign,
  useHolidays,
  useActivateCampaign,
  usePauseCampaign,
  useTriggerCampaign,
  useQueueStats,
  useProcessQueue,
  useVariableMappings,
} from "@/hooks/use-email-campaigns";
import { useEmailTemplates } from "@/hooks/use-email-templates";
import { useEmailConfigs } from "@/hooks/use-email-configs";
import { useRoles } from "@/hooks/use-roles";
import type { EmailCampaign, CreateEmailCampaignDto } from "@/types";
import { Spinner } from "@/components/ui/spinner";
import { PermissionGuard } from "@/components/guards/permission-guard";

const campaignTypes = [
  { value: "holiday", label: "Holiday Campaign" },
  { value: "scheduled", label: "Scheduled Campaign" },
  { value: "recurring", label: "Recurring Campaign" },
];

const targetAudiences = [
  { value: "all_users", label: "All Users" },
  { value: "active_users", label: "Active Users Only" },
  { value: "verified_users", label: "Verified Users Only" },
  { value: "custom", label: "Custom (Select Roles)" },
];

const statusColors: Record<number, string> = {
  2: "secondary",  // draft/pending
  1: "default",    // active
  0: "outline",    // paused/completed
};

const statusLabels: Record<number, string> = {
  2: "Draft",
  1: "Active",
  0: "Paused",
};

const defaultForm: CreateEmailCampaignDto = {
  name: "",
  description: "",
  email_template_id: 0,
  email_config_id: undefined,
  campaign_type: "scheduled",
  holiday_name: "",
  scheduled_date: "",
  scheduled_time: "08:00",
  target_audience: "active_users",
  target_roles: [],
  is_active: 2,
};

export function EmailCampaignsContent() {
  const { data: campaignsData, isLoading } = useEmailCampaigns();
  const { data: templatesData } = useEmailTemplates();
  const { data: configsData } = useEmailConfigs();
  const { data: holidays } = useHolidays();
  const { data: rolesData } = useRoles();
  const { data: queueStats } = useQueueStats();
  const { data: variableMappings } = useVariableMappings();

  const createMutation = useCreateEmailCampaign();
  const updateMutation = useUpdateEmailCampaign();
  const deleteMutation = useDeleteEmailCampaign();
  const activateMutation = useActivateCampaign();
  const pauseMutation = usePauseCampaign();
  const triggerMutation = useTriggerCampaign();
  const processQueueMutation = useProcessQueue();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateEmailCampaignDto>(defaultForm);

  const campaigns = campaignsData?.data || [];
  const templates = templatesData?.data || [];
  const configs = configsData?.data || [];
  const roles = rolesData?.data || [];
  const openCreateDialog = () => {
    setEditingCampaign(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEditDialog = (campaign: EmailCampaign) => {
    setEditingCampaign(campaign);
    setForm({
      name: campaign.name,
      description: campaign.description || "",
      email_template_id: campaign.email_template_id,
      email_config_id: campaign.email_config_id || undefined,
      campaign_type: campaign.campaign_type,
      holiday_name: campaign.holiday_name || "",
      scheduled_date: campaign.scheduled_date || "",
      scheduled_time: campaign.scheduled_time || "08:00",
      target_audience: campaign.target_audience,
      target_roles: campaign.target_roles || [],
      is_active: campaign.is_active === 1 ? 1 : 2,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingCampaign) {
      updateMutation.mutate(
        { id: editingCampaign.id, data: form },
        { onSuccess: () => setDialogOpen(false) },
      );
    } else {
      createMutation.mutate(form, { onSuccess: () => setDialogOpen(false) });
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-12 w-12" />
          <p className="text-sm text-muted-foreground">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="email_campaigns.read">
    <>
      {/* Loading Overlay */}
      {(createMutation.isPending ||
        updateMutation.isPending ||
        deleteMutation.isPending ||
        activateMutation.isPending ||
        pauseMutation.isPending ||
        triggerMutation.isPending ||
        processQueueMutation.isPending) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 bg-card p-8 rounded-lg shadow-lg border">
            <Spinner className="h-12 w-12" />
            <p className="text-sm font-medium">
              {createMutation.isPending && "Creating campaign..."}
              {updateMutation.isPending && "Updating campaign..."}
              {deleteMutation.isPending && "Deleting campaign..."}
              {activateMutation.isPending && "Activating campaign..."}
              {pauseMutation.isPending && "Pausing campaign..."}
              {triggerMutation.isPending && "Triggering campaign..."}
              {processQueueMutation.isPending && "Processing queue..."}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/settings/email">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Email Campaigns</h1>
            <p className="text-muted-foreground">
              Manage holiday and scheduled email campaigns
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>

        {/* Queue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">
                    {queueStats?.pending || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <RefreshCw className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Processing</p>
                  <p className="text-2xl font-bold">
                    {queueStats?.processing || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Sent</p>
                  <p className="text-2xl font-bold">{queueStats?.sent || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <BarChart3 className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold">
                    {queueStats?.failed || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-start justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => processQueueMutation.mutate()}
                disabled={
                  processQueueMutation.isPending ||
                  (queueStats?.pending || 0) === 0
                }
              >
                <Zap className="h-4 w-4 mr-2" />
                Process Now
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns Table */}
        <Card>
          <CardHeader>
            <CardTitle>Campaigns</CardTitle>
            <CardDescription>
              View and manage your email campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            {campaigns.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">
                        <div>
                          {campaign.name}
                          {campaign.holiday_name && (
                            <p className="text-xs text-muted-foreground">
                              {
                                holidays?.find(
                                  (h) => h.key === campaign.holiday_name,
                                )?.name
                              }
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {campaign.campaign_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{campaign.template?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {campaign.target_audience.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            statusColors[campaign.is_active] as
                              | "default"
                              | "secondary"
                              | "outline"
                          }
                        >
                          {statusLabels[campaign.is_active]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(campaign.next_run_at)}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <span className="text-green-600">
                            {campaign.total_sent}
                          </span>
                          {" / "}
                          <span className="text-red-600">
                            {campaign.total_failed}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {campaign.is_active === 1 ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => pauseMutation.mutate(campaign.id)}
                              disabled={pauseMutation.isPending}
                              title="Pause"
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          ) : campaign.is_active !== 0 ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                activateMutation.mutate(campaign.id)
                              }
                              disabled={activateMutation.isPending}
                              title="Activate"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => triggerMutation.mutate(campaign.id)}
                            disabled={triggerMutation.isPending}
                            title="Trigger Now"
                          >
                            <Zap className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(campaign)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeletingId(campaign.id);
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
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No campaigns yet. Create one to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCampaign ? "Edit Campaign" : "Create Campaign"}
              </DialogTitle>
              <DialogDescription>
                Configure your email campaign settings
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., New Year Greetings"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign_type">Campaign Type *</Label>
                  <Select
                    value={form.campaign_type}
                    onValueChange={(
                      value: "holiday" | "scheduled" | "recurring",
                    ) => setForm({ ...form, campaign_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {campaignTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Brief description of the campaign..."
                  rows={2}
                />
              </div>

              {/* Holiday Selection */}
              {form.campaign_type === "holiday" && (
                <div className="space-y-2">
                  <Label htmlFor="holiday">Select Holiday *</Label>
                  <Select
                    value={form.holiday_name}
                    onValueChange={(value) =>
                      setForm({ ...form, holiday_name: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a holiday" />
                    </SelectTrigger>
                    <SelectContent>
                      {holidays?.map((holiday) => (
                        <SelectItem key={holiday.key} value={holiday.key}>
                          {holiday.name} ({holiday.month}/{holiday.day})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Scheduled Date */}
              {form.campaign_type === "scheduled" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduled_date">Schedule Date *</Label>
                    <Input
                      id="scheduled_date"
                      type="date"
                      value={form.scheduled_date}
                      onChange={(e) =>
                        setForm({ ...form, scheduled_date: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduled_time">Schedule Time</Label>
                    <Input
                      id="scheduled_time"
                      type="time"
                      value={form.scheduled_time}
                      onChange={(e) =>
                        setForm({ ...form, scheduled_time: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}

              {/* Template & Config */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template">Email Template *</Label>
                  <Select
                    value={form.email_template_id?.toString() || ""}
                    onValueChange={(value) =>
                      setForm({ ...form, email_template_id: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem
                          key={template.id}
                          value={template.id.toString()}
                        >
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="config">Email Config (Optional)</Label>
                  <Select
                    value={form.email_config_id?.toString() || "default"}
                    onValueChange={(value) =>
                      setForm({
                        ...form,
                        email_config_id:
                          value === "default" ? undefined : parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Use template default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">
                        Use template default
                      </SelectItem>
                      {configs.map((config) => (
                        <SelectItem
                          key={config.id}
                          value={config.id.toString()}
                        >
                          {config.from_email} ({config.driver})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label htmlFor="target_audience">Target Audience *</Label>
                <Select
                  value={form.target_audience}
                  onValueChange={(
                    value:
                      | "all_users"
                      | "active_users"
                      | "verified_users"
                      | "custom",
                  ) => setForm({ ...form, target_audience: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {targetAudiences.map((audience) => (
                      <SelectItem key={audience.value} value={audience.value}>
                        {audience.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Role Selection for Custom Audience */}
              {form.target_audience === "custom" && (
                <div className="space-y-2">
                  <Label>Select Roles</Label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-md">
                    {roles.map((role) => (
                      <Badge
                        key={role.id}
                        variant={
                          form.target_roles?.includes(role.id)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => {
                          const currentRoles = form.target_roles || [];
                          const newRoles = currentRoles.includes(role.id)
                            ? currentRoles.filter((r) => r !== role.id)
                            : [...currentRoles, role.id];
                          setForm({ ...form, target_roles: newRoles });
                        }}
                      >
                        {role.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Variable Info */}
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium mb-2">Available Variables:</p>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const selectedTemplate = templates.find(
                      (t) => t.id === form.email_template_id,
                    );
                    const templateVars = selectedTemplate?.variables || [];
                    const systemVars = variableMappings
                      ? Object.keys(variableMappings)
                      : [];
                    const allVars = [
                      ...new Set([...templateVars, ...systemVars]),
                    ];
                    return allVars.map((variable) => (
                      <Badge
                        key={variable}
                        variant={
                          templateVars.includes(variable)
                            ? "default"
                            : "outline"
                        }
                        title={
                          variableMappings?.[variable]
                            ? `Source: ${variableMappings[variable].source}`
                            : "Template variable"
                        }
                      >
                        {`{{${variable}}}`}
                      </Badge>
                    ));
                  })()}
                </div>
                <div className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1">
                  <Badge variant="default" className="text-[10px] px-1">
                    colored
                  </Badge>{" "}
                  = from template,
                  <Badge variant="outline" className="text-[10px] px-1">
                    outlined
                  </Badge>{" "}
                  = system variables
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  createMutation.isPending ||
                  updateMutation.isPending ||
                  !form.name ||
                  !form.email_template_id
                }
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingCampaign
                    ? "Update"
                    : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this campaign? This will also
                remove all queued emails for this campaign.
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
      </div>
    </>
    </PermissionGuard>
  );
}
