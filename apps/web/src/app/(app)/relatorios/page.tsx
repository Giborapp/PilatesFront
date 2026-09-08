import { EmptyState } from '@/components/ui/state';

export default function ReportsPage() {
  return (
    <EmptyState
      title="Relatórios ainda dependem do backend"
      description="O backend atual não expõe endpoint dedicado de relatórios. Esta necessidade está registrada no plano do frontend."
    />
  );
}
