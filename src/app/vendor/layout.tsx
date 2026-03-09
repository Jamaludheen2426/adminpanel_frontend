'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { VendorSidebar } from '@/components/vendor/vendor-sidebar';
import { VendorNavbar } from '@/components/vendor/vendor-navbar';

export default function VendorLayout({ children }: { children: React.ReactNode }) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // CSS vars must be raw HSL components (no hsl() wrapper)
    // because Tailwind wraps them: hsl(var(--sidebar-background))
    const isDark = mounted && resolvedTheme === 'dark';

    const themeStyle = {
        // Sidebar variables
        '--sidebar-background': isDark ? '222.2 84% 4.9%' : '0 0% 100%',
        '--sidebar-primary':    isDark ? '224.3 76.3% 55%' : '228 64% 51%',
        '--sidebar-primary-foreground': '0 0% 100%',
        '--sidebar-accent':     isDark ? '217.2 32.6% 17.5%' : '214 32% 91%',
        '--sidebar-border':     isDark ? '217.2 32.6% 10%' : '214.3 31.8% 88%',
        '--sidebar-foreground': isDark ? '210 40% 90%' : '222.2 47.4% 20%',
        // Primary (blue) for vendor portal
        '--primary':            isDark ? '224.3 76.3% 55%' : '228 64% 51%',
        '--primary-foreground': '0 0% 100%',
        // Light mode: grayish-blue page background matching reference
        backgroundColor: mounted ? (isDark ? 'hsl(222.2 84% 4.9%)' : 'hsl(225 15% 96%)') : undefined,
    } as React.CSSProperties;

    return (
        <SidebarProvider>
            <div
                className="flex min-h-screen w-full"
                style={themeStyle}
                data-vendor
            >
                <VendorSidebar />
                <SidebarInset className="flex flex-col flex-1 min-w-0">
                    <VendorNavbar />
                    <main className="flex-1 overflow-y-auto">
                        <div className="p-6">
                            {children}
                        </div>
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
