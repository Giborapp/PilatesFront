import { RecordList } from '@/components/domain/record-list';

export default function ReplacementCreditsPage() {
  return (
    <RecordList
      title="Reposicoes"
      description="Creditos disponiveis, reservados, usados e vencidos retornados pelo backend."
      endpoint="/replacement-credits"
      queryKey="replacement-credits"
      fields={[
        { key: 'status', label: 'Status', kind: 'status' },
        { key: 'grantedAt', label: 'Gerado em', kind: 'date' },
        { key: 'expiresAt', label: 'Validade', kind: 'date' },
        { key: 'notes', label: 'Observacoes' },
      ]}
    />
  );
}
