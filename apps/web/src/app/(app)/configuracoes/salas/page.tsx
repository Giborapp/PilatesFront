import { PermissionGate } from '@/components/layout/permission-gate';
import { RecordList } from '@/components/domain/record-list';

export default function RoomsSettingsPage() {
  return (
    <PermissionGate permission="studio_settings.manage">
      <RecordList
        title="Salas"
        description="Salas e capacidade padrao."
        endpoint="/rooms"
        queryKey="rooms"
        fields={[
          { key: 'unitId', label: 'Unidade' },
          { key: 'defaultCapacity', label: 'Capacidade' },
          { key: 'active', label: 'Ativa' },
        ]}
      />
    </PermissionGate>
  );
}
