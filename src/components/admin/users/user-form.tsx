"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { CalendarIcon, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCreateUser, useUpdateUser } from "@/hooks/use-users";
import { useRoles } from "@/hooks/use-roles";
import { useAuth } from "@/hooks/use-auth";
import { getUserRoleLevel } from "@/lib/auth-utils";
import type { User } from "@/types";

const employeeSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  username: z.string().min(2, "Username must be at least 2 characters").optional(),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  dob: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  marital_status: z.enum(["single", "married", "divorced", "widowed"]).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default("India"),
  department: z.string().optional(),
  designation: z.string().optional(),
  doj: z.string().optional(),
  dor: z.string().optional(),
  role_id: z.number({ required_error: "Please select a role" }),
  login_access: z.boolean().default(true),
  is_active: z.boolean().default(true),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface UserFormProps {
  user?: User | null;
  onSuccess?: () => void;
}

function DatePickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(parseISO(value), "dd MMM yyyy") : "DD-MM-YYYY"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => {
              onChange(date ? format(date, "yyyy-MM-dd") : "");
              setOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function UserForm({ user, onSuccess }: UserFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { user: currentUser } = useAuth();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const { data: rolesData } = useRoles({ limit: 100 });

  const currentUserLevel = getUserRoleLevel(currentUser);

  const availableRoles = rolesData?.data?.filter((role) => {
    if (currentUser?.role?.slug === "developer") return true;
    return role.level <= currentUserLevel;
  }) || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      full_name: user?.full_name || "",
      username: (user as User & { username?: string })?.username || "",
      email: user?.email || "",
      phone: user?.phone || "",
      dob: (user as User & { dob?: string })?.dob || "",
      gender: (user as User & { gender?: "male" | "female" | "other" })?.gender || undefined,
      marital_status: (user as User & { marital_status?: "single" | "married" | "divorced" | "widowed" })?.marital_status || undefined,
      address: (user as User & { address?: string })?.address || "",
      city: (user as User & { city?: string })?.city || "",
      pincode: (user as User & { pincode?: string })?.pincode || "",
      state: (user as User & { state?: string })?.state || "",
      country: (user as User & { country?: string })?.country || "India",
      department: (user as User & { department?: string })?.department || "",
      designation: (user as User & { designation?: string })?.designation || "",
      doj: (user as User & { doj?: string })?.doj || "",
      dor: (user as User & { dor?: string })?.dor || "",
      role_id: user?.role_id || undefined,
      login_access: (user as User & { login_access?: boolean })?.login_access ?? true,
      is_active: user?.is_active ?? true,
    },
  });

  const isActive = watch("is_active");
  const loginAccess = watch("login_access");

  const onSubmit = (data: EmployeeFormData) => {
    if (user) {
      updateUserMutation.mutate({ id: user.id, data }, {
        onSuccess: () => { onSuccess?.() ?? router.push("/admin/platform/users"); }
      });
    } else {
      createUserMutation.mutate(data as EmployeeFormData & { password: string }, {
        onSuccess: () => { onSuccess?.() ?? router.push("/admin/platform/users"); }
      });
    }
  };

  const isPending = createUserMutation.isPending || updateUserMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Personal Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name <span className="text-destructive">*</span></Label>
            <Input id="full_name" placeholder="John Doe" {...register("full_name")} />
            {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" placeholder="johndoe" {...register("username")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
            <Input id="email" type="email" placeholder="john@example.com" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Mobile</Label>
            <Input id="phone" placeholder="+91 9876543210" {...register("phone")} />
          </div>

          <DatePickerField
            label="Date of Birth"
            value={watch("dob")}
            onChange={(v) => setValue("dob", v)}
          />

          <div className="space-y-2">
            <Label>Gender</Label>
            <Select
              value={watch("gender")}
              onValueChange={(v) => setValue("gender", v as "male" | "female" | "other")}
            >
              <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Marital Status</Label>
            <Select
              value={watch("marital_status")}
              onValueChange={(v) => setValue("marital_status", v as "single" | "married" | "divorced" | "widowed")}
            >
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" placeholder="Street address" rows={2} {...register("address")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" placeholder="Mumbai" {...register("city")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pincode">Pincode</Label>
            <Input id="pincode" placeholder="400001" {...register("pincode")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" placeholder="Maharashtra" {...register("state")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" placeholder="India" {...register("country")} />
          </div>
        </CardContent>
      </Card>

      {/* Work Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Work Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input id="department" placeholder="Engineering" {...register("department")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="designation">Designation</Label>
            <Input id="designation" placeholder="Software Engineer" {...register("designation")} />
          </div>

          <DatePickerField
            label="Date of Joining (DOJ)"
            value={watch("doj")}
            onChange={(v) => setValue("doj", v)}
          />

          <DatePickerField
            label="Date of Relieving (DOR)"
            value={watch("dor")}
            onChange={(v) => setValue("dor", v)}
          />

          <div className="space-y-2">
            <Label>Role <span className="text-destructive">*</span></Label>
            <Select
              value={watch("role_id")?.toString()}
              onValueChange={(v) => setValue("role_id", parseInt(v))}
            >
              <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
              <SelectContent>
                {availableRoles.length > 0 ? (
                  availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                      <span className="text-xs text-muted-foreground ml-2">Lv.{role.level}</span>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-roles" disabled>No roles available</SelectItem>
                )}
              </SelectContent>
            </Select>
            {errors.role_id && <p className="text-sm text-destructive">{errors.role_id.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label htmlFor="login_access" className="cursor-pointer">Login Access</Label>
                <p className="text-xs text-muted-foreground">Allow this employee to login</p>
              </div>
              <Switch
                id="login_access"
                checked={loginAccess}
                onCheckedChange={(v) => setValue("login_access", v)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
                <p className="text-xs text-muted-foreground">Enable/disable this employee</p>
              </div>
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={(v) => setValue("is_active", v)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Password {!user && <span className="text-destructive">*</span>}
              {user && <span className="text-xs text-muted-foreground ml-1">(leave blank to keep current)</span>}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : user ? "Update Employee" : "Create Employee"}
        </Button>
        <Button type="button" variant="outline" onClick={() => onSuccess?.() ?? router.push("/admin/platform/users")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
