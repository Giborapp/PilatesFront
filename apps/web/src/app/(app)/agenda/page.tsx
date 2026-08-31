"use client";

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
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/state";

const weekdays = [
  ["MONDAY", "Segunda"],
  ["TUESDAY", "Terca"],
  ["WEDNESDAY", "Quarta"],
  ["THURSDAY", "Quinta"],
  ["FRIDAY", "Sexta"],
  ["SATURDAY", "Sabado"],
  ["SUNDAY", "Domingo"],
] as const;

export default function AgendaPage() {
  const queryClient = useQueryClient();
  const [professionalId, setProfessionalId] = useState("");
  const [weekday, setWeekday] = useState("MONDAY");
  const [startTime, setStartTime] = useState("08:00");
  const [durationMinutes, setDurationMinutes] = useState(50);
  const [capacity, setCapacity] = useState(6);
  const [newScheduleStudentIds, setNewScheduleStudentIds] = useState<string[]>([]);

  const schedulesQuery = useRecords(
    "/recurring-schedules",
    "recurring-schedules",
  );
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

  const createSchedule = useMutation({
    mutationFn: async () => {
      const result = await apiRequest<UnknownRecord>("/recurring-schedules", {
        method: "POST",
          body: JSON.stringify({
            professionalId,
          weekday,
          startTime,
          durationMinutes,
          capacity,
            startsOn: new Date().toISOString(),
            studentIds: newScheduleStudentIds,
          }),
      });
      if (!result.ok) throw new Error(result.error.message);
    },
    onSuccess: () => {
      setNewScheduleStudentIds([]);
      void queryClient.invalidateQueries({ queryKey: ["recurring-schedules"] });
      void queryClient.invalidateQueries({ queryKey: ["class-sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  function submitSchedule(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    createSchedule.mutate();
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
          <CardTitle>Criar horario semanal</CardTitle>
          <form className="mt-4 grid gap-4" onSubmit={submitSchedule}>
            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Profissional"
                value={professionalId}
                onChange={setProfessionalId}
                records={professionals}
              />
              <MultiSelect
                label="Aluno"
                value={newScheduleStudentIds}
                onChange={setNewScheduleStudentIds}
                records={students}
                labelFor={studentLabel}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <label className="grid gap-2 text-sm font-medium">
                Dia da semana
                <select
                  className={selectClassName}
                  onChange={(event) => setWeekday(event.target.value)}
                  value={weekday}
                >
                  {weekdays.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Horario
                <Input
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  required
                  type="time"
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
            {createSchedule.isError ? (
              <p className="rounded-md bg-danger/10 p-3 text-sm text-danger">
                {createSchedule.error.message}
              </p>
            ) : null}
            <Button
              disabled={createSchedule.isPending || !professionalId}
            >
              {createSchedule.isPending ? "Criando..." : "Criar horario"}
            </Button>
          </form>
        </Card>
      </div>

      {schedulesQuery.isLoading ? <LoadingState /> : null}
      {schedulesQuery.isError ? (
        <ErrorState
          message={schedulesQuery.errorMessage}
          onRetry={() => void schedulesQuery.refetch()}
        />
      ) : null}
      {schedulesQuery.data.length === 0 && !schedulesQuery.isLoading ? (
        <EmptyState
          title="Sem horarios"
          description="Nenhum horario semanal criado."
        />
      ) : null}

      <div className="grid gap-3">
        {schedulesQuery.data.map((schedule) => (
          <ScheduleCard key={readString(schedule, "id")} schedule={schedule} students={students} />
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

function ScheduleCard({ schedule, students }: { schedule: UnknownRecord; students: UnknownRecord[] }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [pauseWeeks, setPauseWeeks] = useState(1);
  const [confirmAction, setConfirmAction] = useState<
    "pause" | "archive" | null
  >(null);
  const [weekday, setWeekday] = useState(readString(schedule, "weekday"));
  const [startTime, setStartTime] = useState(readString(schedule, "startTime"));
  const [capacity, setCapacity] = useState(readNumber(schedule, "capacity"));
  const [durationMinutes, setDurationMinutes] = useState(
    readNumber(schedule, "durationMinutes"),
  );
  const enrollments = asArray(schedule.enrollments);
  const scheduleId = readString(schedule, "id");
  const [studentId, setStudentId] = useState("");
  const addStudent = useMutation({
    mutationFn: async () => {
      const result = await apiRequest(`/recurring-schedules/${scheduleId}/enrollments`, {
        method: "POST",
        body: JSON.stringify({ studentId }),
      });
      if (!result.ok) throw new Error(result.error.message);
    },
    onSuccess: () => {
      setStudentId("");
      void queryClient.invalidateQueries({ queryKey: ["recurring-schedules"] });
      void queryClient.invalidateQueries({ queryKey: ["class-sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const mutation = useMutation({
    mutationFn: async (action: "update" | "pause" | "archive") => {
      const endpoint =
        action === "update"
          ? `/recurring-schedules/${scheduleId}`
          : `/recurring-schedules/${scheduleId}/${action}`;
      const method = action === "update" ? "PATCH" : "POST";
      const body =
        action === "update"
          ? { weekday, startTime, capacity, durationMinutes }
          : action === "pause"
            ? { weeks: pauseWeeks }
            : {};
      const result = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(body),
      });
      if (!result.ok) throw new Error(result.error.message);
    },
    onSuccess: () => {
      setEditing(false);
      setConfirmAction(null);
      void queryClient.invalidateQueries({ queryKey: ["recurring-schedules"] });
      void queryClient.invalidateQueries({ queryKey: ["class-sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return (
    <Card className="grid gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>{scheduleLabel(schedule)}</CardTitle>
          <p className="mt-1 text-sm text-muted">
            {readString(asRecord(schedule.professional), "name")} -{" "}
            {readNumber(schedule, "capacity")} vagas
          </p>
          {readString(schedule, "pauseUntil") ? (
            <p className="mt-1 text-sm text-warning">
              Pausado ate{" "}
              {new Date(readString(schedule, "pauseUntil")).toLocaleDateString(
                "pt-BR",
              )}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="bg-white text-foreground ring-1 ring-border hover:bg-background"
            onClick={() => setEditing((current) => !current)}
          >
            Modificar
          </Button>
          <Button
            className="bg-white text-foreground ring-1 ring-border hover:bg-background"
            onClick={() => setConfirmAction("pause")}
          >
            Pausar
          </Button>
          <Button
            className="bg-white text-danger ring-1 ring-border hover:bg-background"
            onClick={() => setConfirmAction("archive")}
          >
            Excluir
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {enrollments.length === 0 ? (
          <span className="text-sm text-muted">Sem alunos fixos.</span>
        ) : null}
        {enrollments.map((enrollment, index) => {
          const student = asRecord(enrollment.student);
          return (
            <span
              className="rounded-full bg-background px-3 py-1 text-sm"
              key={readString(enrollment, "id", String(index))}
            >
              {studentLabel(student)}
            </span>
          );
        })}
      </div>

      <form
        className="grid gap-2 rounded-md border border-border bg-background p-3 md:grid-cols-[1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          addStudent.mutate();
        }}
      >
        <Select
          label="Adicionar aluno fixo"
          value={studentId}
          onChange={setStudentId}
          records={students}
          labelFor={studentLabel}
        />
        <div className="flex items-end">
          <Button disabled={addStudent.isPending || !studentId}>
            {addStudent.isPending ? "Adicionando..." : "Adicionar"}
          </Button>
        </div>
        {addStudent.isError ? (
          <p className="text-sm text-danger md:col-span-2">{addStudent.error.message}</p>
        ) : null}
      </form>
      {editing ? (
        <div className="grid gap-3 rounded-md border border-border bg-background p-3 md:grid-cols-4">
          <label className="grid gap-2 text-sm font-medium">
            Dia
            <select
              className={selectClassName}
              onChange={(event) => setWeekday(event.target.value)}
              value={weekday}
            >
              {weekdays.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Horario
            <Input
              onChange={(event) => setStartTime(event.target.value)}
              type="time"
              value={startTime}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Duracao
            <Input
              min={15}
              onChange={(event) =>
                setDurationMinutes(Number(event.target.value))
              }
              type="number"
              value={durationMinutes}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Vagas
            <Input
              min={1}
              onChange={(event) => setCapacity(Number(event.target.value))}
              type="number"
              value={capacity}
            />
          </label>
          <div className="flex gap-2 md:col-span-4">
            <Button
              disabled={mutation.isPending}
              onClick={() => mutation.mutate("update")}
            >
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
            <Button
              className="bg-white text-foreground ring-1 ring-border hover:bg-background"
              onClick={() => setEditing(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}

      {confirmAction ? (
        <div className="rounded-md border border-border bg-background p-3">
          <p className="text-sm font-semibold">
            {confirmAction === "pause"
              ? "Confirmar pausa"
              : "Confirmar exclusao"}
          </p>
          {confirmAction === "pause" ? (
            <label className="mt-3 grid max-w-xs gap-2 text-sm font-medium">
              Semanas pausado
              <Input
                min={1}
                onChange={(event) => setPauseWeeks(Number(event.target.value))}
                type="number"
                value={pauseWeeks}
              />
            </label>
          ) : null}
          {mutation.isError ? (
            <p className="mt-2 text-sm text-danger">{mutation.error.message}</p>
          ) : null}
          <div className="mt-3 flex gap-2">
            <Button
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(confirmAction)}
            >
              {mutation.isPending ? "Salvando..." : "Confirmar"}
            </Button>
            <Button
              className="bg-white text-foreground ring-1 ring-border hover:bg-background"
              disabled={mutation.isPending}
              onClick={() => setConfirmAction(null)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

const selectClassName =
  "min-h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

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
        className={selectClassName}
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

function MultiSelect({ label, value, onChange, records, labelFor = defaultLabel }: { label: string; value: string[]; onChange: (value: string[]) => void; records: UnknownRecord[]; labelFor?: (record: UnknownRecord) => string }) {
  return <label className="grid gap-2 text-sm font-medium">{label}<select className={selectClassName} multiple value={value} onChange={(event) => onChange(Array.from(event.target.selectedOptions, (option) => option.value))}>{records.map((record) => <option key={readString(record, "id")} value={readString(record, "id")}>{labelFor(record)}</option>)}</select><span className="text-xs text-muted">{value.length} aluno(s) selecionado(s)</span></label>;
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

function scheduleLabel(record: UnknownRecord): string {
  const day =
    weekdays.find(([value]) => value === readString(record, "weekday"))?.[1] ??
    readString(record, "weekday");
  return `${day}, ${readString(record, "startTime")}`;
}


function asRecord(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {};
}





