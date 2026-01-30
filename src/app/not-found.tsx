import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-9xl font-bold text-muted-foreground">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground max-w-md">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
          <Link href="/admin">
            <Button variant="outline">Admin Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
