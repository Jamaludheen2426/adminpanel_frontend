'use client';

import { useState } from 'react';
import { useApprovalRequest, useApproveRequest, useRejectRequest } from '@/hooks/use-approvals';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ApprovalBadge } from './approval-badge';
import { PageLoader } from '@/components/common/page-loader';
import { CheckCircle, XCircle, User, Calendar, FileText, Trash2, Mail, ArrowRight } from 'lucide-react';

interface ApprovalDetailDialogProps {
  approvalId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApprovalDetailDialog({
  approvalId,
  open,
  onOpenChange,
}: ApprovalDetailDialogProps) {
  const { data: approval, isLoading } = useApprovalRequest(approvalId || 0);
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    if (!approvalId) return;

    setIsSubmitting(true);
    try {
      await approveRequest.mutateAsync({ id: approvalId, review_notes: reviewNotes });
      onOpenChange(false);
      setReviewNotes('');
    } catch (error) {
      console.error('Error approving request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!approvalId) return;

    setIsSubmitting(true);
    try {
      await rejectRequest.mutateAsync({ id: approvalId, review_notes: reviewNotes });
      onOpenChange(false);
      setReviewNotes('');
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !approval) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approval Request Details</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isPending = approval.is_active === 2;

  return (
    <>
      <PageLoader open={isSubmitting} />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Approval Request Details</DialogTitle>
            <DialogDescription>
              Review and approve or reject this request
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status */}
            <div>
              <ApprovalBadge status={approval.is_active} />
            </div>

            {/* Request Info */}
            <div className="rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm">
                  {approval.requester?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-none">{approval.requester?.full_name ?? '—'}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{approval.requester?.email ?? '—'}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right space-y-0.5">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                    <Calendar className="h-3 w-3" />
                    <span>Requested On</span>
                  </div>
                  <p className="text-xs font-medium">
                    {new Date(approval.createdAt || approval.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Details */}
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center text-sm font-medium">
                <FileText className="mr-2 h-4 w-4" />
                Action Details
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <span className="text-muted-foreground">Module</span>
                <span className="font-medium capitalize">{approval.module_slug.replace(/_/g, ' ')}</span>
                <span className="text-muted-foreground">Permission</span>
                <span className="font-medium break-all">{approval.permission_slug}</span>
                <span className="text-muted-foreground">Action</span>
                <span className="font-medium capitalize">{approval.action}</span>
                <span className="text-muted-foreground">Resource</span>
                <span className="font-medium capitalize">{approval.resource_type}</span>
              </div>
            </div>

            {/* Old vs New Data comparison / Delete notice */}
            {(() => {
              const isDelete = approval.action?.toLowerCase() === 'delete';
              const isEmpty = !approval.request_data || Object.keys(approval.request_data as object).length === 0;

              // Skip internal/meta fields that aren't meaningful to show
              const skipFields = new Set(['id', 'company_id', 'created_at', 'updated_at', 'deleted_at', 'createdAt', 'updatedAt', 'deletedAt', 'password']);

              const formatFieldName = (key: string) =>
                key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

              const formatValue = (val: unknown): string => {
                if (val === null || val === undefined) return '—';
                if (typeof val === 'boolean') return val ? 'Yes' : 'No';
                if (typeof val === 'object') return JSON.stringify(val);
                return String(val);
              };

              if (isDelete || isEmpty) {
                return (
                  <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 flex items-start gap-3">
                    <Trash2 className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400">Delete Request</p>
                      <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
                        This action will <span className="font-semibold">permanently delete</span> the selected record from{' '}
                        <span className="font-semibold capitalize">{approval.module_slug.replace(/_/g, ' ')}</span>.
                        This cannot be undone once approved.
                      </p>
                      {approval.old_data ? (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Record to be deleted:</p>
                          {Object.entries(approval.old_data as Record<string, unknown>)
                            .filter(([key]) => !skipFields.has(key))
                            .map(([key, val]) => (
                              <div key={key} className="flex items-baseline gap-2 text-xs">
                                <span className="text-muted-foreground shrink-0 min-w-[100px]">{formatFieldName(key)}:</span>
                                <span className="font-medium break-all">{formatValue(val)}</span>
                              </div>
                            ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              }

              // Edit: show field-by-field diff
              if (approval.old_data) {
                const oldData = approval.old_data as Record<string, unknown>;
                const newData = (approval.request_data || {}) as Record<string, unknown>;

                // Get only fields that actually changed
                const changedFields = Object.keys(newData).filter((key) => {
                  if (skipFields.has(key)) return false;
                  const oldVal = formatValue(oldData[key]);
                  const newVal = formatValue(newData[key]);
                  return oldVal !== newVal;
                });

                if (changedFields.length === 0) {
                  return (
                    <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                      No field changes detected in this request.
                    </div>
                  );
                }

                return (
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="text-sm font-medium">Changes Requested</div>
                    <div className="space-y-2">
                      {changedFields.map((key) => (
                        <div key={key} className="rounded-md bg-muted/50 p-2.5 space-y-1">
                          <div className="text-xs font-semibold text-muted-foreground">{formatFieldName(key)}</div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 px-2 py-0.5 rounded break-all max-w-[45%]">
                              {formatValue(oldData[key])}
                            </span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded break-all max-w-[45%]">
                              {formatValue(newData[key])}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // Create: show submitted data as field list
              return (
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="text-sm font-medium">Request Data</div>
                  <div className="space-y-1">
                    {Object.entries(approval.request_data as Record<string, unknown>)
                      .filter(([key]) => !skipFields.has(key))
                      .map(([key, val]) => (
                        <div key={key} className="flex items-baseline gap-2 text-xs">
                          <span className="text-muted-foreground shrink-0 min-w-[100px]">{formatFieldName(key)}:</span>
                          <span className="font-medium break-all">{formatValue(val)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })()}

            {/* Review Notes (if reviewed) */}
            {!isPending && approval.review_notes && (
              <div className="rounded-lg border p-4 space-y-2">
                <div className="text-sm font-medium">Review Notes</div>
                <p className="text-sm text-muted-foreground">{approval.review_notes}</p>
                {approval.approver && (
                  <p className="text-xs text-muted-foreground">
                    Reviewed by {approval.approver.full_name} on{' '}
                    {new Date(approval.reviewedAt || approval.reviewed_at!).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {/* Review Notes Input (if pending) */}
            {isPending && (
              <div className="space-y-2">
                <Label htmlFor="review-notes">Review Notes (Optional)</Label>
                <Textarea
                  id="review-notes"
                  placeholder="Add notes about your decision..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            {isPending ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isSubmitting}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  type="button"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Approving...' : 'Approve'}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
