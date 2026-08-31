'use client';

import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Copy, RotateCcw, Send } from 'lucide-react';
import { PermissionGate } from '@/components/layout/permission-gate';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { ErrorState, LoadingState } from '@/components/ui/state';
import { apiRequest, asArray, isRecord, readNumber, readString } from '@/lib/api';

type Template = Record<string, unknown>;

export default function AssessmentTemplatesPage() {
  const queryClient = useQueryClient();
  const templates = useQuery({ queryKey: ['assessment-templates'], queryFn: () => load('/assessment-templates') });
  const presets = useQuery({ queryKey: ['assessment-presets'], queryFn: () => load('/assessment-templates/presets') });
  const publishedCount = templates.data?.filter((template) => readString(template, 'status') === 'PUBLISHED').length ?? 0;

  async function perform(id: string, action: 'publish' | 'archive' | 'restore'): Promise<void> {
    const result = await apiRequest(`/assessment-templates/${id}/${action}`, { method: 'POST' });
    if (result.ok) await queryClient.invalidateQueries({ queryKey: ['assessment-templates'] });
  }

  async function copyPreset(key: string): Promise<void> {
    const result = await apiRequest(`/assessment-templates/presets/${key}/copy`, { method: 'POST' });
    if (result.ok) await queryClient.invalidateQueries({ queryKey: ['assessment-templates'] });
  }

  return (
    <PermissionGate permission="assessments.read">
      <section className="grid gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase text-primary">Formularios</p>
            <h1 className="text-2xl font-semibold">Modelos de anamnese e avaliacao</h1>
            <p className="mt-1 text-sm text-muted">{publishedCount} de 3 vagas publicadas usadas. Rascunhos nao ocupam vaga.</p>
          </div>
          <Link className="rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white" href="/avaliacoes/modelos/novo">Novo modelo</Link>
        </div>
        {templates.isLoading || presets.isLoading ? <LoadingState label="Carregando modelos..." /> : null}
        {templates.isError ? <ErrorState message={templates.error.message} onRetry={() => void templates.refetch()} /> : null}
        <div className="grid gap-3 lg:grid-cols-2">
          {presets.data?.map((preset) => (
            <Card className="grid gap-3" key={readString(preset, 'key')}>
              <CardTitle>{readString(preset, 'name')}</CardTitle>
              <p className="text-sm text-muted">{readString(preset, 'description')}</p>
              <p className="text-sm">Publico: <strong>{readString(preset, 'audience') === 'PROFESSIONAL' ? 'Profissional' : 'Aluno'}</strong> · {readNumber(preset, 'questionCount')} perguntas</p>
              <Button className="w-fit" onClick={() => void copyPreset(readString(preset, 'key'))}><Copy size={16} /> Copiar para meu estúdio</Button>
            </Card>
          ))}
        </div>
        <div className="grid gap-3">
          {templates.data?.map((template) => {
            const id = readString(template, 'id');
            const status = readString(template, 'status');
            const fields = Array.isArray(template.fields) ? template.fields : [];
            const questions = fields.filter((field) => isRecord(field) && readString(field, 'type') !== 'section').length;
            return (
              <Card className="grid gap-3" key={id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{readString(template, 'name')}</CardTitle>
                    <p className="mt-1 text-sm text-muted">Versao {readNumber(template, 'version')} · {questions}/40 perguntas · {readString(template, 'audience') === 'PROFESSIONAL' ? 'Profissional' : 'Aluno'}</p>
                  </div>
                  <span className="rounded-md bg-background px-3 py-2 text-xs font-semibold">{status === 'PUBLISHED' ? 'Publicado' : status === 'ARCHIVED' ? 'Arquivado' : 'Rascunho'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link className="rounded-md border border-border px-3 py-2 text-sm font-semibold" href={`/avaliacoes/modelos/${id}`}>Abrir</Link>
                  {status === 'DRAFT' ? <Button onClick={() => void perform(id, 'publish')}><Send size={16} /> Publicar</Button> : null}
                  {status === 'PUBLISHED' ? <Button className="bg-white text-danger ring-1 ring-border hover:bg-background" onClick={() => void perform(id, 'archive')}><Archive size={16} /> Arquivar</Button> : null}
                  {status === 'ARCHIVED' ? <Button className="bg-white text-foreground ring-1 ring-border hover:bg-background" onClick={() => void perform(id, 'restore')}><RotateCcw size={16} /> Restaurar</Button> : null}
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </PermissionGate>
  );
}

async function load(path: string): Promise<Template[]> {
  const result = await apiRequest<unknown>(path);
  if (!result.ok) throw new Error(result.error.message);
  return asArray(result.data);
}
