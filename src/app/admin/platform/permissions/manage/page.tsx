"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Check, Shield, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/hooks/use-translation";
import { Spinner } from "@/components/ui/spinner";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";

interface PermissionAction {
  label: string;
  suffix: string;
}

const actions: PermissionAction[] = [
  { label: "View", suffix: "view" },
  { label: "Create", suffix: "create" },
  { label: "Edit", suffix: "edit" },
  { label: "Delete", suffix: "delete" },
  { label: "Manage", suffix: "manage" },
];

interface PermissionModule {
  name: string;
  slug: string;
  color: string;
  permissions: {
    slug: string;
    name: string;
    actions: string[]; // Only actions that exist for this permission
  }[];
}

export default function PermissionsManagePage() {
  const { t } = useTranslation();
  const { data, isLoading } = usePermissions({ page: 1, limit: 1000 });
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(["settings"]));
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  // Group permissions by module
  const groupedPermissions: PermissionModule[] = [
    {
      name: "Settings",
      slug: "settings",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      permissions: [
        { slug: "general_settings", name: "General Settings", actions: ["view", "edit"] },
        { slug: "email_configs", name: "Email Configuration", actions: ["view", "edit"] },
        { slug: "email_templates", name: "Email Templates", actions: ["view", "create", "edit", "delete"] },
        { slug: "phone_settings", name: "Phone Settings", actions: ["view", "edit"] },
        { slug: "tracking_settings", name: "Website Tracking", actions: ["view", "edit"] },
        { slug: "admin_appearance", name: "Dashboard Theme", actions: ["view", "edit"] },
        { slug: "admin_settings", name: "Site Settings", actions: ["view", "edit"] },
        { slug: "social_login", name: "Social Login", actions: ["view", "edit"] },
        { slug: "timezone_settings", name: "Timezone", actions: ["view", "edit"] },
        { slug: "cache_settings", name: "Cache", actions: ["view", "manage"] },
        { slug: "optimize_settings", name: "Optimization", actions: ["view", "edit"] },
      ],
    },
    {
      name: "Users & Roles",
      slug: "users_roles",
      color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
      permissions: [
        { slug: "users", name: "Users", actions: ["view", "create", "edit", "delete"] },
        { slug: "roles", name: "Roles", actions: ["view", "create", "edit", "delete"] },
        { slug: "permissions", name: "Permissions", actions: ["view", "create", "edit", "delete"] },
        { slug: "modules", name: "Modules", actions: ["view", "create", "edit", "delete"] },
      ],
    },
    {
      name: "Content Management",
      slug: "cms",
      color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      permissions: [
        { slug: "media", name: "Media", actions: ["view", "create", "delete"] },
        { slug: "translations", name: "Translations", actions: ["view", "create", "edit", "delete"] },
        { slug: "languages", name: "Languages", actions: ["view", "create", "edit", "delete"] },
      ],
    },
    {
      name: "Localization",
      slug: "localization",
      color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
      permissions: [
        { slug: "locations", name: "Locations", actions: ["view"] },
        { slug: "currencies", name: "Currencies", actions: ["view"] },
      ],
    },
    {
      name: "System",
      slug: "system",
      color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      permissions: [
        { slug: "activity_logs", name: "Activity Logs", actions: ["view", "delete"] },
        { slug: "email_campaigns", name: "Email Campaigns", actions: ["view", "create", "edit"] },
      ],
    },
  ];

  const toggleModule = (moduleSlug: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleSlug)) {
      newExpanded.delete(moduleSlug);
    } else {
      newExpanded.add(moduleSlug);
    }
    setExpandedModules(newExpanded);
  };

  const togglePermission = (permissionKey: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionKey)) {
      newSelected.delete(permissionKey);
    } else {
      newSelected.add(permissionKey);
    }
    setSelectedPermissions(newSelected);
  };

  const isModuleExpanded = (moduleSlug: string) => expandedModules.has(moduleSlug);

  const handleSavePermissions = () => {
    console.log("Saving permissions:", Array.from(selectedPermissions));
    // TODO: Implement save logic
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Permission Flags</h1>
          <p className="text-muted-foreground mt-1">
            Manage module permissions and access control
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedModules(new Set(groupedPermissions.map((m) => m.slug)))}
          >
            Expand All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedModules(new Set())}
          >
            Collapse All
          </Button>
          <Button onClick={handleSavePermissions}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Permission Tree */}
      <Card>
        <CardHeader className="border-b bg-muted/30 py-3">
          <div className="grid grid-cols-[1fr_90px_90px_90px_90px_90px] gap-2 items-center px-2">
            <div className="font-semibold text-sm">Module / Permission</div>
            {actions.map((action) => (
              <div key={action.suffix} className="text-center font-semibold text-xs">
                {action.label}
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {groupedPermissions.map((module, moduleIndex) => (
            <div
              key={module.slug}
              className={cn(
                "border-b last:border-b-0",
                moduleIndex % 2 === 0 ? "bg-background" : "bg-muted/10"
              )}
            >
              {/* Module Header */}
              <div
                className="grid grid-cols-[1fr_90px_90px_90px_90px_90px] gap-2 items-center p-3 px-4 hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => toggleModule(module.slug)}
              >
                <div className="flex items-center gap-2">
                  <button className="p-0.5 hover:bg-muted rounded">
                    {isModuleExpanded(module.slug) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">{module.name}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", module.color)}>
                    {module.permissions.length}
                  </span>
                </div>
                {/* Empty cells for alignment */}
                {actions.map((action) => (
                  <div key={action.suffix} />
                ))}
              </div>

              {/* Module Permissions */}
              {isModuleExpanded(module.slug) && (
                <div className="bg-muted/5">
                  {module.permissions.map((permission, permIndex) => (
                    <div
                      key={permission.slug}
                      className={cn(
                        "grid grid-cols-[1fr_90px_90px_90px_90px_90px] gap-2 items-center p-3 px-4 pl-14 hover:bg-muted/20 transition-colors",
                        permIndex > 0 && "border-t border-muted/30"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{permission.name}</span>
                        <code className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                          {permission.slug}
                        </code>
                      </div>
                      {actions.map((action) => {
                        const permissionKey = `${permission.slug}.${action.suffix}`;
                        const hasAction = permission.actions.includes(action.suffix);
                        return (
                          <div key={action.suffix} className="flex justify-center">
                            {hasAction ? (
                              <Checkbox
                                checked={selectedPermissions.has(permissionKey)}
                                onCheckedChange={() => togglePermission(permissionKey)}
                                className="data-[state=checked]:bg-primary"
                              />
                            ) : (
                              <span className="text-muted-foreground/20 text-xs">—</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <span className="text-muted-foreground">
                Modules: <strong className="text-foreground">{groupedPermissions.length}</strong>
              </span>
              <span className="text-muted-foreground">
                Permissions:{" "}
                <strong className="text-foreground">
                  {groupedPermissions.reduce((acc, m) => acc + m.permissions.length, 0)}
                </strong>
              </span>
              <span className="text-muted-foreground">
                Selected: <strong className="text-primary">{selectedPermissions.size}</strong>
              </span>
            </div>
            {selectedPermissions.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPermissions(new Set())}
              >
                Clear Selection
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
