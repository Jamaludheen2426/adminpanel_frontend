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
import { useAuth } from "@/hooks/use-auth";
import { getUserRoleLevel } from "@/lib/auth-utils";
import type { User } from "@/types";

const userSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
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
  const { user: currentUser } = useAuth();
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
      full_name: user?.full_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      role_id: user?.role_id || undefined,
      is_active: user?.is_active ?? true,
    },
  });

  const isActive = watch("is_active");

  // Get current user's role level
  const currentUserLevel = getUserRoleLevel(currentUser);

  // Filter roles to only show roles at or below current user's level
  const availableRoles = rolesData?.data?.filter((role) => {
    // Developer can see all roles
    if (currentUser?.role?.slug === 'developer') {
      return true;
    }
    
    // Non-developers can only assign roles at or below their level
    return role.level <= currentUserLevel;
  }) || [];

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
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name</Label>
        <Input id="full_name" placeholder="John Doe" {...register("full_name")} />
        {errors.full_name && (
          <p className="text-sm text-destructive">{errors.full_name.message}</p>
        )}
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
            {availableRoles.length > 0 ? (
              availableRoles.map((role) => (
                <SelectItem key={role.id} value={role.id.toString()}>
                  <div className="flex items-center justify-between w-full">
                    <span>{role.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      Level {role.level}
                    </span>
                  </div>
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-roles" disabled>
                No roles available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {errors.role_id && (
          <p className="text-sm text-destructive">{errors.role_id.message}</p>
        )}
        {availableRoles.length > 0 && (
          <p className="text-xs text-muted-foreground">
            You can only assign roles up to level {currentUserLevel}
          </p>
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