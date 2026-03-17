"use client";

import Link from "next/link";
import { PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PluginDisabledProps {
    pluginName: string;
    pluginSlug: string;
}

export function PluginDisabledState({ pluginName, pluginSlug }: PluginDisabledProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <PowerOff className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
                <h2 className="text-xl font-semibold mb-1">{pluginName} is disabled</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                    This module is currently inactive. Enable the <strong>{pluginName}</strong> plugin from the Plugins page to use it.
                </p>
            </div>
            <Button asChild variant="outline">
                <Link href={`/admin/plugins?highlight=${pluginSlug}`}>Go to Plugins</Link>
            </Button>
        </div>
    );
}
