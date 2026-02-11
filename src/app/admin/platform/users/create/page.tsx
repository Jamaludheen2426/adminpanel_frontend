'use client';

import { useRouter } from 'next/navigation';
import { useCreateUser, useRoles } from '@/hooks';
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
import { useTranslation } from '@/hooks/use-translation';

const userSchema = z.object({
  full_name: z.string().min(2, 'Full name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role_id: z.string().min(1, 'Role is required'),
});

type UserFormData = z.infer<typeof userSchema>;

interface CreateUserPayload extends Omit<UserFormData, 'role_id'> {
  role_id: number;
}

export default function CreateUserPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: rolesData } = useRoles({ page: 1, limit: 100 });
  const createUserMutation = useCreateUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role_id: '',
    },
  });

  const onSubmit = (data: UserFormData) => {
    const payload: CreateUserPayload = {
      full_name: data.full_name,
      email: data.email,
      password: data.password,
      role_id: parseInt(data.role_id, 10),
    };
    createUserMutation.mutate(payload, {
      onSuccess: () => router.push('/admin/platform/users'),
    });
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t('users.create_user', 'Create User')}</h1>
        <p className="text-gray-600 mt-1">{t('users.create_user_desc', 'Add a new user to the system')}</p>
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
            <Label htmlFor="password">{t('common.password', 'Password')}</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className="mt-2"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="role_id">{t('common.role', 'Role')}</Label>
            <Select
              onValueChange={(value) => setValue('role_id', value)}
              defaultValue=""
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

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? t('common.creating', 'Creating...') : t('users.create_user', 'Create User')}
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
