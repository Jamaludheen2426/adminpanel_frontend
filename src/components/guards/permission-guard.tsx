"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { usePermissionCheck } from "@/hooks";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: string;
  minLevel?: number;
  developerOnly?: boolean;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  children,
  permission,
  minLevel,
  developerOnly = false,
  fallback,
}: PermissionGuardProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { hasPermission, isDeveloper, hasMinLevel } = usePermissionCheck();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoading || !user) {
      setHasAccess(null);
      return;
    }

    // Check developer-only restriction
    if (developerOnly && !isDeveloper()) {
      setHasAccess(false);
      return;
    }

    // Check minimum level
    if (minLevel !== undefined && !hasMinLevel(minLevel)) {
      setHasAccess(false);
      return;
    }

    // Check permission
    if (permission && !hasPermission(permission)) {
      setHasAccess(false);
      return;
    }

    // All checks passed, grant access
    setHasAccess(true);
  }, [user, isLoading, permission, minLevel, developerOnly, hasPermission, isDeveloper, hasMinLevel]);

  // Loading state
  if (isLoading || hasAccess === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <Button onClick={() => router.push("/admin")} variant="default">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Has access, render children
  return <>{children}</>;
}

/**
 * Lightweight permission wrapper — simply hides children if user lacks permission.
 * No loading state, no redirect. Use this to hide buttons/actions inline.
 *
 * Usage:
 *   <Can permission="posts.create"><Button>Create</Button></Can>
 *   <Can permission="posts.edit"><Button>Edit</Button></Can>
 *   <Can permission="posts.delete"><Button>Delete</Button></Can>
 */
export function Can({
  permission,
  children,
}: {
  permission: string;
  children: React.ReactNode;
}) {
  const { hasPermission } = usePermissionCheck();
  if (!hasPermission(permission)) return null;
  return <>{children}</>;
}
