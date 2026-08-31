"use client";

import Link from "next/link";
import { ReactNode, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  apiRequest,
  asArray,
  isRecord,
  readNumber,
  readString,
  UnknownRecord,
} from "@/lib/api";
import { useAuth } from "@/features/auth/auth-provider";
import { formatDateTime, formatMoney } from "@/lib/format";
import { AttendanceButtons } from "@/components/domain/attendance-buttons";
import { StatusBadge } from "@/components/domain/badges";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/state";

type ViewMode = "today" | "cancelled";

const cancelledStatuses = new Set(["ABSENT", "CANCELLED_LATE"]);

export default function DashboardPage() {
  const { staff } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("today");
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const result = await apiRequest<UnknownRecord>("/dashboard");
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
  });

  const classes = asArray(query.data?.classesToday);
  const overduePayments = asArray(query.data?.overduePayments);
  const duePayments = asArray(query.data?.duePayments);
  const trialProcesses = asArray(query.data?.trialProcesses);
  const expiringCredits = asArray(query.data?.expiringCredits);
  const pendingIntakes = asArray(query.data?.pendingIntakes);
  const counts = isRecord(query.data?.dashboardCounts) ? query.data.dashboardCounts : {};
  const cancelledBookings = useMemo(
    () =>
      classes.flatMap((classSession) =>
        asArray(classSession.bookings)
          .filter((booking) => cancelledStatuses.has(attendanceStatus(booking)))
          .map((booking) => ({ booking, classSession })),
      ),
    [classes],
  );

  return (
    <section className="grid gap-5">
      <div>
        <p className="text-sm text-muted">
          {new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" }).format(
            new Date(),
          )}
        </p>
        <h1 className="text-2xl font-semibold">
          Ola, {staff?.name ?? "profissional"}
        </h1>
      </div>

      <div className="grid grid-cols-2 rounded-md border border-border bg-panel p-1 sm:max-w-sm">
        <button
          className={
            viewMode === "today"
              ? "rounded bg-background px-3 py-2 text-sm font-semibold"
              : "px-3 py-2 text-sm font-semibold text-muted"
          }
          onClick={() => setViewMode("today")}
          type="button"
        >
          Aulas de hoje
        </button>
        <button
          className={
            viewMode === "cancelled"
              ? "rounded bg-background px-3 py-2 text-sm font-semibold"
              : "px-3 py-2 text-sm font-semibold text-muted"
          }
          onClick={() => setViewMode("cancelled")}
          type="button"
        >
          Cancelados
        </button>
      </div>

      {query.isLoading ? <LoadingState /> : null}
      {query.isError ? (
        <ErrorState
          message={query.error.message}
          onRetry={() => void query.refetch()}
        />
      ) : null}

      {!query.isLoading && !query.isError ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ActionMetricCard href="/agenda" label="Aulas de hoje" value={readNumber(counts, "classesToday", classes.length)} />
          <ActionMetricCard href="/agenda" label="Presencas pendentes" value={readNumber(counts, "pendingAttendances")} />
          <ActionMetricCard href="/financeiro" label="Pagamentos vencidos" value={readNumber(counts, "overduePayments", overduePayments.length)} tone={readNumber(counts, "overduePayments", overduePayments.length) > 0 ? "danger" : "default"} />
          <ActionMetricCard href="/financeiro" label="Pagamentos proximos" value={readNumber(counts, "duePayments", duePayments.length)} />
          <ActionMetricCard href="/cadastros-recebidos" label="Cadastros aguardando" value={readNumber(counts, "pendingIntakes", pendingIntakes.length)} tone={readNumber(counts, "pendingIntakes", pendingIntakes.length) > 0 ? "warning" : "default"} />
          <ActionMetricCard href="/avaliacoes" label="Avaliacoes pendentes" value={readNumber(counts, "pendingAssessments")} />
          <ActionMetricCard href="/reposicoes" label="Reposicoes disponiveis" value={readNumber(counts, "availableCredits")} />
          <ActionMetricCard href="/reposicoes?expiring=30" label="Reposicoes em 30 dias" value={readNumber(counts, "expiringCredits30")} tone="warning" />
          <ActionMetricCard href="/reposicoes?expiring=7" label="Reposicoes em 7 dias" value={readNumber(counts, "expiringCredits7")} tone="warning" />
          <ActionMetricCard href="/agenda?nearCapacity=true" label="Horarios proximos da capacidade" value={readNumber(counts, "nearCapacity")} />
        </div>
      ) : null}

      {viewMode === "today" ? (
        <div className="grid gap-4">
          {classes.length === 0 && !query.isLoading ? (
            <EmptyState
              title="Sem aulas"
              description="Nenhuma aula encontrada para hoje."
            />
          ) : null}
          {classes.map((classSession, index) => (
            <ClassCard
              key={readString(classSession, "id", String(index))}
              classSession={classSession}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {cancelledBookings.length === 0 ? (
            <EmptyState
              title="Sem cancelados"
              description="Nenhum aluno marcado como falta hoje."
            />
          ) : null}
          {cancelledBookings.map(({ booking, classSession }, index) => (
            <CancelledBookingCard
              key={readString(booking, "id", String(index))}
              booking={booking}
              classSession={classSession}
            />
          ))}
        </div>
      )}

      {!query.isLoading && !query.isError ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <DashboardList title="Financeiro vencido" empty="Nenhuma cobranca vencida." records={overduePayments}>
            {(payment) => <PaymentAlert payment={payment} />}
          </DashboardList>
          <DashboardList title="Vencimentos proximos" empty="Nenhuma cobranca vence nos proximos dias." records={duePayments}>
            {(payment) => <PaymentAlert payment={payment} />}
          </DashboardList>
          <DashboardList title="Acompanhar hoje" empty="Sem experimentais ou reposicoes urgentes." records={[...trialProcesses, ...expiringCredits]}>
            {(record) => isRecord(record.student) ? <StudentAlert record={record} /> : <GenericAlert record={record} />}
          </DashboardList>
          <DashboardList title="Cadastros aguardando" empty="Nenhum cadastro aguardando revisao." records={pendingIntakes}>
            {() => <Link className="font-semibold text-primary" href="/cadastros-recebidos">Abrir cadastros recebidos</Link>}
          </DashboardList>
        </div>
      ) : null}
    </section>
  );
}

function ActionMetricCard({ href, ...props }: { href: string; label: string; value: number; tone?: "default" | "danger" | "warning" }) {
  return <Link href={href} aria-label={`${props.label}: ${props.value}`}><MetricCard {...props} /></Link>;
}

function MetricCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "danger" | "warning";
}) {
  const toneClass =
    tone === "danger"
      ? "text-danger"
      : tone === "warning"
        ? "text-warning"
        : "text-foreground";
  return (
    <Card>
      <p className="text-xs font-semibold uppercase text-muted">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${toneClass}`}>{value}</p>
    </Card>
  );
}

function DashboardList({
  title,
  empty,
  records,
  children,
}: {
  title: string;
  empty: string;
  records: UnknownRecord[];
  children: (record: UnknownRecord) => ReactNode;
}) {
  return (
    <Card className="grid content-start gap-3">
      <CardTitle>{title}</CardTitle>
      {records.length === 0 ? <p className="text-sm text-muted">{empty}</p> : null}
      {records.slice(0, 5).map((record, index) => (
        <div key={readString(record, "id", String(index))} className="rounded-md border border-border bg-background p-3">
          {children(record)}
        </div>
      ))}
    </Card>
  );
}

function PaymentAlert({ payment }: { payment: UnknownRecord }) {
  const student = isRecord(payment.student) ? payment.student : {};
  return (
    <div className="grid gap-1">
      <p className="font-semibold">{studentName(student)}</p>
      <p className="text-sm text-muted">
        {formatMoney(payment.amount)} - vence {formatDateTime(payment.dueDate, { dateStyle: "short", timeStyle: undefined })}
      </p>
      <StatusBadge value={payment.effectiveStatus ?? payment.status} />
    </div>
  );
}

function StudentAlert({ record }: { record: UnknownRecord }) {
  const student = isRecord(record.student) ? record.student : {};
  const date = readString(record, "expiresAt") || readString(record, "createdAt");
  return (
    <div className="grid gap-1">
      <p className="font-semibold">{studentName(student)}</p>
      <p className="text-sm text-muted">{date ? formatDateTime(date, { dateStyle: "short", timeStyle: undefined }) : "Sem data"}</p>
      <StatusBadge value={record.status} />
    </div>
  );
}

function GenericAlert({ record }: { record: UnknownRecord }) {
  return (
    <div className="grid gap-1">
      <p className="font-semibold">{readString(record, "source") || readString(record, "id", "Registro")}</p>
      <StatusBadge value={record.status} />
    </div>
  );
}

function ClassCard({ classSession }: { classSession: UnknownRecord }) {
  const bookings = asArray(classSession.bookings);
  return (
    <Card className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Horario</p>
          <CardTitle>{formatDateTime(classSession.startsAt)}</CardTitle>
          <p className="mt-1 text-sm text-muted">
            {bookings.length}/{readNumber(classSession, "capacity")} alunos
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge value={classSession.status} />
          <Link
            className="text-sm font-semibold text-primary"
            href={`/aulas/${readString(classSession, "id")}`}
          >
            Abrir aula
          </Link>
        </div>
      </div>

      <div className="grid gap-3">
        {bookings.length === 0 ? (
          <p className="text-sm text-muted">Nenhum aluno nesta aula.</p>
        ) : null}
        {bookings.map((booking, index) => (
          <StudentAttendanceRow
            key={readString(booking, "id", String(index))}
            booking={booking}
          />
        ))}
      </div>
    </Card>
  );
}

function StudentAttendanceRow({ booking }: { booking: UnknownRecord }) {
  const student = isRecord(booking.student) ? booking.student : {};
  const bookingId = readString(booking, "id");
  const status = attendanceStatus(booking);
  return (
    <div className="grid gap-3 rounded-md border border-border bg-background p-3 lg:grid-cols-[1fr_auto] lg:items-center">
      <div>
        <p className="font-semibold">{studentName(student)}</p>
        <p className="text-sm text-muted">
          Restam {readNumber(student, "monthlyLessonsRemaining")} de{" "}
          {readNumber(student, "monthlyLessonLimit")} aulas no mes
        </p>
        {status ? <StatusBadge value={status} /> : null}
      </div>
      {bookingId && !cancelledStatuses.has(status) ? (
        <AttendanceButtons bookingId={bookingId} compact />
      ) : null}
    </div>
  );
}

function CancelledBookingCard({
  booking,
  classSession,
}: {
  booking: UnknownRecord;
  classSession: UnknownRecord;
}) {
  const student = isRecord(booking.student) ? booking.student : {};
  const bookingId = readString(booking, "id");
  return (
    <Card className="grid gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>{studentName(student)}</CardTitle>
          <p className="mt-1 text-sm text-muted">
            {formatDateTime(classSession.startsAt)}
          </p>
          <p className="mt-1 text-sm text-muted">
            Restam {readNumber(student, "monthlyLessonsRemaining")} de{" "}
            {readNumber(student, "monthlyLessonLimit")} aulas no mes
          </p>
        </div>
        <StatusBadge value={attendanceStatus(booking)} />
      </div>
      {bookingId ? <AttendanceButtons bookingId={bookingId} /> : null}
    </Card>
  );
}

function attendanceStatus(booking: UnknownRecord): string {
  const attendance = isRecord(booking.attendance) ? booking.attendance : {};
  return readString(attendance, "status");
}

function studentName(student: UnknownRecord): string {
  return (
    readString(student, "preferredName") ||
    readString(student, "fullName") ||
    "Aluno"
  );
}
