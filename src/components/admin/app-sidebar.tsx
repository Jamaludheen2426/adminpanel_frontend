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
  Building2,
  Users,
  Shield,
  Lock,
  Mail,
  Languages,
  DollarSign,
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
import { useAuth } from "@/hooks/use-auth";
import { usePendingCount } from "@/hooks/use-approvals";
import { Badge } from "@/components/ui/badge";

interface MenuItem {
  labelKey: string;
  href?: string;
  icon: React.ElementType;
  children?: MenuItem[];
  permission?: string;
  minLevel?: number;
  developerOnly?: boolean;
}

const menuItems: MenuItem[] = [
  {
    labelKey: "nav.dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    labelKey: "nav.companies",
    href: "/admin/companies",
    icon: Building2,
    developerOnly: true,
  },
  {
    labelKey: "nav.approvals",
    href: "/admin/approvals",
    icon: ShieldCheck,
    minLevel: 100, // Super admin only
  },
  {
    labelKey: "nav.users",
    href: "/admin/platform/users",
    icon: Users,
    permission: "users.view",
  },
  {
    labelKey: "nav.access_control",
    icon: Shield,
    permission: "roles.view",
    children: [
      { 
        labelKey: "nav.roles", 
        href: "/admin/platform/roles", 
        icon: Lock,
        permission: "roles.view",
      },
      {
        labelKey: "nav.permissions",
        href: "/admin/platform/permissions",
        icon: Lock,
        permission: "permissions.view",
      },
      {
        labelKey: "nav.modules",
        href: "/admin/platform/modules",
        icon: Shield,
        permission: "modules.view",
      },
    ],
  },
  {
    labelKey: "nav.appearance",
    icon: Palette,
    permission: "appearance.view",
    children: [
      { 
        labelKey: "nav.theme", 
        href: "/admin/appearance/theme", 
        icon: Brush,
        permission: "appearance.view",
      },
      { 
        labelKey: "nav.menu", 
        href: "/admin/appearance/menu", 
        icon: Menu,
        permission: "appearance.view",
      },
      {
        labelKey: "nav.theme_option",
        href: "/admin/appearance/theme-option",
        icon: SlidersHorizontal,
        permission: "appearance.view",
      },
    ],
  },
  {
    labelKey: "nav.settings",
    href: "/admin/settings",
    icon: Settings,
    permission: "settings.view",
  },
  {
    labelKey: "nav.platform_admin",
    href: "/admin/platform",
    icon: ShieldCheck,
    permission: "platform.view",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: settings } = useSettingsByGroup("appearance");
  const { data: pendingCount } = usePendingCount();

  const adminTitle =
    settings?.find((s) => s.key === "admin_title")?.value || "Admin Panel";
  const adminLogoUrl =
    settings?.find((s) => s.key === "admin_logo_url")?.value || "";
  const logoHeight =
    settings?.find((s) => s.key === "logo_height")?.value || "40";

  const isActive = (href?: string) => !!(href && pathname === href);
  const isChildActive = (children?: MenuItem[]) =>
    children?.some((child) => child.href && pathname.startsWith(child.href));

  // Permission check helper
  const hasPermission = (permission?: string): boolean => {
    if (!user) return false;
    
    const roleSlug = user.role?.slug;
    
    // Developer and Super Admin always have access
    if (roleSlug === 'developer' || roleSlug === 'super_admin') {
      return true;
    }
    
    // If no permission specified, allow access
    if (!permission) return true;
    
    // Check user permissions
    const userPermissions = user.permissions || [];
    return userPermissions.includes(permission);
  };

  // Developer check helper
  const isDeveloper = (): boolean => {
    return user?.role?.slug === 'developer';
  };

  // Level check helper
  const hasMinLevel = (minLevel?: number): boolean => {
    if (!user || minLevel === undefined) return true;
    
    const roleSlug = user.role?.slug;
    if (roleSlug === 'developer') return true;
    
    const userLevel = user.role?.level || 0;
    return userLevel >= minLevel;
  };

  // Filter menu items based on permissions
  const filterMenuItem = (item: MenuItem): boolean => {
    // Developer-only items
    if (item.developerOnly && !isDeveloper()) {
      return false;
    }

    // Level check
    if (!hasMinLevel(item.minLevel)) {
      return false;
    }

    // Permission check
    if (!hasPermission(item.permission)) {
      return false;
    }

    return true;
  };

  // Filter children and check if parent should be shown
  const getVisibleChildren = (children?: MenuItem[]): MenuItem[] => {
    if (!children) return [];
    return children.filter(filterMenuItem);
  };

  // Filter menu items
  const visibleMenuItems = menuItems.filter((item) => {
    if (!filterMenuItem(item)) return false;
    
    // If item has children, check if any children are visible
    if (item.children) {
      const visibleChildren = getVisibleChildren(item.children);
      return visibleChildren.length > 0;
    }
    
    return true;
  });

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
              {visibleMenuItems.map((item) => {
                const visibleChildren = getVisibleChildren(item.children);
                
                if (visibleChildren.length > 0) {
                  return (
                    <Collapsible
                      key={item.labelKey}
                      defaultOpen={isChildActive(visibleChildren)}
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
                            {visibleChildren.map((child) => (
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
                        {item.labelKey === "nav.approvals" && pendingCount != null && pendingCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="ml-auto h-5 min-w-5 px-1 flex items-center justify-center text-[10px]"
                          >
                            {pendingCount > 99 ? '99+' : pendingCount}
                          </Badge>
                        )}
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