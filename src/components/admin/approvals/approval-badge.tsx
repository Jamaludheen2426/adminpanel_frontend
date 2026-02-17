import { cn } from '@/lib/utils';
import { Check, X, Clock } from 'lucide-react';

interface ApprovalBadgeProps {
  status?: number; // 0=rejected, 1=approved, 2=pending
  className?: string;
}

export function ApprovalBadge({ status = 2, className }: ApprovalBadgeProps) {
  const config: Record<number, { trackBg: string; thumbBg: string; thumbPosition: string; label: string; labelColor: string; icon: typeof Clock }> = {
    2: {
      trackBg: 'bg-yellow-100 dark:bg-yellow-900/40',
      thumbBg: 'bg-yellow-400',
      thumbPosition: 'translate-x-[50%] left-1/2 -ml-2.5',
      label: 'Pending',
      labelColor: 'text-yellow-600 dark:text-yellow-300',
      icon: Clock,
    },
    1: {
      trackBg: 'bg-green-100 dark:bg-green-900/40',
      thumbBg: 'bg-green-400',
      thumbPosition: 'translate-x-0 right-0.5',
      label: 'Approved',
      labelColor: 'text-green-600 dark:text-green-300',
      icon: Check,
    },
    0: {
      trackBg: 'bg-red-100 dark:bg-red-900/40',
      thumbBg: 'bg-red-400',
      thumbPosition: 'translate-x-0 left-0.5',
      label: 'Rejected',
      labelColor: 'text-red-600 dark:text-red-300',
      icon: X,
    },
  };

  const { trackBg, thumbBg, thumbPosition, label, labelColor, icon: Icon } = config[status] ?? config[2];

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <div
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors',
          trackBg
        )}
      >
        <span
          className={cn(
            'absolute flex h-5 w-5 items-center justify-center rounded-full shadow-lg transition-transform',
            thumbBg,
            thumbPosition
          )}
        >
          <Icon className="h-3 w-3 text-white" />
        </span>
      </div>
      <span className={cn('text-xs font-semibold', labelColor)}>{label}</span>
    </div>
  );
}
