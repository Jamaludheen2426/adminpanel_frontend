"use client";

import { useUser } from "@/hooks";
import { UserForm } from "@/components/admin/users/user-form";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { PageLoader } from "@/components/common/page-loader";
import { useAuth } from "@/hooks/use-auth";
import { getUserRoleLevel } from "@/lib/auth-utils";

interface EditUserContentProps {
  userId: number;
}

export function EditUserContent({ userId }: EditUserContentProps) {
  const { data: userData, isLoading } = useUser(userId);
  const { user: currentUser } = useAuth();
  const currentUserLevel = getUserRoleLevel(currentUser);

  if (!isLoading && !userData) {
    return (
      <div className="text-center py-16 text-muted-foreground">Employee not found.</div>
    );
  }

  if (!isLoading && userData && userData.id !== currentUser?.id && (userData.role?.level ?? 0) >= currentUserLevel) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        You do not have permission to edit this employee.
      </div>
    );
  }

  return (
    <PermissionGuard permission="employees.view">
      <PageLoader open={isLoading} />
      {!isLoading && (
        <div className="space-y-1">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Edit Employee</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Update employee information
            </p>
          </div>
          <UserForm user={userData!} />
        </div>
      )}
    </PermissionGuard>
  );
}