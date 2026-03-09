'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useVendorMe, useVendorLogout } from '@/hooks/use-vendors';
import { useLanguages } from '@/hooks';
import { useTranslation } from '@/hooks/use-translation';
import { resolveMediaUrl } from '@/lib/utils';
import Link from 'next/link';
import {
    LogOut,
    User,
    Globe,
    Sun,
    Moon,
    Monitor,
    Maximize,
    Minimize,
    KeyRound,
} from 'lucide-react';

const MEMBERSHIP_COLORS: Record<string, string> = {
    basic:    'bg-gray-100 text-gray-700',
    silver:   'bg-slate-200 text-slate-700',
    gold:     'bg-yellow-100 text-yellow-700',
    platinum: 'bg-purple-100 text-purple-700',
};

export function VendorNavbar() {
    const { data: vendor } = useVendorMe();
    const logout = useVendorLogout();
    const { setTheme } = useTheme();
    const { language, setLanguage } = useTranslation();
    const { data: languagesData } = useLanguages({ limit: 100 });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const onFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }, []);

    const languages = languagesData?.data?.filter((l) => l.is_active) || [];

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4 gap-3">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="h-6" />

                <div className="flex-1" />

                <div className="flex items-center gap-1">
                    {/* Membership badge */}
                    {vendor?.membership && (
                        <Badge
                            className={`text-xs capitalize border-0 mr-1 ${MEMBERSHIP_COLORS[vendor.membership] ?? ''}`}
                        >
                            {vendor.membership}
                        </Badge>
                    )}

                    {/* Language selector */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                <Globe className="h-4 w-4" />
                                <span className="sr-only">Language</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[150px]">
                            {languages.length > 0 ? (
                                languages.map((lang) => (
                                    <DropdownMenuItem
                                        key={lang.id}
                                        onClick={() => setLanguage(lang.code)}
                                        className={language === lang.code ? 'bg-accent' : ''}
                                    >
                                        <span className="flex-1">{lang.name}</span>
                                        <span className="text-xs text-muted-foreground ml-2">
                                            {lang.code.toUpperCase()}
                                        </span>
                                    </DropdownMenuItem>
                                ))
                            ) : (
                                <DropdownMenuItem disabled>No languages</DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Fullscreen toggle */}
                    {mounted && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            onClick={toggleFullscreen}
                        >
                            {isFullscreen ? (
                                <Minimize className="h-4 w-4" />
                            ) : (
                                <Maximize className="h-4 w-4" />
                            )}
                            <span className="sr-only">Toggle fullscreen</span>
                        </Button>
                    )}

                    {/* Theme toggle */}
                    {mounted && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9">
                                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                    <span className="sr-only">Toggle theme</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setTheme('light')}>
                                    <Sun className="mr-2 h-4 w-4" /> Light
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme('dark')}>
                                    <Moon className="mr-2 h-4 w-4" /> Dark
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setTheme('system')}>
                                    <Monitor className="mr-2 h-4 w-4" /> System
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* Avatar dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring ml-1">
                                <Avatar className="h-8 w-8 border cursor-pointer">
                                    <AvatarImage src={resolveMediaUrl(vendor?.profile || '')} />
                                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                                        {vendor?.name?.charAt(0).toUpperCase() ?? 'V'}
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <p className="text-sm font-semibold">{vendor?.name}</p>
                                <p className="text-xs text-muted-foreground font-normal truncate">{vendor?.email}</p>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/vendor/profile">
                                    <User className="mr-2 h-4 w-4" />
                                    Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/vendor/profile#change-password">
                                    <KeyRound className="mr-2 h-4 w-4" />
                                    Change Password
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => logout.mutate()}
                                disabled={logout.isPending}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                {logout.isPending ? 'Logging out…' : 'Logout'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
