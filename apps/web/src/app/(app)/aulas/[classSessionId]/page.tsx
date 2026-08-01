'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, asArray, isRecord, readString, UnknownRecord } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { AttendanceButtons } from '@/components/domain/attendance-buttons';
import { StatusBadge } from '@/components/domain/badges';
import { Card, CardTitle } from '@/components/ui/card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state';

export default function ClassSessionPage() {
  const params = useParams<{ classSessionId: string }>();
  const query = useQuery({
    queryKey: ['class-sessions', params.classSessionId],
    queryFn: async () => {
      const result = await apiRequest<unknown>(`/class-sessions/${params.classSessionId}`);
      if (!result.ok) throw new Error(result.error.message);
      return isRecord(result.data) ? result.data : null;
    },
  });

  const session = query.data;
  const bookings = asArray(session?.bookings);

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />;
  if (!session) {
    return (
      <EmptyState
        title="Aula nao encontrada"
        description="Verifique se a aula ainda existe ou se voce tem permissao para acessa-la."
      />
    );
  }

  return (
    <section className="grid gap-4">
      <div>
        <p className="text-sm text-muted">{formatDateTime(session.startsAt)}</p>
        <h1 className="text-2xl font-semibold">Tela da aula</h1>
      </div>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{formatDateTime(session.startsAt)} ate {formatDateTime(session.endsAt)}</CardTitle>
            <p className="mt-1 text-sm text-muted">Capacidade: {String(session.capacity ?? '-')}</p>
          </div>
          <StatusBadge value={session.status} />
        </div>
      </Card>

      <div className="grid gap-3">
        {bookings.length === 0 ? <EmptyState title="Sem alunos" description="Nenhuma reserva encontrada nesta aula." /> : null}
        {bookings.map((booking, index) => (
          <BookingCard key={readString(booking, 'id', String(index))} booking={booking} />
        ))}
      </div>
    </section>
  );
}

function BookingCard({ booking }: { booking: UnknownRecord }) {
  const student = isRecord(booking.student) ? booking.student : {};
  const attendance = isRecord(booking.attendance) ? booking.attendance : {};
  const bookingId = readString(booking, 'id');
  return (
    <Card className="grid gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{readString(student, 'preferredName') || readString(student, 'fullName') || 'Aluno'}</p>
          <p className="text-sm text-muted">{readString(booking, 'bookingType')}</p>
        </div>
        <StatusBadge value={readString(attendance, 'status') || readString(booking, 'status')} />
      </div>
      {bookingId ? <AttendanceButtons bookingId={bookingId} /> : null}
      {readString(student, 'id') ? (
        <Link className="text-sm font-semibold text-primary" href={`/alunos/${readString(student, 'id')}`}>
          Abrir perfil
        </Link>
      ) : null}
    </Card>
  );
}

