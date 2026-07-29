'use client';

import { useRouter } from 'next/navigation';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, getAccessToken, refreshSession, setAccessToken, setUnauthorizedHandler } from '@/lib/api';

export type StaffSession = {
  id: string;
  name: string;
  photoUrl?: string | null;
  role: string;
  permissions: string[];
  lastLoginAt?: string | null;
};

export type StudioDevice = {
  connected: boolean;
  studio?: {
    id: string;
    name: string;
    timezone?: string;
  };
  device?: {
    id: string;
    name?: string | null;
    lastUsedAt?: string;
  };
};

type AuthStatus = 'checking' | 'guest' | 'device' | 'authenticated';

type AuthContextValue = {
  status: AuthStatus;
  staff: StaffSession | null;
  device: StudioDevice | null;
  accessToken: string | null;
  setAuthenticated: (token: string, staff: StaffSession) => void;
  reloadMe: () => Promise<boolean>;
  lock: () => Promise<void>;
  logoutStudio: () => Promise<void>;
  setDeviceOnly: (device: StudioDevice) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [staff, setStaff] = useState<StaffSession | null>(null);
  const [device, setDevice] = useState<StudioDevice | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const clearStaffSession = useCallback(() => {
    setStaff(null);
    setToken(null);
    setAccessToken(null);
    setStatus((current) => (current === 'guest' ? 'guest' : 'device'));
  }, []);

  const reloadMe = useCallback(async () => {
    const result = await apiRequest<StaffSession>('/auth/me', {}, false);
    if (result.ok) {
      setStaff(result.data);
      setStatus('authenticated');
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearStaffSession();
      router.replace('/unlock');
    });
    return () => setUnauthorizedHandler(null);
  }, [clearStaffSession, router]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const deviceResult = await apiRequest<StudioDevice>('/auth/device/status', {}, false);
      if (cancelled) return;

      if (!deviceResult.ok) {
        setStatus('guest');
        setDevice(null);
        return;
      }

      setDevice(deviceResult.data);
      const refreshed = await refreshSession();
      if (cancelled) return;

      if (refreshed) {
        setToken(getAccessToken());
        const loaded = await reloadMe();
        if (loaded) return;
      }

      setStatus('device');
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [reloadMe]);

  const setAuthenticated = useCallback((newToken: string, newStaff: StaffSession) => {
    setAccessToken(newToken);
    setToken(newToken);
    setStaff(newStaff);
    setStatus('authenticated');
  }, []);

  const setDeviceOnly = useCallback((newDevice: StudioDevice) => {
    setDevice(newDevice);
    setStatus('device');
  }, []);

  const lock = useCallback(async () => {
    await apiRequest('/auth/session/lock', { method: 'POST' }, false);
    clearStaffSession();
    router.replace('/unlock');
  }, [clearStaffSession, router]);

  const logoutStudio = useCallback(async () => {
    await apiRequest('/auth/studio/logout', { method: 'POST' }, false);
    setStaff(null);
    setDevice(null);
    setToken(null);
    setAccessToken(null);
    setStatus('guest');
    router.replace('/login');
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      staff,
      device,
      accessToken: token,
      setAuthenticated,
      reloadMe,
      lock,
      logoutStudio,
      setDeviceOnly,
    }),
    [status, staff, device, token, setAuthenticated, reloadMe, lock, logoutStudio, setDeviceOnly],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
