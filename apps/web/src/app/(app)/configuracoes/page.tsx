import Link from 'next/link';
import { Card, CardTitle } from '@/components/ui/card';

const links = [
  ['/configuracoes/estudio', 'Estudio'],
  ['/configuracoes/unidades', 'Unidades'],
  ['/configuracoes/salas', 'Salas'],
  ['/configuracoes/reposicoes', 'Cancelamentos e reposicoes'],
  ['/configuracoes/dispositivos', 'Dispositivos'],
] as const;

export default function SettingsPage() {
  return (
    <section className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Configuracoes</h1>
        <p className="text-sm text-muted">Areas administrativas do estudio.</p>
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
