'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const defaultFields = JSON.stringify(
  [
    {
      id: 'main_complaint',
      label: 'Queixa principal',
      type: 'long_text',
      required: true,
      order: 1,
    },
    {
      id: 'pain_level',
      label: 'Nivel de dor',
      type: 'pain_scale',
      minimum: 0,
      maximum: 10,
      order: 2,
    },
  ],
  null,
  2,
);

export default function NewAssessmentTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState('Anamnese inicial');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState(defaultFields);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    let parsedFields: unknown;
    try {
      parsedFields = JSON.parse(fields) as unknown;
    } catch {
      setLoading(false);
      setError('A definicao de campos precisa ser JSON valido.');
      return;
    }

    const result = await apiRequest('/assessment-templates', {
      method: 'POST',
      body: JSON.stringify({ name, description: description || undefined, fields: parsedFields }),
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    router.replace('/avaliacoes/modelos');
  }

  return (
    <section className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Novo modelo de avaliacao</h1>
      <form className="mt-5 grid gap-4 rounded-lg border border-border bg-panel p-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-medium">
          Nome
          <Input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Descricao
          <Input value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Campos estruturados
          <textarea
            className="min-h-80 rounded-md border border-border p-3 font-mono text-sm"
            value={fields}
            onChange={(event) => setFields(event.target.value)}
          />
        </label>
        <p className="text-sm text-muted">Construtor visual completo ainda depende de enriquecer os contratos de campos no backend/OpenAPI.</p>
        {error ? <p className="rounded-md bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
        <Button disabled={loading}>{loading ? 'Salvando...' : 'Salvar modelo'}</Button>
      </form>
    </section>
  );
}
