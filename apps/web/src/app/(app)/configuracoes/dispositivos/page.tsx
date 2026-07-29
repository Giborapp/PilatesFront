import { PermissionGate } from '@/components/layout/permission-gate';
import { RecordList } from '@/components/domain/record-list';

export default function DevicesSettingsPage() {
  return (
    <PermissionGate permission="devices.manage">
      <RecordList
        title="Dispositivos"
        description="Dispositivos conectados ao estudio."
        endpoint="/devices"
        queryKey="devices"
        fields={[
          { key: 'name', label: 'Nome' },
          { key: 'lastUsedAt', label: 'Ultimo acesso', kind: 'date' },
          { key: 'expiresAt', label: 'Expira em', kind: 'date' },
          { key: 'revokedAt', label: 'Revogado em', kind: 'date' },
        ]}
      />
    </PermissionGate>
  );
}
