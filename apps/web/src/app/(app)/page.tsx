'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, asArray, isRecord, readNumber, readString, UnknownRecord } from '@/lib/api';
import { useAuth } from '@/features/auth/auth-provider';
import { formatDateTime, formatMoney } from '@/lib/format';
import { Card, CardTitle } from '@/components/ui/card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state';
import { StatusBadge } from '@/components/domain/badges';

export default function DashboardPage() {
  const { staff } = useAuth();
  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const result = await apiRequest<UnknownRecord>('/dashboard');
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
  });

  const classes = asArray(query.data?.classesToday);
  const overduePayments = asArray(query.data?.overduePayments);
  const duePayments = asArray(query.data?.duePayments);
  const trials = asArray(query.data?.trialProcesses);
  const credits = asArray(query.data?.expiringCredits);

  return (
    <section className="grid gap-5">
      <div>
        <p className="text-sm text-muted">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date())}</p>
        <h1 className="text-2xl font-semibold">Ola, {staff?.name ?? 'profissional'}</h1>
      </div>

      {query.isLoading ? <LoadingState /> : null}
      {query.isError ? <ErrorState message={query.error.message} onRetry={() => void query.refetch()} /> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <SummaryCard title="Aulas hoje" value={classes.length} />
        <SummaryCard title="Pagamentos vencidos" value={overduePayments.length} />
        <SummaryCard title="Creditos a vencer" value={credits.length} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="grid gap-3">
          <CardTitle>Aulas do dia</CardTitle>
          {classes.length === 0 ? <EmptyState title="Sem aulas" description="Nenhuma aula encontrada para hoje." /> : null}
          {classes.map((classSession, index) => (
            <ClassSummary key={readString(classSession, 'id', String(index))} record={classSession} />
          ))}
        </Card>

        <div className="grid gap-4">
          <SmallList title="Vencendo" records={duePayments} moneyKey="amount" />
          <SmallList title="Experimentais" records={trials} />
          <SmallList title="Creditos proximos do vencimento" records={credits} dateKey="expiresAt" />
        </div>
      </div>
    </section>
  );
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <p className="text-sm text-muted">{title}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </Card>
  );
}

function ClassSummary({ record }: { record: UnknownRecord }) {
  const bookings = asArray(record.bookings);
  const id = readString(record, 'id');
  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">{formatDateTime(record.startsAt)}</p>
          <p className="text-sm text-muted">
            {bookings.length}/{readNumber(record, 'capacity')} alunos
          </p>
        </div>
        <StatusBadge value={record.status} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {bookings.slice(0, 6).map((booking, index) => {
          const student = isRecord(booking.student) ? booking.student : {};
          return (
            <span key={readString(booking, 'id', String(index))} className="rounded-full bg-background px-2 py-1 text-xs">
              {readString(student, 'preferredName') || readString(student, 'fullName') || 'Aluno'}
            </span>
          );
        })}
      </div>
      {id ? (
        <Link className="mt-3 inline-flex text-sm font-semibold text-primary" href={`/aulas/${id}`}>
          Abrir aula
        </Link>
      ) : null}
    </div>
  );
}

function SmallList({
  title,
  records,
  moneyKey,
  dateKey,
}: {
  title: string;
  records: UnknownRecord[];
  moneyKey?: string;
  dateKey?: string;
}) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className="mt-3 grid gap-2">
        {records.length === 0 ? <p className="text-sm text-muted">Nada para mostrar.</p> : null}
        {records.slice(0, 5).map((record, index) => (
          <div key={readString(record, 'id', String(index))} className="rounded-md bg-background p-2 text-sm">
            <p className="font-medium">{readString(record, 'fullName') || readString(record, 'name') || readString(record, 'status') || 'Registro'}</p>
            {moneyKey ? <p className="text-muted">{formatMoney(record[moneyKey])}</p> : null}
            {dateKey ? <p className="text-muted">{formatDateTime(record[dateKey])}</p> : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
