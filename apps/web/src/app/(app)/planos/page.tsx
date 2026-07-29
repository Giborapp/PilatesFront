import { PermissionGate } from '@/components/layout/permission-gate';
import { RecordList } from '@/components/domain/record-list';

export default function PlansPage() {
  return (
    <PermissionGate permission="payments.read">
      <RecordList
        title="Planos"
        description="Planos comerciais do estudio."
        endpoint="/plans"
        queryKey="plans"
        fields={[
          { key: 'sessionsPerWeek', label: 'Sessoes por semana' },
          { key: 'defaultAmount', label: 'Valor padrao', kind: 'money' },
          { key: 'defaultBillingDay', label: 'Dia de cobranca' },
          { key: 'active', label: 'Ativo' },
        ]}
      />
    </PermissionGate>
  );
}
