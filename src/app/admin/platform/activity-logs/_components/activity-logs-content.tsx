"use client";

import { useState } from "react";
import { useActivityLogs } from "@/hooks";
import { CommonTable, type CommonColumn } from "@/components/common/common-table";
import { Card, CardContent } from "@/components/ui/card";
import { ActivityLog } from "@/types";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/use-translation";
import { PermissionGuard } from "@/components/guards/permission-guard";
import { PageLoader } from "@/components/common/page-loader";
import { TablePagination } from "@/components/common/table-pagination";

export function ActivityLogsContent() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const { data: logsData, isLoading } = useActivityLogs({ page, limit });

  const logs = logsData?.data || [];
  const pagination = logsData?.pagination;

  const columns: CommonColumn<ActivityLog>[] = [
    {
      key: "action",
      header: t("common.action"),
      sortable: true,
      render: (row) => <span className="font-semibold">{row.action}</span>
    },
    {
      key: "description",
      header: t("common.description"),
      render: (row) => <span className="text-sm">{row.description}</span>
    },
    {
      key: "user",
      header: t("common.user"),
      render: (row) => <span className="text-sm font-medium">{row.user?.email || "-"}</span>,
    },
    {
      key: "ip_address",
      header: t("activity.ip_address"),
      render: (row) => <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.ip_address}</code>
    },
    {
      key: "createdAt",
      header: t("activity.date_time"),
      sortable: true,
      render: (row) => {
        const value = row.createdAt;
        if (!value) return "-";
        const date = new Date(value);
        if (isNaN(date.getTime())) return "-";
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{format(date, "MMM dd, yyyy")}</span>
            <span className="text-[10px] text-muted-foreground uppercase">{format(date, "HH:mm:ss")}</span>
          </div>
        );
      },
    },
  ];

  return (
    <PermissionGuard permission="activity_logs.view">
      <div className="space-y-6">
        <PageLoader open={isLoading} />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("activity.logs")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("activity.logs_desc")}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <CommonTable
              columns={columns}
              data={logs as any}
              isLoading={isLoading}
              showStatus={false}
              showCreated={false}
              showActions={false}
              emptyMessage={t("activity.no_activity")}
            />
            {pagination && <TablePagination pagination={{ ...pagination, limit }} onPageChange={setPage} onLimitChange={setLimit} />}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}