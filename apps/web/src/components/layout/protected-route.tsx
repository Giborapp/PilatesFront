'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { LoadingState } from '@/components/ui/state';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'guest') {
      router.replace('/login');
    }
    if (status === 'device') {
      router.replace('/unlock');
    }
  }, [status, router, pathname]);

  if (status === 'checking') {
    return <LoadingState label="Verificando sessao..." />;
  }

  if (status !== 'authenticated') {
    return <LoadingState label="Redirecionando..." />;
  }

  return <>{children}</>;
}
