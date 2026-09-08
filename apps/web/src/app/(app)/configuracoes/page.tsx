import Link from 'next/link';
import { Card, CardTitle } from '@/components/ui/card';

const links = [
  ['/avaliacoes/modelos', 'Avaliações e anamneses'],
  ['/configuracoes/estudio', 'Estúdio'],
  ['/configuracoes/assinatura', 'Assinatura mensal'],
  ['/configuracoes/unidades', 'Unidades'],
  ['/configuracoes/salas', 'Salas'],
  ['/configuracoes/reposicoes', 'Cancelamentos e reposicoes'],
  ['/configuracoes/dispositivos', 'Dispositivos'],
] as const;

export default function SettingsPage() {
  return (
    <section className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Gestão</h1>
        <p className="text-sm text-muted">Modelos, formulários e áreas administrativas do estúdio.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map(([href, label]) => (
          <Link key={href} href={href}>
            <Card className="transition hover:border-primary">
              <CardTitle>{label}</CardTitle>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

