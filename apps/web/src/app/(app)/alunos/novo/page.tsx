"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewStudentPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [monthlyLessonLimit, setMonthlyLessonLimit] = useState(8);
  const [importantCareNotes, setImportantCareNotes] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await apiRequest<{ id: string }>("/students", {
      method: "POST",
      body: JSON.stringify({
        fullName,
        preferredName: preferredName || undefined,
        phone: phone || undefined,
        email: email || undefined,
        birthDate: birthDate || undefined,
        startDate: startDate || undefined,
        emergencyContactName: emergencyContactName || undefined,
        emergencyContactPhone: emergencyContactPhone || undefined,
        status: "ACTIVE",
        monthlyLessonLimit,
        importantCareNotes: importantCareNotes || undefined,
        generalNotes: generalNotes || undefined,
      }),
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    router.replace("/alunos");
  }

  return (
    <section className="max-w-xl">
      <h1 className="text-2xl font-semibold">Novo aluno</h1>
      <form
        className="mt-5 grid gap-4 rounded-lg border border-border bg-panel p-4"
        onSubmit={handleSubmit}
      >
        <label className="grid gap-2 text-sm font-medium">
          Nome completo
          <Input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Nome usado no dia a dia
          <Input
            value={preferredName}
            onChange={(event) => setPreferredName(event.target.value)}
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            Data de nascimento
            <Input
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
              type="date"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Inicio no estudio
            <Input
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              type="date"
            />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-medium">
          Telefone
          <Input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          E-mail
          <Input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            Contato de emergencia
            <Input
              value={emergencyContactName}
              onChange={(event) => setEmergencyContactName(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Telefone de emergencia
            <Input
              value={emergencyContactPhone}
              onChange={(event) => setEmergencyContactPhone(event.target.value)}
            />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-medium">
          Aulas por mes
          <Input
            min={0}
            onChange={(event) =>
              setMonthlyLessonLimit(Number(event.target.value))
            }
            required
            type="number"
            value={monthlyLessonLimit}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Cuidados importantes
          <textarea
            className="min-h-24 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) => setImportantCareNotes(event.target.value)}
            value={importantCareNotes}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Observacoes gerais
          <textarea
            className="min-h-24 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) => setGeneralNotes(event.target.value)}
            value={generalNotes}
          />
        </label>
        {error ? (
          <p className="rounded-md bg-danger/10 p-3 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <Button disabled={loading}>
          {loading ? "Salvando..." : "Salvar aluno"}
        </Button>
      </form>
    </section>
  );
}
