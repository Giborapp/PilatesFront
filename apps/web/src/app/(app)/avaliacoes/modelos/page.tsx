import Link from 'next/link';
import { PermissionGate } from '@/components/layout/permission-gate';
import { RecordList } from '@/components/domain/record-list';

export default function AssessmentTemplatesPage() {
  return (
    <PermissionGate permission="assessments.read">
      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Modelos de avaliacao</h1>
            <p className="text-sm text-muted">Editar modelo publicado gera nova versao no backend.</p>
          </div>
          <Link className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" href="/avaliacoes/modelos/novo">
            Novo modelo
          </Link>
        </div>
        <RecordList
          title=""
          description=""
          endpoint="/assessment-templates"
          queryKey="assessment-templates"
          fields={[
            { key: 'id', label: 'Modelo', kind: 'link', hrefPrefix: '/avaliacoes/modelos' },
            { key: 'version', label: 'Versao' },
            { key: 'active', label: 'Ativo' },
            { key: 'createdAt', label: 'Criado em', kind: 'date' },
          ]}
        />
      </section>
    </PermissionGate>
  );
}
