"use client";

import { useRole } from "@/hooks/use-roles";
import { RoleForm } from "@/components/admin/roles/role-form";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { PageLoader } from "@/components/common/page-loader";

interface EditRoleContentProps {
  roleId: number;
}

export function EditRoleContent({ roleId }: EditRoleContentProps) {
  const { data: roleData, isLoading } = useRole(roleId);

  if (!isLoading && !roleData) {
    return (
      <div className="text-center py-16 text-muted-foreground">Role not found.</div>
    );
  }

  return (
    <PermissionGuard permission="roles.view">
      <PageLoader open={isLoading} />
      {!isLoading && (
        <div className="space-y-1">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Edit Role</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Update role details and permissions
            </p>
          </div>
          <RoleForm role={roleData!} />
        </div>
      )}
    </PermissionGuard>
  );
}