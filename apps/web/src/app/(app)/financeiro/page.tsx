import { PermissionGate } from '@/components/layout/permission-gate';
import { RecordList } from '@/components/domain/record-list';

export default function FinancePage() {
  return (
    <PermissionGate permission="payments.read">
      <RecordList
        title="Financeiro"
        description="Cobrancas manuais, vencimentos e pagamentos registrados."
        endpoint="/payments"
        queryKey="payments"
        fields={[
          { key: 'referenceMonth', label: 'Referencia', kind: 'date' },
          { key: 'dueDate', label: 'Vencimento', kind: 'date' },
          { key: 'amount', label: 'Valor', kind: 'money' },
          { key: 'effectiveStatus', label: 'Status', kind: 'status' },
          { key: 'paymentMethod', label: 'Metodo' },
        ]}
      />
    </PermissionGate>
  );
}
