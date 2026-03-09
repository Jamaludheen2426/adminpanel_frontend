'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useVendorMe } from '@/hooks/use-vendors';
import { resolveMediaUrl } from '@/lib/utils';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    LayoutDashboard,
    Users,
    CalendarDays,
    CreditCard,
    BarChart2,
    ActivitySquare,
    HelpCircle,
    Store,
} from 'lucide-react';

const NAV_ITEMS = [
    { label: 'Dashboard',    href: '/vendor/dashboard',    icon: LayoutDashboard },
    { label: 'Clients',      href: '/vendor/clients',      icon: Users },
    { label: 'Events',       href: '/vendor/events',       icon: CalendarDays },
    { label: 'Payments',     href: '/vendor/payments',     icon: CreditCard },
    { label: 'Reports',      href: '/vendor/reports',      icon: BarChart2 },
    { label: 'Activity Log', href: '/vendor/activity-log', icon: ActivitySquare },
    { label: 'Help',         href: '/vendor/help',         icon: HelpCircle },
];

export function VendorSidebar() {
    const pathname = usePathname();
    const { data: vendor } = useVendorMe();
    return (
        <Sidebar>
            {/* Brand */}
            <SidebarHeader>
                <div className="flex items-center gap-2.5 px-2 py-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
                        <Store className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">Vendor Portal</p>
                        {vendor?.company_name && (
                            <p className="text-[11px] text-muted-foreground truncate">{vendor.company_name}</p>
                        )}
                    </div>
                </div>
            </SidebarHeader>

            {/* Navigation */}
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
                                const active = pathname === href || pathname.startsWith(href + '/');
                                return (
                                    <SidebarMenuItem key={href}>
                                        <SidebarMenuButton asChild isActive={active} tooltip={label}>
                                            <Link href={href}>
                                                <Icon />
                                                <span>{label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* Vendor profile + logout */}
            <SidebarFooter>
                <div className="flex items-center gap-3 px-2 py-1">
                    <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={resolveMediaUrl(vendor?.profile || '')} />
                        <AvatarFallback className="text-xs bg-primary/20 text-primary">
                            {vendor?.name?.charAt(0).toUpperCase() ?? 'V'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{vendor?.name ?? '—'}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{vendor?.email ?? ''}</p>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
