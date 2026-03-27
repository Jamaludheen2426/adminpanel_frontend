'use client';

import { useState } from 'react';
import { useApprovals } from '@/hooks/use-approvals';
import type { ApprovalRequest } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApprovalBadge } from '@/components/admin/approvals/approval-badge';
import { ApprovalDetailDialog } from '@/components/admin/approvals/approval-detail-dialog';
import { Search, Eye } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { PermissionGuard } from '@/components/guards/permission-guard';
import { PageLoader } from '@/components/common/page-loader';
import { CommonTable, type CommonColumn } from '@/components/common/common-table';
import { TablePagination } from '@/components/common/table-pagination';

export function ApprovalsContent() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const filters = {
    is_active:
      statusFilter !== 'all'
        ? statusFilter === 'pending'
          ? 2
          : statusFilter === 'approved'
            ? 1
            : 0
        : undefined,
    module_slug: moduleFilter !== 'all' ? moduleFilter : undefined,
    page: currentPage,
    limit,
  };

  const { data, isLoading } = useApprovals(filters);

  const handleViewDetails = (id: number) => {
    setSelectedId(id);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedId(null);
  };

  type NormalizedApprovalRequest = Omit<ApprovalRequest, 'is_active'> & { is_active: boolean; approval_status: number };
  const normalise = (item: ApprovalRequest): NormalizedApprovalRequest => ({
    ...item,
    created_at: item.created_at || item.createdAt || '',
    approval_status: item.is_active, // preserve 0=rejected,1=approved,2=pending for badge
    is_active: item.is_active === 1,
  });

  const columns: CommonColumn<NormalizedApprovalRequest>[] = [
    {
      key: 'requester',
      header: 'Requester',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-xs">
            {row.requester?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-foreground truncate">
              {row.requester?.full_name || `User #${row.requester_id}`}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {row.requester?.email || '—'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'module_slug',
      header: 'Module',
      render: (row) => (
        <span className="capitalize text-muted-foreground">
          {row.module_slug.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => <span className="capitalize text-muted-foreground">{row.action}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <ApprovalBadge status={row.approval_status} />,
    },
  ];

  return (
    <PermissionGuard minLevel={100}>
      <div className="space-y-6">

        {/* Page Loader */}
        <PageLoader open={isLoading} />

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Approval Requests</h1>
          <p className="text-muted-foreground">
            Review and manage approval requests from your team
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter approval requests by status and module</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Module</label>
                <Select value={moduleFilter} onValueChange={setModuleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All modules" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modules</SelectItem>
                    <SelectItem value="users">Users</SelectItem>
                    <SelectItem value="roles">Roles</SelectItem>
                    <SelectItem value="email_campaigns">Email Campaigns</SelectItem>
                    <SelectItem value="email_templates">Email Templates</SelectItem>
                    <SelectItem value="settings">Settings</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by requester..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approval Requests</CardTitle>
            <CardDescription>
              {data?.pagination.totalItems || 0} total requests
            </CardDescription>
          </CardHeader>

          <CardContent>

            {!isLoading && (
              <CommonTable<NormalizedApprovalRequest>
                columns={columns}
                data={(data?.data || []).map(normalise)}
                isLoading={isLoading}
                emptyMessage="No approval requests found"
                showStatus={false}
                showCreated={true}
                showActions={true}
                onEdit={(row) => handleViewDetails(row.id)}
              />
            )}

            {data?.pagination && (
              <TablePagination
                pagination={{ ...data.pagination, limit }}
                onPageChange={setCurrentPage}
                onLimitChange={(newLimit) => { setLimit(newLimit); setCurrentPage(1); }}
              />
            )}
          </CardContent>
        </Card>

        <ApprovalDetailDialog
          approvalId={selectedId}
          open={dialogOpen}
          onOpenChange={handleDialogClose}
        />
      </div>
    </PermissionGuard>
  );
}