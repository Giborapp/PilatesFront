import Link from "next/link";
import { RecordList } from "@/components/domain/record-list";

export default function StudentsPage() {
  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Alunos</h1>
          <p className="text-sm text-muted">
            Lista de alunos filtrada pelo estudio autenticado.
          </p>
        </div>
        <Link
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
          href="/alunos/novo"
        >
          Novo aluno
        </Link>
      </div>
      <RecordList
        title=""
        description=""
        endpoint="/students"
        queryKey="students"
        fields={[
          { key: "fullName", label: "Perfil", kind: "link", hrefPrefix: "/alunos" },
          { key: "preferredName", label: "Nome de uso" },
          { key: "phone", label: "Telefone" },
          { key: "email", label: "E-mail" },
          { key: "monthlyLessonLimit", label: "Aulas/mes" },
          { key: "monthlyLessonsRemaining", label: "Restantes" },
          { key: "status", label: "Status", kind: "status" },
          { key: "createdAt", label: "Cadastro", kind: "date" },
        ]}
      />
    </section>
  );
}
