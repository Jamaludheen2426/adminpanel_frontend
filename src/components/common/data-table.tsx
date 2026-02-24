"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { ReactNode } from "react";

export type SortDirection = "asc" | "desc";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  sortConfig?: { key: string; direction: SortDirection } | null;
  onSort?: (key: string) => void;

  // Pagination (required UI)
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;

  isLoading?: boolean;
  actions?: (row: T) => ReactNode;
}

export function DataTable<T extends { id: number }>({
  columns,
  data,
  sortConfig,
  onSort,
  page,
  pageSize,
  total,
  onPageChange,
  isLoading,
  actions,
}: DataTableProps<T>) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => {
                const isSorted = sortConfig?.key === col.key;

                return (
                  <TableHead key={col.key}>
                    {col.sortable && onSort ? (
                      <button
                        onClick={() => onSort(col.key)}
                        className="flex items-center gap-1 font-medium hover:text-foreground"
                      >
                        {col.label}
                        {isSorted ? (
                          sortConfig?.direction === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                        )}
                      </button>
                    ) : (
                      col.label
                    )}
                  </TableHead>
                );
              })}

              {actions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="text-center py-6"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="text-center py-6 text-muted-foreground"
                >
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render
                        ? col.render(row)
                        : String((row as any)[col.key] ?? "–")}
                    </TableCell>
                  ))}

                  {actions && (
                    <TableCell className="text-right">
                      {actions(row)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          Page {page} of {totalPages}
        </p>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}