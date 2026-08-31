'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiRequest } from '@/lib/api';

type Session = { id: string; startsAt: string; endsAt: string; professionalName: string; remaining: number };
type Details = { studio: { name: string; brandColor: string }; expiresAt: string; creditExpiresAt: string; sessions: Session[] };

export default function PublicReplacementPage() {
  const { token } = useParams<{ token: string }>();
  const [details, setDetails] = useState<Details | null>(null);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => { void apiRequest<Details>(`/replacement-links/${token}`).then((result) => { if (result.ok) setDetails(result.data); else setMessage(result.error.message); }); }, [token]);
  async function reserve(classSessionId: string) { const result = await apiRequest(`/replacement-links/${token}/reserve`, { method: 'POST', body: JSON.stringify({ classSessionId }) }); if (result.ok) setDone(true); else setMessage(result.error.message); }
  if (done) return <main className="grid min-h-screen place-items-center bg-white p-6"><section className="rounded-md border border-border p-8 text-center"><h1 className="text-2xl font-semibold">Reposicao agendada</h1><p className="mt-2 text-sm text-muted">Sua reserva foi confirmada.</p></section></main>;
  if (!details) return <main className="grid min-h-screen place-items-center bg-white p-6"><p role="alert">{message || 'Carregando horarios...'}</p></main>;
  return <main className="min-h-screen bg-white px-4 py-8"><section className="mx-auto grid max-w-2xl gap-5"><header><p className="text-sm font-semibold" style={{ color: details.studio.brandColor }}>{details.studio.name}</p><h1 className="mt-1 text-2xl font-semibold">Escolha sua reposicao</h1><p className="mt-2 text-sm text-muted">Credito valido ate {new Date(details.creditExpiresAt).toLocaleDateString('pt-BR')}.</p></header>{details.sessions.length === 0 ? <p className="text-sm text-muted">Nao ha horarios com vaga nos proximos dias.</p> : <div className="grid gap-3">{details.sessions.map((session) => <button className="grid gap-1 rounded-md border border-border p-4 text-left hover:border-primary" key={session.id} onClick={() => void reserve(session.id)}><strong>{new Date(session.startsAt).toLocaleDateString('pt-BR')} {new Date(session.startsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong><span className="text-sm text-muted">Profissional: {session.professionalName} · {session.remaining} vaga(s)</span></button>)}</div>}{message ? <p role="alert" className="text-sm text-danger">{message}</p> : null}</section></main>;
}
