'use client';

import { useRouter, useParams } from 'next/navigation';
import { usePermission, useUpdatePermission } from '@/hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useEffect } from 'react';
import { useTranslation } from '@/hooks/use-translation';

const permissionSchema = z.object({
  name: z.string().min(2, 'Permission name required'),
  description: z.string().optional(),
});

type PermissionFormData = z.infer<typeof permissionSchema>;

export default function EditPermissionPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const permissionId = Number(params.id);

  const { data: permissionData, isLoading } = usePermission(permissionId);
  const updatePermissionMutation = useUpdatePermission();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PermissionFormData>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (permissionData) {
      reset({
        name: permissionData.name || '',
        description: permissionData.description || '',
      });
    }
  }, [permissionData, reset]);

  const onSubmit = (data: PermissionFormData) => {
    updatePermissionMutation.mutate(
      {
        id: permissionId,
        data,
      },
      {
        onSuccess: () => router.push('/admin/permissions'),
      }
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">{t('common.loading', 'Loading...')}</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('permissions.edit_permission', 'Edit Permission')}</h1>
        <p className="text-gray-600 mt-1">{t('permissions.edit_permission_desc', 'Update permission information')}</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">{t('permissions.permission_name', 'Permission Name')}</Label>
            <Input
              id="name"
              placeholder={t('permissions.permission_name_placeholder', 'users.create')}
              {...register('name')}
              className="mt-2"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">{t('common.description', 'Description')}</Label>
            <Textarea
              id="description"
              placeholder={t('permissions.description_placeholder', 'Permission description...')}
              {...register('description')}
              className="mt-2"
              rows={4}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={updatePermissionMutation.isPending}>
              {updatePermissionMutation.isPending ? t('common.updating', 'Updating...') : t('permissions.update_permission', 'Update Permission')}
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
