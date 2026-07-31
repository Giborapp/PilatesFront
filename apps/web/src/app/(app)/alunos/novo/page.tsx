"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewStudentPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [monthlyLessonLimit, setMonthlyLessonLimit] = useState(8);
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
        phone: phone || undefined,
        email: email || undefined,
        status: "ACTIVE",
        monthlyLessonLimit,
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
