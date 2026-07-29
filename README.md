# FrontPilates

Frontend Next.js do SaaS `pilates-manager`, implementado em `apps/web`.

Backend configurado:

```text
https://pilates-manager-api.onrender.com
```

## Setup

```bash
pnpm install
copy apps\web\.env.example apps\web\.env.local
pnpm dev
```

Abra:

```text
http://localhost:3000
```

## Comandos

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm openapi
```

## Variaveis

```env
NEXT_PUBLIC_API_URL=https://pilates-manager-api.onrender.com
```

## Implementado

- Next.js App Router em `apps/web`.
- PWA com manifest, icone e service worker que nao faz cache de dados sensiveis.
- Cliente de API centralizado com cookies, bearer token em memoria, refresh e tratamento 401/403.
- Tipos gerados do OpenAPI em `apps/web/src/lib/openapi.ts`.
- Fluxo `/login` e `/unlock`.
- Guard de rotas protegidas, `PermissionGate` e navegacao responsiva.
- Dashboard, agenda, aula, alunos, experimentais, reposicoes, financeiro, planos, equipe, configuracoes, avaliacoes e auditoria usando endpoints reais existentes.

## Lacunas conhecidas

- O OpenAPI atual do backend nao descreve schemas de resposta em muitos endpoints.
- O backend nao tem endpoint de bootstrap inicial seguro para criar o primeiro estudio/admin em producao.
- O backend nao tem endpoint de detalhe para algumas entidades, como `GET /class-sessions/:id` e `GET /assessment-templates/:id`.
- Upload binario de arquivos ainda nao esta completo no backend.
- Relatorios dedicados ainda nao existem no backend.
