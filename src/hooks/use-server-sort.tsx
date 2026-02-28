/**
 * useServerSort — server-side sort state hook
 * -------------------------------------------
 * Returns sort_by + sort_order (snake_case) to pass directly into
 * paginated API hooks. Matches what backend parseSort() reads.
 *
 * Usage:
 *   const { sort_by, sort_order, handleSort } = useServerSort('name');
 *   const { data } = useRoles({ page, limit: 10, search, sort_by, sort_order });
 *
 *   <SortHead field="name" sort_by={sort_by} sort_order={sort_order} onSort={handleSort}>Name</SortHead>
 */

import { useState, useCallback } from "react";

export function useServerSort(defaultField = "created_at", defaultOrder: "ASC" | "DESC" = "ASC") {
    const [sort_by, setSortBy] = useState(defaultField);
    const [sort_order, setSortOrder] = useState<"ASC" | "DESC">(defaultOrder);

    const handleSort = useCallback((field: string) => {
        if (sort_by === field) {
            // Same column → just flip the direction
            setSortOrder((o) => (o === "ASC" ? "DESC" : "ASC"));
        } else {
            // New column → switch to it, reset to ASC
            setSortBy(field);
            setSortOrder("ASC");
        }
    }, [sort_by]);

    return { sort_by, sort_order, handleSort };
}
