"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: ReactNode;
    icon?: ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    description,
    action,
    icon,
    className,
}: PageHeaderProps) {
    return (
        <div className={cn("flex flex-wrap items-center justify-between gap-4 py-4", className)}>
            <div className="flex items-center gap-3">
                {icon && (
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                        {icon}
                    </div>
                )}
                <div className="space-y-0.5">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {action && (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2 duration-300">
                    {action}
                </div>
            )}
        </div>
    );
}
