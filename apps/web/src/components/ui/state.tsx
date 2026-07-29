import { Button } from './button';

export function LoadingState({ label = 'Carregando...' }: { label?: string }) {
  return <div className="rounded-lg border border-border bg-panel p-6 text-sm text-muted">{label}</div>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-panel p-6">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-danger/30 bg-danger/5 p-6">
      <h3 className="font-semibold text-danger">Algo deu errado</h3>
      <p className="mt-1 text-sm text-danger">{message}</p>
      {onRetry ? (
        <Button className="mt-4 bg-danger hover:bg-danger" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}
