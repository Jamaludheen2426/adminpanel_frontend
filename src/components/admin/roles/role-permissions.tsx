"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useRole, useAssignPermissions } from "@/hooks/use-roles";
import { usePermissions } from "@/hooks/use-permissions";
import { Permission } from "@/types";

interface RolePermissionsProps {
  roleId: number;
  onSuccess?: () => void;
}

export function RolePermissions({ roleId, onSuccess }: RolePermissionsProps) {
  const { data: role, isLoading: roleLoading } = useRole(roleId);
  const { data: permissionsData, isLoading: permissionsLoading } = usePermissions({ limit: 200 });
  const assignPermissionsMutation = useAssignPermissions();

  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  useEffect(() => {
    if (role?.permissions) {
      setSelectedPermissions(role.permissions.map((p) => p.id));
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

  const handleSave = () => {
    assignPermissionsMutation.mutate(
      { id: roleId, permissionIds: selectedPermissions },
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

        return (
          <div key={module} className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
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
