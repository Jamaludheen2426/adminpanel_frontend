"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useRole, useAssignPermissions } from "@/hooks/use-roles";
import { usePermissions } from "@/hooks/use-permissions";
import { Permission } from "@/types";
import { cn } from "@/lib/utils";

interface RolePermissionsProps {
  roleId: number;
  onSuccess?: () => void;
}

interface ModuleGroup {
  name: string;
  slug: string;
  color: string;
}

const moduleGroups: ModuleGroup[] = [
  { name: "Settings", slug: "settings", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  { name: "Users & Roles", slug: "users_roles", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  { name: "Content", slug: "cms", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  { name: "Localization", slug: "localization", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  { name: "System", slug: "system", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
];

export function RolePermissions({ roleId, onSuccess }: RolePermissionsProps) {
  const { data: role, isLoading: roleLoading } = useRole(roleId);
  const { data: permissionsData, isLoading: permissionsLoading } = usePermissions({ limit: 500 });
  const assignPermissionsMutation = useAssignPermissions();

  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(["settings"]));
  const [expandedSubModules, setExpandedSubModules] = useState<Set<string>>(new Set());
  const [selectedPermissionKeys, setSelectedPermissionKeys] = useState<Set<string>>(new Set());
  const [approvalModules, setApprovalModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (role?.permissions) {
      // Build permission keys from role permissions (slug-based)
      const keys = new Set<string>();
      role.permissions.forEach((p: Permission) => {
        // Each permission slug might be like "users.view" or "roles.edit"
        keys.add(p.slug);
      });
      setSelectedPermissionKeys(keys);

      // Read requires_approval from the RolePermission join data
      const modules: Record<string, boolean> = {};
      role.permissions.forEach((p: Permission & { RolePermission?: { requires_approval?: boolean } }) => {
        const mod = p.module || 'other';
        if (p.RolePermission?.requires_approval) {
          modules[mod] = true;
        }
      });
      setApprovalModules(modules);
    }
  }, [role]);

  const toggleModule = (moduleSlug: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleSlug)) {
      newExpanded.delete(moduleSlug);
    } else {
      newExpanded.add(moduleSlug);
    }
    setExpandedModules(newExpanded);
  };

  const toggleSubModule = (subModuleSlug: string) => {
    const newExpanded = new Set(expandedSubModules);
    if (newExpanded.has(subModuleSlug)) {
      newExpanded.delete(subModuleSlug);
    } else {
      newExpanded.add(subModuleSlug);
    }
    setExpandedSubModules(newExpanded);
  };

  const togglePermissionKey = (permissionKey: string) => {
    const newSelected = new Set(selectedPermissionKeys);
    if (newSelected.has(permissionKey)) {
      newSelected.delete(permissionKey);
    } else {
      newSelected.add(permissionKey);
    }
    setSelectedPermissionKeys(newSelected);
  };

  const handleApprovalToggle = (module: string) => {
    setApprovalModules((prev) => ({
      ...prev,
      [module]: !prev[module],
    }));
  };

  const isModuleExpanded = (moduleSlug: string) => expandedModules.has(moduleSlug);
  const isSubModuleExpanded = (subModuleSlug: string) => expandedSubModules.has(subModuleSlug);

  const handleSave = () => {
    // Map selected permission keys back to permission IDs
    const permissionsPayload = Array.from(selectedPermissionKeys)
      .map((slug) => {
        const permission = permissionsData?.data?.find((p) => p.slug === slug);
        if (!permission) return null;
        const mod = permission.module || 'other';
        return {
          permissionId: permission.id,
          requiresApproval: !!approvalModules[mod],
        };
      })
      .filter(Boolean) as { permissionId: number; requiresApproval: boolean }[];

    assignPermissionsMutation.mutate(
      { id: roleId, permissions: permissionsPayload },
      { onSuccess }
    );
  };

  if (roleLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Group permissions by module
  const groupedByModule = permissionsData?.data?.reduce(
    (acc, permission) => {
      const module = permission.module || "other";
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>
  ) || {};

  // Build grouped permissions structure with sub-modules
  const groupedPermissions = moduleGroups.map((group) => {
    const modulesInGroup = Object.keys(groupedByModule).filter((mod) => {
      // Group by module category
      if (group.slug === "settings") return mod === "settings";
      if (group.slug === "users_roles") return ["sub_admins", "roles", "permissions", "modules"].includes(mod);
      if (group.slug === "cms") return ["media", "translations", "languages"].includes(mod);
      if (group.slug === "localization") return ["locations", "currencies"].includes(mod);
      if (group.slug === "system") return ["activity_logs", "email_campaigns", "email_configs", "email_templates", "other"].includes(mod);
      return false;
    });

    // Create sub-modules structure
    const subModules = modulesInGroup.map((mod) => ({
      slug: mod,
      name: mod.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
      permissions: groupedByModule[mod] || [],
    }));

    return {
      ...group,
      subModules,
    };
  }).filter((group) => group.subModules.length > 0);

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex items-center justify-between pb-3">
        <div className="text-sm font-semibold">Permission Flags</div>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => {
              setExpandedModules(new Set());
              setExpandedSubModules(new Set());
            }}
          >
            Collapse all
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => {
              setExpandedModules(new Set(groupedPermissions.map((m) => m.slug)));
              const allSubModules = groupedPermissions.flatMap((g) => g.subModules.map((s) => s.slug));
              setExpandedSubModules(new Set(allSubModules));
            }}
          >
            Expand all
          </button>
        </div>
      </div>

      {/* Simple Permission Tree */}
      <div className="border rounded-lg overflow-hidden max-h-[60vh] overflow-y-auto">
        {groupedPermissions.map((group, groupIndex) => {
          const hasAnySelected = group.subModules.some((sub) =>
            sub.permissions.some((p) => selectedPermissionKeys.has(p.slug))
          );

          return (
            <div
              key={group.slug}
              className={cn(
                "border-b last:border-b-0",
                groupIndex % 2 === 0 ? "bg-muted/30" : "bg-background"
              )}
            >
              {/* Module Group Header */}
              <div
                className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleModule(group.slug)}
              >
                <button type="button" className="flex items-center">
                  {isModuleExpanded(group.slug) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                <span className={cn("font-semibold text-sm px-2 py-0.5 rounded", group.color)}>
                  {group.name}
                </span>
                {hasAnySelected && role?.slug !== 'super_admin' && role?.slug !== 'developer' && (
                  <div className="flex items-center gap-1 ml-auto" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={!!approvalModules[group.slug]}
                      onCheckedChange={() => handleApprovalToggle(group.slug)}
                      className="h-3 w-3"
                    />
                    <span className="text-xs text-muted-foreground">Requires Approval</span>
                  </div>
                )}
              </div>

              {/* Sub-Modules */}
              {isModuleExpanded(group.slug) && (
                <div className="pl-4">
                  {group.subModules.map((subModule) => (
                    <div key={subModule.slug} className="border-t border-muted/30">
                      {/* Sub-Module Header */}
                      <div
                        className="flex items-center gap-2 p-2 px-3 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => toggleSubModule(subModule.slug)}
                      >
                        <button type="button" className="flex items-center">
                          {isSubModuleExpanded(subModule.slug) ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </button>
                        <span className="text-xs font-medium text-muted-foreground">
                          {subModule.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ({subModule.permissions.length})
                        </span>
                      </div>

                      {/* Sub-Module Permissions - Inline Display */}
                      {isSubModuleExpanded(subModule.slug) && (
                        <div className="pl-6 pr-3 pb-2 flex flex-wrap gap-2">
                          {subModule.permissions.map((permission) => (
                            <div
                              key={permission.id}
                              className="flex items-center gap-1.5 px-2 py-1 hover:bg-muted/30 rounded"
                            >
                              <Checkbox
                                id={`perm-${permission.id}`}
                                checked={selectedPermissionKeys.has(permission.slug)}
                                onCheckedChange={() => togglePermissionKey(permission.slug)}
                                className="h-3 w-3"
                              />
                              <label
                                htmlFor={`perm-${permission.id}`}
                                className="text-xs cursor-pointer whitespace-nowrap"
                              >
                                {permission.slug}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={assignPermissionsMutation.isPending}
        >
          {assignPermissionsMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
