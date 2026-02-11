"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useRole, useAssignPermissions } from "@/hooks/use-roles";
import { usePermissions } from "@/hooks/use-permissions";
import { Permission } from "@/types";
import { ShieldAlert } from "lucide-react";

interface RolePermissionsProps {
  roleId: number;
  onSuccess?: () => void;
}

export function RolePermissions({ roleId, onSuccess }: RolePermissionsProps) {
  const { data: role, isLoading: roleLoading } = useRole(roleId);
  const { data: permissionsData, isLoading: permissionsLoading } = usePermissions({ limit: 200 });
  const assignPermissionsMutation = useAssignPermissions();

  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [approvalModules, setApprovalModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (role?.permissions) {
      setSelectedPermissions(role.permissions.map((p) => p.id));

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

  const handleToggle = (permissionId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSelectAll = (module: string, permissions: Permission[]) => {
    const modulePermissions = permissions.filter((p) => p.module === module);
    const moduleIds = modulePermissions.map((p) => p.id);
    const allSelected = moduleIds.every((id) => selectedPermissions.includes(id));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !moduleIds.includes(id)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...moduleIds])]);
    }
  };

  const handleApprovalToggle = (module: string) => {
    setApprovalModules((prev) => ({
      ...prev,
      [module]: !prev[module],
    }));
  };

  const handleSave = () => {
    // Build permissions array with requiresApproval flag per module
    const permissionsPayload = selectedPermissions.map((permId) => {
      const permission = permissionsData?.data?.find((p) => p.id === permId);
      const mod = permission?.module || 'other';
      return {
        permissionId: permId,
        requiresApproval: !!approvalModules[mod],
      };
    });

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
  const groupedPermissions = permissionsData?.data?.reduce(
    (acc, permission) => {
      const module = permission.module || "other";
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(permission);
      return acc;
    },
    {} as Record<string, typeof permissionsData.data>
  );

  return (
    <div className="space-y-6">
      {Object.entries(groupedPermissions || {}).map(([module, permissions]) => {
        const moduleIds = permissions.map((p) => p.id);
        const allSelected = moduleIds.every((id) => selectedPermissions.includes(id));
        const someSelected = moduleIds.some((id) => selectedPermissions.includes(id)) && !allSelected;
        const hasAnySelected = moduleIds.some((id) => selectedPermissions.includes(id));

        return (
          <div key={module} className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`module-${module}`}
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = someSelected;
                    }
                  }}
                  onCheckedChange={() => handleSelectAll(module, permissions)}
                />
                <Label
                  htmlFor={`module-${module}`}
                  className="text-base font-semibold capitalize cursor-pointer"
                >
                  {module.replace(/_/g, " ")}
                </Label>
              </div>
              {hasAnySelected && (
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <Label
                    htmlFor={`approval-${module}`}
                    className="text-xs font-medium text-yellow-700 dark:text-yellow-300 cursor-pointer"
                  >
                    Requires Approval
                  </Label>
                  <Switch
                    id={`approval-${module}`}
                    checked={!!approvalModules[module]}
                    onCheckedChange={() => handleApprovalToggle(module)}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 pl-6">
              {permissions.map((permission) => (
                <div key={permission.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`permission-${permission.id}`}
                    checked={selectedPermissions.includes(permission.id)}
                    onCheckedChange={() => handleToggle(permission.id)}
                  />
                  <Label
                    htmlFor={`permission-${permission.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {permission.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          type="button"
          onClick={handleSave}
          disabled={assignPermissionsMutation.isPending}
        >
          {assignPermissionsMutation.isPending ? "Saving..." : "Save Permissions"}
        </Button>
      </div>
    </div>
  );
}
