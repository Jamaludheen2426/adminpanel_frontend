import { useAuth } from "@/hooks/use-auth";

/**
 * Permission check hook
 * Returns a function to check if the current user has a specific permission
 */
export function usePermissionCheck() {
  const { user } = useAuth();

  /**
   * Check if user has a specific permission
   * @param permission - Permission slug (e.g., "users.view", "roles.edit")
   * @returns true if user has permission, false otherwise
   */
  const hasPermission = (permission?: string): boolean => {
    if (!user) return false;

    const roleSlug = user.role?.slug;

    // Developer and Super Admin always have access
    if (roleSlug === 'developer' || roleSlug === 'super_admin') {
      return true;
    }

    // If no permission specified, allow access
    if (!permission) return true;

    // Check user role permissions
    const rolePermissions = user.role?.permissions || [];
    return rolePermissions.some((p: any) => p.slug === permission);
  };

  /**
   * Check if user has at least one of the specified permissions
   * @param permissions - Array of permission slugs
   * @returns true if user has at least one permission
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  /**
   * Check if user has all of the specified permissions
   * @param permissions - Array of permission slugs
   * @returns true if user has all permissions
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  /**
   * Check if user is a developer
   */
  const isDeveloper = (): boolean => {
    return user?.role?.slug === 'developer';
  };

  /**
   * Check if user is a super admin
   */
  const isSuperAdmin = (): boolean => {
    return user?.role?.slug === 'super_admin';
  };

  /**
   * Check if user role level meets minimum requirement
   * @param minLevel - Minimum role level required
   * @returns true if user level >= minLevel
   */
  const hasMinLevel = (minLevel?: number): boolean => {
    if (!user || minLevel === undefined) return true;

    const roleSlug = user.role?.slug;
    if (roleSlug === 'developer') return true;

    const userLevel = user.role?.level || 0;
    return userLevel >= minLevel;
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isDeveloper,
    isSuperAdmin,
    hasMinLevel,
  };
}
