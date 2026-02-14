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
import { useCountries, useStates, useCities, usePincodes } from "@/hooks/use-locations";
import { getUserRoleLevel } from "@/lib/auth-utils";
import type { User } from "@/types";

const employeeSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  username: z.string().optional(),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  dob: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  marital_status: z.enum(["married", "unmarried"]).optional(),
  country_id: z.number().optional(),
  state_id: z.number().optional(),
  city_id: z.number().optional(),
  pincode_id: z.number().optional(),
  pincode: z.string().optional(),
  address: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  doj: z.string().optional(),
  dor: z.string().optional(),
  role_id: z.number({ required_error: "Please select a role" }),
  login_access: z.number().default(1),
  is_active: z.number().default(0),
  password: z.string().optional(),
  confirm_password: z.string().optional(),
}).refine((data) => {
  if (data.password && data.password.length > 0) {
    if (data.password.length < 6) return false;
    return data.password === data.confirm_password;
  }
  return true;
}, (data) => ({
  message: data.password && data.password.length > 0 && data.password.length < 6
    ? "Password must be at least 6 characters"
    : "Passwords do not match",
  path: data.password && data.password.length > 0 && data.password.length < 6
    ? ["password"]
    : ["confirm_password"],
}));

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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      username: user?.username || "",
      email: user?.email || "",
      phone: user?.phone || "",
      dob: user?.dob || "",
      gender: user?.gender || undefined,
      marital_status: user?.marital_status || undefined,
      country_id: user?.country_id || undefined,
      state_id: user?.state_id || undefined,
      city_id: user?.city_id || undefined,
      pincode_id: user?.pincode_id || undefined,
      pincode: user?.pincode || "",
      address: user?.address || "",
      department: user?.department || "",
      designation: user?.designation || "",
      doj: user?.doj || "",
      dor: user?.dor || "",
      role_id: user?.role_id || undefined,
      login_access: user?.login_access ?? 1,
      is_active: user?.is_active ?? 0,
    },
  });

  const selectedCountryId = watch("country_id");
  const selectedStateId = watch("state_id");
  const selectedCityId = watch("city_id");

  // Location API hooks
  const { data: countries = [] } = useCountries();
  const { data: states = [] } = useStates(selectedCountryId || 0);
  const { data: cities = [] } = useCities(selectedStateId || 0);
  const { data: pincodes = [] } = usePincodes(selectedCityId || 0);

  const onSubmit = (data: EmployeeFormData) => {
    const { confirm_password, ...rest } = data;

    // Clean up: remove empty strings, send null for optional fields
    const submitData = Object.fromEntries(
      Object.entries(rest).filter(([, v]) => v !== "" && v !== undefined)
    );

    // Remove password if blank (edit mode, keep current)
    if (!submitData.password) delete submitData.password;

    if (user) {
      updateUserMutation.mutate({ id: user.id, data: submitData }, {
        onSuccess: () => { onSuccess?.() ?? router.push("/admin/platform/users"); }
      });
    } else {
      createUserMutation.mutate(submitData as EmployeeFormData & { password: string }, {
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
            <Input id="full_name" placeholder="Enter full name" {...register("full_name")} />
            {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" placeholder="Enter username" {...register("username")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
            <Input id="email" type="email" placeholder="Enter email address" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Mobile</Label>
            <Input id="phone" placeholder="Enter phone number" {...register("phone")} />
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
              onValueChange={(v) => setValue("marital_status", v as "married" | "unmarried")}
            >
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="unmarried">Unmarried</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Address Section - Location Module API */}
          <div className="space-y-2">
            <Label>Country</Label>
            <Select
              value={selectedCountryId?.toString() || ""}
              onValueChange={(v) => {
                setValue("country_id", parseInt(v));
                setValue("state_id", undefined);
                setValue("city_id", undefined);
                setValue("pincode_id", undefined);
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.id} value={country.id.toString()}>{country.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>State</Label>
            <Select
              value={selectedStateId?.toString() || ""}
              onValueChange={(v) => {
                setValue("state_id", parseInt(v));
                setValue("city_id", undefined);
                setValue("pincode_id", undefined);
              }}
              disabled={!selectedCountryId || states.length === 0}
            >
              <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
              <SelectContent>
                {states.map((state) => (
                  <SelectItem key={state.id} value={state.id.toString()}>{state.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>City</Label>
            <Select
              value={selectedCityId?.toString() || ""}
              onValueChange={(v) => {
                setValue("city_id", parseInt(v));
                setValue("pincode_id", undefined);
              }}
              disabled={!selectedStateId || cities.length === 0}
            >
              <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id.toString()}>{city.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Locality / Area</Label>
            <Select
              value={watch("pincode_id")?.toString() || ""}
              onValueChange={(v) => setValue("pincode_id", parseInt(v))}
              disabled={!selectedCityId || pincodes.length === 0}
            >
              <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
              <SelectContent>
                {pincodes.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    {p.area_name || p.pincode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pincode">Pincode</Label>
            <Input id="pincode" placeholder="Enter pincode" {...register("pincode")} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" placeholder="Enter complete address" rows={2} {...register("address")} />
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
            <Input id="department" placeholder="Enter department" {...register("department")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="designation">Designation</Label>
            <Input id="designation" placeholder="Enter designation" {...register("designation")} />
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
          {/* Password Fields in Same Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">
                Password {!user && <span className="text-destructive">*</span>}
                {user && <span className="text-xs text-muted-foreground ml-1">(leave blank to keep current)</span>}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
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

            <div className="space-y-2">
              <Label htmlFor="confirm_password">
                Confirm Password {!user && <span className="text-destructive">*</span>}
              </Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  {...register("confirm_password")}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirm_password && <p className="text-sm text-destructive">{errors.confirm_password.message}</p>}
            </div>
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
