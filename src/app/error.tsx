"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-9xl font-bold text-destructive">500</h1>
        <h2 className="text-2xl font-semibold">Something went wrong!</h2>
        <p className="text-muted-foreground max-w-md">
          An unexpected error has occurred. Please try again later.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
