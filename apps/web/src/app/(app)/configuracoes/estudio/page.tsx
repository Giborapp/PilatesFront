'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { applyBrandColor, normalizeStudio, studioInitials } from '@/lib/studio-branding';
import { PermissionGate } from '@/components/layout/permission-gate';
import { Card, CardTitle } from '@/components/ui/card';
import { ErrorState, LoadingState } from '@/components/ui/state';

export default function StudioSettingsPage() {
  return (
    <PermissionGate permission="studio_settings.manage">
      <StudioSettingsPanel />
    </PermissionGate>
  );
}

function StudioSettingsPanel() {
  const query = useQuery({
    queryKey: ['studio-current'],
    queryFn: async () => {
      const result = await apiRequest<unknown>('/studios/current');
      if (!result.ok) throw new Error(result.error.message);
      return normalizeStudio(result.data);
    },
  });

  const studio = query.data;

  useEffect(() => {
    if (studio?.brandColor) {
      applyBrandColor(studio.brandColor);
    }
  }, [studio?.brandColor]);

  if (query.isLoading) return <LoadingState label="Carregando estudio..." />;
  if (query.isError) return <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />;

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase text-primary">Configuracoes</p>
          <h1 className="text-2xl font-semibold">Estudio</h1>
          <p className="mt-1 text-sm text-muted">Dados, operacao e identidade visual do estudio autenticado.</p>
        </div>
        <Link className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" href="/onboarding">
          Abrir assistente
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardTitle>{studio?.name ?? 'Estudio'}</CardTitle>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <Info label="E-mail" value={studio?.email} />
            <Info label="Telefone" value={studio?.phone} />
            <Info label="WhatsApp" value={studio?.whatsapp} />
            <Info label="CNPJ" value={studio?.cnpj} />
            <Info label="Endereco" value={address(studio)} />
            <Info label="Fuso" value={studio?.timezone} />
          </dl>
        </Card>

        <Card>
          <CardTitle>Identidade</CardTitle>
          <div className="mt-4 flex items-center gap-3">
            {studio?.logo?.downloadUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={`Logo ${studio.name}`} className="size-20 rounded-md border border-border object-contain" src={studio.logo.downloadUrl} />
            ) : (
              <div className="grid size-20 place-items-center rounded-md bg-primary text-xl font-bold text-white">
                {studioInitials(studio?.name ?? 'PM')}
              </div>
            )}
            <div>
              <p className="text-sm text-muted">Cor de destaque</p>
              <p className="font-semibold">{studio?.brandColor ?? '-'}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted">
            {studio?.onboardingCompletedAt ? 'Onboarding concluido.' : 'Onboarding ainda nao concluido.'}
          </p>
        </Card>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-muted">{label}</dt>
      <dd className="mt-1 text-sm">{value && value.trim().length > 0 ? value : '-'}</dd>
    </div>
  );
}

function address(studio: ReturnType<typeof normalizeStudio> | undefined): string {
  if (!studio) return '';
  return [studio.street, studio.number, studio.complement, studio.district, studio.city, studio.state]
    .filter((part) => part && part.trim().length > 0)
    .join(', ');
}
