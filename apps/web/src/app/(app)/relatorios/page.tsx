import { EmptyState } from '@/components/ui/state';

export default function ReportsPage() {
  return (
    <EmptyState
      title="Relatorios ainda dependem do backend"
      description="O backend atual nao expoe endpoint dedicado de relatorios. Esta necessidade esta registrada no plano do frontend."
    />
  );
}
