"use client";

import { Pencil, Trash2, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageLoader } from "@/components/common/page-loader";

export interface CommonColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  headerAlign?: "left" | "right";
  sortable?: boolean;
}

interface CommonTableProps<
  T extends { id: number; is_active: boolean; created_at: string }
> {
  columns: CommonColumn<T>[];
  data: T[];
  isLoading: boolean;
  emptyMessage?: string;
  onStatusToggle?: (row: T, value: boolean) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  showStatus?: boolean;
  showCreated?: boolean;
  showActions?: boolean;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (column: string) => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CommonTable<
  T extends { id: number; is_active: boolean; created_at: string }
>({
  columns,
  data,
  isLoading,
  emptyMessage = "No records found.",
  onStatusToggle,
  onEdit,
  onDelete,
  showStatus = true,
  showCreated = true,
  showActions = true,
  sortColumn,
  sortDirection,
  onSort,
}: CommonTableProps<T>) {
  const handleSortClick = (key: string, isSortable?: boolean) => {
    if (isSortable && onSort) {
      onSort(key);
    }
  };

  return (
    <>
      <PageLoader open={isLoading} />
      {!isLoading && (
        <div className="w-full overflow-hidden rounded-xl border border-border/70 bg-background">
          <Table>
            {/* ── Header ── */}
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border/70">
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    onClick={() => handleSortClick(col.key, col.sortable)}
                    className={`
                      ${col.className || ""}
                      h-11 px-4
                      text-xs font-semibold text-muted-foreground
                      whitespace-nowrap
                      ${col.sortable && onSort ? "cursor-pointer select-none hover:text-foreground transition-colors" : ""}
                    `}
                  >
                    <div className={`flex items-center gap-1 ${col.headerAlign === "right" ? "justify-end" : ""}`}>
                      {col.header}
                      {col.sortable && onSort && (
                        <span className={`transition-colors ${sortColumn === col.key ? "text-primary" : "text-muted-foreground/40"}`}>
                          {sortColumn === col.key ? (
                            sortDirection === "asc"
                              ? <ChevronUp className="h-3.5 w-3.5" />
                              : <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}

                {showStatus && (
                  <TableHead className="h-11 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    Status
                  </TableHead>
                )}
                {showCreated && (
                  <TableHead className="h-11 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    Created
                  </TableHead>
                )}
                {showActions && (
                  <TableHead className="h-11 px-4 text-xs font-semibold text-muted-foreground text-right whitespace-nowrap">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>

            {/* ── Body ── */}
            <TableBody>
              {data.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={
                      columns.length +
                      (showStatus ? 1 : 0) +
                      (showCreated ? 1 : 0) +
                      (showActions ? 1 : 0)
                    }
                  >
                    <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <svg className="h-5 w-5 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium">{emptyMessage}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors duration-100 group"
                  >
                    {columns.map((col, colIndex) => (
                      <TableCell
                        key={col.key}
                        className={`
                          ${col.className || ""}
                          px-4 py-3 text-sm
                          ${colIndex === 0
                            ? "font-medium text-foreground"
                            : "text-muted-foreground"
                          }
                        `}
                      >
                        {col.render
                          ? col.render(row)
                          : String((row as Record<string, unknown>)[col.key] ?? "")}
                      </TableCell>
                    ))}

                    {showStatus && (
                      <TableCell className="px-4 py-3">
                        <Switch
                          checked={Boolean(row.is_active)}
                          onCheckedChange={(val) => onStatusToggle?.(row, val)}
                          disabled={!onStatusToggle}
                        />
                      </TableCell>
                    )}

                    {showCreated && (
                      <TableCell className="px-4 py-3 text-sm tabular-nums text-muted-foreground">
                        {formatDate(row.created_at)}
                      </TableCell>
                    )}

                    {showActions && (
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(row)}
                              title="Edit"
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(row)}
                              title="Delete"
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}