"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useRoles, useDeleteRole, useToggleRoleStatus } from "@/hooks/use-roles";
import { useTranslation } from "@/hooks/use-translation";
import { useDebounce } from "@/hooks/use-debounce";
import { PageLoader } from "@/components/common/page-loader";
import type { Role } from "@/types";
import { PermissionGuard } from "@/components/guards/permission-guard";

export function RolesContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useRoles({ page, limit: 10, search: debouncedSearch });
  const deleteRoleMutation = useDeleteRole();
  const toggleStatusMutation = useToggleRoleStatus();

  const handleEdit = (role: Role) => {
    router.push(`/admin/platform/roles/${role.id}/edit`);
  };

  const isSuperAdminOrDeveloper = (role: Role) =>
    role.slug === "super_admin" || role.slug === "developer";

  const handleDelete = async (role: Role) => {
    if (isSuperAdminOrDeveloper(role)) return;
    if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      deleteRoleMutation.mutate(role.id);
    }
  };

  return (
    <PermissionGuard permission="roles.view">
      <div className="space-y-6">

        {/* Page Loader */}
        <PageLoader open={isLoading} />

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t("nav.roles")}</h1>
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

            {!isLoading && (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.name")}</TableHead>
                      <TableHead>{t("common.description")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead>{t("common.approved", "Approved")}</TableHead>
                      <TableHead className="text-right">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {data?.data?.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {role.description || "-"}
                        </TableCell>

                        <TableCell>
                          <Switch
                            checked={role.is_active === 1}
                            onText="ACTIVE"
                            offText="INACTIVE"
                          pending={role.is_active === 2 || (isApprovalRequired(toggleStatusMutation.error) && toggleStatusMutation.variables?.id === role.id)}
                            disabled={
                              isSuperAdminOrDeveloper(role) ||
                              (toggleStatusMutation.isPending &&
                                toggleStatusMutation.variables?.id === role.id)
                            }
                            onCheckedChange={(checked) => {
                            toggleStatusMutation.mutate({ id: role.id, is_active: checked ? 1 : 0 });
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          {role.approved_at ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <Check className="h-3 w-3" />
                              {new Date(role.approved_at).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(role)}
                              disabled={isSuperAdminOrDeveloper(role)}
                            title={isSuperAdminOrDeveloper(role) ? "Cannot edit super admin" : "Edit Role"}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(role)}
                            disabled={isSuperAdminOrDeveloper(role) || deleteRoleMutation.isPending}
                            title={isSuperAdminOrDeveloper(role) ? "Cannot delete super admin" : "Delete Role"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}

                    {data?.data?.length === 0 && (
                      <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          {t("roles.no_roles_found")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {data?.pagination && data.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      {t("common.page", "Page")} {data.pagination.page} /{" "}
                      {data.pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={!data.pagination.hasPrevPage}
                      >
                        {t("common.previous", "Previous")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={!data.pagination.hasNextPage}
                      >
                        {t("common.next", "Next")}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}