"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Pencil, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { useServerSort } from "@/hooks/use-server-sort";
import { SortHead } from "@/components/ui/sort-head";
import {
  CommonTable,
  type CommonColumn,
} from "@/components/common/common-table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { isApprovalRequired } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMemo } from "react";
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
import { DeleteDialog } from "@/components/common/delete-dialog";
import { useUsers, useDeleteUser, useToggleUserStatus, useUpdateUser } from "@/hooks/use-users";
import { useRoles } from "@/hooks/use-roles";
import { useAuth } from "@/hooks/use-auth";
import { getUserRoleLevel } from "@/lib/auth-utils";
import { useTranslation } from "@/hooks/use-translation";
import { useDebounce } from "@/hooks/use-debounce";
import { PageLoader } from "@/components/common/page-loader";
import { TablePagination } from "@/components/common/table-pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { User } from "@/types";


export function UsersContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const currentUserLevel = getUserRoleLevel(currentUser);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState<{ column: string; direction: "ASC" | "DESC" } | null>({
    column: "full_name",
    direction: "ASC",
  });

  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const [roleChangeDialog, setRoleChangeDialog] = useState<{
    user: User;
    newRoleId: string;
    newRoleName: string;
  } | null>(null);

  const { data, isLoading, isFetching } = useUsers({
    page,
    limit,
    search: debouncedSearch,
    sort_by: sort?.column,
    sort_order: sort?.direction,
  });
  const { data: rolesData } = useRoles({ limit: 100 });
  const deleteUserMutation = useDeleteUser();
  const toggleStatusMutation = useToggleUserStatus();
  const updateUserMutation = useUpdateUser();

  const handleDelete = (user: User) => {
    if (user.id === currentUser?.id || (user.role?.level ?? 0) >= currentUserLevel) return;
    setDeleteUser(user);
  };

  const confirmDelete = () => {
    if (deleteUser) {
      deleteUserMutation.mutate(deleteUser.id, {
        onSuccess: () => setDeleteUser(null),
        onError: () => setDeleteUser(null),
      });
    }
  };

  const handleRoleChange = (user: User, roleId: string) => {
    const newRole = rolesData?.data?.find((r) => r.id.toString() === roleId);
    if (!newRole || newRole.level >= currentUserLevel) return;
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
    if (user.id === currentUser?.id || (user.role?.level ?? 0) >= currentUserLevel) return;
    updateUserMutation.mutate({ id: user.id, data: { login_access: loginAccess ? 1 : 0 } });
  };

  const isHigherOrEqualLevel = (user: User) => (user.role?.level ?? 0) >= currentUserLevel;

  const handleSort = (column: string) => {
    setSort((prev) => {
      if (prev?.column !== column) return { column, direction: "ASC" };
      if (prev.direction === "ASC") return { column, direction: "DESC" };
      return null;
    });
  };

  const normalise = (item: User) => ({
    ...item,
    is_active: item.is_active,   // keep raw value (0=inactive, 1=active, 2=pending)
    created_at: (item as any).createdAt ?? item.created_at ?? "",
  });

  const users = useMemo(() => (data?.data ?? []).map(normalise), [data?.data]);

  const columns: CommonColumn<User>[] = [
    {
      key: "full_name",
      header: "Employee",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            {row.avatar ? (
              <AvatarImage src={row.avatar} />
            ) : (
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {row.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{row.full_name}</span>
            <span className="text-[10px] text-muted-foreground">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      sortable: true,
      render: (row) => <span className="text-xs text-muted-foreground">{row.department || "—"}</span>,
    },
    {
      key: "designation",
      header: "Designation",
      sortable: true,
      render: (row) => <span className="text-xs text-muted-foreground">{row.designation || "—"}</span>,
    },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        isHigherOrEqualLevel(row) ? (
          <Badge variant="secondary" className="text-[10px] font-medium h-5">
            {row.role?.name || "—"}
          </Badge>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded border border-dashed border-border hover:bg-muted transition-colors h-5"
                disabled={updateUserMutation.isPending}
              >
                {row.role?.name || "Select role"}
                <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[180px] p-1" align="start">
              <div className="flex flex-col">
                {rolesData?.data
                  ?.filter((role) => role.level < currentUserLevel)
                  .map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      className={`text-left text-xs px-3 py-1.5 rounded hover:bg-muted transition-colors ${role.id === row.role_id ? "bg-muted font-semibold" : ""}`}
                      onClick={() => {
                        if (role.id !== row.role_id) {
                          handleRoleChange(row, role.id.toString());
                        }
                      }}
                    >
                      {role.name}
                    </button>
                  ))}
              </div>
            </PopoverContent>
          </Popover>
        )
      ),
    },
    {
      key: "login_access",
      header: "Login",
      render: (row) => (
        <Switch
          checked={row.login_access === 1}
          onText="ON"
          offText="OFF"
          disabled={
            row.id === currentUser?.id ||
            isHigherOrEqualLevel(row) ||
            (updateUserMutation.isPending &&
              updateUserMutation.variables?.id === row.id)
          }
          onCheckedChange={(checked) => handleLoginAccessChange(row, checked)}
        />
      ),
    },
  ];

  return (
    <PermissionGuard permission="employees.view">
      <div className="space-y-6">

        {/* Global Page Loader */}
        <PageLoader open={isLoading || isFetching || deleteUserMutation.isPending || toggleStatusMutation.isPending || updateUserMutation.isPending} />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Employees</CardTitle>
                  <CardDescription>Manage employee accounts and access</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={() => router.push("/admin/platform/users/create")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Employee
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <CommonTable
              columns={columns}
              data={users as any}
              isLoading={isLoading}
              onSort={handleSort}
              sortColumn={sort?.column}
              sortDirection={sort?.direction?.toLowerCase() as "asc" | "desc" | undefined}
              onStatusToggle={(row, val) => {
                if (isHigherOrEqualLevel(row) || row.id === currentUser?.id) return;
                toggleStatusMutation.mutate({
                  id: row.id,
                  is_active: val ? 1 : 0,
                });
              }}
              onEdit={(row) => router.push(`/admin/platform/users/${row.id}/edit`)}
              onDelete={handleDelete}
              emptyMessage="No employees found."
              showStatus
              showCreated
              showActions
              disableStatusToggle={(row) => isHigherOrEqualLevel(row) || row.id === currentUser?.id}
              disableEdit={(row) => row.id !== currentUser?.id && (row.role?.level ?? 0) >= currentUserLevel}
              disableDelete={(row) => row.id === currentUser?.id || (row.role?.level ?? 0) >= currentUserLevel}
            />

            {data?.pagination && (
              <TablePagination
                pagination={{ ...data.pagination, limit }}
                onPageChange={setPage}
                onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <DeleteDialog
        open={deleteUser !== null}
        onOpenChange={(open: boolean) => { if (!open) setDeleteUser(null); }}
        onConfirm={confirmDelete}
        isDeleting={deleteUserMutation.isPending}
        title="Delete Employee"
        description={`Are you sure you want to delete "${deleteUser?.full_name}"? This action cannot be undone.`}
      />

      {/* Role Change Confirmation Dialog */}
      <AlertDialog
        open={!!roleChangeDialog}
        onOpenChange={() => setRoleChangeDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change{" "}
              <strong>{roleChangeDialog?.user.full_name}</strong>&apos;s role from{" "}
              <strong>{roleChangeDialog?.user.role?.name || "Unknown"}</strong>{" "}
              to{" "}
              <strong>{roleChangeDialog?.newRoleName}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PermissionGuard>
  );
}