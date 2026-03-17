"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PaginationMeta {
  page: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

interface TablePaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
}

function buildPages(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

export function TablePagination({
  pagination,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 25, 50, 100],
}: TablePaginationProps) {
  const { page, totalPages, totalItems, hasNextPage, hasPrevPage, limit } = pagination;

  if (totalPages <= 1 && totalItems <= limit) return null;

  const pages = buildPages(page, totalPages);
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t">
      {/* Info + limit selector */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>
          {from}–{to} of {totalItems}
        </span>
        {onLimitChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs">Rows:</span>
            <Select
              value={String(limit)}
              onValueChange={(v) => {
                onLimitChange(Number(v));
                onPageChange(1);
              }}
            >
              <SelectTrigger className="h-7 w-[64px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {limitOptions.map((o) => (
                  <SelectItem key={o} value={String(o)} className="text-xs">
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Page buttons */}
      <Pagination className="w-auto mx-0 justify-end">
        <PaginationContent className="gap-0.5">
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => { e.preventDefault(); if (hasPrevPage) onPageChange(page - 1); }}
              aria-disabled={!hasPrevPage}
              className={!hasPrevPage ? "pointer-events-none opacity-40" : ""}
            />
          </PaginationItem>

          {pages.map((p, i) =>
            p === "ellipsis" ? (
              <PaginationItem key={`e-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={p === page}
                  onClick={(e) => { e.preventDefault(); onPageChange(p); }}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => { e.preventDefault(); if (hasNextPage) onPageChange(page + 1); }}
              aria-disabled={!hasNextPage}
              className={!hasNextPage ? "pointer-events-none opacity-40" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
