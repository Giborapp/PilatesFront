'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, asArray, readString } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/components/layout/permission-gate';

export default function NewPublicInvitePage() {
  const [type, setType] = useState<'NEW_STUDENT' | 'EXISTING_STUDENT'>('NEW_STUDENT');
  const [templateId, setTemplateId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [result, setResult] = useState<{ url: string; expiresAt: string } | null>(null);
  const [error, setError] = useState('');
  const templates = useQuery({ queryKey: ['assessment-templates', 'student'], queryFn: async () => { const response = await apiRequest<unknown>('/assessment-templates'); if (!response.ok) throw new Error(response.error.message); return asArray(response.data).filter((item) => readString(item, 'audience') === 'STUDENT' && readString(item, 'status') === 'PUBLISHED'); } });
  async function create() { setError(''); setResult(null); const response = await apiRequest<{ url: string; expiresAt: string }>('/public/intakes/invites', { method: 'POST', body: JSON.stringify({ type, templateId, studentId: type === 'EXISTING_STUDENT' ? studentId : undefined }) }); if (response.ok) setResult(response.data); else setError(response.error.message); }
  return <PermissionGate permission="assessment_templates.manage"><section className="grid max-w-xl gap-5"><header><p className="text-sm font-semibold uppercase text-primary">Entrada publica</p><h1 className="text-2xl font-semibold">Novo link de anamnese</h1><p className="mt-1 text-sm text-muted">O link expira em sete dias e aceita apenas um envio.</p></header><div className="grid gap-4 rounded-md border border-border bg-panel p-4"><label className="grid gap-2 text-sm font-medium">Tipo<select className="min-h-11 rounded-md border border-border bg-white px-3" value={type} onChange={(event) => setType(event.target.value as typeof type)}><option value="NEW_STUDENT">Pessoa nova</option><option value="EXISTING_STUDENT">Aluno existente</option></select></label><label className="grid gap-2 text-sm font-medium">Modelo STUDENT publicado<select className="min-h-11 rounded-md border border-border bg-white px-3" value={templateId} onChange={(event) => setTemplateId(event.target.value)} required><option value="">Selecione</option>{templates.data?.map((template) => <option key={readString(template, 'id')} value={readString(template, 'id')}>{readString(template, 'name')}</option>)}</select></label>{type === 'EXISTING_STUDENT' ? <label className="grid gap-2 text-sm font-medium">ID do aluno<input className="min-h-11 rounded-md border border-border px-3" value={studentId} onChange={(event) => setStudentId(event.target.value)} required /></label> : null}<Button disabled={!templateId || (type === 'EXISTING_STUDENT' && !studentId)} onClick={() => void create()}>Gerar link</Button>{error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}{result ? <div className="grid gap-2 rounded-md border border-primary/30 bg-white p-3"><p className="text-sm font-semibold">Link criado</p><input readOnly className="min-h-11 w-full rounded-md border border-border px-3 text-sm" value={result.url} onFocus={(event) => event.currentTarget.select()} /><p className="text-xs text-muted">Expira em {new Date(result.expiresAt).toLocaleString('pt-BR')}</p><Button onClick={() => void navigator.clipboard?.writeText(result.url)}>Copiar link</Button></div> : null}</div><Link className="text-sm font-semibold text-primary" href="/cadastros-recebidos">Voltar para cadastros recebidos</Link></section></PermissionGate>;
}
