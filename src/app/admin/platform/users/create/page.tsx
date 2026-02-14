import { UserForm } from "@/components/admin/users/user-form";

export default function CreateEmployeePage() {
  return (
    <div className="space-y-1">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add Employee</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Create a new employee account
        </p>
      </div>
      <UserForm />
    </div>
  );
}
