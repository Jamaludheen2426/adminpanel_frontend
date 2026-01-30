'use client';

import { useRouter } from 'next/navigation';
import { useCreatePermission } from '@/hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

const permissionSchema = z.object({
  name: z.string().min(2, 'Permission name required'),
  module: z.string().min(2, 'Module is required'),
  description: z.string().optional(),
});

type PermissionFormData = z.infer<typeof permissionSchema>;

export default function CreatePermissionPage() {
  const router = useRouter();
  const createPermissionMutation = useCreatePermission();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PermissionFormData>({
    resolver: zodResolver(permissionSchema),
  });

  const onSubmit = (data: PermissionFormData) => {
    createPermissionMutation.mutate(data, {
      onSuccess: () => router.push('/admin/permissions'),
    });
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Permission</h1>
        <p className="text-gray-600 mt-1">Create a new system permission</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Permission Name</Label>
            <Input
              id="name"
              placeholder="Create Users"
              {...register('name')}
              className="mt-2"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="module">Module</Label>
            <Input
              id="module"
              placeholder="users"
              {...register('module')}
              className="mt-2"
            />
            {errors.module && (
              <p className="text-red-500 text-sm mt-1">{errors.module.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">e.g., users, roles, settings</p>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Permission description..."
              {...register('description')}
              className="mt-2"
              rows={4}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={createPermissionMutation.isPending}>
              {createPermissionMutation.isPending ? 'Creating...' : 'Create Permission'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
