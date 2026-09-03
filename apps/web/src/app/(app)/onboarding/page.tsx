'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ImagePlus, Trash2 } from 'lucide-react';
import { API_URL, apiRequest, getAccessToken, isRecord, readString } from '@/lib/api';
import {
  STUDIO_BRAND_COLORS,
  StudioProfile,
  applyBrandColor,
  normalizeStudio,
  studioInitials,
} from '@/lib/studio-branding';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ErrorState, LoadingState } from '@/components/ui/state';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3 | 4;
type PlanDraft = {
  id: string;
  name: string;
  sessionsPerWeek: number;
  defaultAmount: string;
  defaultBillingDay: string;
};

const timezones = ['America/Sao_Paulo', 'America/Manaus', 'America/Cuiaba', 'America/Fortaleza'];

export default function OnboardingPage() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    phone: '',
    whatsapp: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    district: '',
    city: '',
    state: '',
    cnpj: '',
    timezone: 'America/Sao_Paulo',
  });
  const [operation, setOperation] = useState({
    defaultClassDurationMinutes: 50,
    defaultClassCapacity: 6,
    cancellationNoticeHours: 12,
    maxJustifiedAbsences: 1,
    replacementCreditValidityDays: 60,
    requireJustificationText: true,
    replacementNoShowConsumesCredit: true,
  });
  const [plans, setPlans] = useState<PlanDraft[]>([
    createPlanDraft('Plano 1x por semana', 1),
    createPlanDraft('Plano 2x por semana', 2),
    createPlanDraft('Plano 3x por semana', 3),
  ]);
  const [brandColor, setBrandColor] = useState<string>(STUDIO_BRAND_COLORS[0]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');

  const query = useQuery({
    queryKey: ['studio-onboarding'],
    queryFn: async () => {
      const result = await apiRequest<unknown>('/studios/onboarding');
      if (!result.ok) throw new Error(result.error.message);
      return normalizeStudio(result.data);
    },
  });

  const studio = query.data;

  useEffect(() => {
    if (!studio) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStep(nextStep(studio));
    setProfile({
      phone: studio.phone ?? '',
      whatsapp: studio.whatsapp ?? '',
      zipCode: studio.zipCode ?? '',
      street: studio.street ?? '',
      number: studio.number ?? '',
      complement: studio.complement ?? '',
      district: studio.district ?? '',
      city: studio.city ?? '',
      state: studio.state ?? '',
      cnpj: studio.cnpj ?? '',
      timezone: studio.timezone,
    });
    if (studio.settings) {
      setOperation({
        defaultClassDurationMinutes: studio.settings.defaultClassDurationMinutes,
        defaultClassCapacity: studio.settings.defaultClassCapacity,
        cancellationNoticeHours: studio.settings.cancellationNoticeHours,
        maxJustifiedAbsences: studio.settings.maxJustifiedAbsences,
        replacementCreditValidityDays: studio.settings.replacementCreditValidityDays,
        requireJustificationText: studio.settings.requireJustificationText,
        replacementNoShowConsumesCredit: studio.settings.replacementNoShowConsumesCredit,
      });
    }
    setBrandColor(studio.brandColor);
    applyBrandColor(studio.brandColor);
  }, [studio]);

  const activeLogo = logoPreview || studio?.logo?.downloadUrl || '';
  const completionLabel = studio?.onboardingCompletedAt ? 'Concluido' : 'Em andamento';

  async function submitProfile(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await save('/studios/onboarding/profile', 'PATCH', normalizePayload(profile), 2);
  }

  async function submitOperation(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await save('/studios/onboarding/operation', 'PATCH', operation, 3);
  }

  async function submitPlans(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const payload = {
      plans: plans
        .filter((plan) => plan.name.trim().length > 0)
        .map((plan) => ({
          name: plan.name.trim(),
          sessionsPerWeek: plan.sessionsPerWeek,
          defaultAmount: plan.defaultAmount || undefined,
          defaultBillingDay: plan.defaultBillingDay ? Number(plan.defaultBillingDay) : undefined,
        })),
    };
    await save('/studios/onboarding/plans', 'POST', payload, 4);
  }

  async function submitBranding(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (logoFile) {
        await uploadLogo(logoFile);
      }
      const result = await apiRequest('/studios/branding', {
        method: 'PATCH',
        body: JSON.stringify({ brandColor, completeOnboarding: true }),
      });
      if (!result.ok) throw new Error(result.error.message);
      applyBrandColor(brandColor);
      setLogoFile(null);
      setLogoPreview('');
      setMessage('Configuracao concluida.');
      await invalidateStudio(queryClient);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erro ao salvar identidade visual.');
    } finally {
      setSaving(false);
    }
  }

  async function save(endpoint: string, method: 'PATCH' | 'POST', body: unknown, next: Step): Promise<void> {
    setSaving(true);
    setError('');
    setMessage('');
    const result = await apiRequest(endpoint, { method, body: JSON.stringify(body) });
    setSaving(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setStep(next);
    setMessage('Etapa salva.');
    await invalidateStudio(queryClient);
  }

  async function uploadLogo(file: File): Promise<void> {
    if (!['image/png', 'image/webp'].includes(file.type)) {
      throw new Error('A logo deve ser PNG ou WebP.');
    }
    if (file.size > 2_000_000) {
      throw new Error('A logo deve ter no maximo 2 MB.');
    }
    const request = await apiRequest<unknown>('/studios/logo/uploads', {
      method: 'POST',
      body: JSON.stringify({
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
      }),
    });
    if (!request.ok) throw new Error(request.error.message);
    if (!isRecord(request.data) || !isRecord(request.data.fileAsset)) {
      throw new Error('Resposta de upload invalida.');
    }
    const fileId = readString(request.data.fileAsset, 'id');
    if (!fileId) {
      throw new Error('Resposta de upload incompleta.');
    }
    await uploadLogoContent(fileId, file);
    const confirm = await apiRequest(`/studios/logo/${fileId}/confirm`, { method: 'POST' });
    if (!confirm.ok) throw new Error(confirm.error.message);
  }

  async function removeLogo(): Promise<void> {
    setSaving(true);
    setError('');
    const result = await apiRequest('/studios/logo', { method: 'DELETE' });
    setSaving(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setLogoFile(null);
    setLogoPreview('');
    setMessage('Logo removida.');
    await invalidateStudio(queryClient);
  }

  if (query.isLoading) return <LoadingState label="Carregando configuracao..." />;
  if (query.isError) return <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />;

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase text-primary">Configuracao inicial</p>
          <h1 className="text-2xl font-semibold">{studio?.name ?? 'Estudio'}</h1>
          <p className="mt-1 text-sm text-muted">{completionLabel}</p>
        </div>
        <StepTabs current={step} onChange={setStep} />
      </div>

      {message ? <p className="rounded-md bg-success/10 p-3 text-sm text-success">{message}</p> : null}
      {error ? <p className="rounded-md bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}

      {step === 1 ? (
        <Card>
          <CardTitle>Dados do estudio</CardTitle>
          <form className="mt-4 grid gap-4" onSubmit={submitProfile}>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Telefone" value={profile.phone} onChange={(value) => setProfile({ ...profile, phone: value })} />
              <TextField label="WhatsApp" value={profile.whatsapp} onChange={(value) => setProfile({ ...profile, whatsapp: value })} />
              <TextField label="CEP" value={profile.zipCode} onChange={(value) => setProfile({ ...profile, zipCode: value })} />
              <TextField label="Endereco" value={profile.street} onChange={(value) => setProfile({ ...profile, street: value })} />
              <TextField label="Numero" value={profile.number} onChange={(value) => setProfile({ ...profile, number: value })} />
              <TextField label="Complemento" value={profile.complement} onChange={(value) => setProfile({ ...profile, complement: value })} />
              <TextField label="Bairro" value={profile.district} onChange={(value) => setProfile({ ...profile, district: value })} />
              <TextField label="Cidade" value={profile.city} onChange={(value) => setProfile({ ...profile, city: value })} />
              <TextField label="Estado" value={profile.state} maxLength={2} onChange={(value) => setProfile({ ...profile, state: value.toUpperCase().slice(0, 2) })} />
              <TextField label="CNPJ" value={profile.cnpj} onChange={(value) => setProfile({ ...profile, cnpj: value })} />
              <label className="grid gap-2 text-sm font-medium">
                Fuso horario
                <select className={selectClassName} value={profile.timezone} onChange={(event) => setProfile({ ...profile, timezone: event.target.value })}>
                  {timezones.map((timezone) => <option key={timezone} value={timezone}>{timezone}</option>)}
                </select>
              </label>
            </div>
            <Button disabled={saving}>{saving ? 'Salvando...' : 'Salvar e continuar'}</Button>
          </form>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card>
          <CardTitle>Operacao</CardTitle>
          <p className="mt-2 text-sm text-muted">
            Defina as regras padrao usadas na agenda, faltas justificadas e creditos de reposicao.
          </p>
          <form className="mt-4 grid gap-4" onSubmit={submitOperation}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <NumberField label="Duracao padrao da aula" help="Tempo sugerido ao criar novos horarios, em minutos." value={operation.defaultClassDurationMinutes} min={15} onChange={(value) => setOperation({ ...operation, defaultClassDurationMinutes: value })} />
              <NumberField label="Capacidade padrao da turma" help="Quantidade de alunos sugerida ao criar uma sala ou horario." value={operation.defaultClassCapacity} min={1} onChange={(value) => setOperation({ ...operation, defaultClassCapacity: value })} />
              <NumberField label="Antecedencia para cancelamento" help="Horas minimas antes da aula para o aluno cancelar sem atendimento manual." value={operation.cancellationNoticeHours} min={0} onChange={(value) => setOperation({ ...operation, cancellationNoticeHours: value })} />
              <NumberField label="Faltas justificadas por periodo" help="Limite de faltas que podem gerar reposicao dentro do periodo configurado." value={operation.maxJustifiedAbsences} min={0} onChange={(value) => setOperation({ ...operation, maxJustifiedAbsences: value })} />
            </div>
            <label className="grid gap-2 text-sm font-medium">
              Validade do credito de reposicao
              <select className={selectClassName} value={operation.replacementCreditValidityDays} onChange={(event) => setOperation({ ...operation, replacementCreditValidityDays: Number(event.target.value) })}>
                {[30, 60, 90].map((days) => <option key={days} value={days}>{days} dias</option>)}
              </select>
              <span className="text-xs font-normal text-muted">Prazo para o aluno usar a reposicao depois que o credito for criado.</span>
            </label>
            <Toggle label="Exigir texto de justificativa" help="Quando ativo, a equipe precisa informar o motivo ao marcar falta justificada." checked={operation.requireJustificationText} onChange={(checked) => setOperation({ ...operation, requireJustificationText: checked })} />
            <Toggle label="Consumir credito se o aluno faltar a reposicao" help="Quando ativo, uma falta na aula de reposicao usa o credito mesmo sem presenca." checked={operation.replacementNoShowConsumesCredit} onChange={(checked) => setOperation({ ...operation, replacementNoShowConsumesCredit: checked })} />
            <Button disabled={saving}>{saving ? 'Salvando...' : 'Salvar e continuar'}</Button>
          </form>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card>
          <CardTitle>Planos iniciais</CardTitle>
          <form className="mt-4 grid gap-4" onSubmit={submitPlans}>
            {plans.map((plan) => (
              <div className="grid gap-3 rounded-md border border-border bg-background p-3 md:grid-cols-[1fr_140px_140px_140px_auto]" key={plan.id}>
                <TextField label="Nome" value={plan.name} onChange={(value) => setPlans(updatePlan(plans, plan.id, { name: value }))} />
                <NumberField label="Aulas/semana" value={plan.sessionsPerWeek} min={1} onChange={(value) => setPlans(updatePlan(plans, plan.id, { sessionsPerWeek: value }))} />
                <TextField label="Valor" value={plan.defaultAmount} inputMode="decimal" onChange={(value) => setPlans(updatePlan(plans, plan.id, { defaultAmount: value.replace(',', '.') }))} />
                <TextField label="Vencimento" value={plan.defaultBillingDay} inputMode="numeric" onChange={(value) => setPlans(updatePlan(plans, plan.id, { defaultBillingDay: value.replace(/\D/g, '').slice(0, 2) }))} />
                <button className="self-end rounded-md border border-border p-3 text-danger" type="button" onClick={() => setPlans(plans.filter((item) => item.id !== plan.id))} aria-label="Remover plano">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button className="bg-white text-foreground ring-1 ring-border hover:bg-background" type="button" onClick={() => setPlans([...plans, createPlanDraft('Plano personalizado', 1)])}>
                Adicionar plano
              </Button>
              <Button disabled={saving}>{saving ? 'Salvando...' : 'Salvar e continuar'}</Button>
            </div>
          </form>
        </Card>
      ) : null}

      {step === 4 ? (
        <Card>
          <CardTitle>Identidade visual</CardTitle>
          <form className="mt-4 grid gap-5" onSubmit={submitBranding}>
            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <div className="grid gap-3">
                <p className="text-sm font-medium">Cor de destaque</p>
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-[repeat(15,minmax(0,1fr))]">
                  {STUDIO_BRAND_COLORS.map((color) => (
                    <button
                      aria-label={`Selecionar cor ${color}`}
                      className={cn('grid size-10 place-items-center rounded-md border border-border', brandColor === color && 'ring-2 ring-primary ring-offset-2')}
                      key={color}
                      onClick={() => {
                        setBrandColor(color);
                        applyBrandColor(color);
                      }}
                      style={{ backgroundColor: color }}
                      type="button"
                    >
                      {brandColor === color ? <Check className="text-white" size={18} /> : null}
                    </button>
                  ))}
                </div>
                <label className="grid max-w-md gap-2 text-sm font-medium">
                  Logo PNG ou WebP
                  <span className="flex min-h-11 items-center gap-3 rounded-md border border-border bg-white px-3 py-2">
                    <ImagePlus size={18} />
                    <span className="truncate text-muted">{logoFile?.name ?? 'Selecionar arquivo ate 2 MB'}</span>
                    <input className="sr-only" accept="image/png,image/webp" type="file" onChange={handleLogo(setLogoFile, setLogoPreview, setError)} />
                  </span>
                </label>
              </div>
              <div className="grid content-start gap-3 rounded-md border border-border bg-background p-4">
                <p className="text-sm font-medium">Previa</p>
                <div className="flex items-center gap-3 rounded-md bg-white p-3">
                  {activeLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="Previa da logo" className="size-16 rounded-md object-contain" src={activeLogo} />
                  ) : (
                    <div className="grid size-16 place-items-center rounded-md text-lg font-bold text-white" style={{ backgroundColor: brandColor }}>
                      {studioInitials(studio?.name ?? 'PM')}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{studio?.name ?? 'Estudio'}</p>
                    <p className="text-sm text-muted">Botoes, links e indicadores usam a cor escolhida.</p>
                  </div>
                </div>
                {studio?.logo ? (
                  <Button className="bg-white text-danger ring-1 ring-border hover:bg-background" disabled={saving} onClick={() => void removeLogo()} type="button">
                    <Trash2 size={16} />
                    Remover logo
                  </Button>
                ) : null}
              </div>
            </div>
            <Button disabled={saving}>{saving ? 'Salvando...' : 'Concluir configuracao'}</Button>
          </form>
        </Card>
      ) : null}
    </section>
  );
}

function StepTabs({ current, onChange }: { current: Step; onChange: (step: Step) => void }) {
  const steps: Array<[Step, string]> = [[1, 'Dados'], [2, 'Operacao'], [3, 'Planos'], [4, 'Visual']];
  return (
    <div className="grid grid-cols-4 rounded-md border border-border bg-panel p-1">
      {steps.map(([step, label]) => (
        <button className={cn('rounded px-3 py-2 text-sm font-semibold text-muted', current === step && 'bg-background text-foreground')} key={step} onClick={() => onChange(step)} type="button">
          {label}
        </button>
      ))}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: 'text' | 'decimal' | 'numeric';
  maxLength?: number;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <Input inputMode={inputMode} maxLength={maxLength} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function NumberField({ label, help, value, min, onChange }: { label: string; help?: string; value: number; min: number; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <Input min={min} type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
      {help ? <span className="text-xs font-normal text-muted">{help}</span> : null}
    </label>
  );
}

function Toggle({ label, help, checked, onChange }: { label: string; help?: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 rounded-md border border-border bg-background p-3 text-sm font-medium">
      <input checked={checked} className="mt-0.5 size-5 accent-primary" type="checkbox" onChange={(event) => onChange(event.target.checked)} />
      <span>
        <span className="block">{label}</span>
        {help ? <span className="mt-1 block text-xs font-normal text-muted">{help}</span> : null}
      </span>
    </label>
  );
}

function createPlanDraft(name: string, sessionsPerWeek: number): PlanDraft {
  return { id: crypto.randomUUID(), name, sessionsPerWeek, defaultAmount: '', defaultBillingDay: '' };
}

function updatePlan(plans: PlanDraft[], id: string, update: Partial<PlanDraft>): PlanDraft[] {
  return plans.map((plan) => (plan.id === id ? { ...plan, ...update } : plan));
}

function nextStep(studio: StudioProfile): Step {
  if (studio.onboardingCompletedAt) return 4;
  if (studio.onboardingStep >= 3) return 4;
  if (studio.onboardingStep === 2) return 3;
  if (studio.onboardingStep === 1) return 2;
  return 1;
}

function normalizePayload(values: Record<string, string>): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, value.trim().length > 0 ? value.trim() : undefined]),
  );
}

function handleLogo(
  setLogoFile: (file: File | null) => void,
  setLogoPreview: (url: string) => void,
  setError: (message: string) => void,
): (event: ChangeEvent<HTMLInputElement>) => void {
  return (event) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setLogoFile(null);
      setLogoPreview('');
      return;
    }
    if (!['image/png', 'image/webp'].includes(file.type)) {
      setError('A logo deve ser PNG ou WebP.');
      setLogoFile(null);
      setLogoPreview('');
      return;
    }
    if (file.size > 2_000_000) {
      setError('A logo deve ter no maximo 2 MB.');
      setLogoFile(null);
      setLogoPreview('');
      return;
    }
    setError('');
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };
}

async function invalidateStudio(queryClient: ReturnType<typeof useQueryClient>): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['studio-current'] }),
    queryClient.invalidateQueries({ queryKey: ['studio-onboarding'] }),
    queryClient.invalidateQueries({ queryKey: ['plans'] }),
  ]);
}

async function uploadLogoContent(fileId: string, file: File): Promise<void> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Sessao expirada ou invalida.');
  }
  const response = await fetch(`${API_URL}/studios/logo/${fileId}/content`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': file.type,
    },
    credentials: 'include',
    body: file,
  }).catch(() => null);
  if (!response?.ok) {
    throw new Error(response ? `Falha ao enviar logo (${response.status}).` : 'Nao foi possivel enviar a logo.');
  }
}

const selectClassName =
  'min-h-11 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';
