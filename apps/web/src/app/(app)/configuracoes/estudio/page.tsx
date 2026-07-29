import { PermissionGate } from '@/components/layout/permission-gate';
import { RecordList } from '@/components/domain/record-list';

export default function StudioSettingsPage() {
  return (
    <PermissionGate permission="studio_settings.manage">
      <RecordList
        title="Estudio"
        description="Dados publicos do estudio autenticado."
        endpoint="/studios/current"
        queryKey="studio-current"
        fields={[
          { key: 'email', label: 'E-mail' },
          { key: 'phone', label: 'Telefone' },
          { key: 'timezone', label: 'Fuso' },
          { key: 'currency', label: 'Moeda' },
          { key: 'status', label: 'Status', kind: 'status' },
        ]}
      />
    </PermissionGate>
  );
}
