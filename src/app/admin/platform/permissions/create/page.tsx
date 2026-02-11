'use client';

import { useRouter } from 'next/navigation';
import { useCreatePermission } from '@/hooks';
import { useModules } from '@/hooks/use-modules';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/hooks/use-translation';

const STANDARD_ACTIONS = [
  { value: 'view', label: 'View', description: 'Can view and list records' },
  { value: 'create', label: 'Create', description: 'Can create new records' },
  { value: 'edit', label: 'Edit', description: 'Can edit and update records' },
  { value: 'delete', label: 'Delete', description: 'Can delete records' },
  { value: 'manage', label: 'Manage', description: 'Full control including special operations' },
];

const permissionSchema = z.object({
  module: z.string().min(1, 'Module is required'),
  action: z.string().min(1, 'Action is required'),
  description: z.string().optional(),
});

type PermissionFormData = z.infer<typeof permissionSchema>;

export default function CreatePermissionPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const createPermissionMutation = useCreatePermission();
  const { data: modulesData, isLoading: modulesLoading } = useModules({ limit: 50 });

  const {
    control,
    handleSubmit,
    watch,
    register,
    formState: { errors },
  } = useForm<PermissionFormData>({
    resolver: zodResolver(permissionSchema),
  });

  const selectedModule = watch('module');
  const selectedAction = watch('action');

  // Find module name for display
  const moduleObj = modulesData?.data?.find(m => m.slug === selectedModule);
  const actionObj = STANDARD_ACTIONS.find(a => a.value === selectedAction);

  // Auto-generated slug preview
  const previewSlug = selectedModule && selectedAction ? `${selectedModule}.${selectedAction}` : '';
  const previewName = moduleObj && actionObj ? `${moduleObj.name} ${actionObj.label}` : '';

  const onSubmit = (data: PermissionFormData) => {
    createPermissionMutation.mutate(
      {
        name: `${modulesData?.data?.find(m => m.slug === data.module)?.name || data.module} ${STANDARD_ACTIONS.find(a => a.value === data.action)?.label || data.action}`,
        slug: `${data.module}.${data.action}`,
        module: data.module,
        description: data.description || actionObj?.description || '',
      },
      {
        onSuccess: () => router.push('/admin/platform/permissions'),
      },
    );
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('permissions.create_permission', 'Create Permission')}</h1>
        <p className="text-gray-600 mt-1">{t('permissions.create_permission_desc', 'Create a new system permission')}</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>{t('permissions.module', 'Module')}</Label>
            <Controller
              name="module"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a module..." />
                  </SelectTrigger>
                  <SelectContent>
                    {modulesLoading ? (
                      <SelectItem value="_loading" disabled>Loading modules...</SelectItem>
                    ) : (
                      modulesData?.data?.map((mod) => (
                        <SelectItem key={mod.id} value={mod.slug}>
                          {mod.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.module && (
              <p className="text-red-500 text-sm mt-1">{errors.module.message}</p>
            )}
          </div>

          <div>
            <Label>{t('permissions.action', 'Action')}</Label>
            <Controller
              name="action"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select an action..." />
                  </SelectTrigger>
                  <SelectContent>
                    {STANDARD_ACTIONS.map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        {action.label} — {action.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.action && (
              <p className="text-red-500 text-sm mt-1">{errors.action.message}</p>
            )}
          </div>

          {previewSlug && (
            <div className="rounded-lg border p-3 bg-muted/50 space-y-1">
              <p className="text-sm">
                <span className="text-muted-foreground">Name:</span>{' '}
                <span className="font-medium">{previewName}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Slug:</span>{' '}
                <code className="bg-muted px-1 rounded">{previewSlug}</code>
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="description">{t('common.description', 'Description')}</Label>
            <Textarea
              id="description"
              placeholder={actionObj?.description || 'Permission description...'}
              {...register('description')}
              className="mt-2"
              rows={3}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={createPermissionMutation.isPending}>
              {createPermissionMutation.isPending ? t('common.creating', 'Creating...') : t('permissions.create_permission', 'Create Permission')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
