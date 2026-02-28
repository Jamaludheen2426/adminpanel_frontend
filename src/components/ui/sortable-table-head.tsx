"use client";

/**
 * SortableTableHead + useSortableTable
 * ------------------------------------
 * A lightweight, zero-dependency sort layer for pages that already have
 * server-side pagination and DO NOT use the TanStack DataTable component.
 *
 * Usage
 * -----
 *  const { sorted, SortableHead, sortData } = useSortableTable();
 *
 *  // In JSX:
 *  <TableHeader>
 *    <TableRow>
 *      <SortableHead field="name">Name</SortableHead>
 *      <SortableHead field="email">Email</SortableHead>
 *      <TableHead>Actions</TableHead>   ← non-sortable stays as-is
 *    </TableRow>
 *  </TableHeader>
 *
 *  // On the data:
 *  const rows = sortData(data?.data ?? []);
 */

import { useState, useCallback, ReactNode } from "react";
import { TableHead } from "@/components/ui/table";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

type Direction = "asc" | "desc";

interface SortState {
    field: string;
    direction: Direction;
}

interface SortableHeadProps {
    field: string;
    children: ReactNode;
    className?: string;
    sortState: SortState | null;
    onSort: (field: string) => void;
}

function SortableTableHead({ field, children, className, sortState, onSort }: SortableHeadProps) {
    const active = sortState?.field === field;
    const Icon = active
        ? sortState!.direction === "asc"
            ? ArrowUp
            : ArrowDown
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

/** Hook that manages sort state and returns a bound SortableHead component + a sortData helper */
export function useSortableTable() {
    const [sortState, setSortState] = useState<SortState | null>(null);

    const handleSort = useCallback((field: string) => {
        setSortState((prev) =>
            prev?.field === field
                ? { field, direction: prev.direction === "asc" ? "desc" : "asc" }
                : { field, direction: "asc" }
        );
    }, []);

    /** Sorts an array of objects by the current sort state. Pass your typed data array. */
    function sortData<T extends object>(data: T[]): T[] {
        if (!sortState) return data;
        const { field, direction } = sortState;
        return [...data].sort((a, b) => {
            const av = (a as Record<string, unknown>)[field] ?? "";
            const bv = (b as Record<string, unknown>)[field] ?? "";
            const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" });
            return direction === "asc" ? cmp : -cmp;
        });
    }

    /** Drop-in bound component — just pass field + children */
    const SortableHead = useCallback(
        ({ field, children, className }: { field: string; children: ReactNode; className?: string }) => (
            <SortableTableHead
                field={field}
                sortState={sortState}
                onSort={handleSort}
                className={className}
            >
                {children}
            </SortableTableHead>
        ),
        [sortState, handleSort]
    );

    return { sortState, SortableHead, sortData };
}
