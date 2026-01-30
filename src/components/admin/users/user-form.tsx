"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateUser, useUpdateUser } from "@/hooks/use-users";
import { useRoles } from "@/hooks/use-roles";
import type { User } from "@/types";

const userSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  phone: z.string().optional(),
  role_id: z.number({ required_error: "Please select a role" }),
  is_active: z.boolean().default(true),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  user?: User | null;
  onSuccess?: () => void;
}

export function UserForm({ user, onSuccess }: UserFormProps) {
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const { data: rolesData } = useRoles({ limit: 100 });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(
      user
        ? userSchema.omit({ password: true })
        : userSchema.extend({ password: z.string().min(6, "Password must be at least 6 characters") })
    ),
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      role_id: user?.role_id || undefined,
      is_active: user?.is_active ?? true,
    },
  });

  const isActive = watch("is_active");

  const onSubmit = (data: UserFormData) => {
    if (user) {
      updateUserMutation.mutate(
        { id: user.id, data },
        { onSuccess }
      );
    } else {
      createUserMutation.mutate(data as UserFormData & { password: string }, { onSuccess });
    }
  };

  const isPending = createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name</Label>
          <Input id="first_name" placeholder="John" {...register("first_name")} />
          {errors.first_name && (
            <p className="text-sm text-destructive">{errors.first_name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name</Label>
          <Input id="last_name" placeholder="Doe" {...register("last_name")} />
          {errors.last_name && (
            <p className="text-sm text-destructive">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="john@example.com" {...register("email")} />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {!user && (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" placeholder="+1234567890" {...register("phone")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role_id">Role</Label>
        <Select
          value={watch("role_id")?.toString()}
          onValueChange={(value) => setValue("role_id", parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {rolesData?.data?.map((role) => (
              <SelectItem key={role.id} value={role.id.toString()}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.role_id && (
          <p className="text-sm text-destructive">{errors.role_id.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="is_active">Active</Label>
          <p className="text-xs text-muted-foreground">Enable/disable this user</p>
        </div>
        <Switch
          id="is_active"
          checked={isActive}
          onCheckedChange={(checked) => setValue("is_active", checked)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving..." : user ? "Update User" : "Create User"}
      </Button>
    </form>
  );
}
