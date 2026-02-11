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
import { CheckCircle, XCircle, User, Calendar, FileText } from 'lucide-react';

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
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isPending = approval.status === 'pending';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Approval Request Details</DialogTitle>
          <DialogDescription>
            Review and approve or reject this request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div>
            <ApprovalBadge status={approval.status} />
          </div>

          {/* Request Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="mr-2 h-4 w-4" />
                Requester
              </div>
              <p className="text-sm font-medium">{approval.requester?.full_name}</p>
              <p className="text-xs text-muted-foreground">{approval.requester?.email}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-2 h-4 w-4" />
                Requested On
              </div>
              <p className="text-sm font-medium">
                {new Date(approval.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Action Details */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center text-sm font-medium">
              <FileText className="mr-2 h-4 w-4" />
              Action Details
            </div>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Module:</span>
                <span className="font-medium capitalize">{approval.module_slug.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Permission:</span>
                <span className="font-medium">{approval.permission_slug}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Action:</span>
                <span className="font-medium capitalize">{approval.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resource:</span>
                <span className="font-medium capitalize">{approval.resource_type}</span>
              </div>
            </div>
          </div>

          {/* Request Data */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="text-sm font-medium">Request Data</div>
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
              {JSON.stringify(approval.request_data, null, 2)}
            </pre>
          </div>

          {/* Review Notes (if reviewed) */}
          {!isPending && approval.review_notes && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="text-sm font-medium">Review Notes</div>
              <p className="text-sm text-muted-foreground">{approval.review_notes}</p>
              {approval.approver && (
                <p className="text-xs text-muted-foreground">
                  Reviewed by {approval.approver.full_name} on{' '}
                  {new Date(approval.reviewed_at!).toLocaleString()}
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
  );
}
