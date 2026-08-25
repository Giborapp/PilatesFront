'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, asArray, isRecord, readString, UnknownRecord } from '@/lib/api';
import { formatDateTime, formatMoney } from '@/lib/format';
import { Card, CardTitle } from '@/components/ui/card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state';
import { StatusBadge } from './badges';

type Field = {
  key: string;
  label: string;
  kind?: 'text' | 'date' | 'money' | 'status' | 'link';
  hrefPrefix?: string;
};

export function RecordList({
  title,
  description,
  endpoint,
  queryKey,
  fields,
  empty = 'Nenhum registro encontrado.',
}: {
  title: string;
  description: string;
  endpoint: string;
  queryKey: string;
  fields: Field[];
  empty?: string;
}) {
  const query = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const result = await apiRequest<unknown>(endpoint);
      if (!result.ok) throw new Error(result.error.message);
      return asArray(result.data);
    },
  });

  return (
    <section className="grid gap-4">
      <div>
        <p className="text-sm font-semibold uppercase text-primary">Pilates Manager</p>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>

      {query.isLoading ? <LoadingState /> : null}
      {query.isError ? <ErrorState message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {query.data?.length === 0 ? <EmptyState title="Vazio" description={empty} /> : null}

      <div className="grid gap-3">
        {query.data?.map((record, index) => (
          <RecordCard key={readString(record, 'id', String(index))} record={record} fields={fields} />
        ))}
      </div>
    </section>
  );
}

function RecordCard({ record, fields }: { record: UnknownRecord; fields: Field[] }) {
  const student = isRecord(record.student) ? record.student : null;
  const title =
    readString(record, 'fullName') ||
    readString(record, 'name') ||
    (student ? readString(student, 'preferredName') || readString(student, 'fullName') : '') ||
    readString(record, 'action') ||
    readString(record, 'id');
  return (
    <Card className="grid gap-3">
      <CardTitle>{title || 'Registro'}</CardTitle>
      <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => (
          <div key={field.key}>
            <dt className="text-xs font-semibold uppercase text-muted">{field.label}</dt>
            <dd className="mt-1 text-sm">{renderValue(record, field)}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function renderValue(record: UnknownRecord, field: Field) {
  const value = readValue(record, field.key);
  if (field.kind === 'date') return formatDateTime(value);
  if (field.kind === 'money') return formatMoney(value);
  if (field.kind === 'status') return <StatusBadge value={value} />;
  if (field.kind === 'link' && field.hrefPrefix) {
    const id = readString(record, 'id');
    const label = typeof value === 'string' && value.trim().length > 0 ? value : 'Abrir';
    if (!id) {
      return label;
    }
    return (
      <Link className="font-semibold text-primary" href={`${field.hrefPrefix}/${id}`}>
        {label}
      </Link>
    );
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '-';
}

function readValue(record: UnknownRecord, key: string): unknown {
  return key.split('.').reduce<unknown>((current, part) => {
    if (!isRecord(current)) {
      return undefined;
    }
    return current[part];
  }, record);
}
