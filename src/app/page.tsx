"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePublicSettings } from "@/hooks/use-settings";
import { Clock, Rocket } from "lucide-react";

export default function HomePage() {
  const { data: settings, isLoading } = usePublicSettings();

  const isComingSoon = settings?.coming_soon_enabled === "true";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (isComingSoon) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted">
        <div className="text-center space-y-8 px-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-6">
              <Rocket className="h-16 w-16 text-primary" />
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight">Coming Soon</h1>
            <p className="text-muted-foreground text-xl max-w-md mx-auto">
              We&apos;re working hard to bring you something amazing. Stay tuned!
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="h-5 w-5" />
            <span>Launching Soon</span>
          </div>
          <div className="pt-4">
            <Link href="/auth/login">
              <Button variant="outline" size="lg">
                Admin Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome to Our Platform
        </h1>
        <p className="text-muted-foreground text-lg max-w-md">
          Your one-stop solution for all your needs. Get started today.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/admin">
            <Button size="lg">Admin Dashboard</Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="outline" size="lg">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
