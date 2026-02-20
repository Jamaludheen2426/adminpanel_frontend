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
  Languages,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import { usePermissionCheck } from "@/hooks";
import { PermissionGuard } from "@/components/guards/permission-guard";

interface SettingItem {
  labelKey: string;
  descriptionKey: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  permission?: string;
}

interface SettingGroup {
  titleKey: string;
  items: SettingItem[];
}

const settingGroups: SettingGroup[] = [
  {
    titleKey: "settings.common",
    items: [
      {
        labelKey: "settings.general",
        descriptionKey: "settings.general_desc",
        href: "/admin/settings/general",
        icon: Settings,
        permission: "general_settings.view",
      },
      {
        labelKey: "settings.email",
        descriptionKey: "settings.email_desc",
        href: "/admin/settings/email",
        icon: Mail,
        permission: "email_configs.view",
      },
      {
        labelKey: "settings.email_templates",
        descriptionKey: "settings.email_templates_desc",
        href: "/admin/settings/templates",
        icon: FileText,
        permission: "email_templates.view",
      },
      {
        labelKey: "settings.phone_number",
        descriptionKey: "settings.phone_number_desc",
        href: "/admin/settings/phone",
        icon: Phone,
        badge: "common.comming",
        permission: "phone_settings.view",
      },
      {
        labelKey: "settings.languages",
        descriptionKey: "settings.languages_desc",
        href: "/admin/settings/languages",
        icon: Globe,
        permission: "languages.view",
      },
      {
        labelKey: "settings.currencies",
        descriptionKey: "settings.currencies_desc",
        href: "/admin/settings/currencies",
        icon: DollarSign,
        permission: "currencies.view",
      },
      {
        labelKey: "settings.media",
        descriptionKey: "settings.media_desc",
        href: "/admin/settings/media",
        icon: Image,
        permission: "media.view",
      },
      {
        labelKey: "settings.website_tracking",
        descriptionKey: "settings.website_tracking_desc",
        href: "/admin/settings/website-tracking",
        icon: Globe,
        badge: "common.comming",
        permission: "tracking_settings.view",
      },
      {
        labelKey: "settings.dashboard_theme",
        descriptionKey: "settings.dashboard_theme_desc",
        href: "/admin/settings/admin-apperance",
        icon: Palette,
        permission: "admin_appearance.view",
      },
      {
        labelKey: "settings.site_settings",
        descriptionKey: "settings.site_settings_desc",
        href: "/admin/settings/admin-settings",
        icon: Settings,
        permission: "admin_settings.view",
      },
      {
        labelKey: "settings.email_campaigns",
        descriptionKey: "settings.email_campaigns_desc",
        href: "/admin/settings/email/campaigns",
        icon: Mail,
        badge: "common.comming",
        permission: "email_campaigns.view",
      },
      {
        labelKey: "settings.social_login",
        descriptionKey: "settings.social_login_desc",
        href: "/admin/settings/social-login",
        icon: Globe,
        badge: "common.comming",
        permission: "social_login.view",
      },
    ],
  },
  {
    titleKey: "settings.localization",
    items: [
      {
        labelKey: "settings.translations",
        descriptionKey: "settings.translations_desc",
        href: "/admin/settings/translations",
        icon: Languages,
        permission: "translations.view",
      },
      {
        labelKey: "settings.locations",
        descriptionKey: "settings.locations_desc",
        href: "/admin/settings/locations",
        icon: MapPin,
        permission: "locations.view",
      },
      {
        labelKey: "settings.timezone",
        descriptionKey: "settings.timezone_desc",
        href: "/admin/settings/timezone",
        icon: Globe,
        permission: "settings.view",
      },
    ],
  },
  {
    titleKey: "settings.performance",
    items: [
      {
        labelKey: "settings.cache",
        descriptionKey: "settings.cache_desc",
        href: "/admin/settings/cache",
        icon: Database,
        permission: "cache_settings.view",
      },
      {
        labelKey: "settings.optimize",
        descriptionKey: "settings.optimize_desc",
        href: "/admin/settings/optimize",
        icon: BarChart3,
        permission: "settings.view",
      },
    ],
  },
];

export function SettingsContent() {
  const { t } = useTranslation();
  const { hasPermission } = usePermissionCheck();

  // Filter setting items based on permissions
  const filterItems = (items: SettingItem[]): SettingItem[] => {
    return items.filter(item => hasPermission(item.permission));
  };

  // Filter groups that have at least one visible item
  const visibleGroups = settingGroups
    .map(group => ({
      ...group,
      items: filterItems(group.items),
    }))
    .filter(group => group.items.length > 0);

  return (
    <PermissionGuard permission="settings.view">
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("nav.settings")}</h1>
        <p className="text-muted-foreground mt-1">{t("settings.page_desc")}</p>
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
                          {item.badge && (
                            <span className="text-muted-foreground font-normal">
                              {" "}
                              ({t(item.badge)})
                            </span>
                          )}
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
    </PermissionGuard>
  );
}
