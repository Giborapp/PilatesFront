"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { API_URL, apiRequest, getAccessToken, isRecord, readString } from "@/lib/api";
import { formatCnpj, formatCpf, onlyDigits } from "@/lib/br-documents";
import { useAuth, StudioDevice } from "@/features/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginResponse = {
  studio: {
    id: string;
    name: string;
    timezone: string;
    locale: string;
  };
  deviceExpiresAt: string;
  accessToken?: string;
  staff?: { id: string; name: string; role: string; permissions: string[] };
};

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const { setDeviceOnly, setAuthenticated } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studioName, setStudioName] = useState("");
  const [responsibleCpf, setResponsibleCpf] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [subscriptionPlan, setSubscriptionPlan] = useState("STARTER");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await apiRequest<LoginResponse>("/auth/studio/login", {
      method: "POST",
      body: JSON.stringify({ email, password, deviceName: "Web" }),
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
    router.replace("/unlock");
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await apiRequest<LoginResponse>("/auth/studio/register", {
      method: "POST",
      body: JSON.stringify({
        studioName,
        email,
        password,
        responsibleCpf: onlyDigits(responsibleCpf),
        cnpj: onlyDigits(cnpj) || undefined,
        subscriptionPlan,
        deviceName: "Web",
      }),
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }

    if (result.data.accessToken && result.data.staff) {
      setAuthenticated(result.data.accessToken, result.data.staff);
      if (logoFile) {
        try {
          await uploadRegistrationLogo(logoFile);
        } catch (uploadError) {
          setError(uploadError instanceof Error ? uploadError.message : "Nao foi possivel enviar a logo.");
        }
      }
      router.replace("/onboarding");
      return;
    }
    setDeviceOnly({
      connected: true,
      studio: {
        id: result.data.studio.id,
        name: result.data.studio.name,
        timezone: result.data.studio.timezone,
      },
    });
    router.replace("/unlock");
  }

  function changeMode(nextMode: Mode): void {
    setMode(nextMode);
    setError("");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <section className="w-full max-w-xl rounded-lg border border-border bg-panel p-6 shadow-sm">
        <div className="mx-auto grid size-16 place-items-center rounded-lg bg-primary text-xl font-bold text-white">
          PM
        </div>
        <p className="mt-4 text-center text-sm font-bold uppercase text-primary">
          Pilates Manager
        </p>
        <h1 className="mt-2 text-2xl font-semibold">
          {mode === "login" ? "Entrar no estudio" : "Criar conta do estudio"}
        </h1>

        <div className="mt-5 grid grid-cols-2 rounded-md border border-border bg-background p-1">
          <button
            className={
              mode === "login"
                ? "rounded bg-panel px-3 py-2 text-sm font-semibold shadow-sm"
                : "px-3 py-2 text-sm font-semibold text-muted"
            }
            onClick={() => changeMode("login")}
            type="button"
          >
            Login
          </button>
          <button
            className={
              mode === "register"
                ? "rounded bg-panel px-3 py-2 text-sm font-semibold shadow-sm"
                : "px-3 py-2 text-sm font-semibold text-muted"
            }
            onClick={() => changeMode("register")}
            type="button"
          >
            Criar conta
          </button>
        </div>

        {mode === "login" ? (
          <form className="mt-6 grid gap-4" onSubmit={handleLogin}>
            <label className="grid gap-2 text-sm font-medium">
              E-mail do estudio
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Senha
              <span className="relative">
                <Input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="pr-11"
                />
                <button
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            {error ? (
              <p className="rounded-md bg-danger/10 p-3 text-sm text-danger">
                {error}
              </p>
            ) : null}
            <Button disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        ) : (
          <form className="mt-6 grid gap-4" onSubmit={handleRegister}>
            <label className="grid gap-2 text-sm font-medium">
              Nome do estudio
              <Input
                value={studioName}
                onChange={(event) => setStudioName(event.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              E-mail do estudio
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                autoComplete="email"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Senha
              <span className="relative">
                <Input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="pr-11"
                />
                <button
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              CPF do responsavel
              <Input
                value={responsibleCpf}
                onChange={(event) => setResponsibleCpf(formatCpf(event.target.value))}
                inputMode="numeric"
                required
                minLength={14}
                maxLength={14}
                placeholder="000.000.000-00"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              CNPJ (opcional)
              <Input
                value={cnpj}
                onChange={(event) => setCnpj(formatCnpj(event.target.value))}
                inputMode="numeric"
                maxLength={18}
                placeholder="00.000.000/0000-00"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Plano mensal (simulacao)
              <select className="min-h-11 rounded-md border border-border bg-white px-3" value={subscriptionPlan} onChange={(event) => setSubscriptionPlan(event.target.value)}>
                <option value="STARTER">Essencial - R$ 99/mes</option>
                <option value="PROFESSIONAL">Profissional - R$ 179/mes</option>
              </select>
              <span className="text-xs text-muted">Nenhuma cobranca real e feita nesta versao.</span>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Logo do studio (opcional)
              <Input accept="image/png,image/webp" type="file" onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)} />
              <span className="text-xs text-muted">PNG ou WebP, preferencialmente transparente, ate 2 MB.</span>
            </label>
            {error ? (
              <p className="rounded-md bg-danger/10 p-3 text-sm text-danger">
                {error}
              </p>
            ) : null}
            <Button disabled={loading}>
              {loading ? "Criando..." : "Criar conta"}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}

async function uploadRegistrationLogo(file: File): Promise<void> {
  if (!['image/png', 'image/webp'].includes(file.type) || file.size > 2_000_000) {
    throw new Error('A logo deve ser PNG ou WebP e ter no maximo 2 MB.');
  }
  const request = await apiRequest<unknown>('/studios/logo/uploads', {
    method: 'POST',
    body: JSON.stringify({ originalName: file.name, mimeType: file.type, size: file.size }),
  });
  if (!request.ok || !isRecord(request.data) || !isRecord(request.data.fileAsset)) {
    throw new Error(request.ok ? 'Resposta de upload invalida.' : request.error.message);
  }
  const fileId = readString(request.data.fileAsset, 'id');
  if (!fileId) throw new Error('Resposta de upload incompleta.');
  await uploadLogoContent(fileId, file);
  const confirm = await apiRequest(`/studios/logo/${fileId}/confirm`, { method: 'POST' });
  if (!confirm.ok) throw new Error(confirm.error.message);
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

