'use client';

import { usePermissions } from '@/hooks';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { Permission } from '@/types';

const columns: ColumnDef<Permission>[] = [
  {
    accessorKey: 'name',
    header: 'Permission Name',
  },
  {
    accessorKey: 'description',
    header: 'Description',
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => (row.original.is_active ? 'Active' : 'Inactive'),
  },
  {
    id: 'actions',
    header: 'Actions',
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

export default function PermissionsPage() {
  const { data: permissionsData, isLoading } = usePermissions();

  const permissions = permissionsData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Permissions</h1>
          <p className="text-gray-600 mt-1">Manage system permissions</p>
        </div>
        <Link href="/admin/permissions/create">
          <Button>
            <Plus size={18} className="mr-2" />
            Add Permission
          </Button>
        </Link>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading permissions...</p>
          </div>
        ) : permissions.length > 0 ? (
          <DataTable columns={columns} data={permissions} />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No permissions found</p>
            <Link href="/admin/permissions/create">
              <Button size="sm">Create First Permission</Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
