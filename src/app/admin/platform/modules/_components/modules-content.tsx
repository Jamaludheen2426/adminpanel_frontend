"use client";

import { useState } from "react";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useModules } from "@/hooks/use-modules";
import { useTranslation } from "@/hooks/use-translation";
import { Spinner } from "@/components/ui/spinner";
import React from "react";
import { PermissionGuard } from "@/components/guards/permission-guard";

export function ModulesContent() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

  const { data, isLoading } = useModules({ page, limit: 50, search });

  const toggleExpand = (moduleId: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  return (
    <PermissionGuard permission="modules.view">
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Modules & Permissions</h1>
        <p className="text-muted-foreground mt-1">
          System modules and their auto-generated permissions. Assign these to roles and configure approval requirements in Role Management.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search modules..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Module Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data?.map((mod) => {
                    const isExpanded = expandedModules.has(mod.id);

                    return (
                      <React.Fragment key={mod.id}>
                        <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleExpand(mod.id)}>
                          <TableCell>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{mod.name}</TableCell>
                          <TableCell>
                            <code className="text-sm bg-muted px-2 py-1 rounded">{mod.slug}</code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{mod.permissions?.length || 0} permissions</Badge>
                          </TableCell>
                          <TableCell>
                            {mod.is_active ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500 border-gray-400">Inactive</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                        {isExpanded && mod.permissions && mod.permissions.length > 0 && (
                          <TableRow>
                            <TableCell></TableCell>
                            <TableCell colSpan={4}>
                              <div className="py-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {mod.permissions.map((perm) => (
                                  <div
                                    key={perm.id}
                                    className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/30"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{perm.name}</p>
                                      <code className="text-xs text-muted-foreground">{perm.slug}</code>
                                    </div>
                                    {perm.is_active && (
                                      <Badge variant="outline" className="text-xs text-green-600 border-green-600">Active</Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {data?.data?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No modules found. Modules are system-defined master data.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {data.pagination.page} / {data.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={!data.pagination.hasPrevPage}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!data.pagination.hasNextPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
    </PermissionGuard>
  );
}
