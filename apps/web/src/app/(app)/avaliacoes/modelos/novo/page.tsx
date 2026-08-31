"use client";

import { useRouter } from "next/navigation";
import { FormEvent, ReactNode, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";

type FieldType = "short_text" | "long_text" | "number" | "date" | "boolean" | "single_select" | "multi_select" | "numeric_scale" | "pain_scale" | "measure" | "section";

type FieldDraft = {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  optionsText: string;
  description: string;
  unit: string;
  minimum?: number;
  maximum?: number;
};

const fieldTypes: Array<[FieldType, string]> = [
  ["short_text", "Texto curto"],
  ["long_text", "Texto longo"],
  ["number", "Numero"],
  ["date", "Data"],
  ["boolean", "Sim/Nao"],
  ["single_select", "Escolha unica"],
  ["multi_select", "Multipla escolha"],
  ["numeric_scale", "Escala numerica"],
  ["pain_scale", "Escala de dor"],
  ["measure", "Medida com unidade"],
  ["section", "Titulo/seção"],
];

function newField(): FieldDraft {
  const id = `campo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  return { id, label: "", type: "short_text", required: false, optionsText: "", description: "", unit: "", minimum: 0, maximum: 10 };
}

export default function NewAssessmentTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState("Anamnese inicial");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState<"STUDENT" | "PROFESSIONAL">("STUDENT");
  const [fields, setFields] = useState<FieldDraft[]>([
    { ...newField(), id: "queixa_principal", label: "Queixa principal", type: "long_text", required: true },
    { ...newField(), id: "nivel_dor", label: "Nivel de dor", type: "pain_scale", required: false, minimum: 0, maximum: 10 },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(index: number, patch: Partial<FieldDraft>): void {
    setFields((current) => current.map((field, fieldIndex) => (fieldIndex === index ? { ...field, ...patch } : field)));
  }

  function removeField(index: number): void {
    setFields((current) => current.filter((_, fieldIndex) => fieldIndex !== index));
  }

  function moveField(index: number, offset: number): void {
    setFields((current) => {
      const target = index + offset;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const [field] = next.splice(index, 1);
      next.splice(target, 0, field);
      return next;
    });
  }

  function duplicateField(index: number): void {
    setFields((current) => {
      const source = current[index];
      const copy = { ...source, id: `${source.id}_copia_${Date.now()}` };
      return [...current.slice(0, index + 1), copy, ...current.slice(index + 1)];
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const normalizedFields = fields.map((field, index) => ({
      id: field.id || `campo_${index + 1}`,
      label: field.label.trim(),
      type: field.type,
      required: field.required,
      options: ["single_select", "multi_select"].includes(field.type)
        ? field.optionsText.split("\n").map((item) => item.trim()).filter(Boolean)
        : undefined,
      description: field.description || undefined,
      unit: field.unit || undefined,
      minimum: ["number", "numeric_scale", "pain_scale", "measure"].includes(field.type) ? field.minimum : undefined,
      maximum: ["number", "numeric_scale", "pain_scale", "measure"].includes(field.type) ? field.maximum : undefined,
    }));

    if (normalizedFields.some((field) => !field.label)) {
      setLoading(false);
      setError("Todas as perguntas precisam ter texto.");
      return;
    }
    if (normalizedFields.some((field) => ["single_select", "multi_select"].includes(field.type) && (!field.options || field.options.length === 0))) {
      setLoading(false);
      setError("Perguntas de escolha precisam ter pelo menos uma opcao.");
      return;
    }

    const result = await apiRequest("/assessment-templates", {
      method: "POST",
      body: JSON.stringify({ name, description: description || undefined, audience, fields: normalizedFields }),
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    router.replace("/avaliacoes/modelos");
  }

  return (
    <section className="grid max-w-4xl gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Novo formulario</h1>
        <p className="text-sm text-muted">Crie avaliacoes e anamneses para aplicar nos alunos.</p>
      </div>
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Card className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Nome
            <Input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Descricao
            <Input value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Publico
            <select className={selectClassName} value={audience} onChange={(event) => setAudience(event.target.value as "STUDENT" | "PROFESSIONAL")}>
              <option value="STUDENT">Aluno</option>
              <option value="PROFESSIONAL">Profissional autorizado</option>
            </select>
          </label>
        </Card>

        <div className="grid gap-3">
          {fields.map((field, index) => (
            <Card key={field.id} className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{field.type === "section" ? "Secao" : `Pergunta ${index + 1}`}</CardTitle>
                <div className="flex gap-1">
                  <IconButton label="Mover para cima" disabled={index === 0} onClick={() => moveField(index, -1)}><ArrowUp size={16} /></IconButton>
                  <IconButton label="Mover para baixo" disabled={index === fields.length - 1} onClick={() => moveField(index, 1)}><ArrowDown size={16} /></IconButton>
                  <IconButton label="Duplicar campo" onClick={() => duplicateField(index)}><Copy size={16} /></IconButton>
                  <IconButton label="Remover campo" disabled={fields.length === 1} onClick={() => removeField(index)}><Trash2 size={16} /></IconButton>
                </div>
              </div>
              <label className="grid gap-2 text-sm font-medium">
                Texto da pergunta
                <Input value={field.label} onChange={(event) => updateField(index, { label: event.target.value })} required />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">
                  Tipo
                  <select className={selectClassName} value={field.type} onChange={(event) => updateField(index, { type: event.target.value as FieldType })}>
                    {fieldTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-2 pt-7 text-sm font-medium">
                  <input type="checkbox" checked={field.required} onChange={(event) => updateField(index, { required: event.target.checked })} />
                  Obrigatoria
                </label>
              </div>
              <label className="grid gap-2 text-sm font-medium">
                Descricao de apoio
                <Input value={field.description} onChange={(event) => updateField(index, { description: event.target.value })} />
              </label>
              {["single_select", "multi_select"].includes(field.type) ? (
                <label className="grid gap-2 text-sm font-medium">
                  Opcoes, uma por linha
                  <textarea className="min-h-28 rounded-md border border-border p-3 text-sm" value={field.optionsText} onChange={(event) => updateField(index, { optionsText: event.target.value })} />
                </label>
              ) : null}
              {["number", "numeric_scale", "pain_scale", "measure"].includes(field.type) ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    Minimo
                    <Input type="number" value={field.minimum ?? 0} onChange={(event) => updateField(index, { minimum: Number(event.target.value) })} />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Maximo
                    <Input type="number" value={field.maximum ?? 10} onChange={(event) => updateField(index, { maximum: Number(event.target.value) })} />
                  </label>
                  {field.type === "measure" ? (
                    <label className="grid gap-2 text-sm font-medium">
                      Unidade
                      <Input value={field.unit} onChange={(event) => updateField(index, { unit: event.target.value })} placeholder="cm" />
                    </label>
                  ) : null}
                </div>
              ) : null}
            </Card>
          ))}
        </div>

        {error ? <p className="rounded-md bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="bg-white text-foreground ring-1 ring-border hover:bg-background" onClick={() => setFields((current) => [...current, newField()])}>
            Adicionar pergunta
          </Button>
          <Button disabled={loading}>{loading ? "Salvando..." : "Salvar formulario"}</Button>
        </div>
      </form>
    </section>
  );
}

const selectClassName =
  "min-h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function IconButton({ label, children, ...props }: { label: string; children: ReactNode; disabled?: boolean; onClick: () => void }) {
  return <button aria-label={label} className="grid size-10 place-items-center rounded-md border border-border text-muted hover:bg-background disabled:opacity-40" type="button" {...props}>{children}</button>;
}
