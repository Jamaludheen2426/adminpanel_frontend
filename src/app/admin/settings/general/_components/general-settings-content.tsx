"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Pencil, Wrench } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useSettingsByGroup,
  useBulkUpdateSettings,
} from "@/hooks/use-settings";
import { Can, PermissionGuard } from "@/components/guards/permission-guard";
import { isApprovalRequired } from "@/lib/api-client";
import { Spinner } from "@/components/ui/spinner";
import { HtmlEditor } from "@/components/common/html-editor";

export function GeneralSettingsContent() {
  const { data: settings, isLoading } = useSettingsByGroup("general");
  const bulkUpdateMutation = useBulkUpdateSettings();

  const [values, setValues] = useState({
    maintenance_enabled: "false",
    maintenance_html: "",
  });

  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const switchPending = isApprovalRequired(bulkUpdateMutation.error);

  useEffect(() => {
    if (settings) {
      const settingsMap: Record<string, string> = {};
      settings.forEach((s) => {
        settingsMap[s.key] = s.value || "";
      });
      setValues({
        maintenance_enabled: settingsMap.maintenance_enabled || "false",
        maintenance_html:
          settingsMap.maintenance_html || getDefaultMaintenanceHTML(),
      });
    }
  }, [settings]);

  const handleSave = () => {
    bulkUpdateMutation.mutate({ group: "general", ...values });
  };

  const handleMaintenanceSave = () => {
    setMaintenanceDialogOpen(false);
  };

  const handleResetToDefault = () => {
    setValues({
      ...values,
      maintenance_html: getDefaultMaintenanceHTML(),
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-12 w-12" />
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="settings.view">
    <>
      {/* Loading Overlay - Shows when saving */}
      {bulkUpdateMutation.isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 bg-card p-8 rounded-lg shadow-lg border">
            <Spinner className="h-12 w-12" />
            <p className="text-sm font-medium">Saving settings...</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">General Settings</h1>
            <p className="text-muted-foreground mt-1">
              Configure system maintenance mode
            </p>
          </div>
        </div>

        {/* System Maintenance Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              System Maintenance Mode
            </CardTitle>
            <CardDescription>
              Show a maintenance page while performing system updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch
                  checked={values.maintenance_enabled === "true"}
                  pending={switchPending}
                  onCheckedChange={(checked) =>
                    setValues({
                      ...values,
                      maintenance_enabled: checked ? "true" : "false",
                    })
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {switchPending
                    ? "Pending approval..."
                    : values.maintenance_enabled === "true"
                    ? "Site is under maintenance"
                    : "Site is operating normally"}
                </span>
              </div>
              <Can permission="general_settings.edit">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMaintenanceDialogOpen(true)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Can>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Can permission="general_settings.edit">
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={bulkUpdateMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {bulkUpdateMutation.isPending
                ? "Saving..."
                : "Save General Settings"}
            </Button>
          </div>
        </Can>
      </div>

      {/* Maintenance Mode Edit Dialog */}
      <Dialog
        open={maintenanceDialogOpen}
        onOpenChange={setMaintenanceDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Edit Maintenance Page
            </DialogTitle>
            <DialogDescription>
              Customize the HTML content that will be displayed during system
              maintenance
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Label>Status:</Label>
              <Switch
                checked={values.maintenance_enabled === "true"}
                pending={switchPending}
                onCheckedChange={(checked) =>
                  setValues({
                    ...values,
                    maintenance_enabled: checked ? "true" : "false",
                  })
                }
              />
              <span className="text-sm text-muted-foreground">
                {switchPending ? "Pending approval..." : values.maintenance_enabled === "true" ? "Active" : "Disabled"}
              </span>
            </div>

            {/* HTML Editor Component */}
            <HtmlEditor
              value={values.maintenance_html}
              onChange={(value) =>
                setValues({
                  ...values,
                  maintenance_html: value,
                })
              }
              label="Maintenance Page HTML"
              placeholder="Enter your HTML content here..."
              rows={14}
              helpText="You can use HTML, CSS (inline or in style tags), and basic styling"
              showResetButton={true}
              onReset={handleResetToDefault}
              resetButtonText="Reset to Default"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMaintenanceDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleMaintenanceSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
    </PermissionGuard>
  );
}

function getDefaultMaintenanceHTML() {
  return `<div style="text-align: center; max-width: 600px; margin: 0 auto;">
  <div style="margin-bottom: 2rem;">
    <div style="display: inline-block; background: rgba(234, 179, 8, 0.1); padding: 1.5rem; border-radius: 50%;">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgb(234, 179, 8)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
      </svg>
    </div>
  </div>

  <h1 style="font-size: 3rem; font-weight: bold; margin-bottom: 1rem; color: inherit;">
    Under Maintenance
  </h1>

  <p style="font-size: 1.25rem; color: #6b7280; margin-bottom: 2rem; line-height: 1.6;">
    We're currently performing scheduled maintenance. We'll be back shortly!
  </p>

  <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: #6b7280; margin-bottom: 2rem;">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
    <span>Please check back soon</span>
  </div>
</div>`;
}