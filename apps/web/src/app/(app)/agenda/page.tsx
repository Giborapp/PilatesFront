"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiRequest,
  asArray,
  isRecord,
  readNumber,
  readString,
  UnknownRecord,
} from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/state";
import { StatusBadge } from "@/components/domain/badges";

export default function AgendaPage() {
  const queryClient = useQueryClient();
  const [unitId, setUnitId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(50);
  const [capacity, setCapacity] = useState(6);
  const [classSessionId, setClassSessionId] = useState("");
  const [studentId, setStudentId] = useState("");

  const classesQuery = useRecords("/class-sessions", "class-sessions");
  const unitsQuery = useRecords("/units", "units");
  const roomsQuery = useRecords("/rooms", "rooms");
  const staffQuery = useRecords("/staff", "staff");
  const studentsQuery = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const result = await apiRequest<unknown>("/students?perPage=100");
      if (!result.ok) throw new Error(result.error.message);
      return asArray(result.data);
    },
  });

  const students = useMemo(
    () => asArray(studentsQuery.data?.[0]?.items ?? studentsQuery.data),
    [studentsQuery.data],
  );
  const professionals = staffQuery.data.filter((record) =>
    ["ADMIN", "PROFESSIONAL"].includes(readString(record, "role")),
  );
  const activeRooms = roomId
    ? roomsQuery.data
    : roomsQuery.data.filter(
        (record) => !unitId || readString(record, "unitId") === unitId,
      );

  const createClass = useMutation({
    mutationFn: async () => {
      const start = new Date(startsAt);
      const end = new Date(start.getTime() + durationMinutes * 60_000);
      const result = await apiRequest("/class-sessions", {
        method: "POST",
        body: JSON.stringify({
          unitId,
          roomId,
          professionalId,
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          capacity,
        }),
      });
      if (!result.ok) throw new Error(result.error.message);
    },
    onSuccess: () => {
      setStartsAt("");
      void queryClient.invalidateQueries({ queryKey: ["class-sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const addStudent = useMutation({
    mutationFn: async () => {
      const result = await apiRequest("/bookings", {
        method: "POST",
        body: JSON.stringify({
          classSessionId,
          studentId,
          bookingType: "FIXED",
        }),
      });
      if (!result.ok) throw new Error(result.error.message);
    },
    onSuccess: () => {
      setStudentId("");
      void queryClient.invalidateQueries({ queryKey: ["class-sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  function submitClass(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    createClass.mutate();
  }

  function submitBooking(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    addStudent.mutate();
  }

  return (
    <section className="grid gap-5">
      <div>
        <p className="text-sm font-semibold uppercase text-primary">
          Pilates Manager
        </p>
        <h1 className="text-2xl font-semibold">Agenda</h1>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardTitle>Criar horario de aula</CardTitle>
          <form className="mt-4 grid gap-4" onSubmit={submitClass}>
            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Unidade"
                value={unitId}
                onChange={setUnitId}
                records={unitsQuery.data}
              />
              <Select
                label="Sala"
                value={roomId}
                onChange={setRoomId}
                records={activeRooms}
              />
            </div>
            <Select
              label="Profissional"
              value={professionalId}
              onChange={setProfessionalId}
              records={professionals}
            />
            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2 text-sm font-medium md:col-span-1">
                Inicio
                <Input
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                  required
                  type="datetime-local"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Duracao
                <Input
                  value={durationMinutes}
                  min={15}
                  onChange={(event) =>
                    setDurationMinutes(Number(event.target.value))
                  }
                  required
                  type="number"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Capacidade
                <Input
                  value={capacity}
                  min={1}
                  onChange={(event) => setCapacity(Number(event.target.value))}
                  required
                  type="number"
                />
              </label>
            </div>
            {createClass.isError ? (
              <p className="rounded-md bg-danger/10 p-3 text-sm text-danger">
                {createClass.error.message}
              </p>
            ) : null}
            <Button
              disabled={
                createClass.isPending ||
                !unitId ||
                !roomId ||
                !professionalId ||
                !startsAt
              }
            >
              {createClass.isPending ? "Criando..." : "Criar aula"}
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Adicionar aluno em aula</CardTitle>
          <form className="mt-4 grid gap-4" onSubmit={submitBooking}>
            <Select
              label="Aula"
              value={classSessionId}
              onChange={setClassSessionId}
              records={classesQuery.data}
              labelFor={classLabel}
            />
            <Select
              label="Aluno salvo"
              value={studentId}
              onChange={setStudentId}
              records={students}
              labelFor={studentLabel}
            />
            {addStudent.isError ? (
              <p className="rounded-md bg-danger/10 p-3 text-sm text-danger">
                {addStudent.error.message}
              </p>
            ) : null}
            <Button
              disabled={addStudent.isPending || !classSessionId || !studentId}
            >
              {addStudent.isPending ? "Adicionando..." : "Adicionar aluno"}
            </Button>
          </form>
        </Card>
      </div>

      {classesQuery.isLoading ? <LoadingState /> : null}
      {classesQuery.isError ? (
        <ErrorState
          message={classesQuery.errorMessage}
          onRetry={() => void classesQuery.refetch()}
        />
      ) : null}
      {classesQuery.data.length === 0 && !classesQuery.isLoading ? (
        <EmptyState title="Sem aulas" description="Nenhum horario criado." />
      ) : null}

      <div className="grid gap-3">
        {classesQuery.data.map((classSession) => (
          <ClassSessionCard
            key={readString(classSession, "id")}
            classSession={classSession}
          />
        ))}
      </div>
    </section>
  );
}

function useRecords(endpoint: string, queryKey: string) {
  const query = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const result = await apiRequest<unknown>(endpoint);
      if (!result.ok) throw new Error(result.error.message);
      return asArray(result.data);
    },
  });
  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    errorMessage: query.error?.message ?? "Erro ao carregar.",
    refetch: query.refetch,
  };
}

function Select({
  label,
  value,
  onChange,
  records,
  labelFor = defaultLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  records: UnknownRecord[];
  labelFor?: (record: UnknownRecord) => string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <select
        className="min-h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        onChange={(event) => onChange(event.target.value)}
        required
        value={value}
      >
        <option value="">Selecione</option>
        {records.map((record) => (
          <option
            key={readString(record, "id")}
            value={readString(record, "id")}
          >
            {labelFor(record)}
          </option>
        ))}
      </select>
    </label>
  );
}

function ClassSessionCard({ classSession }: { classSession: UnknownRecord }) {
  const bookings = asArray(classSession.bookings);
  return (
    <Card className="grid gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
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
      <div className="flex flex-wrap gap-2">
        {bookings.length === 0 ? (
          <span className="text-sm text-muted">Sem alunos.</span>
        ) : null}
        {bookings.map((booking, index) => {
          const student = isRecord(booking.student) ? booking.student : {};
          return (
            <span
              key={readString(booking, "id", String(index))}
              className="rounded-full bg-background px-3 py-1 text-sm"
            >
              {studentLabel(student)}
            </span>
          );
        })}
      </div>
    </Card>
  );
}

function defaultLabel(record: UnknownRecord): string {
  return (
    readString(record, "name") ||
    readString(record, "fullName") ||
    readString(record, "id")
  );
}

function studentLabel(record: UnknownRecord): string {
  const remaining = readNumber(record, "monthlyLessonsRemaining");
  const limit = readNumber(record, "monthlyLessonLimit");
  const name =
    readString(record, "preferredName") ||
    readString(record, "fullName") ||
    readString(record, "name");
  return limit > 0 ? `${name} (${remaining}/${limit})` : name;
}

function classLabel(record: UnknownRecord): string {
  return `${formatDateTime(record.startsAt)} - ${readNumber(record, "capacity")} vagas`;
}
