import { PermissionGate } from '@/components/layout/permission-gate';
import { RecordList } from '@/components/domain/record-list';

export default function AssessmentsPage() {
  return (
    <PermissionGate permission="assessments.read">
      <RecordList
        title="Avaliacoes"
        description="Rascunhos, avaliacoes concluidas e historico retornados pelo backend."
        endpoint="/assessments"
        queryKey="assessments"
        fields={[
          { key: 'studentId', label: 'Aluno' },
          { key: 'templateVersion', label: 'Versao do modelo' },
          { key: 'status', label: 'Status', kind: 'status' },
          { key: 'completedAt', label: 'Concluida em', kind: 'date' },
        ]}
      />
    </PermissionGate>
  );
}
