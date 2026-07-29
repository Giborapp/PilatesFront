import { RecordList } from '@/components/domain/record-list';

export default function AgendaPage() {
  return (
    <RecordList
      title="Agenda"
      description="Aulas específicas geradas pelo backend."
      endpoint="/class-sessions"
      queryKey="class-sessions"
      fields={[
        { key: 'id', label: 'Aula', kind: 'link', hrefPrefix: '/aulas' },
        { key: 'startsAt', label: 'Inicio', kind: 'date' },
        { key: 'endsAt', label: 'Fim', kind: 'date' },
        { key: 'capacity', label: 'Capacidade' },
        { key: 'status', label: 'Status', kind: 'status' },
      ]}
      empty="Nenhuma aula encontrada."
    />
  );
}
