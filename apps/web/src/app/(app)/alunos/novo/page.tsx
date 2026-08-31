'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function NewStudentPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', phone: '', startDate: '', sessionsPerWeek: 2, billingDay: 10, planId: '', amount: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  function update(key: keyof typeof form, value: string | number) { setForm((current) => ({ ...current, [key]: value })); }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(''); setLoading(true); const result = await apiRequest('/students/quick', { method: 'POST', body: JSON.stringify({ ...form, planId: form.planId || undefined, amount: form.amount || undefined }) }); setLoading(false); if (!result.ok) { setError(result.error.message); return; } router.replace('/alunos'); }
  return <section className="max-w-xl"><h1 className="text-2xl font-semibold">Adicionar aluno</h1><p className="mt-1 text-sm text-muted">Cadastre o essencial agora e complete o perfil depois.</p><form className="mt-5 grid gap-4 rounded-lg border border-border bg-panel p-4" onSubmit={(event) => void submit(event)}><Field label="Nome completo" value={form.fullName} required onChange={(value) => update('fullName', value)} /><Field label="Telefone/WhatsApp" value={form.phone} required onChange={(value) => update('phone', value)} /><Field label="Data de inicio" type="date" value={form.startDate} required onChange={(value) => update('startDate', value)} /><div className="grid gap-4 md:grid-cols-2"><Field label="Aulas por semana" type="number" min={1} max={14} value={form.sessionsPerWeek} required onChange={(value) => update('sessionsPerWeek', Number(value))} /><Field label="Dia de vencimento" type="number" min={1} max={31} value={form.billingDay} required onChange={(value) => update('billingDay', Number(value))} /></div><Field label="ID do plano (opcional)" value={form.planId} onChange={(value) => update('planId', value)} /><Field label="Valor mensal (opcional)" value={form.amount} onChange={(value) => update('amount', value)} />{error ? <p className="rounded-md bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}<Button disabled={loading}>{loading ? 'Salvando...' : 'Salvar aluno'}</Button></form></section>;
}

function Field({ label, value, onChange, required = false, type = 'text', min, max }: { label: string; value: string | number; onChange: (value: string) => void; required?: boolean; type?: string; min?: number; max?: number }) { return <label className="grid gap-2 text-sm font-medium">{label}<Input required={required} type={type} min={min} max={max} value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
