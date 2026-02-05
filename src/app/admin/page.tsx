"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Shield,
  MapPin,
  Settings,
  Activity,
  TrendingUp,
  AlertTriangle,
  Languages,
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
import { useTranslation } from "@/hooks/use-translation";
import { useMissingTranslationKeysCount } from "@/hooks/use-translations";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";

interface StatCard {
  labelKey: string;
  value: string;
  change: string;
  icon: React.ElementType;
  href: string;
}

const stats: StatCard[] = [
  {
    labelKey: "dashboard.total_users",
    value: "0",
    change: "+0%",
    icon: Users,
    href: "/admin/users",
  },
  {
    labelKey: "nav.roles",
    value: "0",
    change: "+0%",
    icon: Shield,
    href: "/admin/roles",
  },
  {
    labelKey: "nav.locations",
    value: "0",
    change: "+0%",
    icon: MapPin,
    href: "/admin/locations",
  },
  {
    labelKey: "nav.settings",
    value: "0",
    change: "+0%",
    icon: Settings,
    href: "/admin/settings",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: activityData, isLoading: activityLoading } = useActivityLogs({ limit: 5 });
  const { data: missingKeysCount } = useMissingTranslationKeysCount();

  const activities = activityData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('nav.dashboard')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('auth.welcome_back')}, {user?.full_name || "Admin"}
        </p>
      </div>

      {/* Missing Translation Keys Alert */}
      {missingKeysCount && missingKeysCount.unresolved > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    {missingKeysCount.unresolved} Missing Translation Keys
                  </CardTitle>
                  <CardDescription>
                    Auto-detected keys that need to be added to the translation system
                  </CardDescription>
                </div>
              </div>
              <Link href="/admin/settings/translations/missing">
                <Button size="sm">
                  <Languages className="mr-2 h-4 w-4" />
                  Review & Create
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.labelKey} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {t(stat.labelKey)}
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
          <CardTitle>{t('dashboard.quick_actions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href="/admin/users">
              <Button variant="outline" className="w-full">
                <Users className="mr-2 h-4 w-4" />
                {t('users.manage_users')}
              </Button>
            </Link>
            <Link href="/admin/roles">
              <Button variant="outline" className="w-full">
                <Shield className="mr-2 h-4 w-4" />
                {t('roles.manage_roles')}
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline" className="w-full">
                <Settings className="mr-2 h-4 w-4" />
                {t('nav.settings')}
              </Button>
            </Link>
            <Link href="/admin/activity-logs">
              <Button variant="outline" className="w-full">
                <Activity className="mr-2 h-4 w-4" />
                {t('activity.logs')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('activity.recent')}</CardTitle>
            <Link href="/admin/activity-logs">
              <Button variant="ghost" size="sm">
                {t('activity.view_all')}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : activities.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.user')}</TableHead>
                  <TableHead>{t('common.action')}</TableHead>
                  <TableHead>{t('common.description')}</TableHead>
                  <TableHead>{t('common.date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {log.user?.full_name}
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
                {t('activity.no_activity')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
