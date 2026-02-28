"use client";

import { ReactNode } from "react";
import { TableHead } from "@/components/ui/table";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

interface SortHeadProps {
    field: string;
    sort_by: string;
    sort_order: "ASC" | "DESC";
    onSort: (field: string) => void;
    children: ReactNode;
    className?: string;
}

export function SortHead({ field, sort_by, sort_order, onSort, children, className }: SortHeadProps) {
    const active = sort_by === field;
    const Icon = active
        ? sort_order === "ASC" ? ArrowUp : ArrowDown
        : ArrowUpDown;

    return (
        <TableHead className={className}>
            <button
                type="button"
                onClick={() => onSort(field)}
                className="flex items-center gap-1 font-medium hover:text-foreground transition-colors select-none"
            >
                {children}
                <Icon className={`h-3.5 w-3.5 ${active ? "" : "opacity-40"}`} />
            </button>
        </TableHead>
    );
}
