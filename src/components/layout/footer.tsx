"use client";

import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Heart } from "lucide-react";

const footerLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Support", href: "/support" },
  { label: "Documentation", href: "/docs" },
];

export default function AdminFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>&copy; {currentYear} Admin Dashboard.</span>
            <span className="hidden sm:inline">Made with</span>
            <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500 hidden sm:inline" />
          </div>

          <nav className="flex items-center gap-1">
            {footerLinks.map((link, index) => (
              <div key={link.href} className="flex items-center">
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
                >
                  {link.label}
                </Link>
                {index < footerLinks.length - 1 && (
                  <Separator orientation="vertical" className="h-4 mx-1" />
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
