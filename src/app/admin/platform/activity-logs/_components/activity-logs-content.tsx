"use client";

import { useActivityLogs } from "@/hooks";
import { DataTable } from "@/components/ui/data-table";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ColumnDef } from "@tanstack/react-table";
import { ActivityLog } from "@/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/use-translation";
import { Can } from "@/components/guards/permission-guard";

export function ActivityLogsContent() {
  const { t } = useTranslation();
  const { data: logsData, isLoading } = useActivityLogs();

  const logs = logsData?.data || [];

  const columns: ColumnDef<ActivityLog>[] = [
    {
      accessorKey: "action",
      header: t('common.action'),
    },
    {
      accessorKey: "description",
      header: t('common.description'),
    },
    {
      accessorKey: "createdAt",
      header: t('activity.date_time'),
      cell: ({ row }) => {
        const value = row.original.createdAt;

        if (!value) return "-";

        const date = new Date(value);
        if (isNaN(date.getTime())) return "-";

        return format(date, "MMM dd, yyyy HH:mm:ss");
      },
    },
    {
      id: "user",
      header: t('common.user'),
      cell: ({ row }) => row.original.user?.email || "-",
    },
    {
      accessorKey: "ip_address",
      header: t('activity.ip_address'),
    },
  ];

  return (
    <Can permission="activity_logs.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('activity.logs')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('activity.logs_desc')}
          </p>
        </div>

        <Card className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : logs.length > 0 ? (
            <DataTable columns={columns} data={logs} />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t('activity.no_activity')}</p>
            </div>
          )}
        </Card>
      </div>
    </Can>
  );
}
