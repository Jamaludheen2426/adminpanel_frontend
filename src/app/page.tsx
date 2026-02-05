"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePublicSettings } from "@/hooks/use-settings";

export default function HomePage() {
  const { data: settings, isLoading } = usePublicSettings();

  const isComingSoon = settings?.coming_soon_enabled === "true";
  const comingSoonHTML = settings?.coming_soon_html || "";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (isComingSoon) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted px-4">
        {/* Render custom HTML content */}
        <div
          className="w-full max-w-4xl"
          dangerouslySetInnerHTML={{ __html: comingSoonHTML }}
        />
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