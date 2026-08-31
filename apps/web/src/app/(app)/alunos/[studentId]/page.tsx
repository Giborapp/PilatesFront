"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, asArray, isRecord, readNumber, readString, UnknownRecord } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/state";
import { StatusBadge } from "@/components/domain/badges";
import { useAuth } from "@/features/auth/auth-provider";

type FieldType = "short_text" | "long_text" | "number" | "date" | "boolean" | "single_select" | "multi_select" | "numeric_scale" | "pain_scale" | "measure" | "section";

type TemplateField = {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string[];
  minimum?: number;
  maximum?: number;
};

type AnswerValue = string | number | boolean | string[];
type Answers = Record<string, AnswerValue>;

export default function StudentProfilePage() {
  const params = useParams<{ studentId: string }>();
  const queryClient = useQueryClient();
  const { staff } = useAuth();
  const [activeSection, setActiveSection] = useState("summary");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [answers, setAnswers] = useState<Answers>({});
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");

  const studentQuery = useQuery({
    queryKey: ["students", params.studentId],
    queryFn: async () => {
      const result = await apiRequest<UnknownRecord>(`/students/${params.studentId}`);
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
  });

  const templatesQuery = useQuery({
    queryKey: ["assessment-templates"],
    queryFn: async () => {
      const result = await apiRequest<unknown>("/assessment-templates");
      if (!result.ok) throw new Error(result.error.message);
      return asArray(result.data);
    },
  });

  const assessmentsQuery = useQuery({
    queryKey: ["assessments", params.studentId],
    queryFn: async () => {
      const result = await apiRequest<unknown>(`/assessments?studentId=${params.studentId}`);
      if (!result.ok) throw new Error(result.error.message);
      return asArray(result.data);
    },
  });

  const paymentsQuery = useQuery({ queryKey: ["payments", params.studentId], queryFn: async () => { const result = await apiRequest<unknown>(`/payments?studentId=${params.studentId}`); if (!result.ok) throw new Error(result.error.message); return asArray(result.data); } });
  const schedulesQuery = useQuery({ queryKey: ["recurring-schedules", params.studentId], queryFn: async () => { const result = await apiRequest<unknown>("/recurring-schedules"); if (!result.ok) throw new Error(result.error.message); return asArray(result.data).filter((schedule) => asArray(schedule.enrollments).some((enrollment) => readString(asRecord(enrollment), "studentId") === params.studentId || readString(asRecord(asRecord(enrollment).student), "id") === params.studentId)); } });
  const creditsQuery = useQuery({ queryKey: ["replacement-credits", params.studentId], queryFn: async () => { const result = await apiRequest<unknown>("/replacement-credits"); if (!result.ok) throw new Error(result.error.message); return asArray(result.data).filter((credit) => readString(asRecord(credit.student), "id") === params.studentId); } });
  const clinicalAllowed = staff?.permissions.includes("assessments.clinical_read") === true;

  const templates = templatesQuery.data ?? [];
  const assessments = assessmentsQuery.data ?? [];
  const selectedTemplate = templates.find((template) => readString(template, "id") === selectedTemplateId);
  const selectedFields = useMemo(() => templateFields(selectedTemplate), [selectedTemplate]);
  const latestCompleted = assessments.find((assessment) => readString(assessment, "status") === "COMPLETED");

  const createAssessment = useMutation({
    mutationFn: async () => {
      const normalized = normalizeAnswers(selectedFields, answers);
      const result = await apiRequest("/assessments", {
        method: "POST",
        body: JSON.stringify({
          studentId: params.studentId,
          templateId: selectedTemplateId,
          answers: normalized,
          status: "COMPLETED",
        }),
      });
      if (!result.ok) throw new Error(result.error.message);
    },
    onSuccess: () => {
      setAnswers({});
      void queryClient.invalidateQueries({ queryKey: ["assessments", params.studentId] });
    },
  });

  if (studentQuery.isLoading) return <LoadingState />;
  if (studentQuery.isError) return <ErrorState message={studentQuery.error.message} onRetry={() => void studentQuery.refetch()} />;

  const student = (studentQuery.data ?? {}) as UnknownRecord & { plans?: UnknownRecord[] };
  const firstCompare = assessments.find((assessment) => readString(assessment, "id") === compareA) ?? latestCompleted;
  const secondCompare = assessments.find((assessment) => readString(assessment, "id") === compareB);
  const comparisonRows = firstCompare && secondCompare ? compareAssessments(firstCompare, secondCompare) : [];

  return (
    <section className="grid gap-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Perfil do aluno</p>
            <h1 className="text-2xl font-semibold">{readString(student, "fullName")}</h1>
            <p className="text-sm text-muted">{readString(student, "phone")}</p>
          </div>
          <StatusBadge value={student.status} />
        </div>
      </Card>

      <nav aria-label="Seções do perfil" className="flex gap-2 overflow-x-auto border-b border-border pb-2">
        {[['summary', 'Resumo'], ['schedule', 'Horarios e presenca'], ['finance', 'Plano e financeiro'], ['clinical', 'Anamneses e avaliacoes'], ['replacement', 'Reposicoes'], ['history', 'Historico']].map(([value, label]) => <button className={activeSection === value ? "rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white" : "rounded-md px-3 py-2 text-sm font-semibold text-muted hover:bg-background"} key={value} onClick={() => setActiveSection(value)} type="button" aria-current={activeSection === value ? "page" : undefined}>{label}</button>)}
      </nav>

      {activeSection === "summary" ? <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Resumo</CardTitle>
          <dl className="mt-3 grid gap-2 text-sm">
            <div><dt className="text-muted">Nome preferido</dt><dd>{readString(student, "preferredName") || "-"}</dd></div>
            <div><dt className="text-muted">E-mail</dt><dd>{readString(student, "email") || "-"}</dd></div>
            <div><dt className="text-muted">Nascimento</dt><dd>{formatDate(student.birthDate)}</dd></div>
            <div><dt className="text-muted">Inicio</dt><dd>{formatDate(student.startDate)}</dd></div>
          </dl>
        </Card>
        <Card>
          <CardTitle>Cuidados e observacoes</CardTitle>
          <p className="mt-3 text-sm text-muted">{readString(student, "importantCareNotes") || "Nenhum cuidado importante registrado."}</p>
          <p className="mt-3 text-sm text-muted">{readString(student, "generalNotes") || "Sem observacoes gerais."}</p>
        </Card>
      </div> : null}

      {activeSection === "schedule" ? <Card id="horarios-presenca" className="grid gap-4"><CardTitle>Horarios e presenca</CardTitle>{schedulesQuery.isLoading ? <LoadingState /> : null}{schedulesQuery.data?.map((schedule) => <div className="rounded-md border border-border bg-background p-3 text-sm" key={readString(schedule, "id")}><p className="font-semibold">{readString(schedule, "weekday")} · {readString(schedule, "startTime")}</p><p className="text-muted">{readString(asRecord(schedule.professional), "name")} · {readString(schedule, "durationMinutes")} minutos</p><Link className="text-primary" href="/agenda">Abrir na agenda</Link></div>)}{!schedulesQuery.isLoading && schedulesQuery.data?.length === 0 ? <EmptyState title="Sem horarios" description="Nenhum horario recorrente vinculado." /> : null}<p className="text-sm text-muted">O historico detalhado de presencas permanece disponivel na agenda e nas aulas relacionadas.</p></Card> : null}
      {activeSection === "finance" ? <Card id="plano-financeiro" className="grid gap-4"><CardTitle>Plano e financeiro</CardTitle><p className="text-sm">Frequencia semanal: <strong>{readNumber(asRecord(student.plans?.[0]), "sessionsPerWeek") || "-"}</strong></p><p className="text-sm">Pagamentos vencidos ou proximos: <strong>{paymentsQuery.data?.filter((payment) => ["OVERDUE", "PENDING"].includes(readString(payment, "effectiveStatus") || readString(payment, "status"))).length ?? 0}</strong></p>{paymentsQuery.data?.map((payment) => <div className="rounded-md border border-border bg-background p-3 text-sm" key={readString(payment, "id")}><span>{readString(payment, "status")} · vencimento {new Date(readString(payment, "dueDate")).toLocaleDateString("pt-BR")}</span></div>)}</Card> : null}
      {activeSection === "clinical" && clinicalAllowed ? <div id="anamneses-avaliacoes">{ /* The existing clinical editor follows below. */ }</div> : null}
      {activeSection === "clinical" && !clinicalAllowed ? <EmptyState title="Acesso restrito" description="Somente profissionais autorizados podem visualizar respostas clínicas." /> : null}
      {activeSection === "replacement" ? <Card id="reposicoes" className="grid gap-4"><CardTitle>Reposicoes</CardTitle><p className="text-sm">{creditsQuery.data?.filter((credit) => readString(credit, "status") === "AVAILABLE").length ?? 0} aula(s) para repor</p>{creditsQuery.data?.map((credit) => <div className="rounded-md border border-border bg-background p-3 text-sm" key={readString(credit, "id")}><p className="font-semibold">{readString(credit, "status")}</p><p className="text-muted">Validade: {new Date(readString(credit, "expiresAt")).toLocaleDateString("pt-BR")}</p><div className="mt-2 flex gap-2"><Link className="text-primary" href="/reposicoes">Agendar reposicao</Link>{readString(credit, "status") === "AVAILABLE" && staff?.permissions.includes("attendance.manage") ? <Link className="text-primary" href="/reposicoes">Gerar link</Link> : null}</div></div>)}</Card> : null}
      {activeSection === "history" ? <Card id="historico" className="grid gap-4"><CardTitle>Historico operacional</CardTitle><p className="text-sm text-muted">Criado em {new Date(readString(student, "createdAt")).toLocaleDateString("pt-BR")} · atualizado em {new Date(readString(student, "updatedAt")).toLocaleDateString("pt-BR")}</p><p className="text-sm text-muted">Eventos clinicos e respostas nao sao exibidos nesta area.</p></Card> : null}

      {activeSection === "clinical" && clinicalAllowed ? <Card className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Realizar avaliacao</CardTitle>
            <p className="text-sm text-muted">Selecione um formulario criado na Gestao e preencha para este aluno.</p>
          </div>
        </div>
        {templatesQuery.isLoading ? <LoadingState /> : null}
        {templates.length === 0 && !templatesQuery.isLoading ? (
          <EmptyState title="Sem formularios" description="Crie uma avaliacao ou anamnese em Gestao antes de avaliar o aluno." />
        ) : null}
        {templates.length > 0 ? (
          <form className="grid gap-4" onSubmit={(event) => submitAssessment(event, createAssessment.mutate)}>
            <label className="grid gap-2 text-sm font-medium">
              Formulario
              <select
                className={selectClassName}
                value={selectedTemplateId}
                onChange={(event) => {
                  setSelectedTemplateId(event.target.value);
                  setAnswers({});
                }}
                required
              >
                <option value="">Selecione</option>
                {templates.map((template) => (
                  <option key={readString(template, "id")} value={readString(template, "id")}>
                    {readString(template, "name")}
                  </option>
                ))}
              </select>
            </label>
            {selectedFields.map((field) => (
              <FieldInput
                key={field.id}
                field={field}
                value={answers[field.id]}
                onChange={(value) => setAnswers((current) => ({ ...current, [field.id]: value }))}
              />
            ))}
            {createAssessment.isError ? <p className="rounded-md bg-danger/10 p-3 text-sm text-danger">{createAssessment.error.message}</p> : null}
            <Button disabled={createAssessment.isPending || !selectedTemplateId}>
              {createAssessment.isPending ? "Salvando..." : "Salvar avaliacao"}
            </Button>
          </form>
        ) : null}
      </Card> : null}

      {activeSection === "clinical" && clinicalAllowed ? <Card className="grid gap-4">
        <CardTitle>Avaliacoes anteriores</CardTitle>
        {assessmentsQuery.isLoading ? <LoadingState /> : null}
        {assessments.length === 0 && !assessmentsQuery.isLoading ? <EmptyState title="Sem avaliacoes" description="Nenhuma avaliacao registrada para este aluno." /> : null}
        <div className="grid gap-2">
          {assessments.map((assessment) => (
            <div className="rounded-md border border-border bg-background p-3 text-sm" key={readString(assessment, "id")}>
              <p className="font-semibold">{readString(asRecord(assessment.template), "name")}</p>
              <p className="text-muted">{new Date(readString(assessment, "createdAt")).toLocaleString("pt-BR")} - {readString(assessment, "status")}</p>
            </div>
          ))}
        </div>
      </Card> : null}

      {activeSection === "clinical" && clinicalAllowed ? <Card className="grid gap-4">
        <CardTitle>Comparar avaliacoes</CardTitle>
        <div className="grid gap-3 md:grid-cols-2">
          <AssessmentSelect label="Avaliacao base" value={compareA} onChange={setCompareA} assessments={assessments} fallbackLabel="Ultima concluida" />
          <AssessmentSelect label="Comparar com" value={compareB} onChange={setCompareB} assessments={assessments} />
        </div>
        {comparisonRows.length > 0 ? (
          <div className="grid gap-2">
            {comparisonRows.map((row) => (
              <div className="grid gap-2 rounded-md border border-border bg-background p-3 text-sm md:grid-cols-[1fr_1fr_1fr_auto]" key={row.label}>
                <p className="font-semibold">{row.label}</p>
                <p>{row.before}</p>
                <p>{row.after}</p>
                <StatusBadge value={row.same ? "IGUAL" : "MUDOU"} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Selecione duas avaliacoes para comparar respostas iguais e diferentes.</p>
        )}
      </Card> : null}
    </section>
  );
}

function submitAssessment(event: FormEvent<HTMLFormElement>, submit: () => void): void {
  event.preventDefault();
  submit();
}

function FieldInput({ field, value, onChange }: { field: TemplateField; value: AnswerValue | undefined; onChange: (value: AnswerValue) => void }) {
  if (field.type === "section") {
    return <h3 className="text-base font-semibold">{field.label}</h3>;
  }
  if (field.type === "long_text") {
    return (
      <label className="grid gap-2 text-sm font-medium">
        {field.label}
        <textarea className="min-h-28 rounded-md border border-border p-3 text-sm" required={field.required} value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} />
      </label>
    );
  }
  if (["number", "numeric_scale", "pain_scale", "measure"].includes(field.type)) {
    return (
      <label className="grid gap-2 text-sm font-medium">
        {field.label}
        <Input type="number" min={field.minimum} max={field.maximum} required={field.required} value={typeof value === "number" ? value : ""} onChange={(event) => onChange(Number(event.target.value))} />
      </label>
    );
  }
  if (field.type === "date") {
    return (
      <label className="grid gap-2 text-sm font-medium">
        {field.label}
        <Input type="date" required={field.required} value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} />
      </label>
    );
  }
  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} />
        {field.label}
      </label>
    );
  }
  if (field.type === "single_select") {
    return (
      <label className="grid gap-2 text-sm font-medium">
        {field.label}
        <select className={selectClassName} required={field.required} value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)}>
          <option value="">Selecione</option>
          {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
    );
  }
  if (field.type === "multi_select") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="grid gap-2 text-sm font-medium">
        <p>{field.label}</p>
        <div className="grid gap-2 rounded-md border border-border bg-background p-3">
          {field.options.map((option) => (
            <label className="flex items-center gap-2" key={option}>
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={(event) => {
                  onChange(event.target.checked ? [...selected, option] : selected.filter((item) => item !== option));
                }}
              />
              {option}
            </label>
          ))}
        </div>
      </div>
    );
  }
  return (
    <label className="grid gap-2 text-sm font-medium">
      {field.label}
      <Input required={field.required} value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function AssessmentSelect({ label, value, onChange, assessments, fallbackLabel }: { label: string; value: string; onChange: (value: string) => void; assessments: UnknownRecord[]; fallbackLabel?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <select className={selectClassName} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{fallbackLabel ?? "Selecione"}</option>
        {assessments.map((assessment) => (
          <option key={readString(assessment, "id")} value={readString(assessment, "id")}>
            {readString(asRecord(assessment.template), "name")} - {new Date(readString(assessment, "createdAt")).toLocaleDateString("pt-BR")}
          </option>
        ))}
      </select>
    </label>
  );
}

function templateFields(template: UnknownRecord | undefined): TemplateField[] {
  if (!template) return [];
  return asArray(template.fields).map((field) => ({
    id: readString(field, "id"),
    label: readString(field, "label"),
    type: readString(field, "type", "short_text") as FieldType,
    required: field.required === true,
    options: Array.isArray(field.options) ? field.options.map(String) : [],
    minimum: typeof field.minimum === "number" ? field.minimum : undefined,
    maximum: typeof field.maximum === "number" ? field.maximum : undefined,
  })).filter((field) => field.id && field.label);
}

function normalizeAnswers(fields: TemplateField[], answers: Answers): Answers {
  const normalized: Answers = {};
  for (const field of fields) {
    const value = answers[field.id];
    if (value === undefined || value === "" || field.type === "section") continue;
    normalized[field.id] = value;
  }
  return normalized;
}

function compareAssessments(before: UnknownRecord, after: UnknownRecord) {
  const labels = new Map<string, string>();
  for (const field of [...templateFields(asRecord(before.template)), ...templateFields(asRecord(after.template))]) {
    labels.set(field.id, field.label);
  }
  const beforeAnswers = asRecord(before.answers);
  const afterAnswers = asRecord(after.answers);
  const keys = [...new Set([...Object.keys(beforeAnswers), ...Object.keys(afterAnswers)])];
  return keys.map((key) => {
    const previous = stringifyAnswer(beforeAnswers[key]);
    const current = stringifyAnswer(afterAnswers[key]);
    return { label: labels.get(key) ?? key, before: previous, after: current, same: previous === current };
  });
}

function stringifyAnswer(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(", ") || "-";
  if (typeof value === "boolean") return value ? "Sim" : "Nao";
  if (value === undefined || value === null || value === "") return "-";
  return String(value);
}

function asRecord(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {};
}

const selectClassName =
  "min-h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";


