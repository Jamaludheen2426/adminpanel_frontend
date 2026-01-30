"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Shield,
  MapPin,
  Settings,
  Activity,
  TrendingUp,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useAuth } from "@/hooks";
import { useActivityLogs } from "@/hooks/use-activity-logs";
import { format } from "date-fns";

interface StatCard {
  label: string;
  value: string;
  change: string;
  icon: React.ElementType;
  href: string;
}

const stats: StatCard[] = [
  {
    label: "Total Users",
    value: "0",
    change: "+0%",
    icon: Users,
    href: "/admin/users",
  },
  {
    label: "Roles",
    value: "0",
    change: "+0%",
    icon: Shield,
    href: "/admin/roles",
  },
  {
    label: "Locations",
    value: "0",
    change: "+0%",
    icon: MapPin,
    href: "/admin/locations",
  },
  {
    label: "Settings",
    value: "0",
    change: "+0%",
    icon: Settings,
    href: "/admin/settings",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: activityData, isLoading: activityLoading } = useActivityLogs({ limit: 5 });

  const activities = activityData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user?.first_name || "Admin"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-bold mt-2">{stat.value}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-500">{stat.change}</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href="/admin/users">
              <Button variant="outline" className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </Link>
            <Link href="/admin/roles">
              <Button variant="outline" className="w-full">
                <Shield className="mr-2 h-4 w-4" />
                Manage Roles
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline" className="w-full">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
            <Link href="/admin/activity-logs">
              <Button variant="outline" className="w-full">
                <Activity className="mr-2 h-4 w-4" />
                Activity Logs
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Link href="/admin/activity-logs">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : activities.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {log.user?.first_name} {log.user?.last_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {log.description || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.createdAt ? format(new Date(log.createdAt), "MMM dd, HH:mm") : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No recent activity to display
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
