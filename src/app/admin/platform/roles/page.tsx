"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Search, Shield } from "lucide-react";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRoles, useDeleteRole, useToggleRoleStatus } from "@/hooks/use-roles";
import { RoleForm } from "@/components/admin/roles/role-form";
import { RolePermissions } from "@/components/admin/roles/role-permissions";
import { useTranslation } from "@/hooks/use-translation";
import { Spinner } from "@/components/ui/spinner";
import type { Role } from "@/types";

export default function RolesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const { data, isLoading } = useRoles({ page, limit: 10, search });
  const deleteRoleMutation = useDeleteRole();
  const toggleStatusMutation = useToggleRoleStatus();

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setIsDialogOpen(true);
  };

  const handlePermissions = (role: Role) => {
    setSelectedRole(role);
    setIsPermissionsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm(t('roles.delete_confirm'))) {
      deleteRoleMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedRole(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('nav.roles')}</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedRole(null)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('roles.add_role')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedRole ? t('roles.edit_role') : t('roles.add_role')}</DialogTitle>
              <DialogDescription>
                {selectedRole ? t('roles.edit_desc') : t('roles.add_desc')}
              </DialogDescription>
            </DialogHeader>
            <RoleForm role={selectedRole} onSuccess={handleDialogClose} />
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isPermissionsOpen} onOpenChange={setIsPermissionsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('roles.manage_permissions')} - {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              {t('roles.permissions_desc')}
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <RolePermissions
              roleId={selectedRole.id}
              onSuccess={() => setIsPermissionsOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('roles.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
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
                    <TableHead>{t('common.name')}</TableHead>
                    <TableHead>{t('common.slug')}</TableHead>
                    <TableHead>{t('common.description')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data?.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {role.slug}
                        </code>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {role.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={role.is_active}
                          disabled={toggleStatusMutation.isPending && toggleStatusMutation.variables?.id === role.id}
                          onCheckedChange={(checked) => {
                            toggleStatusMutation.mutate({ id: role.id, is_active: checked });
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePermissions(role)}
                            title="Manage Permissions"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(role)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(role.id)}
                            disabled={deleteRoleMutation.isPending}
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
                        {t('roles.no_roles_found')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    {t('common.page', 'Page')} {data.pagination.page} / {data.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={!data.pagination.hasPrevPage}
                    >
                      {t('common.previous', 'Previous')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!data.pagination.hasNextPage}
                    >
                      {t('common.next', 'Next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
