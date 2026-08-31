'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Archive, RotateCcw, Send } from 'lucide-react';
import { apiRequest, isRecord, readNumber, readString } from '@/lib/api';
import { PermissionGate } from '@/components/layout/permission-gate';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { ErrorState, LoadingState } from '@/components/ui/state';

export default function AssessmentTemplateDetailPage() {
  const params = useParams<{ templateId: string }>();
  const query = useQuery({
    queryKey: ['assessment-template', params.templateId],
    queryFn: async () => {
      const result = await apiRequest<Record<string, unknown>>(`/assessment-templates/${params.templateId}`);
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
  });
  if (query.isLoading) return <LoadingState label="Carregando modelo..." />;
  if (query.isError) return <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />;
  const template = query.data;
  if (!template) return null;
  const fields = Array.isArray(template.fields) ? template.fields.filter(isRecord) : [];
  const status = readString(template, 'status');
  return (
    <PermissionGate permission="assessments.read">
      <section className="grid max-w-4xl gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase text-primary">Modelo v{readNumber(template, 'version')}</p>
            <h1 className="text-2xl font-semibold">{readString(template, 'name')}</h1>
            <p className="mt-1 text-sm text-muted">{readString(template, 'description')} · {status === 'PUBLISHED' ? 'Publicado' : status === 'ARCHIVED' ? 'Arquivado' : 'Rascunho'}</p>
          </div>
          <Link className="rounded-md border border-border px-3 py-3 text-sm font-semibold" href={`/avaliacoes/modelos/novo?templateId=${readString(template, 'id')}`}>Criar nova versao</Link>
        </div>
        <Card className="grid gap-3">
          <CardTitle>{fields.filter((field) => readString(field, 'type') !== 'section').length}/40 perguntas · {readString(template, 'audience') === 'PROFESSIONAL' ? 'Profissional autorizado' : 'Aluno'}</CardTitle>
          {fields.map((field, index) => (
            <div className="rounded-md border border-border p-3" key={`${readString(field, 'id')}-${index}`}>
              <p className="font-semibold">{readString(field, 'label')}</p>
              <p className="text-sm text-muted">{readString(field, 'type')}{field.required ? ' · obrigatoria' : ''}</p>
            </div>
          ))}
        </Card>
        <div className="flex flex-wrap gap-2">
          {status === 'DRAFT' ? <ActionButton id={readString(template, 'id')} action="publish" label="Publicar" icon={<Send size={16} />} /> : null}
          {status === 'PUBLISHED' ? <ActionButton id={readString(template, 'id')} action="archive" label="Arquivar" icon={<Archive size={16} />} /> : null}
          {status === 'ARCHIVED' ? <ActionButton id={readString(template, 'id')} action="restore" label="Restaurar" icon={<RotateCcw size={16} />} /> : null}
        </div>
      </section>
    </PermissionGate>
  );
}

function ActionButton({ id, action, label, icon }: { id: string; action: string; label: string; icon: React.ReactNode }) {
  async function run(): Promise<void> {
    await apiRequest(`/assessment-templates/${id}/${action}`, { method: 'POST' });
    window.location.reload();
  }
  return <Button onClick={() => void run()}>{icon}{label}</Button>;
}
