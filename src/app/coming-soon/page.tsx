import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ComingSoon() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Coming Soon</h1>
        <p className="text-muted-foreground max-w-md text-lg">
          We&apos;re working hard to bring you something amazing. Stay tuned!
        </p>
        <Link href="/">
          <Button size="lg">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
