"use client";

import { Settings, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { Plugin } from "@/types";

// ─── Brand SVG logos by plugin slug ──────────────────────────────────────────

const PLUGIN_LOGOS: Record<string, React.ReactNode> = {
    "google-oauth": (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6">
            <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            <path fill="none" d="M0 0h48v48H0z" />
        </svg>
    ),
    "facebook-oauth": (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6">
            <linearGradient id="fb-grad" x1="9.993" x2="40.615" y1="9.993" y2="40.615" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#2aa4f4" />
                <stop offset="1" stopColor="#007ad9" />
            </linearGradient>
            <path fill="url(#fb-grad)" d="M24 4C12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20S35.046 4 24 4z" />
            <path fill="#fff" d="M26.707 29.301h5.176l.813-5.258h-5.989v-2.874c0-2.184.714-4.121 2.757-4.121h3.283V12.46c-.577-.078-1.797-.248-4.102-.248-4.814 0-7.636 2.542-7.636 8.334v3.498H16.06v5.258h4.948v14.452c.98.146 1.976.247 2.992.247.933 0 1.848-.088 2.707-.214V29.301z" />
        </svg>
    ),
    "google-tag-manager": (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-6 h-6">
            <path fill="#8AB4F8" d="M38.5 12.2L27.3 23.4 40.6 36.7 51.8 25.5z" />
            <path fill="#4285F4" d="M12.2 25.5L23.4 36.7 36.7 23.4 25.5 12.2z" />
            <path fill="#8AB4F8" d="M32 40.6l-8.6 8.6a2 2 0 000 2.8l5.7 5.7a2 2 0 002.8 0l5.7-5.7a2 2 0 000-2.8L32 40.6z" />
            <path fill="#246FDB" d="M32 7.2l-5.7 5.7a2 2 0 000 2.8L32 21.4l5.7-5.7a2 2 0 000-2.8L32 7.2z" />
        </svg>
    ),
    "google-analytics": (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-6 h-6">
            <path fill="#F9AB00" d="M45.3 10.7v42.6a5.3 5.3 0 005.4 5.4 5.3 5.3 0 005.3-5.4V10.7A5.3 5.3 0 0050.7 5.4a5.3 5.3 0 00-5.4 5.3z" />
            <path fill="#E37400" d="M26.7 32v21.3a5.3 5.3 0 005.3 5.4 5.3 5.3 0 005.4-5.4V32a5.3 5.3 0 00-5.4-5.3 5.3 5.3 0 00-5.3 5.3z" />
            <circle fill="#E37400" cx="13.3" cy="53.3" r="5.3" />
        </svg>
    ),
    "amazon-s3": (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" className="w-6 h-6">
            <path fill="#E25444" d="M40 5L10 20v40l30 15 30-15V20L40 5z" />
            <path fill="#fff" fillOpacity=".15" d="M40 5v55l30-15V20L40 5z" />
            <path fill="#fff" d="M40 30a10 10 0 100 20 10 10 0 000-20zm0 16a6 6 0 110-12 6 6 0 010 12z" />
        </svg>
    ),
    "cloudflare-r2": (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="w-6 h-6">
            <rect width="200" height="200" rx="40" fill="#F38020" />
            <path fill="#fff" d="M130.2 125.8c1.7-5.8-.1-9.8-4.2-12.5l.2-.7c5.8-1.3 10.1-5.5 11.5-11 1.2-4.7-.6-9.8-4.7-12.8-2.8-2-6.4-3-10.3-2.9H93.5l-10 45h16.2l3.4-15.3h7.6l5.4 15.3h17.8l-3.7-5.1zm-18.6-12.5h-6.4l2.7-12.2h6.4c4.2 0 6.4 2.2 5.5 6.2-.9 3.9-3.9 6-8.2 6z" />
        </svg>
    ),
    "digitalocean-spaces": (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="w-6 h-6">
            <circle cx="100" cy="100" r="100" fill="#0080FF" />
            <circle cx="100" cy="100" r="42" fill="#fff" />
            <path fill="#0080FF" d="M100 140v21.5c-33.9 0-61.5-27.6-61.5-61.5h21.5c0 22.1 17.9 40 40 40z" />
            <path fill="#0080FF" d="M60 100H38.5c0-8.1 1.6-15.8 4.6-22.9l18.6 10.7A40.3 40.3 0 0060 100z" />
            <path fill="#0080FF" d="M54.6 69.4L36 58.6A61.3 61.3 0 0178.6 38.5L69.9 59a40.8 40.8 0 00-15.3 10.4z" />
        </svg>
    ),
    "wasabi": (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="w-6 h-6">
            <rect width="200" height="200" rx="40" fill="#3DB843" />
            <path fill="#fff" d="M100 40L55 70v60l45 30 45-30V70L100 40zm0 14l35 22v46l-35 23-35-23V76L100 54zm0 12L72 83v34l28 19 28-19V83L100 66z" />
        </svg>
    ),
    "google-maps": (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6">
            <path fill="#34A853" d="M24 4a14 14 0 00-14 14c0 10.5 14 28 14 28s14-17.5 14-28A14 14 0 0024 4z" />
            <circle cx="24" cy="18" r="6" fill="#fff" />
            <path fill="#4285F4" d="M24 4a14 14 0 00-14 14c0 3.5 1.2 6.7 3 9.3L24 4z" />
            <path fill="#EA4335" d="M24 4l11 19.3A14 14 0 0038 18 14 14 0 0024 4z" />
            <path fill="#FBBC04" d="M13 27.3C15.7 32.9 20.5 38.9 24 44c3.5-5.1 8.3-11.1 11-16.7L24 18l-11 9.3z" />
        </svg>
    ),
    "stripe": (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6">
            <rect width="48" height="48" rx="10" fill="#635BFF" />
            <path fill="#fff" d="M22.3 18.7c0-1 .9-1.4 2.3-1.4 2 0 4.6.6 6.6 1.7V13c-2.2-.9-4.4-1.2-6.6-1.2-5.4 0-9 2.8-9 7.5 0 7.3 10 6.1 10 9.3 0 1.2-1 1.6-2.5 1.6-2.2 0-5-.9-7.2-2.2v5.9c2.4 1 4.9 1.5 7.2 1.5 5.5 0 9.3-2.7 9.3-7.5-.1-7.9-10.1-6.5-10.1-9.2z" />
        </svg>
    ),
    "recaptcha": (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6">
            <path fill="#4CAF50" d="M24 4L6 14v20l18 10 18-10V14L24 4z" />
            <path fill="#81C784" d="M24 4v36l18-10V14L24 4z" />
            <path fill="#fff" d="M24 16a8 8 0 100 16 8 8 0 000-16zm0 13a5 5 0 110-10 5 5 0 010 10z" />
            <path fill="#fff" d="M21 24l2 2 4-5-1-1-3 4-1-1-1 1z" />
        </svg>
    ),
    "twilio": (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6">
            <circle cx="24" cy="24" r="22" fill="#F22F46" />
            <circle cx="17" cy="17" r="3.5" fill="#fff" />
            <circle cx="31" cy="17" r="3.5" fill="#fff" />
            <circle cx="17" cy="31" r="3.5" fill="#fff" />
            <circle cx="31" cy="31" r="3.5" fill="#fff" />
        </svg>
    ),
};

function FallbackIcon() {
    return <div className="w-6 h-6 flex items-center justify-center"><Settings className="w-5 h-5 text-muted-foreground" /></div>;
}

// ─── Plugin Card ──────────────────────────────────────────────────────────────

interface PluginCardProps {
    plugin: Plugin;
    onToggle: (slug: string) => void;
    isToggling: boolean;
}

export function PluginCard({ plugin, onToggle, isToggling }: PluginCardProps) {
    const isEnabled = plugin.is_active === 1;
    const logo = PLUGIN_LOGOS[plugin.slug] ?? <FallbackIcon />;

    return (
        <Card className="group hover:shadow-md transition-all duration-200 border-border/60 hover:border-primary/30">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center shadow-inner">
                            {logo}
                        </div>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-semibold leading-tight truncate">{plugin.name}</CardTitle>
                            <CardDescription className="text-xs mt-0.5 line-clamp-2">{plugin.description}</CardDescription>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge
                            variant={isEnabled ? "default" : "secondary"}
                            className={`text-xs gap-1 ${isEnabled ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400" : ""}`}
                        >
                            {isEnabled ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {isEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                        <Switch
                            id={`plugin-toggle-${plugin.slug}`}
                            checked={isEnabled}
                            disabled={isToggling}
                            onCheckedChange={() => onToggle(plugin.slug)}
                            aria-label={`Toggle ${plugin.name}`}
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-0" />
        </Card>
    );
}
