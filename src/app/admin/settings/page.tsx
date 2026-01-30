"use client";

import Link from "next/link";
import {
  Settings,
  Mail,
  FileText,
  Phone,
  Globe,
  DollarSign,
  Image,
  Link2,
  Shield,
  Database,
  MapPin,
  BarChart3,
  Palette,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SettingItem {
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

interface SettingGroup {
  title: string;
  items: SettingItem[];
}

const settingGroups: SettingGroup[] = [
  {
    title: "Common",
    items: [
      {
        label: "General",
        description: "View and update your general settings and site info",
        href: "/admin/settings/general",
        icon: Settings,
      },
      {
        label: "Email",
        description: "View and update your email settings and SMTP configuration",
        href: "/admin/settings/email",
        icon: Mail,
      },
      {
        label: "Email Templates",
        description: "Email templates using HTML & system variables",
        href: "/admin/settings/templates",
        icon: FileText,
      },
      {
        label: "Phone Number",
        description: "Configure phone number field settings",
        href: "/admin/settings/phone",
        icon: Phone,
      },
      {
        label: "Languages",
        description: "View and update your website languages",
        href: "/admin/settings/languages",
        icon: Globe,
      },
      {
        label: "Currencies",
        description: "View and update your website currencies",
        href: "/admin/settings/currencies",
        icon: DollarSign,
      },
      {
        label: "Media",
        description: "View and update your media settings",
        href: "/admin/settings/media",
        icon: Image,
      },
      {
        label: "Website Tracking",
        description: "View and update your Website Tracking settings",
        href: "/admin/settings/website-tracking",
        icon: Globe,
      },
      {
        label: "Dashboard Color Theme",
        description: "View and update Admin Colors And Layout,...",
        href: "/admin/settings/admin-apperance",
        icon: Palette,
      },
      {
        label: "Site Settings ",
        description: "View and update logo, favicon, layout,...",
        href: "/admin/settings/admin-settings",
        icon: Settings,
      },
      {
        label: "Email Campaigns ",
        description: "View and update logo, favicon, layout,...",
        href: "/admin/settings/email/campaigns",
        icon: Mail,
      },
      {
        label: "Social Login",
        description: "View and update logo, favicon, layout,...",
        href: "/admin/settings/social-login",
        icon: Globe,
      },
    ],
  },
  {
    title: "Localization",
    items: [
      {
        label: "Locations",
        description: "Manage countries, states, cities, and pincodes",
        href: "/admin/settings/locations",
        icon: MapPin,
      },
      {
        label: "Timezone",
        description: "Configure timezone and date format settings",
        href: "/admin/settings/timezone",
        icon: Globe,
      },
    ],
  },
  {
    title: "Performance",
    items: [
      {
        label: "Cache",
        description: "Configure caching for optimized speed",
        href: "/admin/settings/cache",
        icon: Database,
      },
      {
        label: "Optimize",
        description: "Minify HTML output, inline CSS, remove comments",
        href: "/admin/settings/optimize",
        icon: BarChart3,
      },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage all your application settings and configuration
        </p>
      </div>

      {settingGroups.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle className="text-lg">{group.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors group cursor-pointer">
                      <div className="mt-0.5 text-muted-foreground group-hover:text-primary transition-colors">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary group-hover:underline">
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
