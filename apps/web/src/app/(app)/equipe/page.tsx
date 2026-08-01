"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PermissionGate } from "@/components/layout/permission-gate";
import { apiRequest, asArray, readString, UnknownRecord } from "@/lib/api";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/state";
import { StatusBadge } from "@/components/domain/badges";

const roles = [
  ["PROFESSIONAL", "Profissional"],
  ["RECEPTION", "Recepcao"],
  ["FINANCE", "Financeiro"],
  ["ADMIN", "Admin"],
] as const;

export default function StaffPage() {
  return (
    <PermissionGate permission="staff.manage">
      <StaffManager />
    </PermissionGate>
  );
}

function StaffManager() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [role, setRole] = useState("PROFESSIONAL");
  const [pin, setPin] = useState("");

  const query = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const result = await apiRequest<unknown>("/staff");
      if (!result.ok) throw new Error(result.error.message);
      return asArray(result.data);
    },
  });

  const createStaff = useMutation({
    mutationFn: async () => {
      const result = await apiRequest("/staff", {
        method: "POST",
        body: JSON.stringify({ name, role, pin }),
      });
      if (!result.ok) throw new Error(result.error.message);
    },
    onSuccess: () => {
      setName("");
      setPin("");
      void queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    createStaff.mutate();
  }

  return (
    <section className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Equipe</h1>
        <p className="text-sm text-muted">
          Crie acessos por PIN para profissionais, recepcao, financeiro e
          admins.
        </p>
      </div>

      <Card>
        <CardTitle>Novo membro</CardTitle>
        <form
          className="mt-4 grid gap-4 md:grid-cols-[1fr_180px_120px_auto]"
          onSubmit={submit}
        >
          <label className="grid gap-2 text-sm font-medium">
            Nome
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Funcao
            <select
              className="min-h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              onChange={(event) => setRole(event.target.value)}
              value={role}
            >
              {roles.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            PIN
            <Input
              inputMode="numeric"
              onChange={(event) =>
                setPin(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              pattern="\d{4}"
              required
              value={pin}
            />
          </label>
          <div className="flex items-end">
            <Button
              className="w-full"
              disabled={createStaff.isPending || pin.length !== 4}
            >
              {createStaff.isPending ? "Criando..." : "Criar"}
            </Button>
          </div>
        </form>
        {createStaff.isError ? (
          <p className="mt-3 rounded-md bg-danger/10 p-3 text-sm text-danger">
            {createStaff.error.message}
          </p>
        ) : null}
      </Card>

      {query.isLoading ? <LoadingState /> : null}
      {query.isError ? (
        <ErrorState
          message={query.error.message}
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {query.data?.length === 0 ? (
        <EmptyState
          title="Sem equipe"
          description="Nenhum membro cadastrado."
        />
      ) : null}

      <div className="grid gap-3">
        {query.data?.map((record) => (
          <StaffCard key={readString(record, "id")} record={record} />
        ))}
      </div>
    </section>
  );
}

function StaffCard({ record }: { record: UnknownRecord }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>{readString(record, "name")}</CardTitle>
          <p className="mt-1 text-sm text-muted">
            {roleLabel(readString(record, "role"))}
          </p>
          <p className="mt-1 text-sm text-muted">
            Ultimo acesso:{" "}
            {readString(record, "lastLoginAt")
              ? new Date(readString(record, "lastLoginAt")).toLocaleString(
                  "pt-BR",
                )
              : "-"}
          </p>
        </div>
        <StatusBadge value={String(record.active ? "ACTIVE" : "INACTIVE")} />
      </div>
    </Card>
  );
}

function roleLabel(role: string): string {
  return roles.find(([value]) => value === role)?.[1] ?? role;
}
