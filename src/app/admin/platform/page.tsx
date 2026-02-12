"use client";

import Link from "next/link";
import {
  Users,
  Activity,
  Shield,
  Database,
  Lock,
  UserCog,
  Layers,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import { usePermissionCheck } from "@/hooks";

interface PlatformItem {
  labelKey: string;
  descriptionKey: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
}

interface PlatformGroup {
  titleKey: string;
  items: PlatformItem[];
}

const platformGroups: PlatformGroup[] = [
  {
    titleKey: "platform.user_management",
    items: [
      {
        labelKey: "nav.users",
        descriptionKey: "platform.users_desc",
        href: "/admin/platform/users",
        icon: Users,
        permission: "users.view",
      },
      {
        labelKey: "nav.roles",
        descriptionKey: "platform.roles_desc",
        href: "/admin/platform/roles",
        icon: Shield,
        permission: "roles.view",
      },
      {
        labelKey: "permissions.title",
        descriptionKey: "platform.permissions_desc",
        href: "/admin/platform/permissions",
        icon: Lock,
        permission: "permissions.view",
      },
      {
        labelKey: "nav.modules",
        descriptionKey: "platform.modules_desc",
        href: "/admin/platform/modules",
        icon: Layers,
        permission: "modules.view",
      },
      {
        labelKey: "profile.title",
        descriptionKey: "platform.profile_desc",
        href: "/admin/profile",
        icon: UserCog,
      },
    ],
  },
  {
    titleKey: "platform.system",
    items: [
      {
        labelKey: "activity.logs",
        descriptionKey: "platform.activity_desc",
        href: "/admin/platform/activity-logs",
        icon: Activity,
        permission: "activity_logs.view",
      },
      {
        labelKey: "platform.cache_manager",
        descriptionKey: "platform.cache_desc",
        href: "/admin/platform/cache",
        icon: Database,
      },
    ],
  },
];

export default function PlatformPage() {
  const { t } = useTranslation();
  const { hasPermission } = usePermissionCheck();

  // Filter platform items based on permissions
  const filterItems = (items: PlatformItem[]): PlatformItem[] => {
    return items.filter(item => hasPermission(item.permission));
  };

  // Filter groups that have at least one visible item
  const visibleGroups = platformGroups
    .map(group => ({
      ...group,
      items: filterItems(group.items),
    }))
    .filter(group => group.items.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('nav.platform_admin')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('platform.page_desc')}
        </p>
      </div>

      {visibleGroups.map((group) => (
        <Card key={group.titleKey}>
          <CardHeader>
            <CardTitle className="text-lg">{t(group.titleKey)}</CardTitle>
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
                          {t(item.labelKey)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {t(item.descriptionKey)}
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
