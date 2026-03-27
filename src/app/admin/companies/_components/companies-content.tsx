'use client';

import { useState } from 'react';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useCompanies, useDeleteCompany, useUpdateCompanyStatus } from '@/hooks/use-companies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CommonTable, type CommonColumn } from '@/components/common/common-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteDialog } from '@/components/common/delete-dialog';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Company } from '@/types';
import { useDebounce } from '@/hooks/use-debounce';
import { EditCompanyDialog } from '@/components/admin/companies/edit-company-dialog';
import { PermissionGuard } from '@/components/guards/permission-guard';
import { PageLoader } from '@/components/common/page-loader';
import { TablePagination } from '@/components/common/table-pagination';
import { cn } from '@/lib/utils';

export function CompaniesContent() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isFetching } = useCompanies({
    page,
    limit,
    search: debouncedSearch,
  });

  const deleteCompany = useDeleteCompany();
  const updateStatus = useUpdateCompanyStatus();

  const handleDelete = () => {
    if (deleteId) {
      deleteCompany.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
        onError: () => setDeleteId(null),
      });
    }
  };

  const handleStatusToggle = async (id: number, currentIsActive: number) => {
    const newIsActive = currentIsActive === 1 ? 0 : 1;
    await updateStatus.mutateAsync({ id, is_active: newIsActive });
  };

  const getStatusColor = (is_active: number) => {
    switch (is_active) {
      case 1: return 'bg-green-500';
      case 0: return 'bg-red-500';
      case 2: return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (is_active: number) => {
    switch (is_active) {
      case 1: return 'Active';
      case 0: return 'Suspended';
      case 2: return 'Pending';
      default: return 'Unknown';
    }
  };

  const companies = data?.data || [];
  const pagination = data?.pagination;

  const columns: CommonColumn<Company & { user_count?: number }>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.logo ? (
            <img
              src={row.logo}
              alt={row.name}
              className="h-8 w-8 rounded object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
              {row.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-semibold text-foreground">{row.name}</div>
            <div className="text-xs text-muted-foreground">{row.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => <span className="text-muted-foreground">{row.email || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge
          variant={row.is_active === 1 ? 'default' : 'secondary'}
          className={cn('text-[10px] px-2 py-0 h-5 font-bold', getStatusColor(row.is_active))}
        >
          {getStatusLabel(row.is_active)}
        </Badge>
      ),
    },
    {
      key: 'user_count',
      header: 'Users',
      render: (row) => <span className="font-medium text-muted-foreground">{row.user_count || 0}</span>,
    },
    {
      key: 'max_users',
      header: 'Max Users',
      render: (row) => <span className="font-medium text-muted-foreground">{row.max_users || '∞'}</span>,
    },
  ];

  return (
    <PermissionGuard developerOnly>
      <div className="space-y-6">

        {/* Page Loader */}
        <PageLoader open={isLoading || isFetching || deleteCompany.isPending || updateStatus.isPending} />

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Companies</h1>
            <p className="text-muted-foreground">
              Manage all companies in the system
            </p>
          </div>
          <Link href="/admin/companies/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Company
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pagination?.totalItems || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <div className="h-2 w-2 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {companies.filter(c => c.is_active === 1).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              <div className="h-2 w-2 rounded-full bg-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {companies.filter(c => c.is_active === 0).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <div className="h-2 w-2 rounded-full bg-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {companies.filter(c => c.is_active === 2).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Companies</CardTitle>
            <CardDescription>
              Search and manage companies
            </CardDescription>
          </CardHeader>
          <CardContent>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 rounded-xl bg-muted/20 border-border/40 focus:bg-background transition-all"
                />
              </div>
            </div>

            <CommonTable
              columns={columns}
              data={companies as any}
              isLoading={isLoading}
              emptyMessage="No companies found."
              showStatus={false}
              showCreated={true}
              showActions={true}
              onEdit={(row) => setEditId(row.id)}
              onDelete={(row) => setDeleteId(row.id)}
              disableEdit={(row) => Number(row.is_active) === 2}
              disableDelete={(row) => Number(row.is_active) === 2}
            />

            {pagination && (
              <TablePagination
                pagination={{ ...pagination, limit }}
                onPageChange={setPage}
                onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
              />
            )}
          </CardContent>
        </Card>

        <DeleteDialog
          open={deleteId !== null}
          onOpenChange={(open: boolean) => { if (!open) setDeleteId(null); }}
          onConfirm={handleDelete}
          isDeleting={deleteCompany.isPending}
          title="Delete Company"
          description="This action cannot be undone. This will permanently delete the company and all associated data."
        />

        <EditCompanyDialog
          companyId={editId}
          open={!!editId}
          onOpenChange={(open) => !open && setEditId(null)}
        />
      </div>
    </PermissionGuard>
  );
}