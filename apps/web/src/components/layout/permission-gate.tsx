'use client';

import { ReactNode } from 'react';
import { hasPermission, Permission } from '@/lib/permissions';
import { useAuth } from '@/features/auth/auth-provider';
import { EmptyState } from '@/components/ui/state';

export function PermissionGate({
  permission,
  children,
  fallback,
}: {
  permission: Permission | Permission[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { staff } = useAuth();
  if (!hasPermission(staff?.permissions, permission)) {
    return (
      fallback ?? (
        <EmptyState
          title="Voce nao tem permissao"
          description="O acesso a esta area depende de permissao liberada pelo backend."
        />
      )
    );
  }

  return <>{children}</>;
}
