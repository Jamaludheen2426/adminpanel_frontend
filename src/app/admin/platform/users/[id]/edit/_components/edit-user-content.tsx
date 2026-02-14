"use client";

import { useUser } from "@/hooks";
import { UserForm } from "@/components/admin/users/user-form";
import { Spinner } from "@/components/ui/spinner";

interface EditUserContentProps {
  userId: number;
}

export function EditUserContent({ userId }: EditUserContentProps) {
  const { data: userData, isLoading } = useUser(userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center py-16 text-muted-foreground">Employee not found.</div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Employee</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Update employee information
        </p>
      </div>
      <UserForm user={userData} />
    </div>
  );
}
