'use client';

import { useEffect } from 'react';
import { CheckCircle2, XCircle, Loader2, RefreshCw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePreflightCheck } from '@/hooks/use-setup';
import { cn } from '@/lib/utils';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const { mutate: runChecks, data, isPending, isError, error } = usePreflightCheck();

  // Run checks automatically on mount
  useEffect(() => {
    runChecks();
  }, []);

  const checks = data?.data?.checks ?? [];
  const allPassed = data?.data?.allPassed ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Welcome to Setup</h2>
        <p className="text-muted-foreground mt-1">
          Let's make sure your environment is ready before we begin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pre-flight Checks</CardTitle>
          <CardDescription>
            Verifying your system meets the requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isPending && (
            <div className="flex items-center gap-3 py-4 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Running checks...</span>
            </div>
          )}

          {isError && (
            <div className="flex items-center gap-3 py-2 text-destructive">
              <XCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">
                Could not reach backend: {error?.message ?? 'Unknown error'}
              </span>
            </div>
          )}

          {checks.map((check) => (
            <div key={check.key} className="flex items-start gap-3">
              {check.passed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-medium',
                  check.passed ? 'text-foreground' : 'text-destructive'
                )}>
                  {check.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{check.detail}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => runChecks()}
          disabled={isPending}
          className="gap-2"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Re-check
        </Button>

        <Button
          onClick={onNext}
          disabled={!allPassed}
          className="gap-2"
        >
          Next
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}