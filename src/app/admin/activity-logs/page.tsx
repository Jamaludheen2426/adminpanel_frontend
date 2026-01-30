"use client";

import { useActivityLogs } from "@/hooks";
import { DataTable } from "@/components/ui/data-table";
import { Card } from "@/components/ui/card";
import { ColumnDef } from "@tanstack/react-table";
import { ActivityLog } from "@/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const columns: ColumnDef<ActivityLog>[] = [
  {
    accessorKey: "action",
    header: "Action",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "createdAt",
    header: "Date & Time",
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
    header: "User",
    cell: ({ row }) => row.original.user?.email || "-",
  },
  {
    accessorKey: "ip_address",
    header: "IP Address",
  },
];

export default function ActivityLogsPage() {
  const { data: logsData, isLoading } = useActivityLogs();
  
  const logs = logsData?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Activity Logs</h1>
        <p className="text-gray-600 mt-1">
          View system activity and user actions
        </p>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading activity logs...</p>
          </div>
        ) : logs.length > 0 ? (
          <DataTable columns={columns} data={logs} />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No activity logs found</p>
          </div>
        )}
      </Card>
    </div>
  );
}
