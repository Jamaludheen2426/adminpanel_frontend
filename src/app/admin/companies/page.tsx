'use client';

import { useState } from 'react';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useCompanies, useDeleteCompany, useUpdateCompanyStatus } from '@/hooks/use-companies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

export default function CompaniesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useCompanies({
    page,
    limit: 10,
    search: debouncedSearch,
  });

  const deleteCompany = useDeleteCompany();
  const updateStatus = useUpdateCompanyStatus();

  const handleDelete = async () => {
    if (deleteId) {
      await deleteCompany.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleStatusToggle = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await updateStatus.mutateAsync({ id, status: newStatus as 'active' | 'suspended' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'suspended':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const companies = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination?.totalItems || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies.filter(c => c.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <div className="h-2 w-2 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies.filter(c => c.status === 'suspended').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <div className="h-2 w-2 rounded-full bg-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies.filter(c => c.status === 'inactive').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
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
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Max Users</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading companies...
                    </TableCell>
                  </TableRow>
                ) : companies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No companies found
                    </TableCell>
                  </TableRow>
                ) : (
                  companies.map((company: Company & { user_count?: number }) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {company.logo ? (
                            <img
                              src={company.logo}
                              alt={company.name}
                              className="h-8 w-8 rounded object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div>
                            <div>{company.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {company.slug}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{company.email || '—'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={company.status === 'active' ? 'default' : 'secondary'}
                          className={getStatusColor(company.status)}
                        >
                          {company.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{company.user_count || 0}</TableCell>
                      <TableCell>{company.max_users || '∞'}</TableCell>
                      <TableCell>
                        {new Date(company.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setEditId(company.id)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusToggle(company.id, company.status)}
                            >
                              {company.status === 'active' ? 'Suspend' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => setDeleteId(company.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={!pagination.hasPrevPage}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the company
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Company Dialog */}
      <EditCompanyDialog
        companyId={editId}
        open={!!editId}
        onOpenChange={(open) => !open && setEditId(null)}
      />
    </div>
  );
}