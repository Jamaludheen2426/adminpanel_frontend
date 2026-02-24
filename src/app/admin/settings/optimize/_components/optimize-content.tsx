'use client';

import { useState, useEffect } from 'react';
import { Save, Trash2, BarChart3, Image, Eye, ListFilter, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useSettingsByGroup, useBulkUpdateSettings } from '@/hooks/use-settings';
import { useClearOldLogs } from '@/hooks/use-activity-logs';
import { PermissionGuard } from '@/components/guards/permission-guard';
import { PageLoader } from '@/components/common/page-loader';
export function OptimizeContent() {
  const { data: optimizeSettings, isLoading: loadingOptimize } = useSettingsByGroup('optimize');
  const { data: paginationSettings, isLoading: loadingPagination } = useSettingsByGroup('pagination');
  const bulkUpdate = useBulkUpdateSettings();
  const clearLogs = useClearOldLogs();

  const [values, setValues] = useState({
    'optimize.image_compression': '0',
    'optimize.image_quality': '80',
    'optimize.lazy_loading': '1',
    'optimize.log_retention_days': '90',
    'items_per_page': '25',
  });

  const isLoading = loadingOptimize || loadingPagination;

  useEffect(() => {
    const map: Record<string, string> = {};
    optimizeSettings?.forEach(s => { map[s.key] = s.value || ''; });
    paginationSettings?.forEach(s => { map[s.key] = s.value || ''; });
    if (Object.keys(map).length > 0) {
      setValues(prev => ({ ...prev, ...map }));
    }
  }, [optimizeSettings, paginationSettings]);

  const handleSaveOptimize = () => {
    bulkUpdate.mutate({
      group: 'optimize',
      'optimize.image_compression': values['optimize.image_compression'],
      'optimize.image_quality': values['optimize.image_quality'],
      'optimize.lazy_loading': values['optimize.lazy_loading'],
      'optimize.log_retention_days': values['optimize.log_retention_days'],
    });
  };

  const handleSavePagination = () => {
    bulkUpdate.mutate({
      group: 'pagination',
      items_per_page: values['items_per_page'],
    });
  };

  const handleClearLogs = () => {
    clearLogs.mutate(parseInt(values['optimize.log_retention_days'] || '90'));
  };


  return (
    <PermissionGuard permission="settings.view">
      <>
      <PageLoader open={isLoading} />
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Optimize</h1>
          <p className="text-muted-foreground mt-1">
            Performance optimization settings for images, loading, and data
          </p>
        </div>

        {/* Image Optimization */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Image className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Image Optimization</CardTitle>
                <CardDescription>
                  Compress images on upload and enable lazy loading
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Compression Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Image Compression</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically compress JPEG, PNG, and WebP images on upload
                </p>
              </div>
              <Switch
                checked={values['optimize.image_compression'] === '1'}
                onCheckedChange={(v) =>
                  setValues(prev => ({ ...prev, 'optimize.image_compression': v ? '1' : '0' }))
                }
              />
            </div>

            {/* Quality Slider */}
            {values['optimize.image_compression'] === '1' && (
              <div className="space-y-3 pl-0">
                <div className="flex items-center justify-between">
                  <Label>Compression Quality</Label>
                  <span className="text-sm font-medium text-primary">
                    {values['optimize.image_quality']}%
                  </span>
                </div>
                <Slider
                  min={10}
                  max={100}
                  step={5}
                  value={[parseInt(values['optimize.image_quality'] || '80')]}
                  onValueChange={([v]) =>
                    setValues(prev => ({ ...prev, 'optimize.image_quality': String(v) }))
                  }
                  className="w-full max-w-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Lower = smaller file size, higher = better quality. Recommended: 75–85%
                </p>
              </div>
            )}

            {/* Lazy Loading Toggle */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="space-y-0.5">
                <Label className="text-base">Lazy Loading</Label>
                <p className="text-sm text-muted-foreground">
                  Defer off-screen image loading to improve initial page speed
                </p>
              </div>
              <Switch
                checked={values['optimize.lazy_loading'] === '1'}
                onCheckedChange={(v) =>
                  setValues(prev => ({ ...prev, 'optimize.lazy_loading': v ? '1' : '0' }))
                }
              />
            </div>

            <div className="pt-2">
              <Button onClick={handleSaveOptimize} disabled={bulkUpdate.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {bulkUpdate.isPending ? 'Saving...' : 'Save Image Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ListFilter className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Default Pagination</CardTitle>
                <CardDescription>
                  Number of records shown per page across all list views
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Label>Items Per Page</Label>
              <Select
                value={values['items_per_page']}
                onValueChange={(v) => setValues(prev => ({ ...prev, items_per_page: v }))}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSavePagination} disabled={bulkUpdate.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {bulkUpdate.isPending ? 'Saving...' : 'Save Pagination'}
            </Button>
          </CardContent>
        </Card>

        {/* Activity Log Cleanup */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Activity Log Cleanup</CardTitle>
                <CardDescription>
                  Automatically remove old activity log entries to keep the database lean
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Label>Retention Period</Label>
              <Select
                value={values['optimize.log_retention_days']}
                onValueChange={(v) =>
                  setValues(prev => ({ ...prev, 'optimize.log_retention_days': v }))
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Button
                variant="outline"
                onClick={() =>
                  bulkUpdate.mutate({
                    group: 'optimize',
                    'optimize.log_retention_days': values['optimize.log_retention_days'],
                  })
                }
                disabled={bulkUpdate.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Retention Setting
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={clearLogs.isPending}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {clearLogs.isPending
                      ? 'Clearing...'
                      : `Clear Logs Older Than ${values['optimize.log_retention_days']} Days`}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Old Activity Logs?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all activity logs older than{' '}
                      <strong>{values['optimize.log_retention_days']} days</strong>. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearLogs}>
                      Yes, Clear Logs
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
      </>
    </PermissionGuard>
  );
}
