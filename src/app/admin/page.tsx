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
  Building2,
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
import { useAuth, usePermissionCheck } from "@/hooks";
import { useActivityLogs } from "@/hooks/use-activity-logs";
import { useTranslation } from "@/hooks/use-translation";
import { useMissingTranslationKeysCount } from "@/hooks/use-translations";
import { useDeveloperDashboard } from "@/hooks/use-companies";
import { useCompany } from "@/contexts/company-context";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";

interface StatCard {
  labelKey: string;
  value: string;
  change: string;
  icon: React.ElementType;
  href: string;
  permission?: string;
}

const defaultStats: StatCard[] = [
  {
    labelKey: "dashboard.total_users",
    value: "0",
    change: "+0%",
    icon: Users,
    href: "/admin/platform/users",
    permission: "users.view",
  },
  {
    labelKey: "nav.roles",
    value: "0",
    change: "+0%",
    icon: Shield,
    href: "/admin/platform/roles",
    permission: "roles.view",
  },
  {
    labelKey: "nav.locations",
    value: "0",
    change: "+0%",
    icon: MapPin,
    href: "/admin/locations",
    permission: "locations.view",
  },
  {
    labelKey: "nav.settings",
    value: "0",
    change: "+0%",
    icon: Settings,
    href: "/admin/settings",
    permission: "settings.view",
  },
];

// Developer Dashboard Component
function DeveloperDashboard() {
  const { t } = useTranslation();
  const { data: dashboardData, isLoading } = useDeveloperDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const stats = dashboardData?.stats;
  const companies = dashboardData?.companies || [];

  return (
    <div className="space-y-6">
      {/* Developer Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Companies
                </p>
                <p className="text-3xl font-bold mt-2">{stats?.total_companies || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Companies
                </p>
                <p className="text-3xl font-bold mt-2">{stats?.active_companies || 0}</p>
              </div>
              <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Suspended
                </p>
                <p className="text-3xl font-bold mt-2">{stats?.suspended_companies || 0}</p>
              </div>
              <div className="h-2 w-2 rounded-full bg-red-500 mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Users
                </p>
                <p className="text-3xl font-bold mt-2">{stats?.total_users || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Users
                </p>
                <p className="text-3xl font-bold mt-2">{stats?.active_users || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Companies List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Companies</CardTitle>
            <Link href="/admin/companies">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Active Users</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.length > 0 ? (
                companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {company.logo ? (
                          <img
                            src={company.logo}
                            alt={company.name}
                            className="h-8 w-8 rounded object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div>
                          <div>{company.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {company.slug}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={company.status === 'active' ? 'default' : 'secondary'}
                      >
                        {company.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{company.user_count || 0}</TableCell>
                    <TableCell>{company.active_user_count || 0}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {company.created_at ? format(new Date(company.created_at), "MMM dd, yyyy") : "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No companies found
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Company Dashboard Component
function CompanyDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { hasPermission } = usePermissionCheck();
  const { data: activityData, isLoading: activityLoading } = useActivityLogs({ limit: 5 });
  const { data: missingKeysCount } = useMissingTranslationKeysCount();

  const activities = activityData?.data || [];

  // Filter stats based on permissions
  const visibleStats = defaultStats.filter(stat => hasPermission(stat.permission));

  // Define quick actions with permissions
  const quickActions = [
    { href: "/admin/platform/users", icon: Users, labelKey: "users.manage_users", permission: "users.view" },
    { href: "/admin/platform/roles", icon: Shield, labelKey: "roles.manage_roles", permission: "roles.view" },
    { href: "/admin/settings", icon: Settings, labelKey: "nav.settings", permission: "settings.view" },
    { href: "/admin/activity-logs", icon: Activity, labelKey: "activity.logs", permission: "activity_logs.view" },
  ];

  // Filter quick actions based on permissions
  const visibleActions = quickActions.filter(action => hasPermission(action.permission));

  return (
    <div className="space-y-6">
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
        {visibleStats.map((stat) => {
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
            {visibleActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.labelKey} href={action.href}>
                  <Button variant="outline" className="w-full">
                    <Icon className="mr-2 h-4 w-4" />
                    {t(action.labelKey)}
                  </Button>
                </Link>
              );
            })}
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

// Main Dashboard Page
export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isDeveloper } = useCompany();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('nav.dashboard')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('auth.welcome_back')}, {user?.full_name || "Admin"}
        </p>
      </div>

      {/* Conditional Dashboard */}
      {isDeveloper ? <DeveloperDashboard /> : <CompanyDashboard />}
    </div>
  );
}