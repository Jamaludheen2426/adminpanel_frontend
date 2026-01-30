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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRoles, useDeleteRole } from "@/hooks/use-roles";
import { RoleForm } from "@/components/admin/roles/role-form";
import { RolePermissions } from "@/components/admin/roles/role-permissions";
import type { Role } from "@/types";

export default function RolesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const { data, isLoading } = useRoles({ page, limit: 10, search });
  const deleteRoleMutation = useDeleteRole();

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setIsDialogOpen(true);
  };

  const handlePermissions = (role: Role) => {
    setSelectedRole(role);
    setIsPermissionsOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this role?")) {
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
        <h1 className="text-3xl font-bold">Roles</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedRole(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedRole ? "Edit Role" : "Add Role"}</DialogTitle>
              <DialogDescription>
                {selectedRole ? "Update the role details below." : "Fill in the details to create a new role."}
              </DialogDescription>
            </DialogHeader>
            <RoleForm role={selectedRole} onSuccess={handleDialogClose} />
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isPermissionsOpen} onOpenChange={setIsPermissionsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Permissions - {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Select the permissions to assign to this role.
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
                placeholder="Search roles..."
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                        <Badge variant={role.is_active ? "default" : "secondary"}>
                          {role.is_active ? "Active" : "Inactive"}
                        </Badge>
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
                        No roles found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {data.pagination.page} of {data.pagination.totalPages}
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
  );
}
