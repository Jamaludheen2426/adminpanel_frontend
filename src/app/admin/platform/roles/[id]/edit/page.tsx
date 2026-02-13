"use client";

import { useRouter, useParams } from "next/navigation";
import { useRole } from "@/hooks/use-roles";
import { RoleForm } from "@/components/admin/roles/role-form";
import { Spinner } from "@/components/ui/spinner";

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = Number(params.id);

  const { data: roleData, isLoading } = useRole(roleId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!roleData) {
    return (
      <div className="text-center py-16 text-muted-foreground">Role not found.</div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Role</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Update role details and permissions
        </p>
      </div>
      <RoleForm role={roleData} onSuccess={() => router.push("/admin/platform/roles")} />
    </div>
  );
}
