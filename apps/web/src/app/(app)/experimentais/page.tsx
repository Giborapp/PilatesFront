import { RecordList } from '@/components/domain/record-list';

export default function TrialsPage() {
  return (
    <RecordList
      title="Aulas experimentais"
      description="Funil de interessados e experimentais conforme status do backend."
      endpoint="/trial-processes"
      queryKey="trial-processes"
      fields={[
        { key: 'student.fullName', label: 'Aluno' },
        { key: 'source', label: 'Origem' },
        { key: 'status', label: 'Status', kind: 'status' },
        { key: 'convertedAt', label: 'Convertido em', kind: 'date' },
        { key: 'createdAt', label: 'Criado em', kind: 'date' },
      ]}
    />
  );
}
