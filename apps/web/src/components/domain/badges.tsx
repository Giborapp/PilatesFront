import { cn } from '@/lib/utils';

const statusColor: Record<string, string> = {
  PAID: 'bg-success/10 text-success',
  PENDING: 'bg-warning/10 text-warning',
  OVERDUE: 'bg-danger/10 text-danger',
  CANCELLED: 'bg-muted/10 text-muted',
  ACTIVE: 'bg-success/10 text-success',
  AVAILABLE: 'bg-success/10 text-success',
  USED: 'bg-muted/10 text-muted',
  EXPIRED: 'bg-danger/10 text-danger',
  BOOKED: 'bg-primary/10 text-primary',
  WAITLISTED: 'bg-warning/10 text-warning',
  PRESENT: 'bg-success/10 text-success',
  ABSENT: 'bg-danger/10 text-danger',
  JUSTIFIED_ABSENCE: 'bg-warning/10 text-warning',
};

export function StatusBadge({ value, className }: { value: unknown; className?: string }) {
  const label = typeof value === 'string' ? value : '-';
  return (
    <span className={cn('inline-flex rounded-full px-2 py-1 text-xs font-semibold', statusColor[label] ?? 'bg-background text-muted', className)}>
      {label}
    </span>
  );
}
