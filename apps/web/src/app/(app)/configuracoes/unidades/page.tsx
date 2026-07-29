import { PermissionGate } from '@/components/layout/permission-gate';
import { RecordList } from '@/components/domain/record-list';

export default function UnitsSettingsPage() {
  return (
    <PermissionGate permission="studio_settings.manage">
      <RecordList
        title="Unidades"
        description="Unidades ativas cadastradas no backend."
        endpoint="/units"
        queryKey="units"
        fields={[
          { key: 'city', label: 'Cidade' },
          { key: 'state', label: 'Estado' },
          { key: 'phone', label: 'Telefone' },
          { key: 'active', label: 'Ativa' },
        ]}
      />
    </PermissionGate>
  );
}
