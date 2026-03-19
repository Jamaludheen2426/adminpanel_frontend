"use client";

import React, { useState } from "react";
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
  hideOnMobile?: boolean;
}

interface CommonTableProps<
  T extends { id: number; is_active: boolean | number; created_at: string; has_pending_approval?: boolean }
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRowClick?: (row: any) => void;
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
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function CommonTable<
  T extends { id: number; is_active: boolean | number; created_at: string; has_pending_approval?: boolean }
>({
  columns,
  data,
  isLoading,
  emptyMessage = "No records found.",
  onStatusToggle,
  onEdit,
  onDelete,
  onRowClick,
  showStatus = true,
  showCreated = true,
  showActions = true,
  sortColumn: externalSortColumn,
  sortDirection: externalSortDirection,
  onSort: externalOnSort,
  searchPlaceholder,
  onSearch,
  pagination,
  disableStatusToggle,
}: CommonTableProps<T>) {
  const [searchValue, setSearchValue] = useState("");
  const [internalSortColumn, setInternalSortColumn] = useState<string | undefined>(undefined);
  const [internalSortDirection, setInternalSortDirection] = useState<"asc" | "desc">("asc");

  const isControlled = !!externalOnSort;
  const sortColumn = isControlled ? externalSortColumn : internalSortColumn;
  const sortDirection = isControlled ? externalSortDirection : internalSortDirection;

  const handleSortClick = (key: string, isSortable?: boolean) => {
    if (!isSortable) return;
    if (isControlled) {
      externalOnSort!(key);
    } else {
      if (internalSortColumn === key) {
        setInternalSortDirection(d => d === "asc" ? "desc" : "asc");
      } else {
        setInternalSortColumn(key);
        setInternalSortDirection("asc");
      }
    }
  };

  const sortedData = React.useMemo(() => {
    if (isControlled || !sortColumn) return data;
    return [...data].sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortColumn] ?? 0;
      const bv = (b as Record<string, unknown>)[sortColumn] ?? 0;
      const cmp = typeof av === "string" && typeof bv === "string"
        ? av.localeCompare(bv)
        : av > bv ? 1 : av < bv ? -1 : 0;
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [data, isControlled, sortColumn, sortDirection]);

  return (
    <div className="space-y-4">
      {/* ── Search ── */}
      {onSearch && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
          <Input
            placeholder={searchPlaceholder || "Search..."}
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              onSearch(e.target.value);
            }}
            className="pl-10 h-11 rounded-2xl bg-muted/25 border-border/50 text-sm placeholder:text-muted-foreground/40 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 focus-visible:bg-background hover:border-border/80 transition-all duration-200 shadow-sm"
          />
        </div>
      )}

      <PageLoader open={isLoading} />
      {!isLoading && (
        <div className="w-full rounded-2xl border border-border/60 bg-background shadow-sm ring-1 ring-border/20">
          <Table>
            {/* ── Header ── */}
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/60">
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    onClick={() => handleSortClick(col.key, col.sortable)}
                    className={`
                      ${col.className || ""}
                      ${col.hideOnMobile ? "hidden md:table-cell" : ""}
                      h-12 px-5
                      text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/70
                      whitespace-nowrap
                      ${col.sortable ? "cursor-pointer select-none hover:text-foreground transition-colors duration-200" : ""}
                    `}
                  >
                    <div className={`flex items-center gap-1.5 ${col.headerAlign === "right" ? "justify-end" : ""}`}>
                      {col.header}
                      {col.sortable && (
                        <span className={`inline-flex shrink-0 transition-all duration-200 ${sortColumn === col.key ? "text-primary scale-110" : "text-muted-foreground/30"}`}>
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
                  <TableHead className="h-12 px-5 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/70 whitespace-nowrap">
                    Status
                  </TableHead>
                )}
                {showCreated && (
                  <TableHead className="hidden sm:table-cell h-12 px-5 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/70 whitespace-nowrap">
                    Created
                  </TableHead>
                )}
                {showActions && (
                  <TableHead className="h-12 px-5 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/70 text-right whitespace-nowrap">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>

            {/* ── Body ── */}
            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={
                      columns.length +
                      (showStatus ? 1 : 0) +
                      (showCreated ? 1 : 0) +
                      (showActions ? 1 : 0)
                    }
                  >
                    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
                      <div className="h-14 w-14 rounded-2xl bg-muted/70 flex items-center justify-center ring-1 ring-border/40 shadow-sm">
                        <svg className="h-6 w-6 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground/60 tracking-wide">{emptyMessage}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={`border-b border-border/40 last:border-0 hover:bg-muted/20 transition-all duration-200 ease-in-out group ${
                      onRowClick ? "cursor-pointer" : ""
                    }`}
                  >
                    {columns.map((col, colIndex) => (
                      <TableCell
                        key={col.key}
                        className={`
                          ${col.className || ""}
                          ${col.hideOnMobile ? "hidden md:table-cell" : ""}
                          px-5 py-4 text-sm leading-snug
                          ${colIndex === 0
                            ? "font-semibold text-foreground"
                            : "font-normal text-muted-foreground"
                          }
                        `}
                      >
                        {col.render
                          ? col.render(row)
                          : String((row as Record<string, unknown>)[col.key] ?? "")}
                      </TableCell>
                    ))}

                    {showStatus && (
                      <TableCell className="px-5 py-4">
                        <Switch
                          pending={Number(row.is_active) === 2 || !!row.has_pending_approval}
                          checked={Number(row.is_active) === 1}
                          onCheckedChange={(val) => onStatusToggle?.(row, val)}
                          disabled={!onStatusToggle || (disableStatusToggle?.(row) ?? false)}
                        />
                      </TableCell>
                    )}

                    {showCreated && (
                      <TableCell className="hidden sm:table-cell px-5 py-4 text-sm tabular-nums text-muted-foreground/70 font-normal tracking-tight">
                        {formatDate(row.created_at)}
                      </TableCell>
                    )}

                    {showActions && (
                      <TableCell className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(row)}
                              title="Edit"
                              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 active:scale-95 transition-all duration-150"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(row)}
                              title="Delete"
                              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:scale-95 transition-all duration-150"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
        <div className="flex items-center justify-between pt-2 px-0.5 flex-wrap gap-2">
          <div className="flex items-center gap-2.5 text-sm text-muted-foreground/80">
            {pagination.onPageSizeChange && (
              <>
                <span className="hidden sm:inline text-xs font-medium tracking-wide">Rows per page</span>
                <Select
                  value={String(pagination.pageSize)}
                  onValueChange={(v) => pagination.onPageSizeChange!(Number(v))}
                >
                  <SelectTrigger className="h-8 w-[72px] rounded-xl border-border/60 bg-background text-xs font-medium shadow-sm hover:border-border transition-all duration-200">
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
            <span className="text-xs font-medium text-muted-foreground/70 tabular-nums">
              Page {pagination.page} of {pagination.totalPages}
              {" "}
              <span className="hidden sm:inline text-muted-foreground/50">· {pagination.totalItems} total</span>
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-xl border-border/60 bg-background shadow-sm hover:bg-muted/50 hover:border-border active:scale-95 transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed"
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-xl border-border/60 bg-background shadow-sm hover:bg-muted/50 hover:border-border active:scale-95 transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed"
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}