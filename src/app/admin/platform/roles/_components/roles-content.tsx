"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CommonTable,
  type CommonColumn,
} from "@/components/common/common-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DeleteDialog } from "@/components/common/delete-dialog";
import { useRoles, useDeleteRole, useToggleRoleStatus } from "@/hooks/use-roles";
import { useAuth } from "@/hooks/use-auth";
import { getUserRoleLevel } from "@/lib/auth-utils";
import { useTranslation } from "@/hooks/use-translation";
import { useDebounce } from "@/hooks/use-debounce";
import { PageLoader } from "@/components/common/page-loader";
import { TablePagination } from "@/components/common/table-pagination";
import type { Role } from "@/types";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { useMemo } from "react";

export function RolesContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const currentUserLevel = getUserRoleLevel(currentUser);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState<{ column: string; direction: "ASC" | "DESC" } | null>({
    column: "name",
    direction: "ASC",
  });

  const [deleteRole, setDeleteRole] = useState<Role | null>(null);

  const { data, isLoading, isFetching } = useRoles({
    page,
    limit,
    search: debouncedSearch,
    sort_by: sort?.column,
    sort_order: sort?.direction,
  });

  const deleteRoleMutation = useDeleteRole();
  const toggleStatusMutation = useToggleRoleStatus();

  const handleSort = (column: string) => {
    setSort((prev) => {
      if (prev?.column !== column) return { column, direction: "ASC" };
      if (prev.direction === "ASC") return { column, direction: "DESC" };
      return null;
    });
  };

  const normalise = (item: Role) => ({
    ...item,
    is_active: item.is_active,
    created_at: (item as any).createdAt ?? item.created_at ?? "",
  });

  const roles = useMemo(() => (data?.data ?? []).map(normalise), [data?.data]);

  const columns: CommonColumn<Role>[] = [
    {
      key: "name",
      header: t("common.name"),
      sortable: true,
      render: (row) => <span className="font-medium text-sm">{row.name}</span>,
    },
    {
      key: "description",
      header: t("common.description"),
      render: (row) => <span className="text-xs text-muted-foreground truncate max-w-xs block">{row.description || "-"}</span>,
    },
    {
      key: "approved_at",
      header: t("common.approved", "Approved"),
      render: (row) => row.approved_at ? (
        <span className="inline-flex items-center gap-1 text-[10px] text-green-600 bg-green-50 dark:bg-green-950/30 px-1.5 py-0.5 rounded border border-green-200 dark:border-green-800">
          <Check className="h-3 w-3" />
          {new Date(row.approved_at).toLocaleDateString()}
        </span>
      ) : (
        <span className="text-[10px] text-muted-foreground">—</span>
      ),
    },
  ];

  return (
    <PermissionGuard permission="roles.view">
      <div className="space-y-6">

        {/* Page Loader */}
        <PageLoader open={isLoading || isFetching || deleteRoleMutation.isPending || toggleStatusMutation.isPending} />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">{t("nav.roles")}</h1>
          <Button onClick={() => router.push("/admin/platform/roles/create")}>
            <Plus className="mr-2 h-4 w-4" />
            {t("roles.add_role")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("roles.search")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <CommonTable
              columns={columns}
              data={roles as any}
              isLoading={isLoading}
              onSort={handleSort}
              sortColumn={sort?.column}
              sortDirection={sort?.direction?.toLowerCase() as "asc" | "desc" | undefined}
              onStatusToggle={(row, val) => {
                if ((row.level ?? 0) > currentUserLevel || row.id === currentUser?.role_id) return;
                toggleStatusMutation.mutate({ id: row.id, is_active: val ? 1 : 0 });
              }}
              disableStatusToggle={(row) => (row.level ?? 0) > currentUserLevel || row.id === currentUser?.role_id}
              onEdit={(row) => router.push(`/admin/platform/roles/${row.id}/edit`)}
              onDelete={(row) => {
                if ((row.level ?? 0) > currentUserLevel || row.id === currentUser?.role_id) return;
                setDeleteRole(row);
              }}
              disableEdit={(row) => (row.level ?? 0) > currentUserLevel}
              disableDelete={(row) => (row.level ?? 0) > currentUserLevel || row.id === currentUser?.role_id}
              emptyMessage={t("roles.no_roles_found")}
              showStatus
              showCreated
              showActions
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

      <DeleteDialog
        open={deleteRole !== null}
        onOpenChange={(open: boolean) => { if (!open) setDeleteRole(null); }}
        onConfirm={() => {
          if (deleteRole) {
            deleteRoleMutation.mutate(deleteRole.id, {
              onSuccess: () => setDeleteRole(null),
              onError: () => setDeleteRole(null),
            });
          }
        }}
        isDeleting={deleteRoleMutation.isPending}
        title={t("roles.delete_role", "Delete Role")}
        description={`Are you sure you want to delete the role "${deleteRole?.name}"? This action cannot be undone.`}
      />
    </PermissionGuard>
  );
}