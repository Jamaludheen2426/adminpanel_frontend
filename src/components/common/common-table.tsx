"use client";

import { Pencil, Trash2 } from "lucide-react";
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
}

interface CommonTableProps<T extends { id: number; is_active: boolean; created_at: string }> {
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
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CommonTable<T extends { id: number; is_active: boolean; created_at: string }>({
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
}: CommonTableProps<T>) {
  return (
    <>
      <PageLoader open={isLoading} />
      {!isLoading && (
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
              {showStatus && <TableHead>Status</TableHead>}
              {showCreated && <TableHead>Created</TableHead>}
              {showActions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length +
                    (showStatus ? 1 : 0) +
                    (showCreated ? 1 : 0) +
                    (showActions ? 1 : 0)
                  }
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </TableCell>
                  ))}
                  {showStatus && (
                    <TableCell>
                      <Switch
                        checked={Boolean(row.is_active)}
                        onCheckedChange={(val) => onStatusToggle?.(row, val)}
                        disabled={!onStatusToggle}
                      />
                    </TableCell>
                  )}
                  {showCreated && (
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(row.created_at)}
                    </TableCell>
                  )}
                  {showActions && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(row)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(row)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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
      )}
    </>
  );
}
