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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";

interface SettingItem {
  labelKey: string;
  descriptionKey: string;
  href: string;
  icon: React.ElementType;
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
      },
      {
        labelKey: "settings.email",
        descriptionKey: "settings.email_desc",
        href: "/admin/settings/email",
        icon: Mail,
      },
      {
        labelKey: "settings.email_templates",
        descriptionKey: "settings.email_templates_desc",
        href: "/admin/settings/templates",
        icon: FileText,
      },
      {
        labelKey: "settings.phone_number",
        descriptionKey: "settings.phone_number_desc",
        href: "/admin/settings/phone",
        icon: Phone,
      },
      {
        labelKey: "settings.languages",
        descriptionKey: "settings.languages_desc",
        href: "/admin/settings/languages",
        icon: Globe,
      },
      {
        labelKey: "settings.currencies",
        descriptionKey: "settings.currencies_desc",
        href: "/admin/settings/currencies",
        icon: DollarSign,
      },
      {
        labelKey: "settings.media",
        descriptionKey: "settings.media_desc",
        href: "/admin/settings/media",
        icon: Image,
      },
      {
        labelKey: "settings.website_tracking",
        descriptionKey: "settings.website_tracking_desc",
        href: "/admin/settings/website-tracking",
        icon: Globe,
      },
      {
        labelKey: "settings.dashboard_theme",
        descriptionKey: "settings.dashboard_theme_desc",
        href: "/admin/settings/admin-apperance",
        icon: Palette,
      },
      {
        labelKey: "settings.site_settings",
        descriptionKey: "settings.site_settings_desc",
        href: "/admin/settings/admin-settings",
        icon: Settings,
      },
      {
        labelKey: "settings.email_campaigns",
        descriptionKey: "settings.email_campaigns_desc",
        href: "/admin/settings/email/campaigns",
        icon: Mail,
      },
      {
        labelKey: "settings.social_login",
        descriptionKey: "settings.social_login_desc",
        href: "/admin/settings/social-login",
        icon: Globe,
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
      },
      {
        labelKey: "settings.locations",
        descriptionKey: "settings.locations_desc",
        href: "/admin/settings/locations",
        icon: MapPin,
      },
      {
        labelKey: "settings.timezone",
        descriptionKey: "settings.timezone_desc",
        href: "/admin/settings/timezone",
        icon: Globe,
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
      },
      {
        labelKey: "settings.optimize",
        descriptionKey: "settings.optimize_desc",
        href: "/admin/settings/optimize",
        icon: BarChart3,
      },
    ],
  },
];

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('nav.settings')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('settings.page_desc')}
        </p>
      </div>

      {settingGroups.map((group) => (
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
