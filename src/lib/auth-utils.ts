import { AuthUser } from '@/types';

/**
 * Check if user is a developer
 */
export const isDeveloper = (user?: AuthUser | null): boolean => {
  return user?.role?.slug === 'developer';
};

/**
 * Check if user is a super admin
 */
export const isSuperAdmin = (user?: AuthUser | null): boolean => {
  return user?.role?.slug === 'super_admin';
};

/**
 * Get current company ID from user
 */
export const getCurrentCompanyId = (user?: AuthUser | null): number | null => {
  return user?.company_id || null;
};

/**
 * Check if user has minimum role level
 */
export const hasMinLevel = (user: AuthUser | null | undefined, minLevel: number = 0): boolean => {
  if (!user) return false;
  
  // Developer bypasses level checks
  if (isDeveloper(user)) return true;
  
  const userLevel = user.role?.level || 0;
  return userLevel >= minLevel;
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (user: AuthUser | null | undefined, permission: string): boolean => {
  if (!user) return false;
  
  // Developer and Super Admin bypass permission checks
  if (isDeveloper(user) || isSuperAdmin(user)) return true;
  
  const userPermissions = user.permissions || [];
  return userPermissions.includes(permission);
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (user: AuthUser | null | undefined, permissions: string[]): boolean => {
  if (!user) return false;
  
  // Developer and Super Admin bypass permission checks
  if (isDeveloper(user) || isSuperAdmin(user)) return true;
  
  const userPermissions = user.permissions || [];
  return permissions.some(p => userPermissions.includes(p));
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllPermissions = (user: AuthUser | null | undefined, permissions: string[]): boolean => {
  if (!user) return false;
  
  // Developer and Super Admin bypass permission checks
  if (isDeveloper(user) || isSuperAdmin(user)) return true;
  
  const userPermissions = user.permissions || [];
  return permissions.every(p => userPermissions.includes(p));
};

/**
 * Get user's role level
 */
export const getUserRoleLevel = (user?: AuthUser | null): number => {
  return user?.role?.level || 0;
};

/**
 * Check if user can manage another user (based on role level)
 */
export const canManageUser = (currentUser: AuthUser | null | undefined, targetUserLevel?: number): boolean => {
  if (!currentUser) return false;
  
  // Developer can manage anyone
  if (isDeveloper(currentUser)) return true;
  
  const currentUserLevel = getUserRoleLevel(currentUser);
  const targetLevel = targetUserLevel || 0;
  
  // Can only manage users with lower or equal level
  return currentUserLevel >= targetLevel;
};