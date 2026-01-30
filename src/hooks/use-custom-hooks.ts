'use client';

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Hook to check if user is authenticated
 */
export const useAuth = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('accessToken');
    setIsAuthenticated(!!token);
    setIsLoading(false);

    if (!token) {
      router.push('/auth/login');
    }
  }, [router]);

  return { isAuthenticated, isLoading };
};

/**
 * Hook to check if user has permission
 */
export const useHasPermission = (requiredPermission: string) => {
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const userStr = Cookies.get('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setHasPermission(
          user.permissions?.some((p: any) => p.name === requiredPermission) || false
        );
      } catch (error) {
        setHasPermission(false);
      }
    }
  }, [requiredPermission]);

  return hasPermission;
};

/**
 * Hook to check if user has role
 */
export const useHasRole = (requiredRole: string) => {
  const [hasRole, setHasRole] = useState(false);

  useEffect(() => {
    const userStr = Cookies.get('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setHasRole(user.role?.name === requiredRole);
      } catch (error) {
        setHasRole(false);
      }
    }
  }, [requiredRole]);

  return hasRole;
};

/**
 * Hook to protect routes based on authentication
 */
export const useRequireAuth = (redirectTo = '/auth/signin') => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('accessToken');

    if (!token) {
      router.push(redirectTo);
    } else {
      setIsLoading(false);
    }
  }, [router, redirectTo]);

  return { isLoading };
};

/**
 * Hook to prevent authenticated users from accessing auth pages
 */
export const usePreventAuthenticatedAccess = (redirectTo = '/admin') => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('accessToken');

    if (token) {
      router.push(redirectTo);
    } else {
      setIsLoading(false);
    }
  }, [router, redirectTo]);

  return { isLoading };
};

/**
 * Hook for debounced value
 */
export const useDebounce = <T,>(value: T, delay: number = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for local storage
 */
export const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
};

/**
 * Hook for device detection
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

/**
 * Hook for dark mode
 */
export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode =
      localStorage.getItem('darkMode') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(isDarkMode);

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggle = () => {
    setIsDark(!isDark);
    localStorage.setItem('darkMode', String(!isDark));
    document.documentElement.classList.toggle('dark');
  };

  return { isDark, toggle };
};
