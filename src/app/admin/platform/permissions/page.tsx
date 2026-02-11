"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import {
  usePermissions,
  useUpdatePermission,
  useDeletePermission,
  useTogglePermissionStatus,
} from "@/hooks/use-permissions";
import { useTranslation } from "@/hooks/use-translation";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import type { Permission } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const editSchema = z.object({
  name: z.string().min(2, "Permission name required"),
  description: z.string().optional(),
});

type EditFormData = z.infer<typeof editSchema>;

function EditPermissionForm({
  permission,
  onSuccess,
}: {
  permission: Permission;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const updateMutation = useUpdatePermission();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: permission.name || "",
      description: permission.description || "",
    },
  });

  useEffect(() => {
    reset({
      name: permission.name || "",
      description: permission.description || "",
    });
  }, [permission, reset]);

  const onSubmit = (data: EditFormData) => {
    updateMutation.mutate(
      { id: permission.id, data },
      { onSuccess }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label className="text-sm text-muted-foreground">Slug</Label>
        <code className="block mt-1 text-sm bg-muted px-3 py-2 rounded">
          {permission.slug}
        </code>
      </div>

      <div>
        <Label htmlFor="edit-name">
          {t("permissions.permission_name", "Permission Name")}
        </Label>
        <Input id="edit-name" {...register("name")} className="mt-2" />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="edit-description">
          {t("common.description", "Description")}
        </Label>
        <Textarea
          id="edit-description"
          {...register("description")}
          className="mt-2"
          rows={3}
        />
      </div>

      <div className="flex gap-4 pt-2">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending
            ? t("common.updating", "Updating...")
            : t("permissions.update_permission", "Update Permission")}
        </Button>
      </div>
    </form>
  );
}

export default function PermissionsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] =
    useState<Permission | null>(null);

  const { data, isLoading } = usePermissions({ page, limit: 10, search });
  const toggleStatusMutation = useTogglePermissionStatus();
  const deleteMutation = useDeletePermission();

  const handleEdit = (perm: Permission) => {
    setSelectedPermission(perm);
    setIsEditOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm(t("permissions.delete_confirm", "Delete this permission?"))) {
      deleteMutation.mutate(id);
    }
  };

  const handleEditClose = () => {
    setIsEditOpen(false);
    setSelectedPermission(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("permissions.title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("permissions.description")}
          </p>
        </div>
        <Link href="/admin/platform/permissions/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("permissions.add_permission")}
          </Button>
        </Link>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("permissions.edit_permission", "Edit Permission")}
            </DialogTitle>
            <DialogDescription>
              {t("permissions.edit_permission_desc", "Update permission details")}
            </DialogDescription>
          </DialogHeader>
          {selectedPermission && (
            <EditPermissionForm
              permission={selectedPermission}
              onSuccess={handleEditClose}
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
                placeholder={t("permissions.search", "Search permissions...")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
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
                    <TableHead>{t("permissions.name")}</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>{t("permissions.module", "Module")}</TableHead>
                    <TableHead>{t("common.description")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead className="text-right">
                      {t("common.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data?.map((perm) => (
                    <TableRow key={perm.id}>
                      <TableCell className="font-medium">{perm.name}</TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {perm.slug}
                        </code>
                      </TableCell>
                      <TableCell>{perm.module || "—"}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {perm.description || "—"}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={perm.is_active}
                          disabled={
                            toggleStatusMutation.isPending &&
                            toggleStatusMutation.variables?.id === perm.id
                          }
                          onCheckedChange={(checked) => {
                            toggleStatusMutation.mutate({
                              id: perm.id,
                              is_active: checked,
                            });
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(perm)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(perm.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data?.data?.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        {t("permissions.no_permissions")}
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
  );
}
