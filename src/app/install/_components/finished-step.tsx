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

useEffect(() => {
  localStorage.clear();
  sessionStorage.clear();
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
