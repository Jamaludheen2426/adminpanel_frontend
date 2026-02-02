'use client';

import { usePermissions } from '@/hooks';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { Permission } from '@/types';
import { useTranslation } from '@/hooks/use-translation';

export default function PermissionsPage() {
  const { t } = useTranslation();
  const { data: permissionsData, isLoading } = usePermissions();

  const permissions = permissionsData?.data || [];

  const columns: ColumnDef<Permission>[] = [
    {
      accessorKey: 'name',
      header: t('permissions.name'),
    },
    {
      accessorKey: 'description',
      header: t('common.description'),
    },
    {
      accessorKey: 'is_active',
      header: t('common.status'),
      cell: ({ row }) => (row.original.is_active ? t('common.active') : t('common.inactive')),
    },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Link href={`/admin/permissions/${row.original.id}/edit`}>
            <Button size="sm" variant="ghost">
              <Edit size={16} />
            </Button>
          </Link>
          <Button size="sm" variant="ghost" className="text-red-600">
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('permissions.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('permissions.description')}</p>
        </div>
        <Link href="/admin/permissions/create">
          <Button>
            <Plus size={18} className="mr-2" />
            {t('permissions.add_permission')}
          </Button>
        </Link>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t('permissions.loading')}</p>
          </div>
        ) : permissions.length > 0 ? (
          <DataTable columns={columns} data={permissions} />
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{t('permissions.no_permissions')}</p>
            <Link href="/admin/permissions/create">
              <Button size="sm">{t('permissions.create_first')}</Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
