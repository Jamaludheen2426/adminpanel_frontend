'use client';

import { useRouter, useParams } from 'next/navigation';
import { useUser, useUpdateUser, useRoles } from '@/hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useEffect } from 'react';
import { useTranslation } from '@/hooks/use-translation';

const userSchema = z.object({
  full_name: z.string().min(2, 'Full name required'),
  email: z.string().email('Invalid email'),
  role_id: z.string().min(1, 'Role is required'),
  is_active: z.boolean(),
});

type UserFormData = z.infer<typeof userSchema>;

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const userId = Number(params.id);

  const { data: userData, isLoading } = useUser(userId);
  const { data: rolesData } = useRoles({ page: 1, limit: 100 });
  const updateUserMutation = useUpdateUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      full_name: '',
      email: '',
      role_id: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (userData) {
      reset({
        full_name: userData.full_name || '',
        email: userData.email || '',
        role_id: userData.role_id?.toString() || '',
        is_active: userData.is_active ?? true,
      });
    }
  }, [userData, reset]);

  const isActive = watch('is_active');

  const onSubmit = (data: UserFormData) => {
    updateUserMutation.mutate(
      {
        id: userId,
        data: {
          full_name: data.full_name,
          email: data.email,
          role_id: parseInt(data.role_id, 10),
          is_active: data.is_active,
        },
      },
      {
        onSuccess: () => router.push('/admin/users'),
      }
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">{t('common.loading', 'Loading...')}</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('users.edit_user', 'Edit User')}</h1>
        <p className="text-gray-600 mt-1">{t('users.edit_user_desc', 'Update user information')}</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="full_name">{t('users.full_name', 'Full Name')}</Label>
            <Input
              id="full_name"
              placeholder={t('users.full_name_placeholder', 'John Doe')}
              {...register('full_name')}
              className="mt-2"
            />
            {errors.full_name && (
              <p className="text-red-500 text-sm mt-1">
                {errors.full_name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="email">{t('common.email', 'Email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('users.email_placeholder', 'john@example.com')}
              {...register('email')}
              className="mt-2"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="role_id">{t('common.role', 'Role')}</Label>
            <Select
              value={watch('role_id')}
              onValueChange={(value) => setValue('role_id', value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder={t('users.select_role', 'Select a role')} />
              </SelectTrigger>
              <SelectContent>
                {rolesData?.data?.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role_id && (
              <p className="text-red-500 text-sm mt-1">
                {errors.role_id.message}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
            <Label htmlFor="is_active">{t('common.active', 'Active')}</Label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? t('common.updating', 'Updating...') : t('users.update_user', 'Update User')}
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
