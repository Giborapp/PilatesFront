'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, CreditCard, RefreshCw } from 'lucide-react';
import { PermissionGate } from '@/components/layout/permission-gate';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/state';
import { apiRequest } from '@/lib/api';

type Subscription = {
  plan: 'STARTER' | 'PROFESSIONAL';
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
  monthlyAmount: string | number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  simulation: boolean;
};

const statusOptions: Subscription['status'][] = ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED'];

const planLabels: Record<Subscription['plan'], string> = {
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
};

const statusLabels: Record<Subscription['status'], string> = {
  TRIALING: 'Período de teste',
  ACTIVE: 'Ativa',
  PAST_DUE: 'Pagamento pendente',
  CANCELED: 'Cancelada',
};

export default function SubscriptionPage() {
  return (
    <PermissionGate permission="studio_settings.manage">
      <SubscriptionPanel />
    </PermissionGate>
  );
}

function SubscriptionPanel() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<Subscription['status'] | null>(null);
  const query = useQuery({
    queryKey: ['billing-subscription'],
    queryFn: async () => {
      const result = await apiRequest<Subscription>('/billing/subscription');
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
  });
  const mutation = useMutation({
    mutationFn: async (status: Subscription['status']) => {
      const result = await apiRequest<Subscription>('/billing/subscription/simulate', {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: async (data) => {
      setFeedback(`Status atualizado para ${statusLabels[data.status].toLowerCase()}.`);
      await queryClient.invalidateQueries({ queryKey: ['billing-subscription'] });
    },
    onError: (error: Error) => setFeedback(error.message),
  });

  if (query.isLoading) {
    return <p role="status">Carregando assinatura...</p>;
  }
  if (query.isError) {
    return <p role="alert" className="text-sm text-danger">{query.error.message}</p>;
  }
  if (!query.data) {
    return <EmptyState title="Assinatura indisponível" description="Não foi possível carregar a assinatura deste estúdio." />;
  }

  const subscription = query.data;
  const amount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(subscription.monthlyAmount));

  return (
    <section className="grid max-w-3xl gap-5">
      <header>
        <p className="text-sm font-semibold uppercase text-primary">Administração financeira</p>
        <h1 className="text-2xl font-semibold">Assinatura mensal</h1>
        <p className="mt-1 text-sm text-muted">Acompanhe o plano do estúdio e simule estados do ciclo de cobrança.</p>
      </header>

      <div className="flex items-start gap-3 rounded-md border border-primary/30 bg-primary/5 p-4 text-sm">
        <CheckCircle2 className="mt-0.5 shrink-0 text-primary" size={18} />
        <p>Esta é uma simulação. Nenhuma cobrança real ou integração com gateway de pagamento está ativa.</p>
      </div>

      <Card className="grid gap-4">
        <div className="flex items-center gap-3">
          <CreditCard className="text-primary" size={22} />
          <CardTitle>Plano atual</CardTitle>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          <Info label="Plano" value={planLabels[subscription.plan]} />
          <Info label="Valor mensal simulado" value={amount} />
          <Info label="Status" value={statusLabels[subscription.status]} />
          <Info label="Próximo ciclo" value={formatDate(subscription.currentPeriodEnd)} />
        </dl>
      </Card>

      <Card className="grid gap-4">
        <div>
          <CardTitle>Simulador de status</CardTitle>
          <p className="mt-1 text-sm text-muted">Use para validar a interface e os fluxos administrativos antes da integração de cobrança.</p>
        </div>
        <label className="grid gap-2 text-sm font-medium" htmlFor="subscription-status">
          Novo status
          <select
            id="subscription-status"
            className="min-h-11 rounded-md border border-border bg-white px-3"
            value={selectedStatus ?? subscription.status}
            onChange={(event) => setSelectedStatus(event.target.value as Subscription['status'])}
          >
            {statusOptions.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
          </select>
        </label>
        <Button
          disabled={mutation.isPending}
          onClick={() => void mutation.mutate(selectedStatus ?? subscription.status)}
        >
          <RefreshCw size={16} />
          {mutation.isPending ? 'Atualizando...' : 'Simular atualização'}
        </Button>
        {feedback ? <p role="status" className="text-sm text-muted">{feedback}</p> : null}
      </Card>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs uppercase text-muted">{label}</dt><dd className="font-semibold">{value}</dd></div>;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('pt-BR');
}
