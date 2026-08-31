"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiRequest } from "@/lib/api";
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
};

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const { setDeviceOnly } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studioName, setStudioName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminPin, setAdminPin] = useState("");
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
        adminName,
        adminPin,
        deviceName: "Web",
      }),
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error.message);
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
            <div className="grid gap-4 md:grid-cols-[1fr_120px]">
              <label className="grid gap-2 text-sm font-medium">
                Nome do admin
                <Input
                  value={adminName}
                  onChange={(event) => setAdminName(event.target.value)}
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                PIN admin
                <Input
                  value={adminPin}
                  onChange={(event) =>
                    setAdminPin(
                      event.target.value.replace(/\D/g, "").slice(0, 4),
                    )
                  }
                  inputMode="numeric"
                  pattern="\d{4}"
                  required
                />
              </label>
            </div>
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

