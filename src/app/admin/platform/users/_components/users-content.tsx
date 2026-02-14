"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PermissionGuard } from "@/components/guards/permission-guard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { isApprovalRequired } from "@/lib/api-client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { useUsers, useDeleteUser, useToggleUserStatus, useUpdateUser } from "@/hooks/use-users";
import { useRoles } from "@/hooks/use-roles";
import { useTranslation } from "@/hooks/use-translation";
import { useDebounce } from "@/hooks/use-debounce";
import { Spinner } from "@/components/ui/spinner";
import type { User } from "@/types";

const isSuperAdminOrDeveloper = (user: User) =>
  user.role?.slug === "super_admin" || user.role?.slug === "developer";

export function UsersContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  // Role change confirmation state
  const [roleChangeDialog, setRoleChangeDialog] = useState<{
    user: User;
    newRoleId: string;
    newRoleName: string;
  } | null>(null);

  const { data, isLoading } = useUsers({ page, limit: 10, search: debouncedSearch });
  const { data: rolesData } = useRoles({ limit: 100 });
  const deleteUserMutation = useDeleteUser();
  const toggleStatusMutation = useToggleUserStatus();
  const updateUserMutation = useUpdateUser();

  const handleDelete = async (user: User) => {
    if (isSuperAdminOrDeveloper(user)) return;
    if (confirm(`Are you sure you want to delete "${user.full_name}"?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const handleRoleChange = (user: User, roleId: string) => {
    const newRole = rolesData?.data?.find((r) => r.id.toString() === roleId);
    setRoleChangeDialog({
      user,
      newRoleId: roleId,
      newRoleName: newRole?.name || "Unknown",
    });
  };

  const confirmRoleChange = () => {
    if (!roleChangeDialog) return;
    updateUserMutation.mutate({
      id: roleChangeDialog.user.id,
      data: { role_id: parseInt(roleChangeDialog.newRoleId) },
    });
    setRoleChangeDialog(null);
  };

  const handleLoginAccessChange = (user: User, loginAccess: boolean) => {
    updateUserMutation.mutate({ id: user.id, data: { login_access: loginAccess ? 1 : 0 } });
  };

  return (
    <PermissionGuard permission="employees.view">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Employees</h1>
          <Button onClick={() => router.push("/admin/platform/users/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-8 w-8" />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Login Access</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.data?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell className="text-muted-foreground">{user.department || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{user.designation || "—"}</TableCell>
                        <TableCell>
                          {isSuperAdminOrDeveloper(user) ? (
                            <span className="text-xs font-medium text-muted-foreground">
                              {user.role?.name || "—"}
                            </span>
                          ) : (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded border border-dashed border-border hover:bg-muted transition-colors"
                                  disabled={updateUserMutation.isPending}
                                >
                                  {user.role?.name || "Select role"}
                                  <Pencil className="h-3 w-3 text-muted-foreground" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[180px] p-1" align="start">
                                <div className="flex flex-col">
                                  {rolesData?.data?.map((role) => (
                                    <button
                                      key={role.id}
                                      type="button"
                                      className={`text-left text-xs px-3 py-1.5 rounded hover:bg-muted transition-colors ${
                                        role.id === user.role_id ? "bg-muted font-semibold" : ""
                                      }`}
                                      onClick={() => {
                                        if (role.id !== user.role_id) {
                                          handleRoleChange(user, role.id.toString());
                                        }
                                      }}
                                    >
                                      {role.name}
                                    </button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={user.login_access === 1}
                            onText="ON"
                            offText="OFF"
                            disabled={
                              isSuperAdminOrDeveloper(user) ||
                              (updateUserMutation.isPending &&
                              updateUserMutation.variables?.id === user.id)
                            }
                            onCheckedChange={(checked) =>
                              handleLoginAccessChange(user, checked)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={user.is_active === 1}
                            onText="ACTIVE"
                            offText="INACTIVE"
                            pending={isApprovalRequired(toggleStatusMutation.error) && toggleStatusMutation.variables?.id === user.id}
                            disabled={
                              isSuperAdminOrDeveloper(user) ||
                              (toggleStatusMutation.isPending &&
                              toggleStatusMutation.variables?.id === user.id)
                            }
                            onCheckedChange={(checked) =>
                              toggleStatusMutation.mutate({ id: user.id, is_active: checked ? 1 : 0 })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/admin/platform/users/${user.id}/edit`)}
                              title="Edit Employee"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(user)}
                              disabled={isSuperAdminOrDeveloper(user) || deleteUserMutation.isPending}
                              title={isSuperAdminOrDeveloper(user) ? "Cannot delete super admin" : "Delete Employee"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {data?.data?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No employees found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {data?.pagination && data.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {data.pagination.page} / {data.pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={!data.pagination.hasPrevPage}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={!data.pagination.hasNextPage}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Role Change Confirmation Dialog */}
      <AlertDialog open={!!roleChangeDialog} onOpenChange={() => setRoleChangeDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change <strong>{roleChangeDialog?.user.full_name}</strong>&apos;s role from{" "}
              <strong>{roleChangeDialog?.user.role?.name || "Unknown"}</strong> to{" "}
              <strong>{roleChangeDialog?.newRoleName}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PermissionGuard>
  );
}
