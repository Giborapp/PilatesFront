'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PermissionGate } from '@/components/layout/permission-gate';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { apiRequest, asArray, readString } from '@/lib/api';

type Item = Record<string, unknown>;

export default function IntakeRequestsPage() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState('');
  const query = useQuery({ queryKey: ['public-intakes'], queryFn: async () => { const result = await apiRequest<unknown>('/public/intakes'); if (!result.ok) throw new Error(result.error.message); return asArray(result.data); } });
  async function action(id: string, path: string, body?: object) { const result = await apiRequest(`/public/intakes/${id}/${path}`, { method: 'POST', body: body ? JSON.stringify(body) : undefined }); if (result.ok) { setFeedback('Acao concluida.'); await queryClient.invalidateQueries({ queryKey: ['public-intakes'] }); } else setFeedback(result.error.message); }
  function merge(id: string) { const studentId = window.prompt('Informe o ID do aluno existente'); if (studentId) void action(id, 'merge', { studentId }); }
  return <PermissionGate permission="assessments.read"><section className="grid gap-5"><header className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold uppercase text-primary">Entrada publica</p><h1 className="text-2xl font-semibold">Cadastros recebidos</h1><p className="mt-1 text-sm text-muted">Revise, aprove, mescle ou rejeite respostas antes de ativar um aluno.</p></div><Link className="rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white" href="/cadastros-recebidos/novo">Novo link publico</Link></header>{feedback ? <p role="status" className="text-sm text-muted">{feedback}</p> : null}{query.isLoading ? <p>Carregando...</p> : null}{query.isError ? <p role="alert" className="text-sm text-danger">{query.error.message}</p> : null}{query.data?.map((item) => { const id = readString(item, 'id'); const standard = (item.standardData && typeof item.standardData === 'object' ? item.standardData : {}) as Item; return <Card key={id} className="grid gap-3"><div><CardTitle>{readString(standard, 'fullName', 'Cadastro sem nome')}</CardTitle><p className="text-sm text-muted">{readString(item, 'status')} · {readString(standard, 'phone')}</p></div>{readString(item, 'status') === 'PENDING' ? <div className="flex flex-wrap gap-2"><Button onClick={() => void action(id, 'approve')}>Aprovar</Button><Button className="bg-white text-foreground ring-1 ring-border" onClick={() => merge(id)}>Mesclar</Button><Button className="bg-white text-danger ring-1 ring-border" onClick={() => void action(id, 'reject', {})}>Rejeitar</Button></div> : null}</Card>; })}</section></PermissionGate>;
}
