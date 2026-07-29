import { PermissionGate } from '@/components/layout/permission-gate';
import { RecordList } from '@/components/domain/record-list';

export default function StaffPage() {
  return (
    <PermissionGate permission="staff.manage">
      <RecordList
        title="Equipe"
        description="Profissionais, papeis, status e ultimo acesso. PINs existentes nunca sao exibidos."
        endpoint="/staff"
        queryKey="staff"
        fields={[
          { key: 'role', label: 'Papel' },
          { key: 'active', label: 'Ativo' },
          { key: 'lastLoginAt', label: 'Ultimo acesso', kind: 'date' },
          { key: 'createdAt', label: 'Criado em', kind: 'date' },
        ]}
      />
    </PermissionGate>
  );
}
