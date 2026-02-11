'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  allPermissions?: string[];
  minLevel?: number;
  fallback?: ReactNode;
}

export function PermissionGuard({
  children,
  permission,
  permissions,
  allPermissions,
  minLevel,
  fallback = null,
}: PermissionGuardProps) {
  const { user } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  const roleSlug = user.role?.slug;
  const roleLevel = user.role?.level || 0;
  const userPermissions = user.permissions || [];

  // Developer always passes
  if (roleSlug === 'developer') {
    return <>{children}</>;
  }

  // Super Admin always passes
  if (roleSlug === 'super_admin') {
    return <>{children}</>;
  }

  // Check minimum level if provided
  if (minLevel !== undefined && roleLevel < minLevel) {
    return <>{fallback}</>;
  }

  // Check single permission
  if (permission) {
    if (!userPermissions.includes(permission)) {
      return <>{fallback}</>;
    }
  }

  // Check any of the permissions (OR logic)
  if (permissions && permissions.length > 0) {
    const hasAnyPermission = permissions.some(p => userPermissions.includes(p));
    if (!hasAnyPermission) {
      return <>{fallback}</>;
    }
  }

  // Check all permissions (AND logic)
  if (allPermissions && allPermissions.length > 0) {
    const hasAllPermissions = allPermissions.every(p => userPermissions.includes(p));
    if (!hasAllPermissions) {
      return <>{fallback}</>;
    }
  }

  // All checks passed
  return <>{children}</>;
}