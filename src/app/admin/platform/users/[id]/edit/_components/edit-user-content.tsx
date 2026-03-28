"use client";

import { useUser } from "@/hooks";
import { UserForm } from "@/components/admin/users/user-form";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { PageLoader } from "@/components/common/page-loader";
import { useAuth } from "@/hooks/use-auth";
import { getUserRoleLevel, isDeveloper, isSuperAdmin } from "@/lib/auth-utils";

interface EditUserContentProps {
  userId: number;
}

export function EditUserContent({ userId }: EditUserContentProps) {
  const { data: userData, isLoading } = useUser(userId);
  const { user: currentUser, isLoading: isAuthLoading } = useAuth();
  const currentUserLevel = getUserRoleLevel(currentUser);

  // Wait for both the employee data and the current user to be loaded
  // before evaluating permission checks — prevents false "no permission"
  // when currentUser is still null and currentUserLevel defaults to 0.
  if (isLoading || isAuthLoading) return <PageLoader open />;

  if (!userData) {
    return (
      <div className="text-center py-16 text-muted-foreground">Employee not found.</div>
    );
  }

  // Developer and SuperAdmin can edit anyone; others only if target level is lower
  const canEdit =
    isDeveloper(currentUser) ||
    isSuperAdmin(currentUser) ||
    userData.id === currentUser?.id ||
    (userData.role?.level ?? 0) < currentUserLevel;

  if (!canEdit) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        You do not have permission to edit this employee.
      </div>
    );
  }

  return (
    <PermissionGuard permission="employees.view">
      <div className="space-y-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Edit Employee</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Update employee information
          </p>
        </div>
        <UserForm user={userData} />
      </div>
    </PermissionGuard>
  );
}