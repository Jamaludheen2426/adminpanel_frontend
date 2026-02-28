'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/common/page-loader';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Invalid or missing verification token');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          'http://localhost:5000/api/auth/verify-email',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
            credentials: 'include',
          }
        );

        const result = await response.json();

        if (!response.ok) {
          setError(result.message || 'Failed to verify email');
          setIsLoading(false);
          return;
        }

        setSuccess(true);
        setIsLoading(false);

        // Redirect to signin after 3 seconds
        setTimeout(() => {
          router.push('/auth/login?message=Email verified successfully');
        }, 3000);
      } catch (err) {
        setError('An error occurred. Please try again.');
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [token, router]);

  if (isLoading) {
    return <PageLoader open={true} text="Verifying your email..." />;
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h2 className="font-semibold text-green-900 mb-2">Email Verified!</h2>
          <p className="text-green-700 text-sm">
            Your email has been verified successfully. Redirecting to sign in...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h2 className="font-semibold text-red-900 mb-2">Verification Failed</h2>
        <p className="text-red-700 text-sm">{error}</p>
      </div>
      <Button onClick={() => router.push('/auth/signin')}>
        Back to Sign In
      </Button>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<PageLoader open={true} text="Loading..." />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
