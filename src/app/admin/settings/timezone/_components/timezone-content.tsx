'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth, useUpdateProfile } from '@/hooks';
import { useCompany, useUpdateCompany } from '@/hooks/use-companies';
import { useTimezones } from '@/hooks/use-timezones';
import { PermissionGuard } from '@/components/guards/permission-guard';
import { Globe, User } from 'lucide-react';

export function TimezoneContent() {
  const { user } = useAuth();
  const { data: timezones = [] } = useTimezones();

  const companyId = user?.company_id ?? 0;
  const { data: company } = useCompany(companyId);
  const updateCompany = useUpdateCompany();
  const updateProfile = useUpdateProfile();

  // Company timezone form
  const companyForm = useForm<{ timezone: string }>({
    defaultValues: { timezone: 'UTC' },
  });

  // User timezone form
  const userForm = useForm<{ timezone: string }>({
    defaultValues: { timezone: '' },
  });

  useEffect(() => {
    if (company?.timezone) {
      companyForm.reset({ timezone: company.timezone });
    }
  }, [company, companyForm]);

  useEffect(() => {
    if (user?.timezone) {
      userForm.reset({ timezone: user.timezone });
    }
  }, [user, userForm]);

  const onCompanySubmit = (data: { timezone: string }) => {
    if (!companyId) return;
    updateCompany.mutate({ id: companyId, data: { timezone: data.timezone } });
  };

  const onUserSubmit = (data: { timezone: string }) => {
    updateProfile.mutate({ timezone: data.timezone });
  };

  return (
    <PermissionGuard permission="settings.view">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Timezone Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure timezone for your company and personal preference
          </p>
        </div>

        {/* Company Timezone */}
        {companyId > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Company Timezone</CardTitle>
              </div>
              <CardDescription>
                Default timezone used for all date/time display in this company
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...companyForm}>
                <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-4">
                  <FormField
                    control={companyForm.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem className="max-w-sm">
                        <FormLabel>Company Timezone</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timezones.map((tz) => (
                              <SelectItem key={tz.value} value={tz.value}>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          All users in this company will use this timezone by default
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={updateCompany.isPending}>
                    {updateCompany.isPending ? 'Saving...' : 'Save Company Timezone'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Personal Timezone */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle>My Timezone</CardTitle>
            </div>
            <CardDescription>
              Override the company timezone with your personal preference
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...userForm}>
              <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
                <FormField
                  control={userForm.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem className="max-w-sm">
                      <FormLabel>Personal Timezone</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Use company default" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timezones.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Leave as company default unless you work in a different timezone
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? 'Saving...' : 'Save My Timezone'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
