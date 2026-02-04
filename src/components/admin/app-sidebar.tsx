"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  Settings,
  Palette,
  ShieldCheck,
  Brush,
  Menu,
  SlidersHorizontal,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useSettingsByGroup } from "@/hooks/use-settings";
import { useTranslation } from "@/hooks/use-translation";

interface MenuItem {
  labelKey: string;
  href?: string;
  icon: React.ElementType;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    labelKey: "nav.dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    labelKey: "nav.appearance",
    icon: Palette,
    children: [
      { labelKey: "nav.theme", href: "/admin/appearance/theme", icon: Brush },
      { labelKey: "nav.menu", href: "/admin/appearance/menu", icon: Menu },
      {
        labelKey: "nav.theme_option",
        href: "/admin/appearance/theme-option",
        icon: SlidersHorizontal,
      },
    ],
  },
  {
    labelKey: "nav.settings",
    href: "/admin/settings",
    icon: Settings,
  },
  {
    labelKey: "nav.platform_admin",
    href: "/admin/platform",
    icon: ShieldCheck,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { data: settings } = useSettingsByGroup("appearance");

  const adminTitle =
    settings?.find((s) => s.key === "admin_title")?.value || "Admin Panel";
  const adminLogoUrl =
    settings?.find((s) => s.key === "admin_logo_url")?.value || "";
  const logoHeight =
    settings?.find((s) => s.key === "logo_height")?.value || "40";

  const isActive = (href?: string) => !!(href && pathname === href);
  const isChildActive = (children?: MenuItem[]) =>
    children?.some((child) => child.href && pathname.startsWith(child.href));

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link
              href="/admin"
              className="flex flex-col items-center gap-2 px-2 py-4"
            >
              {adminLogoUrl ? (
                <>
                  <img
                    src={adminLogoUrl}
                    alt={adminTitle}
                    style={{ height: `${logoHeight}px` }}
                    className="max-w-full object-contain"
                  />
                  <span className="font-semibold text-lg text-center">
                    {adminTitle}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold">
                      {adminTitle.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-semibold text-lg text-center">
                    {adminTitle}
                  </span>
                </>
              )}
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.navigation")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                if (item.children) {
                  return (
                    <Collapsible
                      key={item.labelKey}
                      defaultOpen={isChildActive(item.children)}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton>
                            <item.icon className="w-4 h-4" />
                            <span>{t(item.labelKey)}</span>
                            <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.children.map((child) => (
                              <SidebarMenuSubItem key={child.labelKey}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isActive(child.href)}
                                >
                                  <Link href={child.href || "#"}>
                                    <child.icon className="w-4 h-4" />
                                    <span>{t(child.labelKey)}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.labelKey}>
                    <SidebarMenuButton asChild isActive={isActive(item.href)}>
                      <Link href={item.href || "#"}>
                        <item.icon className="w-4 h-4" />
                        <span>{t(item.labelKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
