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
http://localhost:2345
```

## Comandos

```bash
pnpm dev
pnpm start:local
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

## Portas locais

- Frontend Next.js: `2345`
- PostgreSQL local, quando usado: `5432`
- Backend de producao: `https://pilates-manager-api.onrender.com`

Nao use `5432` para o frontend ou para a API HTTP, porque essa porta e a porta padrao do PostgreSQL.

## Deploy no Render

Crie um Web Service apontando para o repositorio do frontend:

```text
Root Directory: vazio
Build Command: corepack prepare pnpm@9.15.4 --activate && pnpm install --frozen-lockfile && pnpm build
Start Command: pnpm start
```

Variavel de ambiente no Render:

```env
NEXT_PUBLIC_API_URL=https://pilates-manager-api.onrender.com
```

Depois de publicar o frontend, volte no backend no Render e atualize `CORS_ORIGINS` para incluir a URL do frontend publicado. Exemplo:

```env
CORS_ORIGINS=https://sua-url-do-front.onrender.com
```

## Implementado

- Next.js App Router em `apps/web`.
- PWA com manifest, icone e service worker que nao faz cache de dados sensiveis.
- Cliente de API centralizado com cookies, bearer token em memoria, refresh e tratamento 401/403.
- Tipos gerados do OpenAPI em `apps/web/src/lib/openapi.ts`.
- Fluxo `/login` com entrada e criacao de conta, seguido de `/unlock`.
- Guard de rotas protegidas, `PermissionGate` e navegacao responsiva.
- Dashboard, agenda, aula, alunos, experimentais, reposicoes, financeiro, planos, equipe, configuracoes, avaliacoes e auditoria usando endpoints reais existentes.

## Lacunas conhecidas

- O OpenAPI atual do backend nao descreve schemas de resposta em muitos endpoints.
- O backend nao tem endpoint de bootstrap inicial seguro para criar o primeiro estudio/admin em producao.
- O backend nao tem endpoint de detalhe para algumas entidades, como `GET /class-sessions/:id` e `GET /assessment-templates/:id`.
- Upload binario de arquivos ainda nao esta completo no backend.
- Relatorios dedicados ainda nao existem no backend.
