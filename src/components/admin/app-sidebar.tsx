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

interface MenuItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Appearance",
    icon: Palette,
    children: [
      { label: "Theme", href: "/admin/appearance/theme", icon: Brush },
      { label: "Menu", href: "/admin/appearance/menu", icon: Menu },
      { label: "Theme Option", href: "/admin/appearance/theme-option", icon: SlidersHorizontal },
    ],
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
  {
    label: "Platform Administration",
    href: "/admin/platform",
    icon: ShieldCheck,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: settings } = useSettingsByGroup("appearance");

  const adminTitle = settings?.find((s) => s.key === "admin_title")?.value || "Admin Panel";

  const isActive = (href?: string) => !!(href && pathname === href);
  const isChildActive = (children?: MenuItem[]) =>
    children?.some((child) => child.href && pathname.startsWith(child.href));

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/admin" className="flex items-center gap-2 px-2 py-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">{adminTitle.charAt(0).toUpperCase()}</span>
              </div>
              <span className="font-semibold text-lg">{adminTitle}</span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                if (item.children) {
                  return (
                    <Collapsible
                      key={item.label}
                      defaultOpen={isChildActive(item.children)}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton>
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                            <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.children.map((child) => (
                              <SidebarMenuSubItem key={child.label}>
                                <SidebarMenuSubButton asChild isActive={isActive(child.href)}>
                                  <Link href={child.href || "#"}>
                                    <child.icon className="w-4 h-4" />
                                    <span>{child.label}</span>
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
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={isActive(item.href)}>
                      <Link href={item.href || "#"}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
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
