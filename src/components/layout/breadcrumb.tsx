"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumb() {
  const pathname = usePathname();

  const segments = pathname
    .split("/")
    .filter(Boolean)
    .slice(1); // Skip the 'admin' part

  const items = [
    { label: "Dashboard", href: "/admin" },
    ...segments.map((segment, index) => ({
      label: segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      href: `/admin/${segments.slice(0, index + 1).join("/")}`,
    })),
  ];

  if (pathname === "/admin") {
    return null;
  }

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
      <Link href="/admin" className="hover:text-foreground transition-colors">
        <Home className="h-4 w-4" />
      </Link>
      {items.slice(1).map((item, index) => (
        <div key={item.href} className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4" />
          {index === items.length - 2 ? (
            <span className="text-foreground font-medium">{item.label}</span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
