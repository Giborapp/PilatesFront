export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://pilates-manager-api.onrender.com';

const API_TIMEOUT_MS = 15_000;

let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export type ApiError = {
  status: number;
  message: string;
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export type UnknownRecord = Record<string, unknown>;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<ApiResult<T>> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  const timeout = createTimeoutSignal(options.signal);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
      signal: timeout.signal,
    });
    timeout.clear();

    if (response.status === 401 && retry) {
      const refreshed = await refreshSession();
      if (refreshed) {
        return apiRequest<T>(path, options, false);
      }
      onUnauthorized?.();
    }

    const data = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      return {
        ok: false,
        error: {
          status: response.status,
          message: getErrorMessage(data, response.status),
        },
      };
    }

    return { ok: true, data: data as T };
  } catch {
    timeout.clear();
    return {
      ok: false,
      error: { status: 0, message: 'Nao foi possivel conectar com o backend.' },
    };
  }
}

export async function refreshSession(): Promise<boolean> {
  const timeout = createTimeoutSignal();
  const response = await fetch(`${API_URL}/auth/session/refresh`, {
    method: 'POST',
    credentials: 'include',
    signal: timeout.signal,
  }).catch(() => null);
  timeout.clear();

  if (!response?.ok) {
    setAccessToken(null);
    return false;
  }

  const data = (await response.json().catch(() => null)) as unknown;
  if (isRecord(data) && typeof data.accessToken === 'string') {
    setAccessToken(data.accessToken);
    return true;
  }
  setAccessToken(null);
  return false;
}

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function asArray(value: unknown): UnknownRecord[] {
  if (Array.isArray(value)) {
    return value.filter(isRecord);
  }
  if (isRecord(value) && Array.isArray(value.items)) {
    return value.items.filter(isRecord);
  }
  if (isRecord(value)) {
    return [value];
  }
  return [];
}

export function readString(record: UnknownRecord, key: string, fallback = ''): string {
  const value = record[key];
  return typeof value === 'string' ? value : fallback;
}

export function readNumber(record: UnknownRecord, key: string, fallback = 0): number {
  const value = record[key];
  return typeof value === 'number' ? value : fallback;
}

function getErrorMessage(data: unknown, status: number): string {
  if (isRecord(data) && 'message' in data) {
    const message = data.message;
    if (Array.isArray(message)) {
      return message.map(String).join(', ');
    }
    return String(message);
  }
  if (status === 403) {
    return 'Voce nao tem permissao para esta acao.';
  }
  if (status === 401) {
    return 'Sessao expirada ou invalida.';
  }
  return 'Erro ao processar a solicitacao.';
}

function createTimeoutSignal(signal?: AbortSignal | null): {
  signal?: AbortSignal;
  clear: () => void;
} {
  if (signal) {
    return { signal, clear: () => undefined };
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeoutId),
  };
}
