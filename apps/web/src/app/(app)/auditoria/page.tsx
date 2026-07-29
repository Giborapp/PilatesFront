import { PermissionGate } from '@/components/layout/permission-gate';
import { RecordList } from '@/components/domain/record-list';

export default function AuditPage() {
  return (
    <PermissionGate permission="audit_logs.read">
      <RecordList
        title="Auditoria"
        description="Registro de eventos importantes retornados pelo backend."
        endpoint="/audit-logs"
        queryKey="audit-logs"
        fields={[
          { key: 'action', label: 'Acao' },
          { key: 'entityType', label: 'Entidade' },
          { key: 'entityId', label: 'ID' },
          { key: 'createdAt', label: 'Data', kind: 'date' },
        ]}
      />
    </PermissionGate>
  );
}
