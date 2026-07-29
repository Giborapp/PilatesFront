'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';

const actions = [
  ['PRESENT', 'Presente'],
  ['ABSENT', 'Faltou'],
  ['JUSTIFIED_ABSENCE', 'Justificada'],
] as const;

export function AttendanceButtons({ bookingId }: { bookingId: string }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (status: (typeof actions)[number][0]) => {
      const result = await apiRequest('/attendance/mark', {
        method: 'POST',
        body: JSON.stringify({ classBookingId: bookingId, status }),
      });
      if (!result.ok) throw new Error(result.error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['class-sessions'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(([status, label]) => (
        <Button
          key={status}
          className="min-h-9 bg-white px-3 text-xs text-foreground ring-1 ring-border hover:bg-background"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(status)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
