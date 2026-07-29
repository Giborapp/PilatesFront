'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth, StudioDevice } from '@/features/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type LoginResponse = {
  studio: {
    id: string;
    name: string;
    timezone: string;
    locale: string;
  };
  deviceExpiresAt: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { setDeviceOnly } = useAuth();
  const [email, setEmail] = useState('demo@pilates.local');
  const [password, setPassword] = useState('Demo@123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const result = await apiRequest<LoginResponse>('/auth/studio/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, deviceName: 'Web' }),
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    const device: StudioDevice = {
      connected: true,
      studio: {
        id: result.data.studio.id,
        name: result.data.studio.name,
        timezone: result.data.studio.timezone,
      },
    };
    setDeviceOnly(device);
    router.replace('/unlock');
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <section className="w-full max-w-md rounded-lg border border-border bg-panel p-6 shadow-sm">
        <p className="text-sm font-bold uppercase text-primary">Pilates Manager</p>
        <h1 className="mt-2 text-2xl font-semibold">Entrar no estudio</h1>
        <p className="mt-2 text-sm text-muted">Use o e-mail e a senha geral do estudio.</p>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-medium">
            E-mail do estudio
            <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Senha
            <span className="relative">
              <Input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="pr-11"
              />
              <button
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted"
                type="button"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          {error ? <p className="rounded-md bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
          <Button disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</Button>
        </form>
      </section>
    </main>
  );
}
