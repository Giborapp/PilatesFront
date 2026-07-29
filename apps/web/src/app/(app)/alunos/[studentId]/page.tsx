'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, readString, UnknownRecord } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { Card, CardTitle } from '@/components/ui/card';
import { ErrorState, LoadingState } from '@/components/ui/state';
import { StatusBadge } from '@/components/domain/badges';

export default function StudentProfilePage() {
  const params = useParams<{ studentId: string }>();
  const query = useQuery({
    queryKey: ['students', params.studentId],
    queryFn: async () => {
      const result = await apiRequest<UnknownRecord>(`/students/${params.studentId}`);
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError) return <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />;

  const student = query.data ?? {};
  return (
    <section className="grid gap-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Perfil do aluno</p>
            <h1 className="text-2xl font-semibold">{readString(student, 'fullName')}</h1>
            <p className="text-sm text-muted">{readString(student, 'phone')}</p>
          </div>
          <StatusBadge value={student?.status} />
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Resumo</CardTitle>
          <dl className="mt-3 grid gap-2 text-sm">
            <div><dt className="text-muted">Nome preferido</dt><dd>{readString(student, 'preferredName') || '-'}</dd></div>
            <div><dt className="text-muted">E-mail</dt><dd>{readString(student, 'email') || '-'}</dd></div>
            <div><dt className="text-muted">Nascimento</dt><dd>{formatDate(student?.birthDate)}</dd></div>
            <div><dt className="text-muted">Inicio</dt><dd>{formatDate(student?.startDate)}</dd></div>
          </dl>
        </Card>
        <Card>
          <CardTitle>Cuidados e observacoes</CardTitle>
          <p className="mt-3 text-sm text-muted">{readString(student, 'importantCareNotes') || 'Nenhum cuidado importante registrado.'}</p>
          <p className="mt-3 text-sm text-muted">{readString(student, 'generalNotes') || 'Sem observacoes gerais.'}</p>
        </Card>
      </div>
    </section>
  );
}
