"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

// Map URL segments to translation keys
const segmentTranslationMap: Record<string, string> = {
  // Main navigation
  "users": "nav.users",
  "roles": "nav.roles",
  "permissions": "nav.permissions",
  "settings": "nav.settings",
  "profile": "nav.profile",
  "activity-logs": "nav.activity_logs",
  "platform": "nav.platform",
  // Settings sub-pages
  "general": "settings.general",
  "email": "settings.email",
  "templates": "settings.email_templates",
  "phone": "settings.phone_number",
  "languages": "settings.languages",
  "currencies": "settings.currencies",
  "media": "settings.media",
  "website-tracking": "settings.website_tracking",
  "admin-apperance": "settings.dashboard_theme",
  "admin-settings": "settings.site_settings",
  "campaigns": "settings.email_campaigns",
  "social-login": "settings.social_login",
  "translations": "nav.translations",
  "locations": "settings.locations",
  "timezone": "settings.timezone",
  "cache": "settings.cache",
  "optimize": "settings.optimize",
  "missing": "nav.missing_keys",
  // Actions
  "create": "common.create",
  "edit": "common.edit",
  // Appearance
  "appearance": "nav.appearance",
  "theme": "appearance.theme",
  "menu": "appearance.menu",
  "theme-option": "appearance.theme_options",
};

export default function Breadcrumb() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const segments = pathname
    .split("/")
    .filter(Boolean)
    .slice(1); // Skip the 'admin' part

  const getLabel = (segment: string): string => {
    const translationKey = segmentTranslationMap[segment];
    if (translationKey) {
      return t(translationKey, segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "));
    }
    // Fallback: capitalize the segment
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const items = [
    { label: t("nav.dashboard", "Dashboard"), href: "/admin" },
    ...segments.map((segment, index) => ({
      label: getLabel(segment),
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
