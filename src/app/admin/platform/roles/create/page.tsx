import { RoleForm } from "@/components/admin/roles/role-form";

export default function CreateRolePage() {
  return (
    <div className="space-y-1">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Role</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Define a role and assign permissions
        </p>
      </div>
      <RoleForm />
    </div>
  );
}
