import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
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
