"use client";

import { useState } from "react";
import { Pencil, Trash2, ArrowUpDown, ChevronDown, ChevronUp, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  T extends { id: number; is_active: boolean | number; created_at: string }
> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: CommonColumn<any>[];
  data: T[];
  isLoading: boolean;
  emptyMessage?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onStatusToggle?: (row: any, value: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEdit?: (row: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDelete?: (row: any) => void;
  showStatus?: boolean;
  showCreated?: boolean;
  showActions?: boolean;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (column: string) => void;
  searchPlaceholder?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSearch?: (value: string) => void;
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  disableStatusToggle?: (row: any) => boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CommonTable<
  T extends { id: number; is_active: boolean | number; created_at: string }
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
  searchPlaceholder,
  onSearch,
  pagination,
  disableStatusToggle,
}: CommonTableProps<T>) {
  const [searchValue, setSearchValue] = useState("");

  const handleSortClick = (key: string, isSortable?: boolean) => {
    if (isSortable && onSort) {
      onSort(key);
    }
  };

  return (
    <div className="space-y-3">
      {/* ── Search ── */}
      {onSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder || "Search..."}
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              onSearch(e.target.value);
            }}
            className="pl-9 h-10 rounded-xl bg-muted/20 border-border/40 focus:bg-background transition-all"
          />
        </div>
      )}

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
                          disabled={!onStatusToggle || (disableStatusToggle?.(row) ?? false)}
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

      {/* ── Pagination ── */}
      {pagination && !isLoading && (
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {pagination.onPageSizeChange && (
              <>
                <span>Rows per page</span>
                <Select
                  value={String(pagination.pageSize)}
                  onValueChange={(v) => pagination.onPageSizeChange!(Number(v))}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
              {" "}
              <span className="hidden sm:inline">({pagination.totalItems} total)</span>
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}