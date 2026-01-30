"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useCreateRole, useUpdateRole } from "@/hooks/use-roles";
import type { Role } from "@/types";

const roleSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormProps {
  role?: Role | null;
  onSuccess?: () => void;
}

export function RoleForm({ role, onSuccess }: RoleFormProps) {
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name || "",
      slug: role?.slug || "",
      description: role?.description || "",
      is_active: role?.is_active ?? true,
    },
  });

  const isActive = watch("is_active");

  const onSubmit = (data: RoleFormData) => {
    if (role) {
      updateRoleMutation.mutate({ id: role.id, data }, { onSuccess });
    } else {
      createRoleMutation.mutate(data, { onSuccess });
    }
  };

  const isPending = createRoleMutation.isPending || updateRoleMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {!role && (
        <div className="space-y-2">
          <Label htmlFor="slug">Slug (optional)</Label>
          <Input id="slug" {...register("slug")} placeholder="auto-generated-if-empty" />
          <p className="text-xs text-muted-foreground">
            Leave empty to auto-generate from name
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register("description")} />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="is_active">Active</Label>
        <Switch
          id="is_active"
          checked={isActive}
          onCheckedChange={(checked) => setValue("is_active", checked)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving..." : role ? "Update Role" : "Create Role"}
      </Button>
    </form>
  );
}
