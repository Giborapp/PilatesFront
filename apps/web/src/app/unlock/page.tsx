'use client';

import { Delete } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { StaffSession, useAuth } from '@/features/auth/auth-provider';
import { Button } from '@/components/ui/button';

type UnlockResponse = {
  accessToken: string;
  staff: StaffSession;
};

const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

export default function UnlockPage() {
  const router = useRouter();
  const { device, status, setAuthenticated, logoutStudio } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'guest') router.replace('/login');
    if (status === 'authenticated') router.replace('/');
  }, [status, router]);

  const submitPin = useCallback(async (value: string) => {
    setLoading(true);
    setError('');
    const result = await apiRequest<UnlockResponse>('/auth/pin/unlock', {
      method: 'POST',
      body: JSON.stringify({ pin: value }),
    });
    setLoading(false);
    if (!result.ok) {
      setPin('');
      setError(result.error.status === 403 ? 'PIN temporariamente bloqueado.' : 'PIN incorreto.');
      return;
    }
    setAuthenticated(result.data.accessToken, result.data.staff);
    router.replace('/');
  }, [router, setAuthenticated]);

  function appendDigit(digit: string) {
    const nextPin = `${pin}${digit}`.slice(0, 4);
    setPin(nextPin);
    if (nextPin.length === 4 && !loading) {
      void submitPin(nextPin);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <section className="w-full max-w-sm rounded-lg border border-border bg-panel p-6 text-center shadow-sm">
        <p className="text-sm text-muted">{device?.studio?.name ?? 'Estudio conectado'}</p>
        <h1 className="mt-2 text-2xl font-semibold">Digite seu PIN</h1>
        <div className="mt-6 flex justify-center gap-3" aria-label="PIN digitado">
          {[0, 1, 2, 3].map((index) => (
            <span key={index} className="size-4 rounded-full border border-primary" data-filled={pin.length > index} />
          ))}
        </div>
        {error ? <p className="mt-4 rounded-md bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {digits.slice(0, 9).map((digit) => (
            <button
              key={digit}
              className="min-h-14 rounded-md border border-border bg-white text-xl font-semibold"
              disabled={loading || pin.length >= 4}
              onClick={() => appendDigit(digit)}
            >
              {digit}
            </button>
          ))}
          <button className="min-h-14 rounded-md border border-border bg-white" onClick={() => setPin('')} type="button">
            Limpar
          </button>
          <button
            className="min-h-14 rounded-md border border-border bg-white text-xl font-semibold"
            disabled={loading || pin.length >= 4}
            onClick={() => appendDigit('0')}
            type="button"
          >
            0
          </button>
          <button
            aria-label="Apagar"
            className="grid min-h-14 place-items-center rounded-md border border-border bg-white"
            onClick={() => setPin((current) => current.slice(0, -1))}
            type="button"
          >
            <Delete />
          </button>
        </div>
        <Button className="mt-6 w-full bg-white text-foreground ring-1 ring-border hover:bg-background" onClick={logoutStudio}>
          Sair da conta do estudio
        </Button>
      </section>
    </main>
  );
}
