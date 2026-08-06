'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Home,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { hasPermission, Permission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type NavItem = {
  href: string;
  label: string;
  permission: Permission;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  { href: '/', label: 'Inicio', permission: 'dashboard.read', icon: <Home size={18} /> },
  { href: '/agenda', label: 'Agenda', permission: 'classes.read_own', icon: <CalendarDays size={18} /> },
  { href: '/alunos', label: 'Alunos', permission: 'students.read', icon: <Users size={18} /> },
  { href: '/experimentais', label: 'Experimentais', permission: 'trial_students.manage', icon: <Activity size={18} /> },
  { href: '/reposicoes', label: 'Reposicoes', permission: 'attendance.read', icon: <ClipboardList size={18} /> },
  { href: '/financeiro', label: 'Financeiro', permission: 'payments.read', icon: <CreditCard size={18} /> },
  { href: '/equipe', label: 'Equipe', permission: 'staff.manage', icon: <ShieldCheck size={18} /> },
  { href: '/configuracoes', label: 'Gestao', permission: 'assessments.read', icon: <Settings size={18} /> },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { staff, lock, logoutStudio } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const visibleItems = useMemo(
    () => navItems.filter((item) => hasPermission(staff?.permissions, item.permission)),
    [staff?.permissions],
  );

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[260px_1fr]">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 border-r border-border bg-panel p-4 transition lg:static lg:w-auto',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-primary">Pilates Manager</p>
            <h1 className="text-lg font-semibold">Painel</h1>
          </div>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu">
            x
          </button>
        </div>
        <nav className="mt-6 grid gap-1">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted hover:bg-background hover:text-foreground',
                pathname === item.href && 'bg-background text-foreground',
              )}
              onClick={() => setOpen(false)}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-border bg-panel/95 px-4 backdrop-blur">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu />
          </button>
          <div className="hidden lg:block">
            <p className="text-sm text-muted">Profissional</p>
            <p className="font-semibold">{staff?.name ?? '-'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button className="bg-white text-foreground ring-1 ring-border hover:bg-background" onClick={lock}>
              Bloquear
            </Button>
            <Button className="bg-white text-foreground ring-1 ring-border hover:bg-background" onClick={logoutStudio}>
              <LogOut size={16} />
              Sair
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-5 pb-24 lg:px-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-panel lg:hidden">
        {visibleItems.slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'grid min-h-16 place-items-center gap-1 text-xs text-muted',
              pathname === item.href && 'text-primary',
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

