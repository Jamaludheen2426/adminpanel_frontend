import { cn } from '@/lib/utils';
import { Check, X, Clock } from 'lucide-react';

interface ApprovalStatusSwitchProps {
  status: 'pending' | 'approved' | 'rejected';
  className?: string;
  showLabel?: boolean;
}

export function ApprovalStatusSwitch({ 
  status, 
  className,
  showLabel = true 
}: ApprovalStatusSwitchProps) {
  const statusConfig = {
    pending: {
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      borderColor: 'border-yellow-300 dark:border-yellow-700',
      icon: Clock,
      label: 'Pending',
    },
    approved: {
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-800 dark:text-green-200',
      borderColor: 'border-green-300 dark:border-green-700',
      icon: Check,
      label: 'Approved',
    },
    rejected: {
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-800 dark:text-red-200',
      borderColor: 'border-red-300 dark:border-red-700',
      icon: X,
      label: 'Rejected',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors',
        config.bgColor,
        config.textColor,
        config.borderColor,
        className
      )}
    >
      <Icon className="h-4 w-4" />
      {showLabel && <span>{config.label}</span>}
    </div>
  );
}
