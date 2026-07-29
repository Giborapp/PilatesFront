import { EmptyState } from '@/components/ui/state';

export default function AssessmentTemplateDetailPage() {
  return (
    <EmptyState
      title="Detalhe do modelo depende do backend"
      description="O backend atual lista modelos, mas nao possui endpoint GET /assessment-templates/:id. A tela de edicao detalhada foi documentada como lacuna."
    />
  );
}
