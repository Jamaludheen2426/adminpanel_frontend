'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FinishedStepProps {
  adminEmail: string;
}

export function FinishedStep({ adminEmail }: FinishedStepProps) {
  const router = useRouter();

  // Clear all auth cookies/tokens on mount so user must login fresh
  useEffect(() => {
  const clearSession = async () => {
    // 1. Call backend to clear HttpOnly cookies server-side
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include', // sends cookies so server can expire them
      });
    } catch {
      // continue even if it fails
    }

    // 2. Clear ALL localStorage (not just one key)
    localStorage.clear();

    // 3. Clear ALL sessionStorage
    sessionStorage.clear();

    // 4. Clear any client-accessible cookies
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
    });
  };

  clearSession();
}, []);

  const handleGoToLogin = () => {
    router.push('/auth/login');
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
      <div className="h-20 w-20 rounded-full bg-green-500 flex items-center justify-center">
        <Check className="h-10 w-10 text-white" strokeWidth={3} />
      </div>

      <div>
        <h2 className="text-2xl font-bold">Finished Your Installation</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          Your application has been successfully installed and configured.
          Please login with your super admin credentials to get started.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Admin email: <span className="font-medium text-foreground">{adminEmail}</span>
        </p>
      </div>

      <Button size="lg" onClick={handleGoToLogin} className="gap-2">
        <LogIn className="h-4 w-4" />
        Go to Login
      </Button>
    </div>
  );
}
