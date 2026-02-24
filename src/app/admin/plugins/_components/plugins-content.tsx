"use client";

import { useState } from "react";
import {
    Puzzle, Search, CheckCircle, XCircle, Compass,
    Lock, BarChart2, Cloud, CreditCard, MapPin, Shield, MessageSquare, SlidersHorizontal,
    AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageLoader } from "@/components/common/page-loader";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { PluginCard } from "./plugin-card";
import { usePlugins, useTogglePlugin } from "@/hooks/use-plugins";
import type { Plugin, PluginCategory } from "@/types";

// ─── Category meta ────────────────────────────────────────────────────────────

const CATEGORIES: Record<PluginCategory, { label: string; icon: React.ReactNode; color: string }> = {
    authentication: { label: "Authentication", icon: <Lock className="w-4 h-4" />, color: "text-blue-500" },
    analytics: { label: "Analytics", icon: <BarChart2 className="w-4 h-4" />, color: "text-orange-500" },
    storage: { label: "Storage", icon: <Cloud className="w-4 h-4" />, color: "text-sky-500" },
    payment: { label: "Payment", icon: <CreditCard className="w-4 h-4" />, color: "text-violet-500" },
    maps: { label: "Maps", icon: <MapPin className="w-4 h-4" />, color: "text-red-500" },
    security: { label: "Security", icon: <Shield className="w-4 h-4" />, color: "text-green-500" },
    communication: { label: "Communication", icon: <MessageSquare className="w-4 h-4" />, color: "text-pink-500" },
    general: { label: "General", icon: <SlidersHorizontal className="w-4 h-4" />, color: "text-muted-foreground" },
};

const CATEGORY_ORDER: PluginCategory[] = [
    "authentication", "analytics", "storage", "payment", "maps", "security", "communication", "general",
];

// ─── Grouped card grid ────────────────────────────────────────────────────────

interface PluginGridProps {
    plugins: Plugin[];
    search: string;
    onToggle: (slug: string) => Promise<void>;
    togglingSlug: string | null;
    emptyMessage: string;
    emptyIcon: React.ReactNode;
}

function PluginGrid({ plugins, search, onToggle, togglingSlug, emptyMessage, emptyIcon }: PluginGridProps) {
    const filtered = plugins.filter((p) =>
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(search.toLowerCase())
    );

    if (filtered.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-4 opacity-40">{emptyIcon}</div>
                <h3 className="text-lg font-semibold mb-1">{emptyMessage}</h3>
                {search && <p className="text-sm text-muted-foreground">Try adjusting your search.</p>}
            </div>
        );
    }

    // Group by category in defined order
    const grouped: Partial<Record<PluginCategory, Plugin[]>> = {};
    for (const p of filtered) {
        if (!grouped[p.category]) grouped[p.category] = [];
        grouped[p.category]!.push(p);
    }

    return (
        <div className="space-y-8">
            {CATEGORY_ORDER.map((cat) => {
                const catPlugins = grouped[cat];
                if (!catPlugins?.length) return null;
                const meta = CATEGORIES[cat];
                return (
                    <section key={cat}>
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide">{meta.label}</h2>
                            <Badge variant="secondary" className="text-xs">{catPlugins.length}</Badge>
                            <div className="flex-1 h-px bg-border ml-1" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {catPlugins.map((plugin) => (
                                <PluginCard
                                    key={plugin.slug}
                                    plugin={plugin}
                                    onToggle={onToggle}
                                    isToggling={togglingSlug === plugin.slug}
                                />
                            ))}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PluginsContent() {
    const { data, isLoading, isError } = usePlugins();
    const toggleMutation = useTogglePlugin();
    const [search, setSearch] = useState("");
    const [togglingSlug, setTogglingSlug] = useState<string | null>(null);

    const handleToggle = async (slug: string) => {
        setTogglingSlug(slug);
        try {
            await toggleMutation.mutateAsync(slug);
        } finally {
            setTogglingSlug(null);
        }
    };

    const allPlugins = data?.plugins ?? [];
    const activePlugins = allPlugins.filter((p) => p.is_active === 1);
    const explorePlugins = allPlugins; // all, can toggle from here

    return (
        <PermissionGuard permission="plugins.view">
            <div className="space-y-6">
                <PageLoader open={isLoading} />

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Puzzle className="w-8 h-8 text-primary" />
                            Plugins
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage integrations and third-party services.
                        </p>
                    </div>

                    {/* Stats */}
                    {!isLoading && !isError && (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-sm">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span className="font-medium text-emerald-700 dark:text-emerald-300">
                                    {activePlugins.length} Active
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border text-sm">
                                <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="font-medium text-muted-foreground">
                                    {allPlugins.length - activePlugins.length} Inactive
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error state */}
                {!isLoading && isError && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <AlertCircle className="w-12 h-12 text-destructive mb-4 opacity-70" />
                        <h3 className="text-lg font-semibold mb-1">Failed to load plugins</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            Could not reach the plugins API. Make sure the backend is running and the
                            <code className="mx-1 font-mono text-xs bg-muted px-1 rounded">plugins</code>
                            table exists in your database.
                        </p>
                    </div>
                )}

                {/* Tabs */}
                {!isLoading && !isError && (
                    <Tabs defaultValue="active" className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <TabsList className="h-10">
                                <TabsTrigger value="active" className="gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Active Plugins
                                    {activePlugins.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                                            {activePlugins.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="explore" className="gap-2">
                                    <Compass className="w-4 h-4" />
                                    Explore Plugins
                                    <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                                        {allPlugins.length}
                                    </Badge>
                                </TabsTrigger>
                            </TabsList>

                            {/* Search */}
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="plugin-search"
                                    placeholder="Search plugins..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        {/* Active tab */}
                        <TabsContent value="active" className="mt-0">
                            <PluginGrid
                                plugins={activePlugins}
                                search={search}
                                onToggle={handleToggle}
                                togglingSlug={togglingSlug}
                                emptyMessage="No active plugins"
                                emptyIcon={<CheckCircle className="w-12 h-12 text-muted-foreground" />}
                            />
                        </TabsContent>

                        {/* Explore tab */}
                        <TabsContent value="explore" className="mt-0">
                            <PluginGrid
                                plugins={explorePlugins}
                                search={search}
                                onToggle={handleToggle}
                                togglingSlug={togglingSlug}
                                emptyMessage="No plugins found"
                                emptyIcon={<Puzzle className="w-12 h-12 text-muted-foreground" />}
                            />
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </PermissionGuard>
    );
}
