import Cookies from 'js-cookie';
import { AuthUser } from '@/types';

/**
 * Permission and Authentication Utilities
 */

export const hasPermission = (requiredPermission: string): boolean => {
  const userStr = Cookies.get('user');
  if (!userStr) return false;

  try {
    const user: AuthUser = JSON.parse(userStr);
    if (!user.permissions) return false;

    return user.permissions.some((p) => p === requiredPermission);
  } catch (error) {
    return false;
  }
};

export const hasAnyPermission = (permissions: string[]): boolean => {
  return permissions.some((p) => hasPermission(p));
};

export const hasAllPermissions = (permissions: string[]): boolean => {
  return permissions.every((p) => hasPermission(p));
};

export const hasRole = (requiredRole: string): boolean => {
  const userStr = Cookies.get('user');
  if (!userStr) return false;

  try {
    const user: AuthUser = JSON.parse(userStr);
    return user.role?.name === requiredRole;
  } catch (error) {
    return false;
  }
};

export const hasAnyRole = (roles: string[]): boolean => {
  const userStr = Cookies.get('user');
  if (!userStr) return false;

  try {
    const user: AuthUser = JSON.parse(userStr);
    return roles.includes(user.role?.name || '');
  } catch (error) {
    return false;
  }
};

export const getCurrentUser = (): AuthUser | null => {
  const userStr = Cookies.get('user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch (error) {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  const token = Cookies.get('accessToken');
  return !!token;
};

export const getAccessToken = (): string | undefined => {
  return Cookies.get('accessToken');
};

export const getRefreshToken = (): string | undefined => {
  return Cookies.get('refreshToken');
};

export const setTokens = (
  accessToken: string,
  refreshToken: string,
  user?: AuthUser
): void => {
  Cookies.set('accessToken', accessToken, {
    expires: 7,
    secure: true,
    sameSite: 'strict',
  });
  Cookies.set('refreshToken', refreshToken, {
    expires: 30,
    secure: true,
    sameSite: 'strict',
  });

  if (user) {
    Cookies.set('user', JSON.stringify(user), {
      expires: 7,
      secure: true,
      sameSite: 'strict',
    });
  }
};

export const clearTokens = (): void => {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
  Cookies.remove('user');
};

/**
 * Route Protection Utility
 */

export const isPrivateRoute = (path: string): boolean => {
  return path.startsWith('/admin');
};

export const isAuthRoute = (path: string): boolean => {
  return path.startsWith('/auth');
};

export const isPublicRoute = (path: string): boolean => {
  const publicRoutes = ['/', '/coming-soon'];
  return publicRoutes.includes(path);
};

/**
 * Error Handling Utilities
 */

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};

export const logError = (error: unknown, context: string = ''): void => {
  const message = getErrorMessage(error);
  console.error(`[${context}] ${message}`, error);
};

/**
 * Storage Utilities
 */

export const setLocalStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to set localStorage:', error);
  }
};

export const getLocalStorage = <T>(key: string, defaultValue?: T): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue ?? null;
  } catch (error) {
    console.error('Failed to get localStorage:', error);
    return defaultValue ?? null;
  }
};

export const removeLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove localStorage:', error);
  }
};

/**
 * Session Storage Utilities
 */

export const setSessionStorage = <T>(key: string, value: T): void => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to set sessionStorage:', error);
  }
};

export const getSessionStorage = <T>(key: string, defaultValue?: T): T | null => {
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue ?? null;
  } catch (error) {
    console.error('Failed to get sessionStorage:', error);
    return defaultValue ?? null;
  }
};

export const removeSessionStorage = (key: string): void => {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove sessionStorage:', error);
  }
};
