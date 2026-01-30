"use client";

import Link from "next/link";
import {
  Users,
  Activity,
  Shield,
  Database,
  Lock,
  UserCog,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PlatformItem {
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

interface PlatformGroup {
  title: string;
  items: PlatformItem[];
}

const platformGroups: PlatformGroup[] = [
  {
    title: "User Management",
    items: [
      {
        label: "Users",
        description: "Manage all registered users and their accounts",
        href: "/admin/users",
        icon: Users,
      },
      {
        label: "Roles",
        description: "Create and manage user roles and access levels",
        href: "/admin/roles",
        icon: Shield,
      },
      {
        label: "Permissions",
        description: "Define granular permissions for roles",
        href: "/admin/permissions",
        icon: Lock,
      },
      {
        label: "Profile",
        description: "View and update your admin profile",
        href: "/admin/profile",
        icon: UserCog,
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        label: "Activity Log",
        description: "View all user activities and system events",
        href: "/admin/activity-logs",
        icon: Activity,
      },
      {
        label: "Cache Manager",
        description: "Clear and manage application cache",
        href: "/admin/platform/cache",
        icon: Database,
      },
    ],
  },
];

export default function PlatformPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Administration</h1>
        <p className="text-muted-foreground mt-1">
          Manage users, roles, and system administration
        </p>
      </div>

      {platformGroups.map((group) => (
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
