'use client';

import { useRouter, useParams } from 'next/navigation';
import { useRole, useUpdateRole } from '@/hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useEffect } from 'react';

const roleSchema = z.object({
  name: z.string().min(2, 'Role name required'),
  description: z.string().optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = Number(params.id);

  const { data: roleData, isLoading } = useRole(roleId);
  const updateRoleMutation = useUpdateRole();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (roleData) {
      reset({
        name: roleData.name || '',
        description: roleData.description || '',
      });
    }
  }, [roleData, reset]);

  const onSubmit = (data: RoleFormData) => {
    updateRoleMutation.mutate(
      {
        id: roleId,
        data,
      },
      {
        onSuccess: () => router.push('/admin/roles'),
      }
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Role</h1>
        <p className="text-gray-600 mt-1">Update role information</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Role Name</Label>
            <Input
              id="name"
              placeholder="Administrator"
              {...register('name')}
              className="mt-2"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Role description..."
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
            <Button type="submit" disabled={updateRoleMutation.isPending}>
              {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
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
