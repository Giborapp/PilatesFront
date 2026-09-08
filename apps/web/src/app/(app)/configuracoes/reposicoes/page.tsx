import { PermissionGate } from '@/components/layout/permission-gate';
import { RecordList } from '@/components/domain/record-list';

export default function ReplacementSettingsPage() {
  return (
    <PermissionGate permission="studio_settings.manage">
      <RecordList
        title="Cancelamentos e reposicoes"
        description="Configurações de faltas, créditos, capacidade e lista de espera."
        endpoint="/studio-settings"
        queryKey="studio-settings"
        fields={[
          { key: 'cancellationNoticeHours', label: 'Antecedencia minima' },
          { key: 'maxJustifiedAbsences', label: 'Maximo de faltas' },
          { key: 'justifiedAbsencePeriod', label: 'Periodo' },
          { key: 'replacementCreditValidityDays', label: 'Validade do crédito' },
          { key: 'allowOverbooking', label: 'Overbooking' },
          { key: 'trialClassOccupiesCapacity', label: 'Experimental ocupa vaga' },
        ]}
      />
    </PermissionGate>
  );
}
